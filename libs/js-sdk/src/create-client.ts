import { EffectiveFeatureValue } from '@featureboard/contracts'
import { EffectiveFeatureState } from './effective-feature-state'
import { FeatureBoardClient } from './features-client'
import { debugLog } from './log'

export function createClient(state: EffectiveFeatureState): FeatureBoardClient {
    debugLog('Creating client')

    const featureboardClient: FeatureBoardClient = {
        getEffectiveValues: () => {
            const all = state.store.all()
            return {
                audiences: [...state.audiences],
                effectiveValues: Object.keys(all)
                    .filter((key) => all[key])
                    .map<EffectiveFeatureValue>((key) => ({
                        featureKey: key,
                        value: all[key]!,
                    })),
            }
        },
        getFeatureValue: (featureKey, defaultValue) => {
            const value = state.store.get(featureKey as string)
            debugLog('getFeatureValue: %o', { featureKey, value, defaultValue })

            return value ?? defaultValue
        },
        subscribeToFeatureValue(
            featureKey: string,
            defaultValue: any,
            onValue: (value: any) => void,
        ) {
            debugLog('subscribeToFeatureValue: %o', {
                featureKey,
            })

            const callback = (updatedFeatureKey: string, value: any): void => {
                if (featureKey === updatedFeatureKey) {
                    debugLog('subscribeToFeatureValue update: o', {
                        featureKey,
                        value,
                        defaultValue,
                    })
                    onValue(value ?? defaultValue)
                }
            }

            state.on('feature-updated', callback)
            onValue((state.store.get(featureKey) as any) ?? defaultValue)

            return () => {
                debugLog('unsubscribeToFeatureValue: %o', {
                    featureKey,
                })
                state.off('feature-updated', callback)
            }
        },
    }

    return featureboardClient
}
