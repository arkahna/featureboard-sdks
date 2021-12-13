export async function resolveNodeFetch(
    fetchImpl?: (
        input: RequestInfo,
        init?: RequestInit | undefined,
    ) => Promise<Response>,
) {
    return (
        fetchImpl ||
        (typeof fetch !== 'undefined'
            ? fetch
            : ((await import('node-fetch')).default as any as typeof fetch))
    )
}
