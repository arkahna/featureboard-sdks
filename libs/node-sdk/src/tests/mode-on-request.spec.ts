import type { FeatureConfiguration } from '@featureboard/contracts'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { describe, expect, it } from 'vitest'
import { createServerClient } from '../server-client'

describe('On request update mode', () => {
    it('fetches initial values', async () => {
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
                updateStrategy: 'on-request',
            })
            await client.waitForInitialised()

            const requestClient = await client.request([])
            const value = requestClient.getFeatureValue(
                'my-feature',
                'default-value',
            )
            expect(value).toEqual('service-default-value')
        } finally {
            server.resetHandlers()
            server.close()
        }
        expect.assertions(1)
    })

    it('throws if request() is not awaited in request mode', async () => {
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
                updateStrategy: 'on-request',
            })

            await client.waitForInitialised()

            expect(() =>
                client
                    .request([])
                    .getFeatureValue('my-feature', 'default-value'),
            ).toThrow(
                'request() must be awaited when using on-request update strategy',
            )
        } finally {
            server.resetHandlers()
            server.close()
        }
        expect.assertions(1)
    })

    // To reduce load on the FeatureBoard server, we only fetch the values once they are considered old
    // The maxAge can be configured in the client to be 0 to always check for updates
    it('does not fetch update when response is not expired', async () => {
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
                if (count > 0) {
                    return HttpResponse.json(newValues)
                }

                count++
                return HttpResponse.json(values)
            }),
        )
        server.listen({ onUnhandledRequest: 'error' })

        try {
            const connection = createServerClient({
                environmentApiKey: 'fake-key',
                updateStrategy: 'on-request',
            })

            const client = await connection.request([])

            expect(
                client.getFeatureValue('my-feature', 'default-value'),
            ).toEqual('service-default-value')
        } finally {
            server.resetHandlers()
            server.close()
        }
        expect.assertions(1)
    })

    it('fetches update when response is expired', async () => {
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
                if (count > 0) {
                    return HttpResponse.json(newValues)
                }

                count++
                return HttpResponse.json(values)
            }),
        )
        server.listen({ onUnhandledRequest: 'error' })
        try {
            const connection = createServerClient({
                environmentApiKey: 'fake-key',
                updateStrategy: {
                    kind: 'on-request',
                    options: { maxAgeMs: 1 },
                },
            })
            await connection.waitForInitialised()

            // Ensure response has expired
            await new Promise((resolve) => setTimeout(resolve, 10))

            const client = await connection.request([])
            expect(
                client.getFeatureValue('my-feature', 'default-value'),
            ).toEqual('new-service-default-value')
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
                    kind: 'on-request',
                    options: { maxAgeMs: 100 },
                },
            })
            await client.waitForInitialised()
            // Wait for the on-request max age to expire
            await new Promise((resolve) => setTimeout(resolve, 100))
            await client.request([])
            // Wait for the on-request max age to expire
            await new Promise((resolve) => setTimeout(resolve, 100))
            const requestClient = await client.request([])
            const value = requestClient.getFeatureValue(
                'my-feature',
                'default-value',
            )
            expect(value).toEqual('service-default-value')
        } finally {
            server.resetHandlers()
            server.close()
        }
        expect(countAPICalls).toBe(2)
        expect.assertions(2)
    })
})

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
