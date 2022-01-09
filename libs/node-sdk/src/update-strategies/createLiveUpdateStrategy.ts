import { NotificationType } from '@featureboard/contracts'
import { LiveOptions } from '@featureboard/live-connection'
import { AllFeaturesState } from '../feature-state'
import { AllConfigUpdateStrategy } from './update-strategies'

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
        async connect(state: AllFeaturesState) {
            const liveConnection = await liveConnectionAsync

            function handleMessage(message: NotificationType) {
                // wsClientDebug('Handling message: %s', message.kind)
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
