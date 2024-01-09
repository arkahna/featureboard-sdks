import { createEnsureSingle } from '@featureboard/js-sdk'
import { fetchFeaturesConfigurationViaHttp } from '../utils/fetchFeaturesConfiguration'
import { getAllEndpoint } from './getAllEndpoint'
import type { AllConfigUpdateStrategy } from './update-strategies'
import { updatesLog } from './updates-log'

export function createOnRequestUpdateStrategy(
    environmentApiKey: string,
    httpEndpoint: string,
    maxAgeMs: number,
): AllConfigUpdateStrategy {
    let responseExpires: number | undefined
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
                    'on-request',
                )
                etag = response.etag
                return response
            })

            return fetchUpdatesSingle().then((response) => {
                if (response.error) {
                    // Failed to connect, throw error
                    throw response.error
                }
                responseExpires = Date.now() + maxAgeMs
            })
        },
        close() {
            return Promise.resolve()
        },
        get state() {
            return 'connected' as const
        },
        async updateFeatures() {
            if (fetchUpdatesSingle) {
                await fetchUpdatesSingle().then((response) => {
                    if (response.error) {
                        updatesLog(response.error)
                    }
                })
            }
        },
        async onRequest() {
            if (fetchUpdatesSingle) {
                const now = Date.now()
                if (!responseExpires || now >= responseExpires) {
                    responseExpires = now + maxAgeMs
                    updatesLog('Response expired, fetching updates: %o', {
                        maxAgeMs,
                        newExpiry: responseExpires,
                    })
                    return fetchUpdatesSingle().then((response) => {
                        if (response.error) {
                            updatesLog(response.error)
                        }
                    })
                }

                updatesLog('Response not expired: %o', {
                    responseExpires,
                    now,
                })
                return Promise.resolve()
            }
        },
    }
}
