import type { EffectiveFeatureValue } from '@featureboard/contracts'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBrowserClient } from '../create-browser-client'
import { interval } from '../interval'

beforeEach(() => {
    interval.set = setInterval
    interval.clear = clearInterval
})

describe('Polling update mode', () => {
    it('fetches initial values', async () => {
        interval.set = vi.fn(() => {}) as any
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]

        const server = setupServer(
            http.get(
                'https://client.featureboard.app/effective',
                () => HttpResponse.json(values),
                { once: true },
            ),
        )
        server.listen({ onUnhandledRequest: 'error' })

        try {
            const connection = createBrowserClient({
                environmentApiKey: 'fake-key',
                audiences: [],
                updateStrategy: 'polling',
            })

            await connection.waitForInitialised()

            const value = connection.client.getFeatureValue(
                'my-feature',
                'default-value',
            )
            expect(value).toEqual('service-default-value')
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('sets up interval correctly', async () => {
        const handle = {}
        interval.set = vi.fn(() => {
            return handle
        }) as any
        interval.clear = vi.fn(() => {})

        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]

        const server = setupServer(
            http.get('https://client.featureboard.app/effective', () =>
                HttpResponse.json(values),
            ),
        )
        server.listen({ onUnhandledRequest: 'error' })

        try {
            const connection = createBrowserClient({
                environmentApiKey: 'fake-key',
                audiences: [],
                updateStrategy: 'polling',
            })
            connection.close()

            expect(interval.set).toBeCalled()
            expect(interval.clear).toBeCalledWith(handle)
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('fetches updates when interval fires', async () => {
        const setMock = vi.fn(() => {})
        interval.set = setMock as any

        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        const newValues: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'new-service-default-value',
            },
        ]

        let count = 0
        const server = setupServer(
            http.get('https://client.featureboard.app/effective', () => {
                if (count > 0) {
                    return HttpResponse.json(newValues)
                }

                count++
                return HttpResponse.json(values)
            }),
        )
        server.listen({ onUnhandledRequest: 'error' })

        try {
            const client = createBrowserClient({
                environmentApiKey: 'fake-key',
                audiences: [],
                updateStrategy: 'polling',
            })
            await client.waitForInitialised()

            const pollCallback = (setMock.mock.calls[0] as any)[0]
            await pollCallback()

            const value = client.client.getFeatureValue(
                'my-feature',
                'default-value',
            )
            expect(value).toEqual('new-service-default-value')
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('Do NOT throw error or make call to HTTP Client API when Too Many Requests (429) has been returned', async () => {
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]

        let countAPICalls = 0
        const server = setupServer(
            http.get(
                'https://client.featureboard.app/effective',
                () => {
                    countAPICalls++
                    return HttpResponse.json(values)
                },
                { once: true },
            ),
            http.get('https://client.featureboard.app/effective', () => {
                countAPICalls++
                return new Response(null, {
                    status: 429,
                    headers: { 'Retry-After': '2' },
                })
            }),
        )
        server.listen({ onUnhandledRequest: 'error' })

        try {
            const client = createBrowserClient({
                environmentApiKey: 'fake-key',
                audiences: [],
                updateStrategy: {
                    kind: 'polling',
                    options: { intervalMs: 100 },
                },
            })

            await client.waitForInitialised()
            // Wait for the interval to expire
            await new Promise((resolve) => setTimeout(resolve, 100))
            const value1 = client.client.getFeatureValue(
                'my-feature',
                'default-value',
            )
            expect(value1).toEqual('service-default-value')
            // Wait for interval to expire
            await new Promise((resolve) => setTimeout(resolve, 100))
            const value2 = client.client.getFeatureValue(
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
