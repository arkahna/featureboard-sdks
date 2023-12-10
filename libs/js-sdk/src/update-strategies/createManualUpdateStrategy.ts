import { createEnsureSingle } from '../ensure-single'
import { fetchFeaturesConfigurationViaHttp } from '../utils/fetchFeaturesConfiguration'
import type { EffectiveConfigUpdateStrategy } from './update-strategies'

export function createManualUpdateStrategy(
    environmentApiKey: string,
    httpEndpoint: string,
): EffectiveConfigUpdateStrategy {
    let etag: undefined | string
    let fetchUpdatesSingle: undefined | (() => Promise<void>)

    return {
        name: 'manual',
        async connect(stateStore) {
            // Force update
            etag = undefined
            // Ensure that we don't trigger another request while one is in flight
            fetchUpdatesSingle = createEnsureSingle(async () => {
                etag = await fetchFeaturesConfigurationViaHttp(
                    httpEndpoint,
                    stateStore.audiences,
                    environmentApiKey,
                    stateStore,
                    etag,
                    () => stateStore.audiences,
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
        onRequest() {
            return undefined
        },
    }
}
