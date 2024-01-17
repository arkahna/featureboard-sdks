import { trace } from '@opentelemetry/api'
import { createEnsureSingleWithBackoff } from '../ensure-single'
import { fetchFeaturesConfigurationViaHttp } from '../utils/fetchFeaturesConfiguration'
import { pollingUpdates } from '../utils/pollingUpdates'
import { resolveError } from '../utils/resolve-error'
import { startActiveSpan } from '../utils/start-active-span'
import type { EffectiveConfigUpdateStrategy } from './update-strategies'

export function createPollingUpdateStrategy(
    environmentApiKey: string,
    httpEndpoint: string,
    intervalMs: number,
): EffectiveConfigUpdateStrategy {
    let stopPolling: undefined | (() => void)
    let etag: undefined | string
    let fetchUpdatesSingle: undefined | (() => Promise<void>)
    const parentSpan = trace.getActiveSpan()

    return {
        name: 'polling',
        async connect(stateStore) {
            // Force update
            etag = undefined

            // Ensure that we don't trigger another request while one is in flight
            fetchUpdatesSingle = createEnsureSingleWithBackoff(async () => {
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
                return startActiveSpan({
                    name: 'polling-updates',
                    options: { attributes: { etag } },
                    parentSpan,
                    fn: async (span) => {
                        // Catch errors here to ensure no unhandled promise rejections after a poll
                        if (fetchUpdatesSingle) {
                            return await fetchUpdatesSingle()
                                .catch((err) => {
                                    span.recordException(resolveError(err))
                                })
                                .finally(() => span.end())
                        }
                    },
                })
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
