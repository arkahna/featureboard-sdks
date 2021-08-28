import { NotificationType } from '@featureboard/contracts'
import {
    FeatureBoardApiConfig,
    featureBoardHostedService,
    LiveConnection,
    LiveOptions,
} from '@featureboard/js-sdk'
import { createServerConnection } from './create-server-connection'
import { FeatureState } from './feature-state'
import { ServerConnection } from './server-connection'

export interface FeatureBoardServerWsClientOptions {
    api?: FeatureBoardApiConfig
    state?: FeatureState
    liveOptions: LiveOptions
}

export async function createNodeWsClient(
    environmentApiKey: string,
    {
        api = featureBoardHostedService,
        state = new FeatureState(),
        liveOptions,
    }: FeatureBoardServerWsClientOptions,
): Promise<ServerConnection> {
    const liveConnection = new LiveConnection(
        environmentApiKey,
        { kind: 'all-values' },
        api,
        liveOptions,
    )

    await liveConnection.connect(handleMessage)

    return createServerConnection(
        state,
        async () => {},
        () => liveConnection.close(),
    )

    function handleMessage(message: NotificationType) {
        switch (message.kind) {
            case 'feature-updated':
            case 'feature-available': {
                state.updateFeatureState(message.featureKey, {
                    featureKey: message.featureKey,
                    defaultValue: message.defaultValue,
                    audienceExceptions: message.audienceExceptions,
                })
                break
            }

            case 'feature-unavailable': {
                state.updateFeatureState(message.featureKey, undefined)
                break
            }

            case 'state-of-the-world': {
                message.features.forEach((feature) => {
                    state.updateFeatureState(feature.featureKey, {
                        featureKey: feature.featureKey,
                        defaultValue: feature.defaultValue,
                        audienceExceptions: feature.audienceExceptions,
                    })
                })
                break
            }

            case 'subscription-error': {
                console.error('Failed to subscribe', message.error)
                liveConnection.close()
                break
            }

            default: {
                console.warn(
                    { kind: message.kind },
                    'Unknown message type from FeatureBoard, you may need to upgrade your SDK',
                )
                break
            }
        }
    }
}
