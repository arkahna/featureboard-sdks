import type { EffectiveFeatureValue } from '@featureboard/contracts'
import { SpanStatusCode, trace } from '@opentelemetry/api'
import { PromiseCompletionSource } from 'promise-completion-source'
import type { BrowserClient } from './client-connection'
import { createClientInternal } from './create-client'
import { EffectiveFeatureStateStore } from './effective-feature-state-store'
import type { FeatureBoardApiConfig } from './featureboard-api-config'
import { featureBoardHostedService } from './featureboard-service-urls'
import { resolveUpdateStrategy } from './update-strategies/resolveUpdateStrategy'
import type { UpdateStrategies } from './update-strategies/update-strategies'
import { compareArrays } from './utils/compare-arrays'
import { getTracer } from './utils/get-tracer'
import { resolveError } from './utils/resolve-error'
import { retry } from './utils/retry'

/**
 * Create a FeatureBoard client for use in the browser
 *
 * This client will automatically connect to the FeatureBoard service and update the feature state
 */
export function createBrowserClient({
    updateStrategy,
    environmentApiKey,
    api,
    audiences,
    initialValues,
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

    initialValues?: EffectiveFeatureValue[]

    environmentApiKey: string
}): BrowserClient {
    const tracer = getTracer()

    const initialPromise = new PromiseCompletionSource<boolean>()
    const initialisedState: {
        initialisedCallbacks: Array<(initialised: boolean) => void>
        initialisedPromise: PromiseCompletionSource<boolean>
        initialisedError: Error | undefined
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

    const stateStore = new EffectiveFeatureStateStore(audiences, initialValues)

    const updateStrategyImplementation = resolveUpdateStrategy(
        updateStrategy,
        environmentApiKey,
        api || featureBoardHostedService,
    )

    const retryCancellationToken = { cancel: false }
    tracer.startActiveSpan(
        'connect-with-retry',
        {
            attributes: { audiences },
            // This is asynchronous so we don't want it nested in the current span
            root: true,
        },
        (span) =>
            retry(async () => {
                return await tracer.startActiveSpan(
                    'connect',
                    {
                        attributes: {
                            audiences,
                            updateStrategy: updateStrategyImplementation.name,
                        },
                    },
                    (operationSpan) =>
                        updateStrategyImplementation
                            .connect(stateStore)
                            .finally(() => operationSpan.end()),
                )
            }, retryCancellationToken)
                .then(() => {
                    if (
                        initialPromise !== initialisedState.initialisedPromise
                    ) {
                        return
                    }

                    if (!initialPromise.completed) {
                        span.end()
                        initialPromise.resolve(true)
                    }
                })
                .catch((err) => {
                    if (!initialisedState.initialisedPromise.completed) {
                        span.setStatus({ code: SpanStatusCode.ERROR })
                        span.end()
                        console.error(
                            'FeatureBoard SDK failed to connect after 5 retries',
                            err,
                        )
                        initialisedState.initialisedError = err
                        initialisedState.initialisedPromise.resolve(true)
                    }
                }),
    )

    const isInitialised = () => {
        return initialisedState.initialisedPromise.completed
    }

    return {
        client: createClientInternal(stateStore),
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
            initialisedState.initialisedCallbacks.push(callback)
            return () => {
                initialisedState.initialisedCallbacks.splice(
                    initialisedState.initialisedCallbacks.indexOf(callback),
                    1,
                )
            }
        },
        async updateAudiences(updatedAudiences: string[]) {
            await tracer.startActiveSpan(
                'connect',
                {
                    attributes: {
                        audiences,
                        updateStrategy: updateStrategyImplementation.name,
                    },
                },
                (updateAudiencesSpan) => {
                    if (compareArrays(stateStore.audiences, updatedAudiences)) {
                        trace
                            .getActiveSpan()
                            ?.addEvent('Skipped update audiences', {
                                updatedAudiences,
                                currentAudiences: stateStore.audiences,
                                initialised: isInitialised(),
                            })
                        updateAudiencesSpan.end()

                        // No need to update audiences
                        return Promise.resolve()
                    }

                    // Close connection and cancel retry
                    updateStrategyImplementation.close()
                    retryCancellationToken.cancel = true

                    const newPromise = new PromiseCompletionSource<boolean>()
                    initialisedState.initialisedPromise = newPromise
                    initialisedState.initialisedError = undefined
                    initialisedState.initialisedPromise.promise.catch(() => {})
                    initialisedState.initialisedPromise.promise.then(() => {
                        // If the promise has changed, then we don't want to invoke the callback
                        if (
                            newPromise !== initialisedState.initialisedPromise
                        ) {
                            return
                        }

                        // Get the value from the function, just incase it has changed
                        const initialised = isInitialised()
                        initialisedState.initialisedCallbacks.forEach((c) =>
                            c(initialised),
                        )
                    })

                    initialisedState.initialisedCallbacks.forEach((c) =>
                        c(false),
                    )

                    stateStore.audiences = updatedAudiences

                    updateStrategyImplementation
                        .connect(stateStore)
                        .then(() => {
                            newPromise?.resolve(true)
                            trace
                                .getActiveSpan()
                                ?.addEvent('Updated audiences', {
                                    updatedAudiences,
                                    currentAudiences: stateStore.audiences,
                                    initialised: isInitialised(),
                                })
                        })
                        .catch((error) => {
                            const err = resolveError(error)
                            updateAudiencesSpan.recordException(err)
                            updateAudiencesSpan.setStatus({
                                code: SpanStatusCode.ERROR,
                                message: 'Failed to update audiences',
                            })
                            initialisedState.initialisedError = error
                            newPromise?.resolve(true)
                        })
                        .finally(() => updateAudiencesSpan.end())
                },
            )
        },
        updateFeatures() {
            return updateStrategyImplementation.updateFeatures()
        },
        close() {
            retryCancellationToken.cancel = true
            return updateStrategyImplementation.close()
        },
    }
}
