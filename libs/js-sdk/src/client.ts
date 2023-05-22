import { EffectiveFeatureValue } from '@featureboard/contracts'
import { PromiseCompletionSource } from 'promise-completion-source'
import { BrowserClient } from './client-connection'
import { EffectiveFeaturesState } from './effective-feature-state'
import {
    EffectiveFeatureStore,
    MemoryEffectiveFeatureStore,
} from './effective-feature-store'
import { FeatureBoardApiConfig } from './featureboard-api-config'
import { featureBoardHostedService } from './featureboard-service-urls'
import { FeatureBoardClient } from './features-client'
import { debugLog } from './log'
import { resolveUpdateStrategy } from './update-strategies/resolveUpdateStrategy'
import { UpdateStrategies } from './update-strategies/update-strategies'

export function createBrowserClient({
    initialValues,
    store,
    updateStrategy,
    environmentApiKey,
    api,
    audiences,
}: {
    /** Connect to a self hosted instance of FeatureBoard */
    api?: FeatureBoardApiConfig

    /**
     * The method your feature state is updated
     *
     * manual - will not proactively update
     * live - uses websockets for near realtime updates
     * polling - checks with the featureboard service every 30seconds (or configured interval) for updates
     */
    updateStrategy?: UpdateStrategies['kind'] | UpdateStrategies

    store?: EffectiveFeatureStore
    audiences: string[]

    initialValues?: EffectiveFeatureValue[]

    environmentApiKey: string
}): BrowserClient {
    if (store && initialValues) {
        throw new Error('Cannot specify both store and initialValues')
    }

    let initialisedCallback: (initialised: boolean) => void
    const initialisedPromise = new PromiseCompletionSource<boolean>()
    let updatedPromise: PromiseCompletionSource<boolean>[] = []

    // Ensure that the init promise doesn't cause an unhandled promise rejection
    initialisedPromise.promise.catch(() => {})
    const state = new EffectiveFeaturesState(
        audiences,
        store || new MemoryEffectiveFeatureStore(initialValues),
    )

    const updateStrategyImplementation = resolveUpdateStrategy(
        updateStrategy,
        environmentApiKey,
        api || featureBoardHostedService,
        audiences,
    )

    debugLog('SDK connecting in background (%o)', {
        audiences,
    })
    updateStrategyImplementation
        .connect(state)
        .then(() => {
            if (!initialisedPromise.completed) {
                debugLog('SDK connected (%o)', {
                    audiences,
                })
                initialisedPromise.resolve(true)
            }
        })
        .catch((err) => {
            if (!initialisedPromise.completed) {
                debugLog(
                    'SDK failed to connect (%o): %o',
                    {
                        audiences,
                    },
                    err,
                )
                initialisedPromise.reject(err)
            }
        })

    return {
        client: createBrowserFbClient(state),
        get initialised() {
            return (
                initialisedPromise.completed &&
                updatedPromise.every((p) => p.completed)
            )
        },
        waitForInitialised() {
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (this.initialised) {
                        clearInterval(interval)
                        resolve(true)
                    }
                }, 100)
            })
        },
        initialisedChanged(callback) {
            initialisedCallback = callback
        },
        async updateAudiences(updatedAudiences: string[]) {
            debugLog('Updating audiences: %o', {
                updatedAudiences,
                initialised: this.initialised,
            })

            const promise = new PromiseCompletionSource<boolean>()

            updatedPromise.push(promise)
            debugLog('updateAudiences: invoke initialised callback with false')
            initialisedCallback?.(false)

            return updateStrategyImplementation
                .updateAudiences(state, updatedAudiences)
                .then(() => {
                    promise?.resolve(true)
                    if (this.initialised) {
                        debugLog(
                            'updateAudiences: invoke initialised callback with true',
                        )
                        initialisedCallback?.(true)
                        updatedPromise = []
                    }
                })
        },
        updateFeatures() {
            return updateStrategyImplementation.updateFeatures()
        },
        close() {
            return updateStrategyImplementation.close()
        },
    }
}

function createBrowserFbClient(
    state: EffectiveFeaturesState,
): FeatureBoardClient {
    return {
        getEffectiveValues() {
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

            state.on('feature-updated', callback)
            onValue((state.store.get(featureKey) as any) ?? defaultValue)

            return () => {
                debugLog('unsubscribeToFeatureValue: %s', featureKey)
                state.off('feature-updated', callback)
            }
        },
    }
}
