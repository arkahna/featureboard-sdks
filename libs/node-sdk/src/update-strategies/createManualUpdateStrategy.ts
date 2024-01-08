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
    const cancellationToken = { cancel: false }

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
                    'manual',
                    cancellationToken,
                )
            })

            return fetchUpdatesSingle()
        },
        close() {
            cancellationToken.cancel = true
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
