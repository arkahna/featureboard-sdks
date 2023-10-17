/**
 * The method your feature state is updated
 *
 * manual - will not proactively update
 * live - uses websockets for near realtime updates
 * polling - checks with the featureboard service every 30seconds (or configured interval) for updates
 * on-request - checks for updates on every request
 */

import type { LiveOptions } from '@featureboard/live-connection'
import { AllFeatureStateStore } from '../feature-state-store'

export interface ManualUpdateStrategy {
    kind: 'manual'
}

export interface PollingUpdateStrategy {
    kind: 'polling'
    options?: PollingOptions
}

export interface OnRequestUpdateStrategy {
    kind: 'on-request'
    options?: OnRequestOptions
}

export interface LiveUpdateStrategy {
    kind: 'live'
    options?: LiveOptions
}

export type UpdateStrategies =
    | ManualUpdateStrategy
    // TODO Currently disabled
    //| LiveUpdateStrategy
    | PollingUpdateStrategy
    | OnRequestUpdateStrategy

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

export interface AllConfigUpdateStrategy {
    state: 'connected' | 'disconnected'
    connect(state: AllFeatureStateStore): Promise<void>
    close(): Promise<void>
    updateFeatures(): PromiseLike<void>
    /** To be called when creating a request client */
    onRequest(): PromiseLike<void> | undefined
}
