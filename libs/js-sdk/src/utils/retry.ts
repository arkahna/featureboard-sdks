import { TooManyRequestsError } from '@featureboard/contracts'
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

        try {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                try {
                    return await retryAttemptFn<T>(tracer, retryAttempt, fn)
                } catch (error) {
                    let retryAfterMs = 0
                    const err = resolveError(error)
                    if (cancellationToken?.cancel) {
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
                            message:
                                'Operation failed after max retries exceeded',
                        })
                        // Max retries
                        throw error
                    }

                    if (
                        error instanceof TooManyRequestsError &&
                        error.retryAfter > new Date()
                    ) {
                        retryAfterMs =
                            error.retryAfter.getTime() - new Date().getTime()
                    }

                    const delayMs =
                        retryAfterMs === 0
                            ? initialDelayMs *
                              Math.pow(backoffFactor, retryAttempt)
                            : retryAfterMs

                    if (delayMs > 180000) {
                        // If delay is longer than 3 min throw error
                        // Todo: Replace with cancellation token with timeout
                        span.recordException(
                            new Error('Operation failed, retry timed out.', {
                                cause: err,
                            }),
                        )
                        span.setStatus({
                            code: SpanStatusCode.ERROR,
                            message: 'Operation failed, retry timed out.',
                        })
                        throw error
                    }

                    await tracer.startActiveSpan('delay', (delaySpan) =>
                        delay(delayMs).finally(() => delaySpan.end()),
                    )

                    retryAttempt++
                }
            }
        } finally {
            span.end()
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
