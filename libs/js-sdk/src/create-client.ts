import { EffectiveFeatureState } from './effective-feature-state'
import { FeatureBoardClient } from './features-client'
import { debugLog } from './log'

export function createClient(state: EffectiveFeatureState): FeatureBoardClient {
    debugLog('Creating client')

    return {
        getFeatureValue: (featureKey: string, defaultValue: any): any => {
            return state.store.get(featureKey) ?? defaultValue
        },
        subscribeToFeatureValue(
            featureKey: string,
            defaultValue: any,
            onValue: (value: any) => void,
        ) {
            const callback = (updatedFeatureKey: string, value: any): void => {
                if (featureKey === updatedFeatureKey) {
                    onValue(value ?? defaultValue)
                }
            }

            state.on('feature-updated', callback)
            onValue((state.store.get(featureKey) as any) ?? defaultValue)

            return () => {
                state.off('feature-updated', callback)
            }
        },
    } as any
}
