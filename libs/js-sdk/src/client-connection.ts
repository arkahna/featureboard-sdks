import { FeatureBoardClient } from './features-client'

export interface BrowserClient {
    client: FeatureBoardClient

    /** Returns true once the FeatureBoard SDK has a valid set of values */
    initialised: boolean

    /**
     * Waits for BrowserClient to be initialised
     * 
     * @throws {Error} If the initialisation process fails an error is thrown
     */
    waitForInitialised(): Promise<boolean>

    /** Subscribe to initialised changes, will call back with initialised boolean value
     * Recommended to be used in conjunction with updateAudiences()
     *
     * @returns unsubscribe function
     */
    subscribeToInitialisedChanged(
        callback: (initialised: boolean) => void,
    ): () => void

    /** Will set initialised to false until the new audiences are loaded */
    updateAudiences(audiences: string[]): PromiseLike<void>

    /** Manually triggers an update to the feature state */
    updateFeatures(): PromiseLike<void>

    /** Closes subscription to the FeatureBoard service */
    close: () => void
}
