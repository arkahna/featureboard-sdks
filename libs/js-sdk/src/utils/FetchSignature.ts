export interface FetchSignatureInit {
    /** A BodyInit object or null to set request's body. */
    body?: string | null
    /** A Headers object, an object literal, or an array of two-item arrays to set request's headers. */
    headers?: Record<string, string>
    /** A boolean to set request's keepalive. */
    keepalive?: boolean
    /** A string to set request's method. */
    method?: string
    /** A string to indicate whether the request will use CORS, or will be restricted to same-origin URLs. Sets request's mode. */
    mode?: 'cors' | 'navigate' | 'no-cors' | 'same-origin'
}

export interface FetchSignatureResponse {
    status: number
    statusText: string
    json: () => Promise<any>
    headers: {
        get(header: string): string | null
    }
}

/**
 * Simple fetch signature which is used by the FeatureBoard SDK
 * Is compatible with browser fetch and node-fetch
 */
export type FetchSignature = (
    input: string,
    init?: FetchSignatureInit | undefined,
) => Promise<FetchSignatureResponse>
