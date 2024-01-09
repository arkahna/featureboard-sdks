export interface RateLimitProperty {
    retryAfter?: Date
}
/** De-dupes calls while the promise is in flight, otherwise will trigger again */
export function createEnsureSingle<T extends RateLimitProperty>(
    cb: () => Promise<T>,
): () => Promise<T> {
    let current: Promise<T> | undefined
    let lastResponse: T | undefined

    return () => {
        if (lastResponse?.retryAfter && lastResponse.retryAfter > new Date()) {
            return Promise.resolve(lastResponse)
        }
        if (!current) {
            current = cb()
                .then((response) => {
                    lastResponse = response
                    return response
                })
                .finally(() => {
                    current = undefined
                })
        }

        return current
    }
}
