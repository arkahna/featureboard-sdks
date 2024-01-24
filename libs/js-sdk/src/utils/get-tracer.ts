import { version } from '../version'
import { traceProvider } from './trace-provider'

export function getTracer() {
    return traceProvider.getTracer('featureboard-js-sdk', version)
}
