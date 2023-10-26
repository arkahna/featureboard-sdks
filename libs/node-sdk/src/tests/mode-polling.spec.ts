import type { FeatureConfiguration } from '@featureboard/contracts'
import { rest } from 'msw'
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
            rest.get('https://client.featureboard.app/all', (_req, res, ctx) =>
                res.once(ctx.json(values), ctx.status(200)),
            ),
        )
        server.listen()

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
            rest.get('https://client.featureboard.app/all', (_req, res, ctx) =>
                res.once(ctx.json(values), ctx.status(200)),
            ),
        )
        server.listen()

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
            rest.get(
                'https://client.featureboard.app/all',
                (_req, res, ctx) => {
                    if (count > 1) {
                        throw new Error('Too many requests')
                    }
                    if (count > 0) {
                        return res(ctx.json(newValues), ctx.status(200))
                    }

                    count++
                    return res(ctx.json(values), ctx.status(200))
                },
            ),
        )
        server.listen()

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
    })
})

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
