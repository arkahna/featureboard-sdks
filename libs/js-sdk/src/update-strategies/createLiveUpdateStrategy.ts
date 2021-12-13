import { NotificationType } from '@featureboard/contracts'
import { LiveOptions } from '@featureboard/live-connection'
import { EffectiveFeaturesState } from '../effective-feature-state'
import { EffectiveConfigUpdateStrategy } from './update-strategies'

export function createLiveUpdateStrategy(
    environmentApiKey: string,
    endpoint: string,
    options: LiveOptions,
): EffectiveConfigUpdateStrategy {
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
        async connect(state: EffectiveFeaturesState) {
            const liveConnection = await liveConnectionAsync

            function handleMessage(message: NotificationType) {
                // wsClientDebug('Handling message: %s', message.kind)
                switch (message.kind) {
                    case 'feature-value-available':
                    case 'feature-value-updated': {
                        state.updateFeatureValue(
                            message.featureKey,
                            message.value,
                        )
                        break
                    }

                    case 'feature-unavailable': {
                        state.updateFeatureValue(message.featureKey, undefined)
                        break
                    }

                    case 'state-of-the-world-effective-values': {
                        message.features.forEach((feature) => {
                            state.updateFeatureValue(
                                feature.featureKey,
                                feature.value,
                            )
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
