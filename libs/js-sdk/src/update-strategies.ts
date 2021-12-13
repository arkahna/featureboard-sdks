import type { LiveOptions } from '@featureboard/live-connection'

export interface ManualUpdateStrategy {
    kind: 'manual'
}

export interface PollingUpdateStrategy {
    kind: 'polling'
    options?: PollingOptions
}

export interface LiveUpdateStrategy {
    kind: 'live'
    options?: LiveOptions
}

export type UpdateStrategies =
    | ManualUpdateStrategy
    | LiveUpdateStrategy
    | PollingUpdateStrategy

export interface PollingOptions {
    /** in ms */
    interval?: number
}
