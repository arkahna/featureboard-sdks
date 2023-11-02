import type { FeatureConfiguration } from '@featureboard/contracts'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { describe, expect, it } from 'vitest'
import { createServerClient } from '../server-client'

describe('Manual update mode', () => {
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
                updateStrategy: 'manual',
            })
            expect(client.initialised).toBe(false)
            await client.waitForInitialised()

            const value = client
                .request([])
                .getFeatureValue('my-feature', 'default-value')
            expect(value).toEqual('service-default-value')
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('can manually update values', async () => {
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
            const client = createServerClient({
                environmentApiKey: 'fake-key',
                updateStrategy: 'manual',
            })
            await client.waitForInitialised()
            await client.updateFeatures()

            expect(
                client
                    .request([])
                    .getFeatureValue('my-feature', 'default-value'),
            ).toEqual('new-service-default-value')
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('can manually update audience exception values', async () => {
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [
                    { audienceKey: 'aud', value: 'aud-value' },
                ],
                defaultValue: 'service-default-value',
            },
        ]
        const newValues: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [
                    { audienceKey: 'aud', value: 'new-aud-value' },
                ],
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
            const client = createServerClient({
                environmentApiKey: 'fake-key',
                updateStrategy: 'manual',
            })
            await client.waitForInitialised()
            await client.updateFeatures()

            expect(
                client
                    .request(['aud'])
                    .getFeatureValue('my-feature', 'default-value'),
            ).toEqual('new-aud-value')
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('close', async () => {
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
                updateStrategy: 'manual',
            })

            client.close()
        } finally {
            server.resetHandlers()
            server.close()
        }
    })
})

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
