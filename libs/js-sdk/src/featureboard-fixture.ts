import { trace } from '@opentelemetry/api'
import { type RequestHandler } from 'msw'
import { setupServer, type SetupServer } from 'msw/node'
import { type TestFunction } from 'vitest'
import { openTelemetryTracePassthrough } from './utils/openTelemetryTracePassthrough'

export function featureBoardFixture<Context>(
    testContext: Context,
    handlers: (context: Context) => Array<RequestHandler>,
    testFn: TestFunction<{ testContext: Context; server: SetupServer }>,
): TestFunction {
    return async (context) => {
        const { task } = context
        const tracer = trace.getTracer(task.suite.name)
        const server = setupServer(
            openTelemetryTracePassthrough,
            ...handlers(testContext),
        )
        server.listen({ onUnhandledRequest: 'error' })

        await tracer.startActiveSpan(
            task.name,
            {
                root: true,
                attributes: {},
            },
            async (span) => {
                try {
                    await testFn({ ...context, testContext, server })
                } finally {
                    tracer.startActiveSpan('msw cleanup', (cleanupSpan) => {
                        server.resetHandlers()
                        server.close()
                        cleanupSpan.end()
                    })
                    span.end()
                }
            },
        )
    }
}
