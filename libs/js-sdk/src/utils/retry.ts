import { TooManyRequestsError } from '@featureboard/contracts'
import { debugLog } from '../log'

const maxRetries = 5
const initialDelayMs = process.env.TEST === 'true' ? 1 : 1000
const backoffFactor = 2

export async function retry<T>(
    fn: () => Promise<T>,
    cancellationToken = { cancel: false },
    retryAttempt = 0,
): Promise<void | T> {
    try {
        return await fn()
    } catch (error) {
        let retryAfterMs = 0
        if (cancellationToken?.cancel) {
            debugLog('Cancel retry function')
            return Promise.resolve()
        }
        if (retryAttempt >= maxRetries) {
            // Max retries
            throw error
        }
        if (error instanceof TooManyRequestsError && error.retryAfter > new Date()) {
            // or should we fail without retries
            retryAfterMs = error.retryAfter.getTime() - new Date().getTime()
        }
        const delayMs = initialDelayMs * Math.pow(backoffFactor, retryAttempt) + retryAfterMs
        await delay(delayMs) // Wait for the calculated delay
        return retry(fn, cancellationToken, retryAttempt + 1) // Retry the operation recursively
    }
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
