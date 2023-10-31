import type { EffectiveFeatureValue } from '@featureboard/contracts'
import type {
    FeatureBoardApiConfig,
    FeatureBoardClient,
    Features,
} from '@featureboard/js-sdk'
import { featureBoardHostedService, retry } from '@featureboard/js-sdk'
import { PromiseCompletionSource } from 'promise-completion-source'
import type { ExternalStateStore, ServerClient } from '.'
import { AllFeatureStateStore } from './feature-state-store'
import { debugLog } from './log'
import { resolveUpdateStrategy } from './update-strategies/resolveUpdateStrategy'
import type { UpdateStrategies } from './update-strategies/update-strategies'

const serverConnectionDebug = debugLog.extend('server-connection')

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
}

export function createServerClient({
    api,
    externalStateStore,
    updateStrategy,
    environmentApiKey,
}: CreateServerClientOptions): ServerClient {
    const initialisedPromise = new PromiseCompletionSource<boolean>()
    // Ensure that the init promise doesn't cause an unhandled promise rejection
    initialisedPromise.promise.catch(() => {})
    const stateStore = new AllFeatureStateStore(externalStateStore)
    const updateStrategyImplementation = resolveUpdateStrategy(
        updateStrategy,
        environmentApiKey,
        api || featureBoardHostedService,
    )

    const retryCancellationToken = { cancel: false }
    retry(async () => {
        try {
            serverConnectionDebug('Connecting to SDK...')
            return await updateStrategyImplementation.connect(stateStore)
        } catch (error) {
            serverConnectionDebug(
                'Failed to connect to SDK, try to initialise form external state store',
                error,
            )
            // Try initialise external state store
            const result = await stateStore.initialiseFromExternalStateStore()
            if (!result) {
                // No external state store, throw original error
                console.error('Failed to connect to SDK', error)
                throw error
            }
            serverConnectionDebug('Initialised from external state store')
            return Promise.resolve()
        }
    }, retryCancellationToken)
        .then(() => {
            if (!initialisedPromise.completed) {
                serverConnectionDebug('Server client is initialised')
                initialisedPromise.resolve(true)
            }
        })
        .catch((err) => {
            if (!initialisedPromise.completed) {
                console.error(
                    'FeatureBoard SDK failed to connect after 5 retries',
                    err,
                )
                initialisedPromise.reject(err)
            }
        })

    return {
        get initialised() {
            return initialisedPromise.completed
        },
        close() {
            retryCancellationToken.cancel = true
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
                      request.then(() => syncRequest(stateStore, audienceKeys)),
                  )
                : makeRequestClient(syncRequest(stateStore, audienceKeys))
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

/**
 * Makes a request client which is can be awaited or not
 **/
export function makeRequestClient(
    client: FeatureBoardClient,
): FeatureBoardClient & PromiseLike<FeatureBoardClient> {
    return client as any
}

function syncRequest(
    stateStore: AllFeatureStateStore,
    audienceKeys: string[],
): FeatureBoardClient {
    // Shallow copy the feature state so requests are stable
    const featuresState = stateStore.all()

    const client: FeatureBoardClient = {
        getEffectiveValues: () => {
            return {
                audiences: audienceKeys,
                effectiveValues: Object.keys(featuresState)
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
