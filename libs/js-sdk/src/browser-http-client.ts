import { EffectiveFeatureValue } from '@featureboard/contracts'
import { ClientConnection } from './client'
import { createClient } from './create-client'
import { EffectiveFeatureState } from './effective-feature-state'
import { createEnsureSingle } from './ensure-single'
import { FeatureBoardApiConfig } from './featureboard-api-config'
import { interval } from './interval'
import { timeout } from './timeout'
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
    // eslint-disable-next-line prefer-const
    let { lastModified, effectiveEndpoint } = await initStore(
        api,
        audiences,
        fetch,
        environmentApiKey,
        state,
    )

    // Ensure that we don't trigger another request while one is in flight
    const fetchUpdatesSingle = createEnsureSingle(async () => {
        lastModified = await triggerUpdate(
            fetch,
            effectiveEndpoint,
            environmentApiKey,
            state,
            lastModified,
        )
    })

    const close =
        updateStrategy.kind === 'polling'
            ? pollingUpdates(
                  fetchUpdatesSingle,
                  updateStrategy.options?.interval || 60000,
              )
            : () => {}

    return {
        client: createClient(state),
        updateFeatures: () => {
            return fetchUpdatesSingle()
        },
        close,
    }
}

export async function initStore(
    api: FeatureBoardApiConfig,
    audiences: string[],
    fetch: (
        input: RequestInfo,
        init?: RequestInit | undefined,
    ) => Promise<Response>,
    environmentApiKey: string,
    state: EffectiveFeatureState,
    attemptedRetries = 0,
): Promise<{ lastModified: string | undefined; effectiveEndpoint: string }> {
    let lastModified: string | undefined
    const effectiveEndpoint = api.http.endsWith('/')
        ? `${api.http}effective?audiences=${audiences.join(',')}`
        : `${api.http}/effective?audiences=${audiences.join(',')}`
    const response = await fetch(effectiveEndpoint, {
        method: 'GET',
        headers: {
            'x-environment-key': environmentApiKey,
        },
    })

    if (!response.ok) {
        const errMsg =
            `Failed to initialise FeatureBoard SDK (${response.statusText}): ` +
            ((await response.text()) || '-')

        // If the SDK has been initialised with a valid set of features, we can continue
        if (state.store.isInitialised) {
            console.error(errMsg)
        } else {
            if (attemptedRetries < 4) {
                const delay = Math.pow(2, attemptedRetries) * 1000
                console.warn(
                    `Failed to initialise FeatureBoard SDK, retrying in ${delay}`,
                )
                await new Promise((resolve) =>
                    timeout.set(resolve, delay).unref(),
                )

                return initStore(
                    api,
                    audiences,
                    fetch,
                    environmentApiKey,
                    state,
                    attemptedRetries + 1,
                )
            }
            throw new Error(errMsg)
        }
    } else {
        const effectiveFeatures: EffectiveFeatureValue[] = await response.json()

        for (const effectiveFeature of effectiveFeatures) {
            state.updateFeatureValue(
                effectiveFeature.featureKey,
                effectiveFeature.value,
            )
        }
        lastModified = response.headers.get('last-modified') || undefined
        state.store.isInitialised = true
    }
    return { lastModified, effectiveEndpoint }
}

function pollingUpdates(update: () => void, intervalMs: number) {
    const intervalRef = interval.set(update, intervalMs)

    const stopUpdates = () => interval.clear(intervalRef)
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
    lastModified: string | undefined,
) {
    const response = await fetch(effectiveEndpoint, {
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

    const effectiveFeatures: EffectiveFeatureValue[] = await response.json()
    const removed = Object.keys(state.store.all()).filter(
        (key) => !effectiveFeatures.some((feat) => feat.featureKey === key),
    )

    for (const removedKey of removed) {
        state.updateFeatureValue(removedKey, undefined)
    }
    for (const effectiveFeature of effectiveFeatures) {
        const currentStoredValue = state.store.get(effectiveFeature.featureKey)
        if (currentStoredValue !== effectiveFeature.value) {
            state.updateFeatureValue(
                effectiveFeature.featureKey,
                effectiveFeature.value,
            )
        }
    }

    return response.headers.get('last-modified') || undefined
}
