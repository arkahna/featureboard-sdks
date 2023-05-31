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
    private _audiences: string[] = []

    constructor(
        audiences: string[],
        public store: EffectiveFeatureStore = new MemoryEffectiveFeatureStore(),
    ) {
        this._audiences = audiences
    }

    set audiences(value: string[]) {
        this._audiences = value
        const storeRecords = this.store.all()
        this.store.clear()
        Object.keys(storeRecords).forEach((key) => {
            this.valueUpdatedCallbacks.forEach((valueUpdated) =>
                valueUpdated(key, undefined),
            )
        })
    }

    get audiences(): string[] {
        return [...this._audiences]
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
