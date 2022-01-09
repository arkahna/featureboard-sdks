import { FetchSignature } from '@featureboard/js-sdk'

export async function resolveNodeFetch(
    fetchInstance?: FetchSignature,
): Promise<FetchSignature> {
    if (fetchInstance) {
        return fetchInstance
    }
    if (typeof fetch !== 'undefined') {
        return fetch
    }
    const nodeFetch = await import('node-fetch')
    return nodeFetch.default
}
