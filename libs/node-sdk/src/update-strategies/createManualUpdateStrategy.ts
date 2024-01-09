import { createEnsureSingle } from '@featureboard/js-sdk'
import { fetchFeaturesConfigurationViaHttp } from '../utils/fetchFeaturesConfiguration'
import { getAllEndpoint } from './getAllEndpoint'
import type { AllConfigUpdateStrategy } from './update-strategies'
import { updatesLog } from './updates-log'

export function createManualUpdateStrategy(
    environmentApiKey: string,
    httpEndpoint: string,
): AllConfigUpdateStrategy {
    let etag: undefined | string
    let fetchUpdatesSingle:
        | undefined
        | (() => Promise<{ error: Error | undefined }>)

    return {
        async connect(stateStore) {
            fetchUpdatesSingle = createEnsureSingle(async () => {
                const allEndpoint = getAllEndpoint(httpEndpoint)
                const response = await fetchFeaturesConfigurationViaHttp(
                    allEndpoint,
                    environmentApiKey,
                    stateStore,
                    etag,
                    'manual',
                )
                etag = response.etag
                return response
            })

            return fetchUpdatesSingle().then((response) => {
                if (response.error) {
                    // Failed to connect, throw error
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
                        updatesLog(response.error)
                        //throw response.error
                    }
                })
            }
        },
        onRequest() {
            return undefined
        },
    }
}
