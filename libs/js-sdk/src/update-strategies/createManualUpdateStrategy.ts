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
        async updateAudiences(state, updatedAudiences) {
            if (updatedAudiences.sort() === currentAudiences.sort()) {
                // No need to update audiences
                return Promise.resolve()
            }
            currentAudiences = updatedAudiences
            state.audiences = updatedAudiences
            manualUpdatesDebugLog(
                'Audiences updated (%o), getting new effective values',
                updatedAudiences,
            )
            lastModified = undefined
            return await this.connect(state)
        },
    }
}
