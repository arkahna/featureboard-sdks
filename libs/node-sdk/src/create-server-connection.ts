import { FeatureBoardClient } from '@featureboard/js-sdk'
import { FeatureState } from './feature-state'
import { ServerConnection } from './server-connection'

export function createServerConnection(
    state: FeatureState,
    updateFeatures: () => Promise<void>,
    close: () => void,
    onRequest?: () => Promise<void>,
): ServerConnection {
    return {
        request: (audienceKeys: string[]) =>
            onRequest
                ? addUserWarnings(
                      onRequest().then(() => syncRequest(audienceKeys)),
                  )
                : addSyncUserWarnings(syncRequest(audienceKeys)),
        updateFeatures,
        close,
    }

    function syncRequest(audienceKeys: string[]): FeatureBoardClient {
        // Shallow copy the feature state so requests are stable
        const featuresState = { ...state.features }

        const getFeatureValue = (featureKey: any, defaultValue: any) => {
            const featureValues = featuresState[featureKey]
            if (!featureValues) {
                return defaultValue
            }
            const audienceValue = featureValues.audienceValues.find((value) =>
                audienceKeys.includes(value.audienceKey),
            )
            return audienceValue?.value ?? featureValues.defaultValue
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
    ;(client as any).then = () => {
        return Promise.resolve(client)
    }

    return client as any
}
