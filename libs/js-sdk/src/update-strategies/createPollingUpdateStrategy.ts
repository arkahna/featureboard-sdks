import { error } from 'console'
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
    let fetchUpdatesSingle: undefined | (() => Promise<void>)

    return {
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
                if (fetchUpdatesSingle) {
                    pollingUpdatesDebugLog('Polling for updates (%o)', etag)
                    // Catch errors here to ensure no unhandled promise rejections after a poll
                    return fetchUpdatesSingle().catch((error: Error) => {
                        updatesLog(error)
                    })
                }
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
