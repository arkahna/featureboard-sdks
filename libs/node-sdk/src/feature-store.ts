import { FeatureValues } from '@featureboard/contracts'

export interface FeatureStore {
    /** Gets a stable copy of the feature values (will not be updated if the store is updated). */
    all(): Record<string, FeatureValues | undefined>
    get(featureKey: string): FeatureValues | undefined
    set(
        featureKey: string,
        value: FeatureValues | undefined,
    ): void | PromiseLike<any>
}

export class MemoryStore implements FeatureStore {
    private _store: Record<string, FeatureValues | undefined> = {}

    constructor(initialValues?: FeatureValues[]) {
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
