import { createEnsureSingle } from '@featureboard/js-sdk'
import { fetchFeaturesConfigurationViaHttp } from '../utils/fetchFeaturesConfiguration'
import { getAllEndpoint } from './getAllEndpoint'
import type { AllConfigUpdateStrategy } from './update-strategies'

export function createManualUpdateStrategy(
    environmentApiKey: string,
    httpEndpoint: string,
): AllConfigUpdateStrategy {
    let etag: undefined | string
    let fetchUpdatesSingle: undefined | (() => Promise<void>)
    let retryAfter: Date | undefined = undefined

    return {
        async connect(stateStore) {
            // Ensure that we don't trigger another request while one is in flight
            fetchUpdatesSingle = createEnsureSingle(async () => {
                if (!retryAfter || retryAfter < new Date()) {
                    const allEndpoint = getAllEndpoint(httpEndpoint)
                    const response = await fetchFeaturesConfigurationViaHttp(
                        allEndpoint,
                        environmentApiKey,
                        stateStore,
                        etag,
                        'manual',
                    )
                    etag = response.etag
                    retryAfter = response.retryAfter
                }
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
        onRequest() {
            return undefined
        },
    }
}
