import type { EffectiveFeatureValue } from '@featureboard/contracts'
import type { Span } from '@opentelemetry/api'
import { SpanStatusCode } from '@opentelemetry/api'
import { PromiseCompletionSource } from 'promise-completion-source'
import type { BrowserClient } from './client-connection'
import { createClientInternal } from './create-client'
import { EffectiveFeatureStateStore } from './effective-feature-state-store'
import type { FeatureBoardApiConfig } from './featureboard-api-config'
import { featureBoardHostedService } from './featureboard-service-urls'
import { resolveUpdateStrategy } from './update-strategies/resolveUpdateStrategy'
import type { UpdateStrategies } from './update-strategies/update-strategies'
import { addDebugEvent } from './utils/add-debug-event'
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

    const waitingForInitialisation: Array<PromiseCompletionSource<boolean>> = []
    const initialisedCallbacks: Array<(initialised: boolean) => void> = []

    const initialisedState: {
        initialisedPromise: PromiseCompletionSource<boolean>
        initialisedCancellationToken: { cancel: boolean }
    } = {
        initialisedPromise: new PromiseCompletionSource<boolean>(),
        initialisedCancellationToken: { cancel: false },
    }

    const stateStore = new EffectiveFeatureStateStore(audiences, initialValues)

    const updateStrategyImplementation = resolveUpdateStrategy(
        updateStrategy,
        environmentApiKey,
        api || featureBoardHostedService,
    )

    async function initializeWithAudiences(
        initializeSpan: Span,
        audiences: string[],
    ) {
        const initialPromise = new PromiseCompletionSource<boolean>()
        const cancellationToken = { cancel: false }
        initialPromise.promise.catch(() => {})
        initialisedState.initialisedPromise = initialPromise
        initialisedState.initialisedCancellationToken = cancellationToken

        try {
            await retry(async () => {
                if (cancellationToken.cancel) {
                    return
                }

                return await tracer.startActiveSpan(
                    'connect',
                    {
                        attributes: {
                            audiences,
                            updateStrategy: updateStrategyImplementation.name,
                        },
                    },
                    (connectSpan) =>
                        updateStrategyImplementation
                            .connect(stateStore)
                            .finally(() => connectSpan.end()),
                )
            }, cancellationToken)
        } catch (error) {
            if (initialPromise !== initialisedState.initialisedPromise) {
                addDebugEvent(
                    "Ignoring initialisation error as it's out of date",
                )
                initializeSpan.end()
                return
            }
            const err = resolveError(error)

            initializeSpan.setStatus({
                code: SpanStatusCode.ERROR,
            })
            console.error(
                'FeatureBoard SDK failed to connect after 5 retries',
                err,
            )
            initialisedState.initialisedPromise.reject(err)

            waitingForInitialisation.forEach((w) => w.reject(err))
            waitingForInitialisation.length = 0
            initializeSpan.end()
            return
        }

        // Successfully completed
        if (initialPromise !== initialisedState.initialisedPromise) {
            addDebugEvent("Ignoring initialisation event as it's out of date")
            initializeSpan.end()
            return
        }

        initialisedState.initialisedPromise.resolve(true)

        notifyWaitingForInitialisation(initialisedCallbacks, initializeSpan)
        waitingForInitialisation.forEach((w) => w.resolve(true))
        waitingForInitialisation.length = 0
        initializeSpan.end()
    }

    void tracer.startActiveSpan(
        'connect-with-retry',
        {
            attributes: { audiences },
        },
        (connectWithRetrySpan) =>
            initializeWithAudiences(connectWithRetrySpan, audiences),
    )

    return {
        client: createClientInternal(stateStore),
        get initialised() {
            return initialisedState.initialisedPromise.completed
        },
        waitForInitialised() {
            if (initialisedState.initialisedPromise.completed) {
                return initialisedState.initialisedPromise.promise
            }

            const initialised = new PromiseCompletionSource<boolean>()
            waitingForInitialisation.push(initialised)
            return initialised.promise
        },
        subscribeToInitialisedChanged(callback) {
            initialisedCallbacks.push(callback)
            return () => {
                initialisedCallbacks.splice(
                    initialisedCallbacks.indexOf(callback),
                    1,
                )
            }
        },
        async updateAudiences(updatedAudiences: string[]) {
            if (compareArrays(stateStore.audiences, updatedAudiences)) {
                addDebugEvent('Skipped update audiences', {
                    updatedAudiences,
                    currentAudiences: stateStore.audiences,
                })

                // No need to update audiences
                return Promise.resolve()
            }

            // Close connection and cancel retry
            updateStrategyImplementation.close()
            initialisedState.initialisedCancellationToken.cancel = true

            await tracer.startActiveSpan(
                'update-audiences',
                {
                    attributes: {
                        audiences,
                        updateStrategy: updateStrategyImplementation.name,
                    },
                },
                (updateAudiencesSpan) => {
                    stateStore.audiences = updatedAudiences
                    return initializeWithAudiences(
                        updateAudiencesSpan,
                        updatedAudiences,
                    )
                },
            )
        },
        updateFeatures() {
            return tracer.startActiveSpan('manual-update', (span) =>
                updateStrategyImplementation
                    .updateFeatures()
                    .then(() => span.end()),
            )
        },
        close() {
            initialisedState.initialisedCancellationToken.cancel = true
            return updateStrategyImplementation.close()
        },
    }
}
function notifyWaitingForInitialisation(
    initialisedCallbacks: ((initialised: boolean) => void)[],
    initializeSpan: Span,
) {
    const errors: Error[] = []
    initialisedCallbacks.forEach((c) => {
        try {
            c(true)
        } catch (error) {
            const err = resolveError(error)
            initializeSpan.recordException(err)
            errors.push(err)
        }
    })

    if (errors.length === 1) {
        throw errors[0]
    }
    if (errors.length > 0) {
        throw new AggregateError(errors, 'Multiple callback errors occurred')
    }
    initialisedCallbacks.length = 0
}
