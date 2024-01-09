import { createEnsureSingle } from '../ensure-single'
import { fetchFeaturesConfigurationViaHttp } from '../utils/fetchFeaturesConfiguration'
import type { EffectiveConfigUpdateStrategy } from './update-strategies'
import { updatesLog } from './updates-log'

export const manualUpdatesDebugLog = updatesLog.extend('manual')

export function createManualUpdateStrategy(
    environmentApiKey: string,
    httpEndpoint: string,
): EffectiveConfigUpdateStrategy {
    let etag: undefined | string
    let fetchUpdatesSingle:
        | undefined
        | (() => Promise<{ error: Error | undefined }>)

    return {
        async connect(stateStore) {
            // Force update
            etag = undefined
            // Ensure that we don't trigger another request while one is in flight
            fetchUpdatesSingle = createEnsureSingle(async () => {
                const response = await fetchFeaturesConfigurationViaHttp(
                    httpEndpoint,
                    stateStore.audiences,
                    environmentApiKey,
                    stateStore,
                    etag,
                    () => stateStore.audiences,
                )
                etag = response.etag
                return response
            })

            return fetchUpdatesSingle().then((response) => {
                if (response.error) {
                    /// Failed to connect, throw error
                    throw response.error
                }
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
                        manualUpdatesDebugLog(response.error)
                    }
                })
            }
        },
        onRequest() {
            return undefined
        },
    }
}
