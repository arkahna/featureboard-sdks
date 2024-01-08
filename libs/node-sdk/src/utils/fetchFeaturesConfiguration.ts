import type { FeatureConfiguration } from '@featureboard/contracts'
import type { AllFeatureStateStore } from '../feature-state-store'
import { httpClientDebug } from './http-log'

const maxRetries = 3
const initialDelayMs = process.env.TEST === 'true' ? 1 : 1000
const backoffFactor = 2

async function fetchWithRetryOnRateLimit({
    allEndpoint,
    environmentApiKey,
    etag,
    cancellationToken,
    retryAttempt = 0,
}: {
    allEndpoint: string
    environmentApiKey: string
    etag: string | undefined
    cancellationToken: { cancel: boolean }
    retryAttempt?: number
}): Promise<Response> {
    const response = await fetch(allEndpoint, {
        method: 'GET',
        headers: {
            'x-environment-key': environmentApiKey,
            ...(etag ? { 'if-none-match': etag } : {}),
        },
    })

    if (response.status === 429) {
        if (cancellationToken?.cancel) {
            cancellationToken.cancel = false
            return response
        }

        if (retryAttempt >= maxRetries) {
            return response
        }

        const retryAfterHeader = response.headers.get('Retry-After')
        const retryAfter = retryAfterHeader
            ? parseInt(retryAfterHeader, 10)
            : 60
        const delayMs =
            initialDelayMs * Math.pow(backoffFactor, retryAttempt) +
            retryAfter * 1000
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        return await fetchWithRetryOnRateLimit({
            allEndpoint,
            environmentApiKey,
            etag,
            cancellationToken,
            retryAttempt: retryAttempt + 1,
        })
    }

    return response
}

export async function fetchFeaturesConfigurationViaHttp(
    allEndpoint: string,
    environmentApiKey: string,
    stateStore: AllFeatureStateStore,
    etag: string | undefined,
    updateTrigger: string,
    cancellationToken: { cancel: boolean },
) {
    httpClientDebug(
        'Fetching updates: trigger=%s, lastModified=%s',
        updateTrigger,
        etag,
    )

    const response = await fetchWithRetryOnRateLimit({
        allEndpoint,
        environmentApiKey,
        etag,
        cancellationToken,
    })

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
