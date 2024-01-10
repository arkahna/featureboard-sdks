import { createEnsureSingle } from '@featureboard/js-sdk'
import { fetchFeaturesConfigurationViaHttp } from '../utils/fetchFeaturesConfiguration'
import { pollingUpdates } from '../utils/pollingUpdates'
import { getAllEndpoint } from './getAllEndpoint'
import type { AllConfigUpdateStrategy } from './update-strategies'
import { updatesLog } from './updates-log'

export function createPollingUpdateStrategy(
    environmentApiKey: string,
    httpEndpoint: string,
    intervalMs: number,
): AllConfigUpdateStrategy {
    let stopPolling: undefined | (() => void)
    let etag: undefined | string
    let fetchUpdatesSingle:
        | undefined
        | (() => Promise<{ error: Error | undefined }>)

    return {
        async connect(stateStore) {
            // Ensure that we don't trigger another request while one is in flight
            fetchUpdatesSingle = createEnsureSingle(async () => {
                const allEndpoint = getAllEndpoint(httpEndpoint)
                const response = await fetchFeaturesConfigurationViaHttp(
                    allEndpoint,
                    environmentApiKey,
                    stateStore,
                    etag,
                    'polling',
                )
                etag = response.etag
                return response
            })

            if (stopPolling) {
                stopPolling()
            }
            stopPolling = pollingUpdates(() => {
                if (fetchUpdatesSingle) {
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

            return fetchUpdatesSingle().then((response) => {
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
