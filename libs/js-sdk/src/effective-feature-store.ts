import { EffectiveFeatureValue } from '@featureboard/contracts'
import { debugLog } from './log'

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

const storeDebug = debugLog.extend('store')
const memoryStoreDebug = storeDebug.extend('memory')

export class MemoryEffectiveFeatureStore implements EffectiveFeatureStore {
    private _store: Record<string, EffectiveFeatureValue['value'] | undefined> =
        {}
    isInitialised: boolean

    constructor(initialValues?: EffectiveFeatureValue[]) {
        memoryStoreDebug('initialising: %o', initialValues)
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
        const value = this._store[featureKey]
        memoryStoreDebug("get '%s': %o", featureKey, value)
        return value
    }

    set(featureKey: string, value: EffectiveFeatureValue['value'] | undefined) {
        memoryStoreDebug("set '%s': %o", featureKey, value)
        this._store[featureKey] = value
    }
}
