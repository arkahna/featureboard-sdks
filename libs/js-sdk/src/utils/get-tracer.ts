import { trace } from '@opentelemetry/api'
import { version } from '../version'

export function getTracer() {
    return trace.getTracer('featureboard-js-sdk', version)
}
