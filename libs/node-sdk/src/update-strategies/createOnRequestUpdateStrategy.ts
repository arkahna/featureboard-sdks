import { createEnsureSingleWithBackoff } from '@featureboard/js-sdk'
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
    let fetchUpdatesSingle: undefined | (() => Promise<void>)

    return {
        async connect(stateStore) {
            // Ensure that we don't trigger another request while one is in flight
            fetchUpdatesSingle = createEnsureSingleWithBackoff(async () => {
                const allEndpoint = getAllEndpoint(httpEndpoint)
                etag = await fetchFeaturesConfigurationViaHttp(
                    allEndpoint,
                    environmentApiKey,
                    stateStore,
                    etag,
                    'on-request',
                )
            })

            return fetchUpdatesSingle().then(() => {
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
                await fetchUpdatesSingle()
            }
        },
        async onRequest() {
            if (fetchUpdatesSingle) {
                const now = Date.now()
                if (!responseExpires || now >= responseExpires) {
                    return fetchUpdatesSingle()
                        .then(() => {
                            responseExpires = now + maxAgeMs
                            updatesLog(
                                'Response expired, fetching updates: %o',
                                {
                                    maxAgeMs,
                                    newExpiry: responseExpires,
                                },
                            )
                        })
                        .catch((error: Error) => {
                            updatesLog(error)
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
