import { NotificationType } from '@featureboard/contracts'
import { ClientConnection } from './client'
import { createClient } from './create-client'
import { EffectiveFeatureState } from './effective-feature-state'
import { FeatureBoardApiConfig } from './featureboard-api-config'
import { LiveConnection, LiveOptions } from './live-connection'

export interface FeatureBoardBrowserWsClientOptions {
    api: FeatureBoardApiConfig
    state: EffectiveFeatureState
    liveOptions: LiveOptions
}

export async function createBrowserWsClient(
    environmentApiKey: string,
    audiences: string[],
    { api, state, liveOptions }: FeatureBoardBrowserWsClientOptions,
): Promise<ClientConnection> {
    const liveConnection = new LiveConnection(
        environmentApiKey,
        { kind: 'effective-values', audiences },
        api,
        liveOptions,
    )

    await liveConnection.connect(handleMessage)

    return {
        client: createClient(state),
        updateFeatures: () => liveConnection.connect(handleMessage),
        close() {
            liveConnection.close()
        },
    }

    function handleMessage(message: NotificationType) {
        switch (message.kind) {
            case 'feature-value-updated':
            case 'feature-value-available': {
                state.updateFeatureValue(message.featureKey, message.value)
                break
            }
            case 'state-of-the-world-effective-values': {
                message.features.forEach((feature) => {
                    state.updateFeatureValue(feature.featureKey, feature.value)
                })
                break
            }

            case 'feature-unavailable': {
                state.updateFeatureValue(message.featureKey, undefined)
                break
            }

            case 'subscription-error': {
                console.error('Failed to subscribe', message.error)
                liveConnection.close()
                break
            }

            default: {
                // Kind should be never here if everything has been handled
                console.warn(
                    { kind: message.kind },
                    'Unknown message type from FeatureBoard, you may need to upgrade your SDK',
                )
                break
            }
        }
    }
}
