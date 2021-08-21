export interface EffectiveFeatureValues {
    [featureKey: string]: string | boolean | number
}

export class EffectiveFeatureState {
    featureValues: EffectiveFeatureValues

    private valueUpdatedCallbacks: Array<
        (featureKey: string, value: string | boolean | number | undefined) => void
    > = []

    constructor(
        public readonly audiences: ReadonlyArray<string>,
        featureValues?: EffectiveFeatureValues,
    ) {
        this.featureValues = featureValues || {}
    }

    on(
        _event: 'feature-updated',
        callback: (featureKey: string, value: string | boolean | number | undefined) => void,
    ): void {
        this.valueUpdatedCallbacks.push(callback)
    }
    off(
        _event: 'feature-updated',
        callback: (featureKey: string, value: string | boolean | number | undefined) => void,
    ): void {
        this.valueUpdatedCallbacks.splice(this.valueUpdatedCallbacks.indexOf(callback), 1)
    }

    updateFeatureValue(featureKey: string, value: undefined | string | boolean | number) {
        if (value === undefined) {
            delete this.featureValues[featureKey]
        } else {
            this.featureValues[featureKey] = value
        }
        this.valueUpdatedCallbacks.forEach((valueUpdated) => valueUpdated(featureKey, value))
    }
}
