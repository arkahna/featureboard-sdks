import type { EffectiveFeatureValue } from '@featureboard/contracts'
import type { Span } from '@opentelemetry/api'
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

    const waitingForInitialization: Array<PromiseCompletionSource<boolean>> = []
    const initializedCallbacks: Array<(initialised: boolean) => void> = []

    const initialisedState: {
        initialisedPromise: PromiseCompletionSource<boolean>
        initializedCancellationToken: { cancel: boolean }
    } = {
        initialisedPromise: new PromiseCompletionSource<boolean>(),
        initializedCancellationToken: { cancel: false },
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
        initialisedState.initializedCancellationToken = cancellationToken

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
                initializeSpan.addEvent(
                    "Ignoring initialization error as it's out of date",
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

            waitingForInitialization.forEach((w) => w.reject(err))
            waitingForInitialization.length = 0
            initializeSpan.end()
            return
        }

        // Successfully completed
        if (initialPromise !== initialisedState.initialisedPromise) {
            initializeSpan.addEvent(
                "Ignoring initialization event as it's out of date",
            )
            initializeSpan.end()
            return
        }

        initialisedState.initialisedPromise.resolve(true)

        notifyWaitingForInitialization(initializedCallbacks, initializeSpan)
        waitingForInitialization.forEach((w) => w.resolve(true))
        waitingForInitialization.length = 0
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

            const initialized = new PromiseCompletionSource<boolean>()
            waitingForInitialization.push(initialized)
            return initialized.promise
        },
        subscribeToInitialisedChanged(callback) {
            initializedCallbacks.push(callback)
            return () => {
                initializedCallbacks.splice(
                    initializedCallbacks.indexOf(callback),
                    1,
                )
            }
        },
        async updateAudiences(updatedAudiences: string[]) {
            if (compareArrays(stateStore.audiences, updatedAudiences)) {
                trace.getActiveSpan()?.addEvent('Skipped update audiences', {
                    updatedAudiences,
                    currentAudiences: stateStore.audiences,
                })

                // No need to update audiences
                return Promise.resolve()
            }

            // Close connection and cancel retry
            updateStrategyImplementation.close()
            initialisedState.initializedCancellationToken.cancel = true

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
            initialisedState.initializedCancellationToken.cancel = true
            return updateStrategyImplementation.close()
        },
    }
}
function notifyWaitingForInitialization(
    initializedCallbacks: ((initialised: boolean) => void)[],
    initializeSpan: Span,
) {
    const errors: Error[] = []
    initializedCallbacks.forEach((c) => {
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
    initializedCallbacks.length = 0
}
