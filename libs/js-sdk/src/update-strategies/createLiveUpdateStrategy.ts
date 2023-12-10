import type { NotificationType } from '@featureboard/contracts'
import type { LiveOptions } from '@featureboard/live-connection'
import type { EffectiveFeatureStateStore } from '../effective-feature-state-store'
import type { EffectiveConfigUpdateStrategy } from './update-strategies'

export function createLiveUpdateStrategy(
    environmentApiKey: string,
    endpoint: string,
    audiences: string[],
    options: LiveOptions,
): EffectiveConfigUpdateStrategy {
    const currentAudiences = audiences
    const liveConnectionLib = import('@featureboard/live-connection')
    const liveConnectionAsync = liveConnectionLib.then(({ LiveConnection }) => {
        return new LiveConnection(
            environmentApiKey,
            { kind: 'effective-values', audiences: currentAudiences },
            endpoint,
            options,
        )
    })

    let connectionState: 'connected' | 'disconnected' = 'disconnected'

    return {
        name: 'live',
        async connect(stateStore: EffectiveFeatureStateStore) {
            const liveConnection = await liveConnectionAsync

            function handleMessage(message: NotificationType) {
                switch (message.kind) {
                    case 'feature-value-updated':
                    case 'feature-value-available': {
                        stateStore.set(message.featureKey, message.value)
                        break
                    }
                    case 'state-of-the-world-effective-values': {
                        message.features.forEach((feature) => {
                            stateStore.set(feature.featureKey, feature.value)
                        })
                        connectionState = 'connected'
                        break
                    }

                    case 'feature-unavailable': {
                        stateStore.set(message.featureKey, undefined)
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

            await liveConnection.connect(handleMessage)
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
        // updateAudiences(state, updatedAudiences) {
        //     currentAudiences = updatedAudiences
        //     return this.connect(state)
        // },
    }
}
