import { FeatureValues } from '@featureboard/contracts'
import { FeatureStore, MemoryStore } from './feature-store'

export class FeatureState {
    constructor(public store: FeatureStore = new MemoryStore()) {}

    private featureUpdatedCallbacks: Array<
        (featureKey: string, values: FeatureValues | undefined) => void
    > = []

    on(
        _event: 'feature-updated',
        callback: (
            featureKey: string,
            values: FeatureValues | undefined,
        ) => void,
    ): void {
        this.featureUpdatedCallbacks.push(callback)
    }

    off(
        _event: 'feature-updated',
        callback: (
            featureKey: string,
            values: FeatureValues | undefined,
        ) => void,
    ): void {
        this.featureUpdatedCallbacks.splice(
            this.featureUpdatedCallbacks.indexOf(callback),
            1,
        )
    }

    async updateFeatureState(
        featureKey: string,
        featureValues: FeatureValues | undefined,
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
