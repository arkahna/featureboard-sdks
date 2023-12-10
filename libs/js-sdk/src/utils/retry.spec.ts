import { trace } from '@opentelemetry/api'
import {
    BasicTracerProvider,
    InMemorySpanExporter,
    SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { retry } from './retry'

describe('retry function with OpenTelemetry', () => {
    let exporter: InMemorySpanExporter

    beforeEach(() => {
        // Set up in-memory exporter
        exporter = new InMemorySpanExporter()
        const provider = new BasicTracerProvider()
        provider.addSpanProcessor(new SimpleSpanProcessor(exporter))
        trace.setGlobalTracerProvider(provider)
    })

    afterEach(() => {
        // Clear the spans and reset the tracer
        exporter.reset()
    })

    it('should retry the function and succeed', async () => {
        let attempt = 0
        const mockFn = async () => {
            if (attempt < 2) {
                attempt++
                throw new Error('Temporary failure')
            }
            return 'Success'
        }

        const result = await retry(mockFn)

        expect(result).toBe('Success')
        const spans = exporter.getFinishedSpans()
        expect(spans.length).toEqual(5)
        expect(spans[0].attributes?.retryAttempt).toBe(0)
        expect(spans[1].name).toEqual('delay')
        expect(spans[2].attributes?.retryAttempt).toBe(1)
        expect(spans[3].name).toEqual('delay')
        expect(spans[4].attributes?.retryAttempt).toBe(2)
    })

    it('should retry the function and fail', async () => {
        const mockFn = async () => {
            throw new Error('Temporary failure')
        }

        await expect(retry(mockFn)).rejects.toThrow('Temporary failure')
    })
})
