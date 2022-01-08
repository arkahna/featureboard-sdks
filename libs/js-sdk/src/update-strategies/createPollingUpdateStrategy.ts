import { createEnsureSingle } from '../ensure-single'
import { fetchFeaturesConfigurationViaHttp } from '../utils/fetchFeaturesConfiguration'
import { FetchSignature } from '../utils/FetchSignature'
import { pollingUpdates } from '../utils/pollingUpdates'
import { getEffectiveEndpoint } from './getEffectiveEndpoint'
import { EffectiveConfigUpdateStrategy } from './update-strategies'

export function createPollingUpdateStrategy(
    environmentApiKey: string,
    httpEndpoint: string,
    intervalMs: number,
    audiences: string[],
    fetchInstance: FetchSignature,
): EffectiveConfigUpdateStrategy {
    let stopPolling: undefined | (() => void)
    let lastModified: undefined | string
    let fetchUpdatesSingle: undefined | (() => Promise<void>)
    let currentAudiences = audiences

    return {
        async connect(state) {
            // Ensure that we don't trigger another request while one is in flight
            fetchUpdatesSingle = createEnsureSingle(async () => {
                const effectiveEndpoint = getEffectiveEndpoint(
                    httpEndpoint,
                    currentAudiences,
                )

                lastModified = await fetchFeaturesConfigurationViaHttp(
                    fetchInstance,
                    effectiveEndpoint,
                    environmentApiKey,
                    state,
                    lastModified,
                )
            })

            if (stopPolling) {
                stopPolling()
            }
            stopPolling = pollingUpdates(() => {
                if (fetchUpdatesSingle) {
                    fetchUpdatesSingle()
                }
            }, intervalMs)

            return fetchUpdatesSingle()
        },
        async close() {
            if (stopPolling) {
                stopPolling()
            }
        },
        get state() {
            if (stopPolling) {
                return 'connected'
            }
            return 'disconnected'
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
