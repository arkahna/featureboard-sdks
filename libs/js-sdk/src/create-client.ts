import type { EffectiveFeatureValue } from '@featureboard/contracts'
import type { EffectiveFeatureStateStore } from './effective-feature-state-store'
import type { FeatureBoardClient } from './features-client'
import { getTracer } from './utils/get-tracer'

/** Designed for internal SDK use */
export function createClientInternal(
    stateStore: EffectiveFeatureStateStore,
): FeatureBoardClient {
    return {
        getEffectiveValues() {
            return getTracer().startActiveSpan(
                'fbsdk-get-effective-values',
                (span) => {
                    try {
                        const all = stateStore.all()
                        span.setAttributes({
                            store: JSON.stringify(all),
                        })

                        return {
                            audiences: [...stateStore.audiences],
                            effectiveValues: Object.keys(all)
                                .filter((key) => all[key])
                                .map<EffectiveFeatureValue>((key) => ({
                                    featureKey: key,
                                    value: all[key]!,
                                })),
                        }
                    } finally {
                        span.end()
                    }
                },
            )
        },
        getFeatureValue: (featureKey, defaultValue) => {
            return getTracer().startActiveSpan(
                'fbsdk-get-feature-value',
                (span) => {
                    try {
                        const value = stateStore.get(featureKey as string)
                        span.setAttributes({
                            'feature.key': featureKey,
                            'feature.value': value,
                            'feature.defaultValue': defaultValue,
                        })

                        return value ?? defaultValue
                    } finally {
                        span.end()
                    }
                },
            )
        },
        subscribeToFeatureValue(
            featureKey: string,
            defaultValue: any,
            onValue: (value: any) => void,
        ) {
            return getTracer().startActiveSpan(
                'fbsdk-subscribe-to-feature-value',
                {
                    attributes: {
                        'feature.key': featureKey,
                        'feature.defaultValue': defaultValue,
                    },
                },
                (span) => {
                    try {
                        const callback = (
                            updatedFeatureKey: string,
                            value: any,
                        ): void => {
                            if (featureKey === updatedFeatureKey) {
                                getTracer().startActiveSpan(
                                    'fbsdk-subscribeToFeatureValue-onValue',
                                    {
                                        attributes: {
                                            'feature.key': featureKey,
                                            'feature.value': value,
                                            'feature.defaultValue':
                                                defaultValue,
                                        },
                                    },
                                    (span) => {
                                        try {
                                            onValue(value ?? defaultValue)
                                        } finally {
                                            span.end()
                                        }
                                    },
                                )
                            }
                        }

                        stateStore.on('feature-updated', callback)
                        onValue(stateStore.get(featureKey) ?? defaultValue)

                        return () => {
                            getTracer().startActiveSpan(
                                'fbsdk-unsubscribe-to-feature-value',
                                {
                                    attributes: {
                                        'feature.key': featureKey,
                                        'feature.defaultValue': defaultValue,
                                    },
                                },
                                (span) => {
                                    try {
                                        stateStore.off(
                                            'feature-updated',
                                            callback,
                                        )
                                    } finally {
                                        span.end()
                                    }
                                },
                            )
                        }
                    } finally {
                        span.end()
                    }
                },
            )
        },
    }
}
