import { FeatureValues } from '@featureboard/contracts'
import { FeatureBoardApiConfig } from '@featureboard/js-sdk'
import { createServerConnection } from './create-server-connection'
import { createEnsureSingle } from './ensure-single'
import { FeatureState } from './feature-state'
import { ServerConnection } from './server-connection'
import {
    ManualUpdateStrategy,
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

export async function createNodeHttpClient(
    environmentApiKey: string,
    { api, fetch, state, updateStrategy }: FeatureBoardNodeHttpClientOptions,
): Promise<ServerConnection> {
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
            'Failed to initialise FeatureBoard SDK: ' + (await response.text()),
        )
    }

    const allValues: FeatureValues[] = await response.json()

    for (const featureValue of allValues) {
        state.updateFeatureState(featureValue.featureKey, featureValue)
    }

    // Ensure that we don't trigger another request while one is in flight
    const fetchUpdatesSingle = createEnsureSingle(() => {
        return fetchUpdates(fetch, allEndpoint, environmentApiKey, state)
    })

    if (updateStrategy.kind === 'polling') {
        const stopUpdates = pollingUpdates(fetchUpdatesSingle, 30000)
        return createServerConnection(state, fetchUpdatesSingle, stopUpdates)
    }

    return createServerConnection(
        state,
        fetchUpdatesSingle,
        () => {},
        updateStrategy.kind === 'on-request'
            ? () => fetchUpdatesSingle()
            : undefined,
    )
}

function pollingUpdates(update: () => void, interval: number) {
    const intervalRef = setInterval(() => {
        update()
    }, interval)

    const stopUpdates = () => clearInterval(intervalRef)
    return stopUpdates
}

async function fetchUpdates(
    fetch: (
        input: RequestInfo,
        init?: RequestInit | undefined,
    ) => Promise<Response>,
    effectiveEndpoint: string,
    environmentApiKey: string,
    state: FeatureState,
) {
    const response = await fetch(effectiveEndpoint, {
        headers: {
            'x-environment-key': environmentApiKey,
        },
    })

    if (!response.ok) {
        console.error('Failed to get latest toggles')
        return
    }
    // Expect most times will just get a response from the HEAD request saying no updates
    if (response.status === 304) {
        return
    }

    const allValues: FeatureValues[] = await response.json()

    for (const featureValue of allValues) {
        state.updateFeatureState(featureValue.featureKey, featureValue)
    }
}
