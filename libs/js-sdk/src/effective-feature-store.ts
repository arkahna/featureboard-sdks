import { EffectiveFeatureValue } from '@featureboard/contracts'

export interface EffectiveFeatureStore {
    /** Flag indicating the store has a valid set of feature values */
    isInitialised: boolean

    /** Gets a stable copy of the feature values (will not be updated if the store is updated). */
    all(): Record<string, EffectiveFeatureValue['value'] | undefined>
    get(featureKey: string): EffectiveFeatureValue['value'] | undefined
    set(
        featureKey: string,
        value: EffectiveFeatureValue['value'] | undefined,
    ): void | PromiseLike<any>
}

export class MemoryEffectiveFeatureStore implements EffectiveFeatureStore {
    private _store: Record<string, EffectiveFeatureValue['value'] | undefined> =
        {}
    isInitialised: boolean

    constructor(initialValues?: EffectiveFeatureValue[]) {
        // Assume if initial values are provided, they are a valid set of feature values
        this.isInitialised = !!initialValues
        for (const value of initialValues || []) {
            this._store[value.featureKey] = value.value
        }
    }

    all(): Record<string, EffectiveFeatureValue['value'] | undefined> {
        return { ...this._store }
    }

    get(featureKey: string): EffectiveFeatureValue['value'] | undefined {
        return this._store[featureKey]
    }

    set(featureKey: string, value: EffectiveFeatureValue['value'] | undefined) {
        this._store[featureKey] = value
    }
}
