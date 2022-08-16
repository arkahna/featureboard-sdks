import { EffectiveFeatureValue } from '@featureboard/contracts'
import { EffectiveFeaturesState } from '../effective-feature-state'
import { getEffectiveEndpoint } from '../update-strategies/getEffectiveEndpoint'
import { httpClientDebug } from './http-log'

export async function fetchFeaturesConfigurationViaHttp(
    featureBoardEndpoint: string,
    audiences: string[],
    environmentApiKey: string,
    state: EffectiveFeaturesState,
    lastModified: string | undefined,
    getCurrentAudiences: () => string[],
) {
    const effectiveEndpoint = getEffectiveEndpoint(
        featureBoardEndpoint,
        audiences,
    )
    httpClientDebug('Fetching effective values (%o)', audiences)
    const response = await fetch(effectiveEndpoint, {
        method: 'GET',
        headers: {
            'x-environment-key': environmentApiKey,
            ...(lastModified ? { 'if-modified-since': lastModified } : {}),
        },
    })

    if (response.status !== 200 && response.status !== 304) {
        httpClientDebug(
            `Failed to fetch updates (%o): ${response.status}`,
            audiences,
        )
        throw new Error(
            `Failed to get latest toggles: Service returned error ${response.status} (${response.statusText})`,
        )
    }

    // Expect most times will just get a response from the HEAD request saying no updates
    if (response.status === 304) {
        httpClientDebug('No changes (%o)', audiences)
        return lastModified
    }

    const currentEffectiveValues: EffectiveFeatureValue[] =
        await response.json()

    if (getCurrentAudiences() !== audiences) {
        httpClientDebug('Audiences changed while fetching (%o)', audiences)
        return lastModified
    }
    const existing = { ...state.store.all() }

    for (const featureValue of currentEffectiveValues) {
        state.updateFeatureValue(featureValue.featureKey, featureValue.value)
        delete existing[featureValue.featureKey]
    }
    const unavailableFeatures = Object.keys(existing)
    unavailableFeatures.forEach((unavailableFeature) => {
        state.updateFeatureValue(unavailableFeature, undefined)
    })
    httpClientDebug(`Updates (%o), %o`, audiences, {
        allValues: currentEffectiveValues,
        unavailableFeatures,
    })

    return response.headers.get('last-modified') || undefined
}
