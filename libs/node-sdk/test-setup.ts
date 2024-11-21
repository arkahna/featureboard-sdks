import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { NodeSDK } from '@opentelemetry/sdk-node'
import {
    ConsoleSpanExporter,
    SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-node'
import { afterAll, beforeAll } from 'vitest'

let sdk: NodeSDK | undefined
let spanProcessor: SimpleSpanProcessor | undefined

beforeAll(({ suite }) => {
    const exporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        ? new OTLPTraceExporter()
        : process.env.OTEL_EXPORTER_OTLP_CONSOLE
        ? new ConsoleSpanExporter()
        : undefined
    spanProcessor = exporter ? new SimpleSpanProcessor(exporter) : undefined

    sdk = spanProcessor
        ? new NodeSDK({
              serviceName: 'featureboard-node-sdk-test',
              spanProcessor: spanProcessor,
              instrumentations: [],
          })
        : undefined

    sdk?.start()
})

afterAll(async () => {
    await spanProcessor?.forceFlush()
    await sdk?.shutdown()
})
