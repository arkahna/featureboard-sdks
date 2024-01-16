import {
    TooManyRequestsError,
    type FeatureConfiguration,
} from '@featureboard/contracts'
import type { AllFeatureStateStore } from '../feature-state-store'
import { httpClientDebug } from './http-log'

export async function fetchFeaturesConfigurationViaHttp(
    allEndpoint: string,
    environmentApiKey: string,
    stateStore: AllFeatureStateStore,
    etag: string | undefined,
    updateTrigger: string,
): Promise<string | undefined> {
    httpClientDebug(
        'Fetching updates: trigger=%s, lastModified=%s',
        updateTrigger,
        etag,
    )

    const response = await fetch(allEndpoint, {
        method: 'GET',
        headers: {
            'x-environment-key': environmentApiKey,
            ...(etag ? { 'if-none-match': etag } : {}),
        },
    })

    if (response.status === 429) {
        // Too many requests
        const retryAfterHeader = response.headers.get('Retry-After')
        const retryAfterInt = retryAfterHeader
            ? parseInt(retryAfterHeader, 10)
            : 60
        const retryAfter =
            retryAfterHeader && !retryAfterInt
                ? new Date(retryAfterHeader)
                : new Date()

        if (retryAfterInt) {
            const retryAfterTime = retryAfter.getTime() + retryAfterInt * 1000
            retryAfter.setTime(retryAfterTime)
        }

        throw new TooManyRequestsError(
            `Failed to get latest features: Service returned ${
                response.status
            }${response.statusText ? ' ' + response.statusText : ''}. ${
                retryAfterHeader
                    ? 'Retry after: ' + retryAfter.toUTCString()
                    : ''
            } `,
            retryAfter,
        )
    }

    if (response.status !== 200 && response.status !== 304) {
        throw new Error(
            `Failed to get latest flags: Service returned error ${response.status} (${response.statusText})`,
        )
    }

    // Expect most times will just get a response from the HEAD request saying no updates
    if (response.status === 304) {
        httpClientDebug('No changes')
        return etag
    }

    const allValues: FeatureConfiguration[] = await response.json()

    for (const featureValue of allValues) {
        stateStore.set(featureValue.featureKey, featureValue)
    }

    const removed = Object.keys(stateStore.all()).filter((existing) =>
        allValues.every((v) => v.featureKey !== existing),
    )
    for (const removedFeature of removed) {
        stateStore.set(removedFeature, undefined)
    }

    const newEtag = response.headers.get('etag') || undefined
    httpClientDebug('Fetching updates done, newEtag=%s', newEtag)
    return newEtag
}
