import type { Attributes } from '@opentelemetry/api'
import { trace } from '@opentelemetry/api'

export function addDebugEvent(event: string, attributes: Attributes = {}) {
    if (process.env.FEATUREBOARD_SDK_DEBUG) {
        trace.getActiveSpan()?.addEvent(event, attributes)
    }
}
