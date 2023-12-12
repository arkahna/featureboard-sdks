import type { FeatureConfiguration } from '@featureboard/contracts'
import type { IFeatureStateStore } from '../feature-state-store'
import { addDebugEvent } from './add-debug-event'

export class DebugFeatureStateStore implements IFeatureStateStore {
    constructor(private store: IFeatureStateStore) {}

    initialiseFromExternalStateStore(): Promise<boolean> {
        return this.store.initialiseFromExternalStateStore()
    }

    all(): Record<string, FeatureConfiguration | undefined> {
        const allValues = this.store.all()
        addDebugEvent('all', { allValues: JSON.stringify(allValues) })
        return { ...allValues }
    }

    get(featureKey: string): FeatureConfiguration | undefined {
        const value = this.store.get(featureKey)
        addDebugEvent('get', { featureKey, value: JSON.stringify(value) })

        return value
    }

    set(featureKey: string, value: FeatureConfiguration | undefined) {
        addDebugEvent('set', { featureKey, value: JSON.stringify(value) })
        this.store.set(featureKey, value)
    }
}
