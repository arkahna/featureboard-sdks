import { EffectiveFeatureValue } from '@featureboard/contracts'
import { BrowserClient } from './client-connection'
import { EffectiveFeatureStore } from './effective-feature-store'

export function createBrowserClient({
    initialValues,
    store,
    updateStrategy,
}: {
    /**
     * The method your feature state is updated
     *
     * manual - will not proactively update
     * live - uses websockets for near realtime updates
     * polling - checks with the featureboard service every 30seconds (or configured interval) for updates
     */
    updateStrategy?: 'manual' | 'live' | 'polling'

    store?: EffectiveFeatureStore

    initialValues?: Record<string, EffectiveFeatureValue>
}): BrowserClient {}
