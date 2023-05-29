import { createEnsureSingle } from '../ensure-single'
import { compareArrays } from '../utils/compare-arrays'
import { fetchFeaturesConfigurationViaHttp } from '../utils/fetchFeaturesConfiguration'
import { pollingUpdates } from '../utils/pollingUpdates'
import { EffectiveConfigUpdateStrategy } from './update-strategies'
import { updatesLog } from './updates-log'

export const pollingUpdatesDebugLog = updatesLog.extend('polling')

export function createPollingUpdateStrategy(
    environmentApiKey: string,
    httpEndpoint: string,
    intervalMs: number,
): EffectiveConfigUpdateStrategy {
    let stopPolling: undefined | (() => void)
    let lastModified: undefined | string
    let fetchUpdatesSingle: undefined | (() => Promise<void>)

    return {
        async connect(state) {
            // Ensure that we don't trigger another request while one is in flight
            fetchUpdatesSingle = createEnsureSingle(async () => {
                lastModified = await fetchFeaturesConfigurationViaHttp(
                    httpEndpoint,
                    state.audiences,
                    environmentApiKey,
                    state,
                    lastModified,
                    () => state.audiences,
                )
            })

            if (stopPolling) {
                stopPolling()
            }
            stopPolling = pollingUpdates(() => {
                if (fetchUpdatesSingle) {
                    pollingUpdatesDebugLog('Polling for updates (%o)',
                        lastModified,
                    )
                    // Catch errors here to ensure no unhandled promise rejections after a poll
                    return fetchUpdatesSingle().catch(() => {})
                }
            }, intervalMs)

            return fetchUpdatesSingle()
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
        async updateAudiences(state, updatedAudiences) {
            if (compareArrays(state.audiences, updatedAudiences)) {
                // No need to update audiences
                return Promise.resolve()
            }
            state.audiences = updatedAudiences
            pollingUpdatesDebugLog(
                'Audiences updated (%o), getting new effective values',
                updatedAudiences,
            )
            // Fetch new values
            lastModified = undefined
            return await this.connect(state)
        },
    }
}
