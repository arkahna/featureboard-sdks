export interface SubscribeToEnvironment {
    kind: 'subscribe'
    apiKey: string

    /** Subscription mode */
    mode:
        | { kind: 'effective-values'; audiences: string[] }
        | { kind: 'all-values' }
}

export type ClientMessages = SubscribeToEnvironment
