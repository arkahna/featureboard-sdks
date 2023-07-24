import { ExternalStateStore } from '../external-state-store'

export class MockExternalStateStore
    implements ExternalStateStore<string | number | boolean | undefined>
{
    constructor(
        private allCallback: () => Promise<
            Record<string, string | number | boolean | undefined>
        >,
        private updateCallback: (
            store: Record<string, string | number | boolean | undefined>,
        ) => PromiseLike<any>,
    ) {}

    all(): Promise<Record<string, string | number | boolean | undefined>> {
        return this.allCallback()
    }
    update(
        store: Record<string, string | number | boolean | undefined>,
    ): PromiseLike<any> {
        return this.updateCallback(store)
    }
}
