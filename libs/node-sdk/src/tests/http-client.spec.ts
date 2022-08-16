import { FeatureConfiguration } from '@featureboard/contracts'
import { featureBoardHostedService } from '@featureboard/js-sdk'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { describe, expect, it } from 'vitest'
import { MemoryFeatureStore } from '../feature-store'
import { createServerClient } from '../server-client'

describe('http client', () => {
    it('calls featureboard /all endpoint on creation', async () => {
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        const server = setupServer(
            rest.get('https://client.featureboard.app/all', (_req, res, ctx) =>
                res.once(ctx.json(values), ctx.status(200)),
            ),
        )
        server.listen()

        try {
            const httpClient = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
            })

            const value = httpClient
                .request([])
                .getFeatureValue('my-feature', 'default-value')
            expect(httpClient.initialised).toBe(false)
            expect(value).toBe('default-value')
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('can wait for initialisation', async () => {
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        const server = setupServer(
            rest.get('https://client.featureboard.app/all', (_req, res, ctx) =>
                res.once(ctx.json(values), ctx.status(200)),
            ),
        )
        server.listen()

        try {
            const httpClient = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
            })
            await httpClient.waitForInitialised()

            const value = httpClient
                .request([])
                .getFeatureValue('my-feature', 'default-value')
            expect(httpClient.initialised).toBe(true)
            expect(value).toBe('service-default-value')
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('can manually fetch updates', async () => {
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
            rest.get(
                'https://client.featureboard.app/all',
                (_req, res, ctx) => {
                    if (count > 0) {
                        return res(ctx.json(newValues), ctx.status(200))
                    }

                    count++
                    return res(ctx.json(values), ctx.status(200))
                },
            ),
        )
        server.listen()

        try {
            const httpClient = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
            })
            await httpClient.waitForInitialised()
            await httpClient.updateFeatures()

            const value = httpClient
                .request([])
                .getFeatureValue('my-feature', 'default-value')
            expect(httpClient.initialised).toBe(true)
            expect(value).toBe('new-service-default-value')
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    // Below tests are testing behaviour around https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since
    it('Attaches last modified header to update requests', async () => {
        const values: FeatureConfiguration[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        const lastModified = new Date().toISOString()

        const server = setupServer(
            rest.get('https://client.featureboard.app/all', (req, res, ctx) => {
                if (req.headers.get('if-modified-since') === lastModified) {
                    return res(ctx.status(304))
                }

                return res(
                    ctx.json(values),
                    ctx.status(200),
                    ctx.set({
                        'Last-Modified': lastModified,
                    }),
                )
            }),
        )
        server.listen()

        try {
            const httpClient = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                updateStrategy: { kind: 'manual' },
            })

            await httpClient.updateFeatures()
        } finally {
            server.resetHandlers()
            server.close()
        }
    })

    it('can start with last known good config', async () => {
        const server = setupServer(
            rest.get('https://client.featureboard.app/all', (_req, res, ctx) =>
                res.once(ctx.status(500)),
            ),
        )
        server.listen()

        try {
            const client = createServerClient({
                environmentApiKey: 'env-api-key',
                api: featureBoardHostedService,
                store: new MemoryFeatureStore([
                    {
                        featureKey: 'my-feature',
                        audienceExceptions: [],
                        defaultValue: 'service-default-value',
                    },
                ]),
                updateStrategy: { kind: 'manual' },
            })

            const value = client
                .request([])
                .getFeatureValue('my-feature', 'default-value')

            expect(client.initialised).toEqual(false)
            expect(value).toEqual('service-default-value')
        } finally {
            server.resetHandlers()
            server.close()
        }
    })
})
