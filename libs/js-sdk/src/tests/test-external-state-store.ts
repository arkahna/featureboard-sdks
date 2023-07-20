import { ExternalStateStore } from "../effective-feature-store"

export class TestExternalStateStore implements ExternalStateStore {
    constructor(
        private allCallback: () => Promise<
            Record<string, string | number | boolean | undefined>
        >, 
        private updateCallback: (store: Record<string, string | number | boolean | undefined>) => void
    ) {}

    all(): Promise<Record<string, string | number | boolean | undefined>> {
        return this.allCallback()
    }
    update(
        store: Record<string, string | number | boolean | undefined>,
    ): void | PromiseLike<any> {
        this.updateCallback(store)
    }
}