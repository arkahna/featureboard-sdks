import { NotificationType } from '@featureboard/contracts'
import {
    FeatureBoardApiConfig,
    featureBoardHostedService,
    LiveConnection,
    LiveOptions,
} from '@featureboard/js-sdk'
import { createServerConnection } from './create-server-connection'
import { FeatureState } from './feature-state'
import { debugLog } from './log'
import { ServerConnection } from './server-connection'
import { initStore } from './server-http-client'

export interface FeatureBoardServerWsClientOptions {
    api?: FeatureBoardApiConfig
    state?: FeatureState
    liveOptions: LiveOptions

    /** Used for fallback if there are issues connecting */
    getFetch: () => Promise<
        (input: RequestInfo, init?: RequestInit) => Promise<Response>
    >
}

const wsClientDebug = debugLog.extend('ws-client')

export async function createNodeWsClient(
    environmentApiKey: string,
    {
        api = featureBoardHostedService,
        state = new FeatureState(),
        liveOptions,
        getFetch,
    }: FeatureBoardServerWsClientOptions,
): Promise<ServerConnection> {
    wsClientDebug('Creating Client')
    const liveConnection = new LiveConnection(
        environmentApiKey,
        { kind: 'all-values' },
        api,
        liveOptions,
    )

    try {
        await liveConnection.connect(handleMessage)
        wsClientDebug('Connected')
    } catch (err) {
        if (!state.store.isInitialised) {
            wsClientDebug(
                'Failed to connect to WS, falling back to http while retrying in background: %o',
                err,
            )
            await initStore(api, await getFetch(), environmentApiKey, state)
        }

        // We have successfully initialised the store using http, can now retry
        // live connection in the background
        liveConnection.tryReconnectInBackground(handleMessage)
    }

    return createServerConnection(
        state,
        async () => {},
        () => liveConnection.close('Client called close()'),
    )

    function handleMessage(message: NotificationType) {
        wsClientDebug('Handling message: %s', message.kind)
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
                liveConnection.close('Subscription error')
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
