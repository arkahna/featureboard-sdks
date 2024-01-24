import type { Attributes } from '@opentelemetry/api'
import { trace } from '@opentelemetry/api'

export function addDebugEvent(event: string, attributes: Attributes = {}) {
    trace.getActiveSpan()?.addEvent(event, attributes)
}
