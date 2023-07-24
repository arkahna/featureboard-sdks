import { FeatureConfiguration } from '@featureboard/contracts'
import { ExternalStateStore } from '@featureboard/js-sdk'

export class MockExternalStateStore
    implements ExternalStateStore<FeatureConfiguration | undefined>
{
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
