import { FeatureValues } from '@featureboard/contracts'
import { FeatureBoardApiConfig } from '@featureboard/js-sdk'
import { createServerConnection } from './create-server-connection'
import { createEnsureSingle } from './ensure-single'
import { FeatureState } from './feature-state'
import { interval } from './interval'
import { ServerConnection } from './server-connection'
import {
    ManualUpdateStrategy,
    maxAgeDefault,
    OnRequestUpdateStrategy,
    PollingUpdateStrategy,
} from './update-strategies'

export interface FeatureBoardNodeHttpClientOptions {
    api: FeatureBoardApiConfig
    state: FeatureState

    updateStrategy:
        | ManualUpdateStrategy
        | PollingUpdateStrategy
        | OnRequestUpdateStrategy

    fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
}

// NOTE: Most node fetch implementations do not support any sort of http caching, so we implement it in our SDK
export async function createNodeHttpClient(
    environmentApiKey: string,
    { api, fetch, state, updateStrategy }: FeatureBoardNodeHttpClientOptions,
): Promise<ServerConnection> {
    let lastModified: string | undefined
    const allEndpoint = api.http.endsWith('/')
        ? `${api.http}all`
        : `${api.http}/all`
    const response = await fetch(allEndpoint, {
        method: 'GET',
        headers: {
            'x-environment-key': environmentApiKey,
        },
    })

    if (!response.ok) {
        throw new Error(
            `Failed to initialise FeatureBoard SDK (${response.statusText}): ` +
                ((await response.text()) || '-'),
        )
    }

    lastModified = response.headers.get('last-modified') || undefined

    const allValues: FeatureValues[] = await response.json()

    for (const featureValue of allValues) {
        state.updateFeatureState(featureValue.featureKey, featureValue)
    }

    // Ensure that we don't trigger another request while one is in flight
    const fetchUpdatesSingle = createEnsureSingle(async () => {
        lastModified = await fetchUpdates(
            fetch,
            allEndpoint,
            environmentApiKey,
            state,
            lastModified,
        )
    })

    if (updateStrategy.kind === 'polling') {
        const stopUpdates = pollingUpdates(fetchUpdatesSingle, 30000)
        return createServerConnection(state, fetchUpdatesSingle, stopUpdates)
    }

    let responseExpires: number | undefined =
        updateStrategy.kind === 'on-request'
            ? Date.now() + (updateStrategy.options?.maxAgeMs || maxAgeDefault)
            : undefined

    return createServerConnection(
        state,
        fetchUpdatesSingle,
        () => {},
        updateStrategy.kind === 'on-request'
            ? () => {
                  const maxAgeMs =
                      updateStrategy.options?.maxAgeMs || maxAgeDefault

                  if (!responseExpires || Date.now() > responseExpires) {
                      responseExpires = Date.now() + maxAgeMs
                      return fetchUpdatesSingle()
                  }

                  return Promise.resolve()
              }
            : undefined,
    )
}

function pollingUpdates(update: () => any, intervalMs: number) {
    const intervalRef = interval.set(update, intervalMs)

    const stopUpdates = () => interval.clear(intervalRef)
    return stopUpdates
}

async function fetchUpdates(
    fetch: (
        input: RequestInfo,
        init?: RequestInit | undefined,
    ) => Promise<Response>,
    allEndpoint: string,
    environmentApiKey: string,
    state: FeatureState,
    lastModified: string | undefined,
) {
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
        return lastModified
    }

    const allValues: FeatureValues[] = await response.json()

    for (const featureValue of allValues) {
        state.updateFeatureState(featureValue.featureKey, featureValue)
    }

    return response.headers.get('last-modified') || undefined
}
