import { createEnsureSingle } from '../ensure-single'
import { fetchFeaturesConfigurationViaHttp } from '../utils/fetchFeaturesConfiguration'
import { pollingUpdates } from '../utils/pollingUpdates'
import { EffectiveConfigUpdateStrategy } from './update-strategies'
import { updatesLog } from './updates-log'

export const pollingUpdatesDebugLog = updatesLog.extend('polling')

export function createPollingUpdateStrategy(
    environmentApiKey: string,
    httpEndpoint: string,
    intervalMs: number,
    audiences: string[],
): EffectiveConfigUpdateStrategy {
    let stopPolling: undefined | (() => void)
    let lastModified: undefined | string
    let fetchUpdatesSingle: undefined | (() => Promise<void>)
    let currentAudiences = audiences

    return {
        async connect(state) {
            // Ensure that we don't trigger another request while one is in flight
            fetchUpdatesSingle = createEnsureSingle(async () => {
                lastModified = await fetchFeaturesConfigurationViaHttp(
                    httpEndpoint,
                    currentAudiences,
                    environmentApiKey,
                    state,
                    lastModified,
                    () => currentAudiences,
                )
            })

            if (stopPolling) {
                stopPolling()
            }
            stopPolling = pollingUpdates(() => {
                if (fetchUpdatesSingle) {
                    pollingUpdatesDebugLog('Polling for updates (%o)', {
                        currentAudiences,
                        lastModified,
                    })
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
            if (updatedAudiences.sort() === currentAudiences.sort()) {
                // No need to update audiences
                return Promise.resolve()
            }
            currentAudiences = updatedAudiences
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
