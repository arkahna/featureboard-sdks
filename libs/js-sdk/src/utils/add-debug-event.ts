import type { Attributes } from '@opentelemetry/api'
import { trace } from '@opentelemetry/api'

export function addDebugEvent(event: string, attributes: Attributes = {}) {
    if (
        typeof window !== 'undefined'
            ? (window as any)['FEATUREBOARD_SDK_DEBUG']
            : process.env.FEATUREBOARD_SDK_DEBUG
    ) {
        trace.getActiveSpan()?.addEvent(event, attributes)
    }
}
