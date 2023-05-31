/**
 * The method your feature state is updated
 *
 * manual - will not proactively update
 * live - uses websockets for near realtime updates
 * polling - checks with the featureboard service every 30seconds (or configured interval) for updates
 */

import type { LiveOptions } from '@featureboard/live-connection'
import { EffectiveFeaturesState } from '../effective-feature-state'

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
    // TODO reenable
    // | LiveUpdateStrategy
    | PollingUpdateStrategy

export const pollingIntervalDefault = 30000
export interface PollingOptions {
    /**
     * The polling interval in ms
     * @default 30000
     **/
    intervalMs?: number
}

export const maxAgeDefault = 30000
export interface OnRequestOptions {
    /**
     * Specifies how long the featureboard SDK can wait before checking if features have updated.
     * @default 30000 (30 seconds)
     **/
    maxAgeMs?: number
}

export interface EffectiveConfigUpdateStrategy {
    state: 'connected' | 'disconnected'
    connect(state: EffectiveFeaturesState): Promise<void>
    close(): Promise<void>
    updateFeatures(): PromiseLike<void>
    /** To be called when creating a request client */
    onRequest(): PromiseLike<void> | undefined
}
