import { FeatureConfiguration } from '@featureboard/contracts'
import { FeatureStore, MemoryFeatureStore } from './feature-store'

export class AllFeaturesState {
    constructor(public store: FeatureStore = new MemoryFeatureStore()) {}

    private featureUpdatedCallbacks: Array<
        (featureKey: string, values: FeatureConfiguration | undefined) => void
    > = []

    on(
        _event: 'feature-updated',
        callback: (
            featureKey: string,
            values: FeatureConfiguration | undefined,
        ) => void,
    ): void {
        this.featureUpdatedCallbacks.push(callback)
    }

    off(
        _event: 'feature-updated',
        callback: (
            featureKey: string,
            values: FeatureConfiguration | undefined,
        ) => void,
    ): void {
        this.featureUpdatedCallbacks.splice(
            this.featureUpdatedCallbacks.indexOf(callback),
            1,
        )
    }

    async updateFeatureState(
        featureKey: string,
        featureValues: FeatureConfiguration | undefined,
    ) {
        if (featureValues === undefined) {
            await this.store.set(featureKey, undefined)
            this.featureUpdatedCallbacks.forEach((valueUpdated) =>
                valueUpdated(featureKey, undefined),
            )
        } else {
            await this.store.set(featureKey, featureValues)
            this.featureUpdatedCallbacks.forEach((valueUpdated) =>
                valueUpdated(featureKey, featureValues),
            )
        }
    }
}
