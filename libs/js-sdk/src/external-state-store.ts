export interface ExternalStateStore<T> {
    /**
     * Gets a stable copy of the feature values.
     * Will only be used during the initialisation if retrieving the feature values from the API would fail.
     * */
    all(): Promise<Record<string, T>>
    /**
     * Update is called whenever an effective feature value is updated.
     * It can be used to keep the external state store accurate.
     * */
    update(
        store: Record<string, T>,
    ): PromiseLike<any>
}
