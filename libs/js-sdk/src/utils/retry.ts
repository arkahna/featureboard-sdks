import type { Tracer } from '@opentelemetry/api'
import { SpanStatusCode } from '@opentelemetry/api'
import { getTracer } from './get-tracer'
import { resolveError } from './resolve-error'

/** Not including initial execution */
const maxRetries = process.env.TEST === 'true' ? 2 : 5
const initialDelayMs = process.env.TEST === 'true' ? 1 : 1000
const backoffFactor = 2

export async function retry<T>(
    fn: () => Promise<T>,
    cancellationToken = { cancel: false },
): Promise<void | T> {
    const tracer = getTracer()
    return tracer.startActiveSpan('retry', async (span) => {
        let retryAttempt = 0

        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                return await retryAttemptFn<T>(
                    tracer,
                    retryAttempt,
                    fn,
                ).finally(() => span.end())
            } catch (error) {
                const err = resolveError(error)
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
                    span.setStatus({
                        code: SpanStatusCode.ERROR,
                        message: 'Operation failed after max retries exceeded',
                    })
                    span.end()
                    // Max retries
                    throw error
                }

                const delayMs =
                    initialDelayMs * Math.pow(backoffFactor, retryAttempt)

                await tracer.startActiveSpan('delay', (delaySpan) =>
                    delay(delayMs).finally(() => delaySpan.end()),
                )

                retryAttempt++
            }
        }
    })
}

async function retryAttemptFn<T>(
    tracer: Tracer,
    retryAttempt: number,
    fn: () => Promise<T>,
) {
    return await tracer.startActiveSpan(
        'retry-attempt',
        { attributes: { retryAttempt } },
        async (attemptSpan) => {
            try {
                return await fn()
            } finally {
                attemptSpan.end()
            }
        },
    )
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
