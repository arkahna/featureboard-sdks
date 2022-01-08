import { FeatureConfiguration } from '@featureboard/contracts'
import { FetchSignature } from '@featureboard/js-sdk'
import { AllFeaturesState } from '../feature-state'
import { httpClientDebug } from './http-log'

export async function fetchFeaturesConfigurationViaHttp(
    fetchInstance: FetchSignature,
    allEndpoint: string,
    environmentApiKey: string,
    state: AllFeaturesState,
    lastModified: string | undefined,
) {
    httpClientDebug('Fetching updates')
    const response = await fetchInstance(allEndpoint, {
        method: 'GET',
        headers: {
            'x-environment-key': environmentApiKey,
            ...(lastModified ? { 'if-modified-since': lastModified } : {}),
        },
    })

    if (response.status !== 200 && response.status !== 304) {
        throw new Error(
            `Failed to get latest toggles: Service returned error ${response.status} (${response.statusText})`,
        )
    }

    // Expect most times will just get a response from the HEAD request saying no updates
    if (response.status === 304) {
        httpClientDebug('No changes')
        return lastModified
    }

    const allValues: FeatureConfiguration[] = await response.json()

    for (const featureValue of allValues) {
        await state.updateFeatureState(featureValue.featureKey, featureValue)
    }

    return response.headers.get('last-modified') || undefined
}
