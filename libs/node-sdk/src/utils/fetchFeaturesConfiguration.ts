import { FeatureConfiguration } from '@featureboard/contracts'
import { AllFeaturesState } from '../feature-state'
import { httpClientDebug } from './http-log'

export async function fetchFeaturesConfigurationViaHttp(
    allEndpoint: string,
    environmentApiKey: string,
    state: AllFeaturesState,
    lastModified: string | undefined,
    updateTrigger: string,
) {
    httpClientDebug(
        'Fetching updates: trigger=%s, lastModified=%s',
        updateTrigger,
        lastModified,
    )
    const response = await fetch(allEndpoint, {
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

    const removed = Object.keys(state.store.all()).filter((existing) =>
        allValues.every((v) => v.featureKey !== existing),
    )
    for (const removedFeature of removed) {
        await state.updateFeatureState(removedFeature, undefined)
    }

    const newLastModified = response.headers.get('last-modified') || undefined
    httpClientDebug('Fetching updates done, newLastModified=%s', lastModified)
    return newLastModified
}
