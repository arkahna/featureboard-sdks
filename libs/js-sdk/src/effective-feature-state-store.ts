import { EffectiveFeatureValue } from "@featureboard/contracts"
import { ExternalStateStore } from "./external-state-store"
import { debugLog } from "./log"

type FeatureValue = EffectiveFeatureValue['value'] | undefined

const stateStoreDebug = debugLog.extend('state-store')

export class EffectiveFeatureStateStore {
    private _audiences: string[] = []
    private _store: Record<string, FeatureValue> =
        {}
    private _externalStore: ExternalStateStore | undefined
    private valueUpdatedCallbacks: Array<(featureKey: string, value: FeatureValue) => void> = []

    constructor(audiences: string[], externalStateStore?: ExternalStateStore) {
        this._audiences = audiences
        this._externalStore = externalStateStore
    }

    set audiences(value: string[]) {
        this._audiences = value
        const storeRecords = {...this._store }
        this._store = {}
        Object.keys(storeRecords).forEach((key) => {
            this.valueUpdatedCallbacks.forEach((valueUpdated) =>
                valueUpdated(key, undefined),
            )
        })
    }

    get audiences(): string[] {
        return [...this._audiences]
    }

    async initialiseExternalStateStore(): Promise<boolean> {
        if (!this._externalStore) {
            return Promise.resolve(false)
        }
        stateStoreDebug('Initialising external state store')

        try {
            const externalStore = await this._externalStore.all()

            this._store = { ...externalStore}
            Object.keys(externalStore).forEach((key) => {
                this.valueUpdatedCallbacks.forEach((valueUpdated) =>
                    valueUpdated(key, externalStore[key]),
                )
            })
        } catch (error: any) {
            stateStoreDebug(
                'Initialse effective state store with external state store failed',
                error,
            )
            throw error
        }
        return Promise.resolve(true)
    }

    on(_event: 'feature-updated',
        callback: (featureKey: string, value: FeatureValue) => void,
    ): void {
        this.valueUpdatedCallbacks.push(callback)
    }

    off(_event: 'feature-updated',
        callback: (featureKey: string, value: FeatureValue) => void,
    ): void {
        this.valueUpdatedCallbacks.splice(
            this.valueUpdatedCallbacks.indexOf(callback),
            1,
        )
    }

    all(): Record<string, FeatureValue> {
        return { ...this._store }
    }

    set(featureKey: string, value: FeatureValue) {
        stateStoreDebug("set '%s': %o", featureKey, value)
        this._store[featureKey] = value

        this.valueUpdatedCallbacks.forEach((valueUpdated) =>
            valueUpdated(featureKey, value),
        )

        if (this._externalStore) {
            this._externalStore.update(this._store)
        }
    }

    get(featureKey: string): FeatureValue {
        const value = this._store[featureKey]
        stateStoreDebug("get '%s': %o", featureKey, value)
        return value
    }
}