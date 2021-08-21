import { EffectiveFeatureValue } from '@featureboard/contracts'
import { ClientConnection } from './client'
import { createClient } from './create-client'
import { EffectiveFeatureState } from './effective-feature-state'
import { FeatureBoardApiConfig } from './featureboard-api-config'
import {
    ManualUpdateStrategy,
    PollingUpdateStrategy,
} from './update-strategies'

export interface FeatureBoardBrowserHttpClientOptions {
    api: FeatureBoardApiConfig
    state: EffectiveFeatureState

    updateStrategy: ManualUpdateStrategy | PollingUpdateStrategy

    fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
}

export async function createBrowserHttpClient(
    environmentApiKey: string,
    audiences: string[],
    { api, fetch, state, updateStrategy }: FeatureBoardBrowserHttpClientOptions,
): Promise<ClientConnection> {
    const effectiveEndpoint = api.http.endsWith('/')
        ? `${api.http}effective?audiences=${audiences.join(',')}`
        : `${api.http}/effective?audiences=${audiences.join(',')}`
    const response = await fetch(effectiveEndpoint, {
        method: 'POST',
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

    const effectiveFeatures: EffectiveFeatureValue[] = await response.json()

    for (const effectiveFeature of effectiveFeatures) {
        state.updateFeatureValue(
            effectiveFeature.featureKey,
            effectiveFeature.value,
        )
    }

    const close =
        updateStrategy.kind === 'polling'
            ? pollingUpdates(
                  () => async () => {},
                  updateStrategy.options?.interval || 60000,
              )
            : () => {}

    return {
        client: createClient(state),
        updateFeatures: () =>
            triggerUpdate(fetch, effectiveEndpoint, environmentApiKey, state),
        close,
    }
}

function pollingUpdates(update: () => void, interval: number) {
    const intervalRef = setInterval(() => {
        update()
    }, interval)

    const stopUpdates = () => clearInterval(intervalRef)
    return stopUpdates
}

async function triggerUpdate(
    fetch: (
        input: RequestInfo,
        init?: RequestInit | undefined,
    ) => Promise<Response>,
    effectiveEndpoint: string,
    environmentApiKey: string,
    state: EffectiveFeatureState,
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

    const effectiveFeatures: EffectiveFeatureValue[] = await response.json()
    const removed = Object.keys(state.featureValues).filter(
        (key) => !effectiveFeatures.some((feat) => feat.featureKey === key),
    )

    for (const removedKey of removed) {
        state.updateFeatureValue(removedKey, undefined)
    }
    for (const effectiveFeature of effectiveFeatures) {
        if (
            state.featureValues[effectiveFeature.featureKey] !==
            effectiveFeature.value
        ) {
            state.updateFeatureValue(
                effectiveFeature.featureKey,
                effectiveFeature.value,
            )
        }
    }
}
