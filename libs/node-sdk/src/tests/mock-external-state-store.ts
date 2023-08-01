import { FeatureConfiguration } from '@featureboard/contracts'
import { ExternalStateStore } from '../external-state-store'

export class MockExternalStateStore implements ExternalStateStore {
    constructor(
        private allCallback: () => Promise<
            Record<string, FeatureConfiguration | undefined>
        >,
        private updateCallback: (
            store: Record<string, FeatureConfiguration | undefined>,
        ) => PromiseLike<any>,
    ) {}

    all(): Promise<Record<string, FeatureConfiguration | undefined>> {
        return this.allCallback()
    }
    update(
        store: Record<string, FeatureConfiguration | undefined>,
    ): PromiseLike<any> {
        return this.updateCallback(store)
    }
}
