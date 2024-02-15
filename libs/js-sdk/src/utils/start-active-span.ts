import { context, trace, type Span, type SpanOptions } from '@opentelemetry/api'
import { getTracer } from './get-tracer'

export function startActiveSpan<F extends (span: Span) => unknown>({
    name,
    options,
    parentSpan,
    fn,
}: {
    name: string
    options: SpanOptions
    parentSpan?: Span
    fn: F
}): ReturnType<F> {
    // Get context from parent span
    const ctx = parentSpan
        ? trace.setSpan(context.active(), parentSpan)
        : undefined

    return ctx
        ? getTracer().startActiveSpan(name, options, ctx, fn)
        : getTracer().startActiveSpan(name, options, fn)
}
