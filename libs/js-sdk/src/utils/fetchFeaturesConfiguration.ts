import { EffectiveFeatureValue } from '@featureboard/contracts'
import { EffectiveFeatureStateStore } from '../effective-feature-state-store'
import { getEffectiveEndpoint } from '../update-strategies/getEffectiveEndpoint'
import { compareArrays } from './compare-arrays'
import { httpClientDebug } from './http-log'

export async function fetchFeaturesConfigurationViaHttp(
    featureBoardEndpoint: string,
    audiences: string[],
    environmentApiKey: string,
    stateStore: EffectiveFeatureStateStore,
    etag: string | undefined,
    getCurrentAudiences: () => string[],
) {
    const effectiveEndpoint = getEffectiveEndpoint(
        featureBoardEndpoint,
        audiences,
    )
    httpClientDebug('Fetching effective values (%o)', {
        etag,
        audiences,
    })
    const response = await fetch(effectiveEndpoint, {
        method: 'GET',
        headers: {
            'x-environment-key': environmentApiKey,
            ...(etag ? { 'if-none-match': etag } : {}),
        },
    })

    if (response.status !== 200 && response.status !== 304) {
        httpClientDebug(
            `Failed to fetch updates (%o): ${
                response.status
            } (${await response.text()})`,
            audiences,
        )
        throw new Error(
            `Failed to get latest toggles: Service returned error ${response.status} (${response.statusText})`,
        )
    }

    // Expect most times will just get a response from the HEAD request saying no updates
    if (response.status === 304) {
        httpClientDebug('No changes (%o)', audiences)
        return etag
    }

    const currentEffectiveValues: EffectiveFeatureValue[] =
        await response.json()

    if (!compareArrays(getCurrentAudiences(), audiences)) {
        httpClientDebug('Audiences changed while fetching (%o)', audiences)
        return etag
    }
    const existing = { ...stateStore.all() }

    for (const featureValue of currentEffectiveValues) {
        stateStore.set(featureValue.featureKey, featureValue.value)
        delete existing[featureValue.featureKey]
    }
    const unavailableFeatures = Object.keys(existing)
    unavailableFeatures.forEach((unavailableFeature) => {
        stateStore.set(unavailableFeature, undefined)
    })
    httpClientDebug(`Updates (%o), %o`, audiences, {
        effectiveValues: currentEffectiveValues,
        unavailableFeatures,
    })

    return response.headers.get('etag') || undefined
}
