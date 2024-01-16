import { TooManyRequestsError } from '@featureboard/contracts'

/** De-dupes calls while the promise is in flight, otherwise will trigger again */
export function createEnsureSingleWithBackoff<T>(
    cb: () => Promise<T>,
): () => Promise<T> {
    let current: Promise<T> | undefined
    let tooManyRequestsError: TooManyRequestsError | undefined

    return () => {
        if (
            tooManyRequestsError &&
            tooManyRequestsError.retryAfter > new Date()
        ) {
            return Promise.reject(tooManyRequestsError)
        }
        if (!current) {
            current = cb()
                .catch((error: Error) => {
                    if (error instanceof TooManyRequestsError) {
                        tooManyRequestsError = error
                    }
                    throw error
                })
                .finally(() => {
                    current = undefined
                })
        }
        return current
    }
}
