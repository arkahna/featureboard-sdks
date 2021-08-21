import { Features } from '..'

export interface FeatureBoardClient {
    getFeatureValue(
        featureKey: keyof Features,
        defaultValue: Features[typeof featureKey],
    ): Features[typeof featureKey]

    /**
     * Subscribe to value updates, will immediately call back with the current value
     *
     * @returns unsubscribe function
     */
    subscribeToFeatureValue(
        featureKey: keyof Features,
        defaultValue: Features[typeof featureKey],
        onValue: (value: Features[typeof featureKey]) => void,
    ): () => void
}
