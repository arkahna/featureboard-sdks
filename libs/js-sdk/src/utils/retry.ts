import { getTracer } from './get-tracer'
import { resolveError } from './resolve-error'

const maxRetries = 5
const initialDelayMs = process.env.TEST === 'true' ? 1 : 1000
const backoffFactor = 2

export async function retry<T>(
    fn: () => Promise<T>,
    cancellationToken = { cancel: false },
    retryAttempt = 0,
): Promise<void | T> {
    const tracer = getTracer()
    return tracer.startActiveSpan(
        'retry',
        { attributes: { retryAttempt } },
        async (span) => {
            try {
                const result = await fn()
                span.end()
                return result
            } catch (error) {
                const err = resolveError(error)
                span.recordException(err)

                if (cancellationToken?.cancel) {
                    span.end()
                    return Promise.resolve()
                }

                if (retryAttempt >= maxRetries) {
                    span.recordException(
                        new Error(
                            'Operation failed after max retries exceeded',
                            { cause: err },
                        ),
                    )
                    span.end()
                    // Max retries
                    throw error
                }
                span.end()

                const delayMs =
                    initialDelayMs * Math.pow(backoffFactor, retryAttempt)

                await tracer.startActiveSpan('delay', (delaySpan) =>
                    delay(delayMs).finally(() => delaySpan.end()),
                ) // Wait for the calculated delay
                return retry(fn, cancellationToken, retryAttempt + 1) // Retry the operation recursively
            }
        },
    )
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
