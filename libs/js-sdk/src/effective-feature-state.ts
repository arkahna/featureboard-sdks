import {
    EffectiveFeatureStore,
    MemoryEffectiveFeatureStore,
} from './effective-feature-store'

export interface EffectiveFeatureValues {
    [featureKey: string]: string | boolean | number
}

type FeatureValue = string | boolean | number | undefined

export class EffectiveFeaturesState {
    private static instance: EffectiveFeaturesState | null = null
    private valueUpdatedCallbacks: Array<
        (featureKey: string, value: FeatureValue) => void
    > = []

    private constructor(
        public audiences: string[],
        public store: EffectiveFeatureStore = new MemoryEffectiveFeatureStore(),
    ) {
        if (EffectiveFeaturesState.instance) {
            return EffectiveFeaturesState.instance
        }
        EffectiveFeaturesState.instance = this
    }

    static getInstance(
        audiences: string[],
        store: EffectiveFeatureStore,
    ): EffectiveFeaturesState {
        if (!EffectiveFeaturesState.instance) {
            EffectiveFeaturesState.instance = new EffectiveFeaturesState(
                audiences,
                store,
            )
        }
        return EffectiveFeaturesState.instance
    }

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
        this.store.set(featureKey, value)

        this.valueUpdatedCallbacks.forEach((valueUpdated) =>
            valueUpdated(featureKey, value),
        )
    }
}
