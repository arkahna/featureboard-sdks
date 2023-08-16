import { createEnsureSingle } from '@featureboard/js-sdk'
import { fetchFeaturesConfigurationViaHttp } from '../utils/fetchFeaturesConfiguration'
import { pollingUpdates } from '../utils/pollingUpdates'
import { getAllEndpoint } from './getAllEndpoint'
import { AllConfigUpdateStrategy } from './update-strategies'

export function createPollingUpdateStrategy(
    environmentApiKey: string,
    httpEndpoint: string,
    intervalMs: number,
): AllConfigUpdateStrategy {
    let stopPolling: undefined | (() => void)
    let etag: undefined | string
    let fetchUpdatesSingle: undefined | (() => Promise<void>)

    return {
        async connect(stateStore) {
            // Ensure that we don't trigger another request while one is in flight
            fetchUpdatesSingle = createEnsureSingle(async () => {
                const allEndpoint = getAllEndpoint(httpEndpoint)
                etag = await fetchFeaturesConfigurationViaHttp(
                    allEndpoint,
                    environmentApiKey,
                    stateStore,
                    etag,
                    'polling',
                )
            })

            if (stopPolling) {
                stopPolling()
            }
            stopPolling = pollingUpdates(() => {
                if (fetchUpdatesSingle) {
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
    }
}
