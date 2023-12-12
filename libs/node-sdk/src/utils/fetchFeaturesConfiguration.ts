import type { FeatureConfiguration } from '@featureboard/contracts'
import { resolveError } from '@featureboard/js-sdk'
import { SpanStatusCode } from '@opentelemetry/api'
import type { IFeatureStateStore } from '../feature-state-store'
import { addDebugEvent } from './add-debug-event'
import { getTracer } from './get-tracer'

export async function fetchFeaturesConfigurationViaHttp(
    allEndpoint: string,
    environmentApiKey: string,
    stateStore: IFeatureStateStore,
    etag: string | undefined,
) {
    return getTracer().startActiveSpan(
        'fetchEffectiveFeatures(http)',
        { attributes: { etag } },
        async (span) => {
            try {
                const response = await fetch(allEndpoint, {
                    method: 'GET',
                    headers: {
                        'x-environment-key': environmentApiKey,
                        ...(etag ? { 'if-none-match': etag } : {}),
                    },
                })

                if (response.status !== 200 && response.status !== 304) {
                    throw new Error(
                        `Failed to get latest flags: Service returned error ${response.status} (${response.statusText})`,
                    )
                }

                // Expect most times will just get a response from the HEAD request saying no updates
                if (response.status === 304) {
                    addDebugEvent('No changes')
                    return etag
                }

                const allValues: FeatureConfiguration[] = await response.json()

                for (const featureValue of allValues) {
                    stateStore.set(featureValue.featureKey, featureValue)
                }

                const removed = Object.keys(stateStore.all()).filter(
                    (existing) =>
                        allValues.every((v) => v.featureKey !== existing),
                )
                for (const removedFeature of removed) {
                    stateStore.set(removedFeature, undefined)
                }

                const newEtag = response.headers.get('etag') || undefined
                addDebugEvent('fetching updates done', { newEtag })
                return newEtag
            } catch (error) {
                const err = resolveError(error)
                span.recordException(err)
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: err.message,
                })
                throw err
            } finally {
                span.end()
            }
        },
    )
}
