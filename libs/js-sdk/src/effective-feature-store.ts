import { EffectiveFeatureValue } from '@featureboard/contracts'
import { debugLog } from './log'
import { ExternalStateStore } from './external-state-store'

const storeDebug = debugLog.extend('store')
const memoryStoreDebug = storeDebug.extend('memory')

export class MemoryEffectiveFeatureStore {
    private _store: Record<string, EffectiveFeatureValue['value'] | undefined> =
        {}

    private _externalStore: ExternalStateStore | undefined
    hasExternalStateStore: boolean

    constructor(
        externalStateStore?: ExternalStateStore,
    ) {
        this._externalStore = externalStateStore
        this.hasExternalStateStore = !!externalStateStore
    }

    async initialiseExternalStateStore(): Promise<Record<string, EffectiveFeatureValue['value'] | undefined>> {
        if (!this._externalStore) {
            throw new Error('External state store is undefined')
        }
        memoryStoreDebug('Initialising external state store',)

        try {
            this._store = await this._externalStore.all()
        } catch (error: any) {
            memoryStoreDebug(
                'Initialse memory store with external store failed',
                error,
            )
            throw error
        }

        return Promise.resolve({...this._store})
    }

    clear(): void {
        this._store = {}
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

        if (this._externalStore) {
            this._externalStore.update(this._store)
        }
    }
}
