export type FetchSignature = (
    input: RequestInfo,
    init?: RequestInit | undefined,
) => Promise<Response>
