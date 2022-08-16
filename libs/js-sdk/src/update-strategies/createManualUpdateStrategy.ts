import { createEnsureSingle } from '../ensure-single'
import { fetchFeaturesConfigurationViaHttp } from '../utils/fetchFeaturesConfiguration'
import { EffectiveConfigUpdateStrategy } from './update-strategies'
import { updatesLog } from './updates-log'

export const manualUpdatesDebugLog = updatesLog.extend('manual')

export function createManualUpdateStrategy(
    environmentApiKey: string,
    httpEndpoint: string,
    audiences: string[],
): EffectiveConfigUpdateStrategy {
    let lastModified: undefined | string
    let fetchUpdatesSingle: undefined | (() => Promise<void>)
    let currentAudiences = audiences

    return {
        async connect(state) {
            // Ensure that we don't trigger another request while one is in flight
            fetchUpdatesSingle = createEnsureSingle(async () => {
                lastModified = await fetchFeaturesConfigurationViaHttp(
                    httpEndpoint,
                    currentAudiences,
                    environmentApiKey,
                    state,
                    lastModified,
                    () => currentAudiences,
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
        updateAudiences(state, updatedAudiences) {
            currentAudiences = updatedAudiences
            manualUpdatesDebugLog(
                'Audiences updated (%o), getting new effective values',
                updatedAudiences,
            )
            return this.connect(state)
        },
    }
}
