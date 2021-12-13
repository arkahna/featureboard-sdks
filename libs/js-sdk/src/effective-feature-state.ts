import {
    EffectiveFeatureStore,
    MemoryEffectiveFeatureStore,
} from './effective-feature-store'

export interface EffectiveFeatureValues {
    [featureKey: string]: string | boolean | number
}

type FeatureValue = string | boolean | number | undefined

export class EffectiveFeaturesState {
    private valueUpdatedCallbacks: Array<
        (featureKey: string, value: FeatureValue) => void
    > = []

    constructor(
        public audiences: string[],
        public store: EffectiveFeatureStore = new MemoryEffectiveFeatureStore(),
    ) {}

    on(
        _event: 'feature-updated',
        callback: (featureKey: string, value: FeatureValue) => void,
    ): void {
        this.valueUpdatedCallbacks.push(callback)
    }
    off(
        _event: 'feature-updated',
        callback: (featureKey: string, value: FeatureValue) => void,
    ): void {
        this.valueUpdatedCallbacks.splice(
            this.valueUpdatedCallbacks.indexOf(callback),
            1,
        )
    }

    updateFeatureValue(featureKey: string, value: FeatureValue) {
        if (value === undefined) {
            this.store.set(featureKey, undefined)
        } else {
            this.store.set(featureKey, value)
        }

        this.valueUpdatedCallbacks.forEach((valueUpdated) =>
            valueUpdated(featureKey, value),
        )
    }
}
