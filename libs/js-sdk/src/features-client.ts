import { EffectiveFeatureValue } from '@featureboard/contracts'
import { Features } from '.'

export interface FeatureBoardClient {
    getFeatureValue<T extends keyof Features>(
        featureKey: T,
        defaultValue: Features[T],
    ): Features[T]

    /**
     * Subscribe to value updates, will immediately call back with the current value
     *
     * @returns unsubscribe function
     */
    subscribeToFeatureValue<T extends keyof Features>(
        featureKey: keyof Features,
        defaultValue: Features[T],
        onValue: (value: Features[T]) => void,
    ): () => void
}
