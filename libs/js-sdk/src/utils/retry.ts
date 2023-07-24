const maxRetries = 5
const initialDelayMs = 1000
const backoffFactor = 2

export async function retry<T>(
    fn: () => Promise<T>,
    retryAttempt = 0,
): Promise<T> {
    try {
        return await fn()
    } catch (error) {
        if (retryAttempt >= maxRetries) {
            // Max retries
            throw error
        }
        const delayMs = initialDelayMs * Math.pow(backoffFactor, retryAttempt)
        await delay(delayMs) // Wait for the calculated delay
        return retry(fn, retryAttempt + 1) // Retry the operation recursively
    }
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}