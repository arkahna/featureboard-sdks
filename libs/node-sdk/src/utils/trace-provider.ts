import { ProxyTracerProvider, trace } from '@opentelemetry/api'

export const traceProvider = new ProxyTracerProvider()
const noopTraceProvider = traceProvider.getDelegate()

export function setTracingEnabled(enabled: boolean) {
    traceProvider.setDelegate(
        enabled ? trace.getTracerProvider() : noopTraceProvider,
    )
}
