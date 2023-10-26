import type { EffectiveFeatureValue } from '@featureboard/contracts'
import type { EffectiveFeatureStateStore } from './effective-feature-state-store'
import type { FeatureBoardClient } from './features-client'
import { debugLog } from './log'

/** Designed for internal SDK use */
export function createClientInternal(
    stateStore: EffectiveFeatureStateStore,
): FeatureBoardClient {
    return {
        getEffectiveValues() {
            const all = stateStore.all()
            return {
                audiences: [...stateStore.audiences],
                effectiveValues: Object.keys(all)
                    .filter((key) => all[key])
                    .map<EffectiveFeatureValue>((key) => ({
                        featureKey: key,
                        value: all[key]!,
                    })),
            }
        },
        getFeatureValue: (featureKey, defaultValue) => {
            const value = stateStore.get(featureKey as string)
            debugLog('getFeatureValue: %o', {
                featureKey,
                value,
                defaultValue,
            })

            return value ?? defaultValue
        },
        subscribeToFeatureValue(
            featureKey: string,
            defaultValue: any,
            onValue: (value: any) => void,
        ) {
            debugLog('subscribeToFeatureValue: %s', featureKey)

            const callback = (updatedFeatureKey: string, value: any): void => {
                if (featureKey === updatedFeatureKey) {
                    debugLog(
                        'subscribeToFeatureValue: %s update: %o',
                        featureKey,
                        {
                            featureKey,
                            value,
                            defaultValue,
                        },
                    )
                    onValue(value ?? defaultValue)
                }
            }

            stateStore.on('feature-updated', callback)
            onValue(stateStore.get(featureKey) ?? defaultValue)

            return () => {
                debugLog('unsubscribeToFeatureValue: %s', featureKey)
                stateStore.off('feature-updated', callback)
            }
        },
    }
}
