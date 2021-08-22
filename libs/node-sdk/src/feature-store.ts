import { FeatureValues } from '@featureboard/contracts'

export interface FeatureStore {
    /** Flag indicating the store has a valid set of feature values */
    isInitialised: boolean

    /** Gets a stable copy of the feature values (will not be updated if the store is updated). */
    all(): Record<string, FeatureValues | undefined>
    get(featureKey: string): FeatureValues | undefined
    set(
        featureKey: string,
        value: FeatureValues | undefined,
    ): void | PromiseLike<any>
}

export class MemoryFeatureStore implements FeatureStore {
    private _store: Record<string, FeatureValues | undefined> = {}
    isInitialised: boolean

    constructor(initialValues?: FeatureValues[]) {
        // Assume if initial values are provided, they are a valid set of feature values
        this.isInitialised = !!initialValues
        for (const value of initialValues || []) {
            this._store[value.featureKey] = value
        }
    }

    all(): Record<string, FeatureValues | undefined> {
        return { ...this._store }
    }

    get(featureKey: string): FeatureValues | undefined {
        return this._store[featureKey]
    }

    set(featureKey: string, value: FeatureValues | undefined) {
        this._store[featureKey] = value
    }
}
