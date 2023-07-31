import { PromiseCompletionSource } from 'promise-completion-source'
import { BrowserClient } from './client-connection'
import { EffectiveFeatureStateStore } from './effective-feature-state-store'
import { FeatureBoardApiConfig } from './featureboard-api-config'
import { featureBoardHostedService } from './featureboard-service-urls'
import { FeatureBoardClient } from './features-client'
import { debugLog } from './log'
import { resolveUpdateStrategy } from './update-strategies/resolveUpdateStrategy'
import { UpdateStrategies } from './update-strategies/update-strategies'
import { compareArrays } from './utils/compare-arrays'
import { retry } from './utils/retry'

export function createBrowserClient({
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

    audiences: string[]

    environmentApiKey: string
}): BrowserClient {
    const initialPromise = new PromiseCompletionSource<boolean>()
    const initialisedState: {
        initialisedCallbacks: Array<(initialised: boolean) => void>
        initialisedPromise: PromiseCompletionSource<boolean>
        initialisedError: any
    } = {
        initialisedCallbacks: [],
        initialisedPromise: initialPromise,
        initialisedError: undefined,
    }
    initialisedState.initialisedPromise.promise.then(() => {
        // If the promise has changed, then we don't want to invoke the callback
        if (initialPromise !== initialisedState.initialisedPromise) {
            return
        }

        // Get the value from the function, just incase it has changed
        const initialised = isInitialised()
        initialisedState.initialisedCallbacks.forEach((c) => c(initialised))
    })

    // Ensure that the init promise doesn't cause an unhandled promise rejection
    initialisedState.initialisedPromise.promise.catch(() => {})

    const stateStore = new EffectiveFeatureStateStore(audiences)

    const updateStrategyImplementation = resolveUpdateStrategy(
        updateStrategy,
        environmentApiKey,
        api || featureBoardHostedService,
    )

    const retryCancellationToken = { cancel: false }
    retry(async () => {
        debugLog('SDK connecting in background (%o)', {
            audiences,
        })
        return await updateStrategyImplementation.connect(stateStore)
    }, retryCancellationToken)
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
                console.error(
                    'FeatureBoard SDK failed to connect after 5 retries',
                    err,
                )
                initialisedState.initialisedError = err
                initialisedState.initialisedPromise.resolve(true)
            }
        })
    const isInitialised = () => {
        return initialisedState.initialisedPromise.completed
    }

    return {
        client: createBrowserFbClient(stateStore),
        get initialised() {
            return isInitialised()
        },
        waitForInitialised() {
            return new Promise((resolve, reject) => {
                const interval = setInterval(() => {
                    if (initialisedState.initialisedError) {
                        clearInterval(interval)
                        reject(initialisedState.initialisedError)
                    } else if (isInitialised()) {
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
            if (compareArrays(stateStore.audiences, updatedAudiences)) {
                debugLog('Skipped updating audiences, no change: %o', {
                    updatedAudiences,
                    currentAudiences: stateStore.audiences,
                    initialised: isInitialised(),
                })
                // No need to update audiences
                return Promise.resolve()
            }

            debugLog('Updating audiences: %o', {
                updatedAudiences,
                currentAudiences: stateStore.audiences,
                initialised: isInitialised(),
            })

            // Close connection and cancel retry
            updateStrategyImplementation.close()
            retryCancellationToken.cancel = true

            const newPromise = new PromiseCompletionSource<boolean>()
            initialisedState.initialisedPromise = newPromise
            initialisedState.initialisedError = undefined
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

            stateStore.audiences = updatedAudiences
            debugLog(
                'updateAudiences: Audiences updated (%o), getting new effective values',
                updatedAudiences,
            )

            updateStrategyImplementation
                .connect(stateStore)
                .then(() => {
                    newPromise?.resolve(true)
                    debugLog('Audiences updated: %o', {
                        updatedAudiences,
                        currentAudiences: stateStore.audiences,
                        initialised: isInitialised(),
                    })
                })
                .catch((error) => {
                    console.error('Failed to connect to SDK', error)
                    initialisedState.initialisedError = error
                    newPromise?.resolve(true)
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
    stateStore: EffectiveFeatureStateStore,
): FeatureBoardClient {
    return {
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
            onValue((stateStore.get(featureKey) as any) ?? defaultValue)

            return () => {
                debugLog('unsubscribeToFeatureValue: %s', featureKey)
                stateStore.off('feature-updated', callback)
            }
        },
    }
}
