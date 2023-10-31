import type { NotificationType } from '@featureboard/contracts'
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { LiveOptions } from '@featureboard/live-connection'
import type { AllFeatureStateStore } from '../feature-state-store'
import type { AllConfigUpdateStrategy } from './update-strategies'

export function createLiveUpdateStrategy(
    environmentApiKey: string,
    endpoint: string,
    options: LiveOptions,
): AllConfigUpdateStrategy {
    const liveConnectionLib = import('@featureboard/live-connection')
    const liveConnectionAsync = liveConnectionLib.then(({ LiveConnection }) => {
        return new LiveConnection(
            environmentApiKey,
            { kind: 'all-values' },
            endpoint,
            options,
        )
    })

    let connectionState: 'connected' | 'disconnected' = 'disconnected'

    return {
        async connect(stateStore: AllFeatureStateStore) {
            const liveConnection = await liveConnectionAsync

            function handleMessage(message: NotificationType) {
                // wsClientDebug('Handling message: %s', message.kind)
                switch (message.kind) {
                    case 'feature-updated':
                    case 'feature-available': {
                        stateStore.set(message.featureKey, {
                            featureKey: message.featureKey,
                            defaultValue: message.defaultValue,
                            audienceExceptions: message.audienceExceptions,
                        })
                        break
                    }

                    case 'feature-unavailable': {
                        stateStore.set(message.featureKey, undefined)
                        break
                    }

                    case 'state-of-the-world': {
                        message.features.forEach((feature) => {
                            stateStore.set(feature.featureKey, {
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

            await liveConnection.connect(handleMessage)
            connectionState = 'connected'
        },
        get state() {
            return connectionState
        },

        async close() {
            const liveConnection = await liveConnectionAsync

            liveConnection.close('close()')
        },
        async updateFeatures() {
            // Currently no way to trigger manual update of live
        },
        onRequest() {
            return undefined
        },
    }
}
