import type { FeatureBoardClient } from './features-client'

export interface BrowserClient {
    client: FeatureBoardClient

    /** Returns true once the FeatureBoard SDK has a valid set of values */
    initialised: boolean

    /**
     * Waits for BrowserClient to be initialised
     *
     * @throws {Error} If the initialisation process fails an error is thrown
     */
    waitForInitialised(this: void): Promise<boolean>

    /** Subscribe to initialised changes, will call back with initialised boolean value
     * Recommended to be used in conjunction with updateAudiences()
     *
     * @returns unsubscribe function
     */
    subscribeToInitialisedChanged(
        this: void,
        callback: (initialised: boolean) => void,
    ): () => void

    /** Will set initialised to false until the new audiences are loaded */
    updateAudiences(this: void, audiences: string[]): PromiseLike<void>

    /** Manually triggers an update to the feature state */
    updateFeatures(this: void): PromiseLike<void>

    /** Closes subscription to the FeatureBoard service */
    close: (this: void) => void
}
