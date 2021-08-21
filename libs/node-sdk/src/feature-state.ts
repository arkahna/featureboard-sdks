import { FeatureValues } from '@featureboard/contracts'

export class FeatureState {
    features: {
        [featureKey: string]: FeatureValues
    } = {}

    constructor(initialValues?: FeatureValues[]) {
        for (const value of initialValues || []) {
            this.features[value.featureKey] = value
        }
    }

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

    updateFeatureState(
        featureKey: string,
        featureValues: FeatureValues | undefined,
    ) {
        if (featureValues === undefined) {
            delete this.features[featureKey]
            this.featureUpdatedCallbacks.forEach((valueUpdated) =>
                valueUpdated(featureKey, undefined),
            )
        } else {
            this.features[featureKey] = featureValues
            this.featureUpdatedCallbacks.forEach((valueUpdated) =>
                valueUpdated(featureKey, featureValues),
            )
        }
    }
}
