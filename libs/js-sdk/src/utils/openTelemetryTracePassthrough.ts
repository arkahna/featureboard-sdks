import { http, passthrough } from 'msw'

export const openTelemetryTracePassthrough = http.post(
    'http://localhost:4318/v1/traces',
    () => passthrough(),
)
