import { FeatureConfiguration } from '@featureboard/contracts'
import { debugLog } from './log'

export interface FeatureStore {
    /** Gets a stable copy of the feature values (will not be updated if the store is updated). */
    all(): Record<string, FeatureConfiguration | undefined>
    get(featureKey: string): FeatureConfiguration | undefined
    set(
        featureKey: string,
        value: FeatureConfiguration | undefined,
    ): void | PromiseLike<any>
}

const storeDebug = debugLog.extend('store')
const memoryStoreDebug = storeDebug.extend('memory')

export class MemoryFeatureStore implements FeatureStore {
    private _store: Record<string, FeatureConfiguration | undefined> = {}

    constructor(initialValues?: FeatureConfiguration[]) {
        memoryStoreDebug('initialising: %o', initialValues)
        // Assume if initial values are provided, they are a valid set of feature values
        for (const value of initialValues || []) {
            this._store[value.featureKey] = value
        }
    }

    all(): Record<string, FeatureConfiguration | undefined> {
        memoryStoreDebug('all: %o', this._store)
        return { ...this._store }
    }

    get(featureKey: string): FeatureConfiguration | undefined {
        const value = this._store[featureKey]
        memoryStoreDebug("get '%s': %o", featureKey, value)
        return value
    }

    set(featureKey: string, value: FeatureConfiguration | undefined) {
        memoryStoreDebug("set '%s': %o", featureKey, value)
        this._store[featureKey] = value
    }
}
