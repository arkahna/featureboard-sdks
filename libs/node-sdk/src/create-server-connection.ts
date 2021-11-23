import { EffectiveFeatureValue } from '@featureboard/contracts'
import { FeatureBoardClient, Features } from '@featureboard/js-sdk'
import { FeatureState } from './feature-state'
import { debugLog } from './log'
import { ServerConnection } from './server-connection'

const serverConnectionDebug = debugLog.extend('server-connection')

export function createServerConnection(
    state: FeatureState,
    updateFeatures: () => Promise<void>,
    close: () => void,
    onRequest?: () => Promise<void>,
): ServerConnection {
    return {
        request: (audienceKeys: string[]) => {
            serverConnectionDebug(
                'Creating request client for audiences: %o',
                audienceKeys,
            )
            return onRequest
                ? addUserWarnings(
                      onRequest().then(() => syncRequest(audienceKeys)),
                  )
                : addSyncUserWarnings(syncRequest(audienceKeys))
        },
        updateFeatures,
        close,
    }

    function syncRequest(audienceKeys: string[]): FeatureBoardClient {
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
                            (effectiveValue) =>
                                effectiveValue.value !== undefined,
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
            const audienceException = featureValues.audienceExceptions.find(
                (value) => audienceKeys.includes(value.audienceKey),
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
}

const asyncErrorMessage =
    'request() must be awaited when using on-request update strategy'
const getValueAsyncWarn = () => {
    throw new Error(asyncErrorMessage)
}
/** Adds errors to the promise if the user doesn't await it */
function addUserWarnings(
    client: Promise<FeatureBoardClient>,
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
