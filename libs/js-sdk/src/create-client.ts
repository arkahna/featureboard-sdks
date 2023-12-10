import type { EffectiveFeatureValue } from '@featureboard/contracts'
import { trace } from '@opentelemetry/api'
import type { EffectiveFeatureStateStore } from './effective-feature-state-store'
import type { FeatureBoardClient } from './features-client'

/** Designed for internal SDK use */
export function createClientInternal(
    stateStore: EffectiveFeatureStateStore,
): FeatureBoardClient {
    return {
        getEffectiveValues() {
            const all = stateStore.all()
            trace.getActiveSpan()?.addEvent('getEffectiveValues', {})

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
            trace.getActiveSpan()?.addEvent('getFeatureValue', {
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
            trace.getActiveSpan()?.addEvent('subscribeToFeatureValue', {
                featureKey,
                defaultValue,
            })

            const callback = (updatedFeatureKey: string, value: any): void => {
                if (featureKey === updatedFeatureKey) {
                    trace
                        .getActiveSpan()
                        ?.addEvent('subscribeToFeatureValue:update', {
                            featureKey,
                            value,
                            defaultValue,
                        })
                    onValue(value ?? defaultValue)
                }
            }

            stateStore.on('feature-updated', callback)
            onValue(stateStore.get(featureKey) ?? defaultValue)

            return () => {
                trace.getActiveSpan()?.addEvent('unsubscribeToFeatureValue', {
                    featureKey,
                })
                stateStore.off('feature-updated', callback)
            }
        },
    }
}
