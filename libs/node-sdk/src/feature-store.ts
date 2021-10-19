import { FeatureValues } from '@featureboard/contracts'
import { debugLog } from './log'

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

const storeDebug = debugLog.extend('store')
const memoryStoreDebug = storeDebug.extend('memory')

export class MemoryFeatureStore implements FeatureStore {
    private _store: Record<string, FeatureValues | undefined> = {}
    isInitialised: boolean

    constructor(initialValues?: FeatureValues[]) {
        memoryStoreDebug('initialising: %o', initialValues)
        // Assume if initial values are provided, they are a valid set of feature values
        this.isInitialised = !!initialValues
        for (const value of initialValues || []) {
            this._store[value.featureKey] = value
        }
    }

    all(): Record<string, FeatureValues | undefined> {
        memoryStoreDebug('all: %o', this._store)
        return { ...this._store }
    }

    get(featureKey: string): FeatureValues | undefined {
        const value = this._store[featureKey]
        memoryStoreDebug("get '%s': %o", featureKey, value)
        return value
    }

    set(featureKey: string, value: FeatureValues | undefined) {
        memoryStoreDebug("set '%s': %o", featureKey, value)
        this._store[featureKey] = value
    }
}
