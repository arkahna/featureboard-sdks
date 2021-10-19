import { FeatureBoardClient } from '@featureboard/js-sdk'
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

        const getFeatureValue = (featureKey: any, defaultValue: any) => {
            const featureValues = featuresState[featureKey]
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

        return {
            getFeatureValue,
            subscribeToFeatureValue: (
                featureKey: string,
                defaultValue: any,
                onValue: (value: any) => void,
            ) => {
                onValue(getFeatureValue(featureKey, defaultValue))

                return () => {}
            },
        } as any
    }
}

const asyncErrorMessage =
    'request() must be awaited when using on-request update strategy'
const getFeatureValueAsync = () => {
    throw new Error(asyncErrorMessage)
}
const subscribeToFeatureValueAsync = () => {
    throw new Error(asyncErrorMessage)
}
/** Adds errors to the promise if the user doesn't await it */
function addUserWarnings(
    client: Promise<FeatureBoardClient>,
): FeatureBoardClient & PromiseLike<FeatureBoardClient> {
    ;(client as any).getFeatureValue = getFeatureValueAsync
    ;(client as any).subscribeToFeatureValue = subscribeToFeatureValueAsync

    return client as any
}

/** Adds warnings to the promise if the user doesn't await it */
function addSyncUserWarnings(
    client: FeatureBoardClient,
): FeatureBoardClient & PromiseLike<FeatureBoardClient> {
    return client as any
}
