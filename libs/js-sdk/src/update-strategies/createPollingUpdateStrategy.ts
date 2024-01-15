import { createEnsureSingleWithBackoff } from '../ensure-single'
import { fetchFeaturesConfigurationViaHttp } from '../utils/fetchFeaturesConfiguration'
import { pollingUpdates } from '../utils/pollingUpdates'
import type { EffectiveConfigUpdateStrategy } from './update-strategies'
import { updatesLog } from './updates-log'

export const pollingUpdatesDebugLog = updatesLog.extend('polling')

export function createPollingUpdateStrategy(
    environmentApiKey: string,
    httpEndpoint: string,
    intervalMs: number,
): EffectiveConfigUpdateStrategy {
    let stopPolling: undefined | (() => void)
    let etag: undefined | string
    let fetchUpdatesSingle:
        | undefined
        | (() => Promise<{ error: Error | undefined }>)

    return {
        async connect(stateStore) {
            // Force update
            etag = undefined

            // Ensure that we don't trigger another request while one is in flight
            fetchUpdatesSingle = createEnsureSingleWithBackoff(async () => {
                const response = await fetchFeaturesConfigurationViaHttp(
                    httpEndpoint,
                    stateStore.audiences,
                    environmentApiKey,
                    stateStore,
                    etag,
                    () => stateStore.audiences,
                )
                etag = response.etag
                return response
            })

            if (stopPolling) {
                stopPolling()
            }
            stopPolling = pollingUpdates(() => {
                if (fetchUpdatesSingle) {
                    pollingUpdatesDebugLog('Polling for updates (%o)', etag)
                    // Catch errors here to ensure no unhandled promise rejections after a poll
                    return fetchUpdatesSingle()
                        .then((response) => {
                            if (response.error) {
                                updatesLog(response.error)
                            }
                        })
                        .catch(() => {})
                }
            }, intervalMs)

            return await fetchUpdatesSingle().then((response) => {
                if (response.error) {
                    // Failed to connect, throw error
                    throw response.error
                }
            })
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
                await fetchUpdatesSingle().then((response) => {
                    if (response.error) {
                        throw response.error
                    }
                })
            }
        },
        onRequest() {
            return undefined
        },
    }
}
