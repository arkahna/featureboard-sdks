import type { FeatureConfiguration } from '@featureboard/contracts'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { interval } from '../interval'
import { createServerClient } from '../server-client'

beforeEach(() => {
    interval.set = setInterval
    interval.clear = clearInterval
})

describe('Polling update mode', () => {
    it('fetches initial values', async () => {
        interval.set = vi.fn(() => {}) as any
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        const server = setupServer(
            http.get(
                'https://client.featureboard.app/all',
                () => HttpResponse.json(values),
                { once: true },
            ),
        )
        server.listen({ onUnhandledRequest: 'error' })

        try {
            const client = createServerClient({
                environmentApiKey: 'fake-key',
                updateStrategy: 'polling',
            })
            await client.waitForInitialised()

            const value = client
                .request([])
                .getFeatureValue('my-feature', 'default-value')
            expect(value).toEqual('service-default-value')
        } finally {
            server.resetHandlers()
            server.close()
        }
        expect.assertions(1)
    })

    it('sets up interval correctly', async () => {
        const handle = {}
        interval.set = vi.fn(() => {
            return handle
        }) as any
        interval.clear = vi.fn(() => {})

        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        const server = setupServer(
            http.get(
                'https://client.featureboard.app/all',
                () => HttpResponse.json(values),
                { once: true },
            ),
        )
        server.listen({ onUnhandledRequest: 'error' })

        try {
            const client = createServerClient({
                environmentApiKey: 'fake-key',
                updateStrategy: 'polling',
            })
            client.close()

            expect(interval.set).toBeCalled()
            expect(interval.clear).toBeCalledWith(handle)
        } finally {
            server.resetHandlers()
            server.close()
        }
        expect.assertions(2)
    })

    it('fetches updates when interval fires', async () => {
        const setMock = vi.fn(() => {})
        interval.set = setMock as any

        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        const newValues: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'new-service-default-value',
            },
        ]
        let count = 0
        const server = setupServer(
            http.get('https://client.featureboard.app/all', () => {
                if (count > 1) {
                    throw new Error('Too many requests')
                }
                if (count > 0) {
                    return HttpResponse.json(newValues)
                }

                count++
                return HttpResponse.json(values)
            }),
        )
        server.listen({ onUnhandledRequest: 'error' })

        try {
            const client = createServerClient({
                environmentApiKey: 'fake-key',
                updateStrategy: 'polling',
            })
            await client.waitForInitialised()

            const pollCallback = (setMock.mock.calls[0] as any)[0]
            await pollCallback()

            const value = client
                .request([])
                .getFeatureValue('my-feature', 'default-value')
            expect(value).toEqual('new-service-default-value')
        } finally {
            server.resetHandlers()
            server.close()
        }
        expect.assertions(1)
    })

    it('Do NOT throw error or make call to HTTP Client API when Too Many Requests (429) has been returned', async () => {
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]

        let countAPICalls = 0
        const server = setupServer(
            http.get(
                'https://client.featureboard.app/all',
                () => {
                    countAPICalls++
                    return HttpResponse.json(values)
                },
                { once: true },
            ),
            http.get('https://client.featureboard.app/all', () => {
                countAPICalls++
                return new Response(null, {
                    status: 429,
                    headers: { 'Retry-After': '2' },
                })
            }),
        )
        server.listen({ onUnhandledRequest: 'error' })

        try {
            const client = createServerClient({
                environmentApiKey: 'fake-key',
                updateStrategy: {
                    kind: 'polling',
                    options: { intervalMs: 100 },
                },
            })
            await client.waitForInitialised()
            // Wait for the interval to expire
            await new Promise((resolve) => setTimeout(resolve, 100))
            const requestClient1 = await client.request([])
            const value1 = requestClient1.getFeatureValue(
                'my-feature',
                'default-value',
            )
            expect(value1).toEqual('service-default-value')
            // Wait for interval to expire
            await new Promise((resolve) => setTimeout(resolve, 100))
            const requestClient2 = await client.request([])
            const value2 = requestClient2.getFeatureValue(
                'my-feature',
                'default-value',
            )
            expect(value2).toEqual('service-default-value')
        } finally {
            server.resetHandlers()
            server.close()
        }
        expect(countAPICalls).toBe(2)
        expect.assertions(3)
    })
})

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
