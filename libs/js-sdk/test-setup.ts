import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { NodeSDK } from '@opentelemetry/sdk-node'
import {
    ConsoleSpanExporter,
    SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-node'
import { afterAll, beforeAll } from 'vitest'

let sdk: NodeSDK
let spanProcessor: SimpleSpanProcessor | undefined

beforeAll(({ suite }) => {
    const exporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        ? new OTLPTraceExporter()
        : process.env.OTEL_EXPORTER_OTLP_CONSOLE
        ? new ConsoleSpanExporter()
        : undefined
    spanProcessor = exporter ? new SimpleSpanProcessor(exporter) : undefined

    sdk = new NodeSDK({
        serviceName: 'featureboard-js-sdk-test',
        spanProcessor: spanProcessor,
        instrumentations: [],
    })

    sdk.start()
})

afterAll(async () => {
    await spanProcessor?.forceFlush()
    await sdk.shutdown()
})
