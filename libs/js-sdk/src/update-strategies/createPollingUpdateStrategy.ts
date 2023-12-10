import { createEnsureSingle } from '../ensure-single'
import { fetchFeaturesConfigurationViaHttp } from '../utils/fetchFeaturesConfiguration'
import { getTracer } from '../utils/get-tracer'
import { pollingUpdates } from '../utils/pollingUpdates'
import { resolveError } from '../utils/resolve-error'
import type { EffectiveConfigUpdateStrategy } from './update-strategies'

export function createPollingUpdateStrategy(
    environmentApiKey: string,
    httpEndpoint: string,
    intervalMs: number,
): EffectiveConfigUpdateStrategy {
    let stopPolling: undefined | (() => void)
    let etag: undefined | string
    let fetchUpdatesSingle: undefined | (() => Promise<void>)

    return {
        name: 'polling',
        async connect(stateStore) {
            // Force update
            etag = undefined

            // Ensure that we don't trigger another request while one is in flight
            fetchUpdatesSingle = createEnsureSingle(async () => {
                etag = await fetchFeaturesConfigurationViaHttp(
                    httpEndpoint,
                    stateStore.audiences,
                    environmentApiKey,
                    stateStore,
                    etag,
                    () => stateStore.audiences,
                )
            })

            if (stopPolling) {
                stopPolling()
            }
            stopPolling = pollingUpdates(() => {
                getTracer().startActiveSpan(
                    'Polling update',
                    { attributes: { etag }, root: true },
                    async (span) => {
                        // Catch errors here to ensure no unhandled promise rejections after a poll
                        if (fetchUpdatesSingle) {
                            await fetchUpdatesSingle()
                                .catch((err) => {
                                    span.recordException(resolveError(err))
                                })
                                .finally(() => span.end())
                        }
                    },
                )
            }, intervalMs)

            return await fetchUpdatesSingle()
        },
        async close() {
            if (stopPolling) {
                stopPolling()
            }
        },
        get state() {
            if (stopPolling) {
                return 'connected'
            }
            return 'disconnected'
        },
        async updateFeatures() {
            if (fetchUpdatesSingle) {
                await fetchUpdatesSingle()
            }
        },
        onRequest() {
            return undefined
        },
    }
}
