import type { EffectiveFeatureValue } from '@featureboard/contracts'
import { debugLog } from './log'

export type FeatureValue = EffectiveFeatureValue['value'] | undefined

const stateStoreDebug = debugLog.extend('state-store')

export class EffectiveFeatureStateStore {
    private _audiences: string[] = []
    private _store: Record<string, FeatureValue> = {}
    private valueUpdatedCallbacks: Array<
        (featureKey: string, value: FeatureValue) => void
    > = []

    constructor(audiences: string[], initialValues?: EffectiveFeatureValue[]) {
        this._audiences = audiences

        for (const value of initialValues || []) {
            this._store[value.featureKey] = value.value
        }
    }

    set audiences(value: string[]) {
        this._audiences = value
        const storeRecords = { ...this._store }
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

    on(
        _event: 'feature-updated',
        callback: (featureKey: string, value: FeatureValue) => void,
    ): void {
        this.valueUpdatedCallbacks.push(callback)
    }

    off(
        _event: 'feature-updated',
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
    }

    get(featureKey: string): FeatureValue {
        const value = this._store[featureKey]
        stateStoreDebug("get '%s': %o", featureKey, value)
        return value
    }
}
