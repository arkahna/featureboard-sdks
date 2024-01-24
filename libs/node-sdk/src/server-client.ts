import type { EffectiveFeatureValue } from '@featureboard/contracts'
import type {
    ClientOptions,
    FeatureBoardApiConfig,
    FeatureBoardClient,
    Features,
} from '@featureboard/js-sdk'
import {
    featureBoardHostedService,
    resolveError,
    retry,
} from '@featureboard/js-sdk'
import { SpanStatusCode } from '@opentelemetry/api'
import { PromiseCompletionSource } from 'promise-completion-source'
import type { ExternalStateStore, ServerClient } from '.'
import type { IFeatureStateStore } from './feature-state-store'
import { AllFeatureStateStore } from './feature-state-store'
import { resolveUpdateStrategy } from './update-strategies/resolveUpdateStrategy'
import type { UpdateStrategies } from './update-strategies/update-strategies'
import { DebugFeatureStateStore } from './utils/debug-store'
import { getTracer } from './utils/get-tracer'
import { setTracingEnabled } from './utils/trace-provider'

export interface CreateServerClientOptions {
    /** Connect to a self hosted instance of FeatureBoard */
    api?: FeatureBoardApiConfig

    /**
     * External state store is used to initialise the internal state store if retrieving the effective feature values from the API would fail.
     * After initialisation the external state store will be updated but otherwise not used again.
     *
     */
    externalStateStore?: ExternalStateStore

    /**
     * The method your feature state is updated
     *
     * manual - will not proactively update
     * live - uses websockets for near realtime updates
     * polling - checks with the featureboard service every 30seconds (or configured interval) for updates
     * on-request - checks for updates on every request
     */
    updateStrategy?: UpdateStrategies | UpdateStrategies['kind']

    environmentApiKey: string

    options?: ClientOptions
}

export function createServerClient({
    api,
    externalStateStore,
    updateStrategy,
    environmentApiKey,
    options,
}: CreateServerClientOptions): ServerClient {
    // enable or disable OpenTelemetry, enabled by default
    setTracingEnabled(!options || !options.disableOTel)
    const tracer = getTracer()

    const initialisedPromise = new PromiseCompletionSource<boolean>()
    // Ensure that the init promise doesn't cause an unhandled promise rejection
    initialisedPromise.promise.catch(() => {})
    let stateStore: IFeatureStateStore = new AllFeatureStateStore(
        externalStateStore,
    )
    if (process.env.FEATUREBOARD_SDK_DEBUG) {
        stateStore = new DebugFeatureStateStore(stateStore)
    }

    const updateStrategyImplementation = resolveUpdateStrategy(
        updateStrategy,
        environmentApiKey,
        api || featureBoardHostedService,
    )

    const retryCancellationToken = { cancel: false }

    void tracer.startActiveSpan(
        'fbsdk-connect-with-retry',
        {
            attributes: {},
        },
        (connectWithRetrySpan) =>
            retry(async () => {
                try {
                    return await updateStrategyImplementation.connect(
                        stateStore,
                    )
                } catch (error) {
                    const err = resolveError(error)
                    connectWithRetrySpan.recordException(err)

                    // Try initialise external state store
                    const result =
                        await stateStore.initialiseFromExternalStateStore()

                    if (!result) {
                        // No external state store, throw original error
                        console.error('Failed to connect to SDK', error)
                        throw error
                    }

                    return Promise.resolve()
                }
            }, retryCancellationToken)
                .then(() => {
                    initialisedPromise.resolve(true)
                })
                .catch((err) => {
                    console.error(
                        'FeatureBoard SDK failed to connect after 5 retries',
                        err,
                    )
                    initialisedPromise.reject(err)
                    connectWithRetrySpan.setStatus({
                        code: SpanStatusCode.ERROR,
                        message: err.message,
                    })
                })
                .finally(() => connectWithRetrySpan.end()),
    )

    return {
        get initialised() {
            return initialisedPromise.completed
        },
        close() {
            retryCancellationToken.cancel = true
            return updateStrategyImplementation.close()
        },
        request: (audienceKeys: string[]) => {
            return tracer.startActiveSpan(
                'fbsdk-get-request-client',
                { attributes: { audiences: audienceKeys } },
                (span) => {
                    const request = updateStrategyImplementation.onRequest()

                    if (request) {
                        return addUserWarnings(
                            request.then(() => {
                                span.end()
                                return syncRequest(stateStore, audienceKeys)
                            }),
                        )
                    }

                    try {
                        return makeRequestClient(
                            syncRequest(stateStore, audienceKeys),
                        )
                    } finally {
                        span.end()
                    }
                },
            )
        },
        updateFeatures() {
            return tracer.startActiveSpan(
                'fbsdk-update-features-manually',
                (span) => {
                    try {
                        return updateStrategyImplementation
                            .updateFeatures()
                            .then(() => span.end())
                    } finally {
                        span.end()
                    }
                },
            )
        },
        waitForInitialised() {
            return initialisedPromise.promise
        },
    }
}

const asyncErrorMessage =
    'request() must be awaited when using on-request update strategy'
const getValueAsyncWarn = () => {
    throw new Error(asyncErrorMessage)
}
/** Adds errors to the promise if the user doesn't await it */
function addUserWarnings(
    client: PromiseLike<FeatureBoardClient>,
): FeatureBoardClient & PromiseLike<FeatureBoardClient> {
    ;(client as any).getEffectiveValues = getValueAsyncWarn
    ;(client as any).getFeatureValue = getValueAsyncWarn
    ;(client as any).subscribeToFeatureValue = getValueAsyncWarn

    return client as any
}

/**
 * Makes a request client which is can be awaited or not
 **/
export function makeRequestClient(
    client: FeatureBoardClient,
): FeatureBoardClient & PromiseLike<FeatureBoardClient> {
    return client as any
}

function syncRequest(
    stateStore: IFeatureStateStore,
    audienceKeys: string[],
): FeatureBoardClient {
    // Shallow copy the feature state so requests are stable
    const featuresState = stateStore.all()

    const client: FeatureBoardClient = {
        getEffectiveValues: () => {
            return getTracer().startActiveSpan(
                'fbsdk-get-effective-values',
                (span) => {
                    try {
                        return {
                            audiences: audienceKeys,
                            effectiveValues: Object.keys(featuresState)
                                .map<EffectiveFeatureValue>((key) => ({
                                    featureKey: key,
                                    // We will filter the invalid undefined in the next filter
                                    value: getFeatureValue(key, undefined!),
                                }))
                                .filter(
                                    (effectiveValue) =>
                                        effectiveValue.value !== undefined,
                                ),
                        }
                    } finally {
                        span.end()
                    }
                },
            )
        },
        getFeatureValue,
        subscribeToFeatureValue: (
            featureKey: string,
            defaultValue: any,
            onValue: (value: any) => void,
        ) => {
            onValue(getFeatureValue(featureKey, defaultValue))
            return () => {}
        },
    }

    function getFeatureValue<T extends string | number>(
        featureKey: T,
        defaultValue: Features[T],
    ) {
        return getTracer().startActiveSpan(
            'fbsdk-get-feature-value',
            (span) => {
                try {
                    const featureValues = featuresState[featureKey as string]
                    if (!featureValues) {
                        span.addEvent(
                            'getFeatureValue - no value, returning user fallback: ',
                            {
                                audienceKeys,
                                'feature.key': featureKey,
                                'feature.defaultValue': defaultValue,
                            },
                        )

                        return defaultValue
                    }
                    const audienceException =
                        featureValues.audienceExceptions.find((a) =>
                            audienceKeys.includes(a.audienceKey),
                        )
                    const value =
                        audienceException?.value ?? featureValues.defaultValue
                    span.setAttributes({
                        'feature.key': featureKey,
                        'feature.value': value,
                        'feature.defaultValue': defaultValue,
                    })
                    return value
                } finally {
                    span.end()
                }
            },
        )
    }

    return client
}
