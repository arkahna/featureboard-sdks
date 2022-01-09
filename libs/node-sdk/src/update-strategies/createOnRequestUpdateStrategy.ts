import { createEnsureSingle, FetchSignature } from '@featureboard/js-sdk'
import { fetchFeaturesConfigurationViaHttp } from '../utils/fetchFeaturesConfiguration'
import { getAllEndpoint } from './getEffectiveEndpoint'
import { AllConfigUpdateStrategy } from './update-strategies'
import { updatesLog } from './updates-log'

export function createOnRequestUpdateStrategy(
    environmentApiKey: string,
    httpEndpoint: string,
    maxAgeMs: number,
    fetchInstance: FetchSignature,
): AllConfigUpdateStrategy {
    let responseExpires: number | undefined = Date.now() + maxAgeMs
    let lastModified: undefined | string
    let fetchUpdatesSingle: undefined | (() => Promise<void>)

    return {
        async connect(state) {
            // Ensure that we don't trigger another request while one is in flight
            fetchUpdatesSingle = createEnsureSingle(async () => {
                const allEndpoint = getAllEndpoint(httpEndpoint)
                lastModified = await fetchFeaturesConfigurationViaHttp(
                    fetchInstance,
                    allEndpoint,
                    environmentApiKey,
                    state,
                    lastModified,
                )
            })

            return fetchUpdatesSingle()
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
                if (!responseExpires || Date.now() > responseExpires) {
                    responseExpires = Date.now() + maxAgeMs
                    updatesLog('Response expired, fetching updates: %o', {
                        maxAgeMs,
                        newExpiry: responseExpires,
                    })
                    return fetchUpdatesSingle()
                }

                return Promise.resolve()
            }
        },
    }
}
