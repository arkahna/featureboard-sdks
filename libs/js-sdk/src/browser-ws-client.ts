import { NotificationType } from '@featureboard/contracts'
import { initStore } from './browser-http-client'
import { ClientConnection } from './client-connection'
import { createClient } from './create-client'
import { EffectiveFeatureState } from './effective-feature-state'
import { FeatureBoardApiConfig } from './featureboard-api-config'
import { LiveConnection, LiveOptions } from './live-connection'
import { debugLog } from './log'

export interface FeatureBoardBrowserWsClientOptions {
    api: FeatureBoardApiConfig
    state: EffectiveFeatureState
    liveOptions: LiveOptions

    /** Used for fallback if there are issues connecting */
    fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
}

const wsClientDebug = debugLog.extend('ws-client')

export async function createBrowserWsClient(
    environmentApiKey: string,
    audiences: string[],
    { api, state, liveOptions, fetch }: FeatureBoardBrowserWsClientOptions,
): Promise<ClientConnection> {
    wsClientDebug('Creating Client')
    let liveConnection = new LiveConnection(
        environmentApiKey,
        { kind: 'effective-values', audiences },
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
            await initStore(api, audiences, fetch, environmentApiKey, state)
        }

        // We have successfully initialised the store using http, can now retry
        // live connection in the background
        liveConnection.tryReconnectInBackground(handleMessage)
    }

    return {
        client: createClient(state),
        updateFeatures: async () => {},
        updateAudiences: async (audiences: string[]) => {
            state.audiences = audiences
            liveConnection.close('Changing audiences')
            liveConnection = new LiveConnection(
                environmentApiKey,
                { kind: 'effective-values', audiences },
                api,
                liveOptions,
            )

            try {
                await liveConnection.connect(handleMessage)
                wsClientDebug('Connected')
            } catch (err) {
                liveConnection.tryReconnectInBackground(handleMessage)
            }
        },
        close() {
            liveConnection.close('Client called close()')
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
                liveConnection.close('Subscription error')
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
