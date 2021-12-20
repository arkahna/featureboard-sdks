import {
    EffectiveFeatureValue,
    FeatureConfiguration,
} from '@featureboard/contracts'
import {
    FeatureBoardApiConfig,
    FeatureBoardClient,
    featureBoardHostedService,
    Features,
} from '@featureboard/js-sdk'
import { PromiseCompletionSource } from 'promise-completion-source'
import {
    AllFeaturesState,
    FeatureStore,
    MemoryFeatureStore,
    ServerClient,
} from '.'
import { debugLog } from './log'
import { resolveUpdateStrategy } from './update-strategies/resolveUpdateStrategy'
import { UpdateStrategies } from './update-strategies/update-strategies'
import { FetchSignature } from './utils/fetchFeaturesConfiguration'

const serverConnectionDebug = debugLog.extend('server-connection')

export interface CreateServerClientOptions {
    /** Connect to a self hosted instance of FeatureBoard */
    api?: FeatureBoardApiConfig

    store?: FeatureStore

    initialValues?: FeatureConfiguration[]

    /**
     * The method your feature state is updated
     *
     * manual - will not proactively update
     * live - uses websockets for near realtime updates
     * polling - checks with the featureboard service every 30seconds (or configured interval) for updates
     * on-request - checks for updates on every request - see docs for how to enable HTTP caching in node
     */
    updateStrategy?: UpdateStrategies | UpdateStrategies['kind']

    environmentApiKey: string

    fetch?: FetchSignature
}

export function createServerClient({
    api,
    initialValues,
    store,
    updateStrategy,
    environmentApiKey,
    fetch,
}: CreateServerClientOptions): ServerClient {
    if (store && initialValues) {
        throw new Error('Cannot specify both store and initialValues')
    }

    const initialisedPromise = new PromiseCompletionSource<boolean>()
    const state = new AllFeaturesState(
        store || new MemoryFeatureStore(initialValues),
    )
    const updateStrategyImplementation = resolveUpdateStrategy(
        updateStrategy,
        environmentApiKey,
        api || featureBoardHostedService,
        fetch,
    )

    updateStrategyImplementation.connect(state).then(() => {
        if (!initialisedPromise.completed) {
            initialisedPromise.resolve(true)
        }
    })

    return {
        get initialised() {
            return initialisedPromise.completed
        },
        close() {
            return updateStrategyImplementation.close()
        },
        request: (audienceKeys: string[]) => {
            const request = updateStrategyImplementation.onRequest()

            serverConnectionDebug(
                'Creating request client for audiences: %o',
                audienceKeys,
            )
            return request
                ? addUserWarnings(
                      request.then(() => syncRequest(state, audienceKeys)),
                  )
                : addSyncUserWarnings(syncRequest(state, audienceKeys))
        },
        updateFeatures() {
            return updateStrategyImplementation.updateFeatures()
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

/** Adds warnings to the promise if the user doesn't await it */
function addSyncUserWarnings(
    client: FeatureBoardClient,
): FeatureBoardClient & PromiseLike<FeatureBoardClient> {
    return client as any
}

function syncRequest(
    state: AllFeaturesState,
    audienceKeys: string[],
): FeatureBoardClient {
    // Shallow copy the feature state so requests are stable
    const featuresState = state.store.all()

    const client: FeatureBoardClient = {
        getEffectiveValues: () => {
            const all = state.store.all()
            return {
                audiences: audienceKeys,
                effectiveValues: Object.keys(all)
                    .map<EffectiveFeatureValue>((key) => ({
                        featureKey: key,
                        // We will filter the invalid undefined in the next filter
                        value: getFeatureValue(key, undefined!),
                    }))
                    .filter(
                        (effectiveValue) => effectiveValue.value !== undefined,
                    ),
            }
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
        const featureValues = featuresState[featureKey as string]
        if (!featureValues) {
            serverConnectionDebug(
                'getFeatureValue - no value, returning user fallback: %o',
                audienceKeys,
            )
            return defaultValue
        }
        const audienceException = featureValues.audienceExceptions.find((a) =>
            audienceKeys.includes(a.audienceKey),
        )
        const value = audienceException?.value ?? featureValues.defaultValue
        serverConnectionDebug('getFeatureValue: %o', {
            audienceExceptionValue: audienceException?.value,
            defaultValue: featureValues.defaultValue,
            value,
        })
        return value
    }

    return client
}
