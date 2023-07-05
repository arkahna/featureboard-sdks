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
import { compareArrays } from './utils/compare-arrays'

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
    const initialPromise = new PromiseCompletionSource<boolean>()
    const initialisedState: {
        initialisedCallbacks: Array<(initialsed: boolean) => void>
        initialisedPromise: PromiseCompletionSource<boolean>
    } = {
        initialisedCallbacks: [],
        initialisedPromise: initialPromise,
    }

    // Ensure that the init promise doesn't cause an unhandled promise rejection
    initialisedState.initialisedPromise.promise.catch(() => {})
    const state = new EffectiveFeaturesState(
        audiences,
        store || new MemoryEffectiveFeatureStore(initialValues),
    )

    const updateStrategyImplementation = resolveUpdateStrategy(
        updateStrategy,
        environmentApiKey,
        api || featureBoardHostedService,
    )

    debugLog('SDK connecting in background (%o)', {
        audiences,
    })
    updateStrategyImplementation
        .connect(state)
        .then(() => {
            if (initialPromise !== initialisedState.initialisedPromise) {
                return
            }

            if (!initialPromise.completed) {
                debugLog('SDK connected (%o)', {
                    audiences,
                })
                initialPromise.resolve(true)
            }
        })
        .catch((err) => {
            if (!initialisedState.initialisedPromise.completed) {
                debugLog(
                    'SDK failed to connect (%o): %o',
                    {
                        audiences,
                    },
                    err,
                )
                initialisedState.initialisedPromise.reject(err)
            }
        })
    const isInitialised = () => {
        return initialisedState.initialisedPromise.completed
    }

    return {
        client: createBrowserFbClient(state),
        get initialised() {
            return isInitialised()
        },
        waitForInitialised() {
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (isInitialised()) {
                        clearInterval(interval)
                        resolve(true)
                    }
                }, 100)
            })
        },
        subscribeToInitialisedChanged(callback) {
            debugLog('Subscribing to initialised changed: %o', {
                initialised: isInitialised(),
            })

            initialisedState.initialisedCallbacks.push(callback)
            return () => {
                initialisedState.initialisedCallbacks.splice(
                    initialisedState.initialisedCallbacks.indexOf(callback),
                    1,
                )
            }
        },
        async updateAudiences(updatedAudiences: string[]) {
            if (compareArrays(state.audiences, updatedAudiences)) {
                debugLog('Skipped updating audiences, no change: %o', {
                    updatedAudiences,
                    currentAudiences: state.audiences,
                    initialised: isInitialised(),
                })
                // No need to update audiences
                return Promise.resolve()
            }

            debugLog('Updating audiences: %o', {
                updatedAudiences,
                currentAudiences: state.audiences,
                initialised: isInitialised(),
            })

            const newPromise = new PromiseCompletionSource<boolean>()
            initialisedState.initialisedPromise = newPromise
            initialisedState.initialisedPromise.promise.catch(() => {})
            initialisedState.initialisedPromise.promise.then(() => {
                // If the promise has changed, then we don't want to invoke the callback
                if (newPromise !== initialisedState.initialisedPromise) {
                    return
                }

                // Get the value from the function, just incase it has changed
                const initialised = isInitialised()
                initialisedState.initialisedCallbacks.forEach((c) =>
                    c(initialised),
                )
            })
            debugLog('updateAudiences: invoke initialised callback with false')
            initialisedState.initialisedCallbacks.forEach((c) => c(false))

            state.audiences = updatedAudiences
            debugLog(
                'updateAudiences: Audiences updated (%o), getting new effective values',
                updatedAudiences,
            )

            updateStrategyImplementation.connect(state).then(() => {
                newPromise?.resolve(true)
                debugLog('Audiences updated: %o', {
                    updatedAudiences,
                    currentAudiences: state.audiences,
                    initialised: isInitialised(),
                })
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
