import { createEnsureSingle } from '../ensure-single'
import { fetchFeaturesConfigurationViaHttp } from '../utils/fetchFeaturesConfiguration'
import { FetchSignature } from '../utils/FetchSignature'
import { getEffectiveEndpoint } from './getEffectiveEndpoint'
import { EffectiveConfigUpdateStrategy } from './update-strategies'

export function createManualUpdateStrategy(
    environmentApiKey: string,
    httpEndpoint: string,
    audiences: string[],
    fetchInstance: FetchSignature,
): EffectiveConfigUpdateStrategy {
    let lastModified: undefined | string
    let fetchUpdatesSingle: undefined | (() => Promise<void>)
    let currentAudiences = audiences

    return {
        async connect(state) {
            // Ensure that we don't trigger another request while one is in flight
            fetchUpdatesSingle = createEnsureSingle(async () => {
                lastModified = await fetchFeaturesConfigurationViaHttp(
                    fetchInstance,
                    getEffectiveEndpoint(httpEndpoint, currentAudiences),
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
        onRequest() {
            return undefined
        },
        updateAudiences(state, updatedAudiences) {
            currentAudiences = updatedAudiences
            return this.connect(state)
        },
    }
}
