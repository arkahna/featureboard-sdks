import type { Features } from '.'
import type { FeatureBoardEffectiveStateJS } from './js-state'

export interface FeatureBoardClient {
    getFeatureValue<T extends keyof Features>(
        this: void,
        featureKey: T,
        defaultValue: Features[T],
    ): Features[T]

    /**
     * Subscribe to value updates, will immediately call back with the current value
     *
     * @returns unsubscribe function
     */
    subscribeToFeatureValue<T extends keyof Features>(
        this: void,
        featureKey: keyof Features,
        defaultValue: Features[T],
        onValue: (value: Features[T]) => void,
    ): () => void

    getEffectiveValues(this: void): FeatureBoardEffectiveStateJS
}
