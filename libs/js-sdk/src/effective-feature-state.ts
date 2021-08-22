import {
    EffectiveFeatureStore,
    MemoryEffectiveFeatureStore,
} from './effective-feature-store'

export interface EffectiveFeatureValues {
    [featureKey: string]: string | boolean | number
}

export class EffectiveFeatureState {
    private valueUpdatedCallbacks: Array<
        (
            featureKey: string,
            value: string | boolean | number | undefined,
        ) => void
    > = []

    constructor(
        public readonly audiences: ReadonlyArray<string>,
        public store: EffectiveFeatureStore = new MemoryEffectiveFeatureStore(),
    ) {}

    on(
        _event: 'feature-updated',
        callback: (
            featureKey: string,
            value: string | boolean | number | undefined,
        ) => void,
    ): void {
        this.valueUpdatedCallbacks.push(callback)
    }
    off(
        _event: 'feature-updated',
        callback: (
            featureKey: string,
            value: string | boolean | number | undefined,
        ) => void,
    ): void {
        this.valueUpdatedCallbacks.splice(
            this.valueUpdatedCallbacks.indexOf(callback),
            1,
        )
    }

    updateFeatureValue(
        featureKey: string,
        value: undefined | string | boolean | number,
    ) {
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
