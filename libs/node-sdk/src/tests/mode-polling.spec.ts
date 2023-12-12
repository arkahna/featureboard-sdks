import type { FeatureConfiguration } from '@featureboard/contracts'
import { HttpResponse, http } from 'msw'
import { beforeEach, expect, it, vi } from 'vitest'
import { interval } from '../interval'
import { createServerClient } from '../server-client'
import { featureBoardFixture } from '../utils/featureboard-fixture'

beforeEach(() => {
    interval.set = setInterval
    interval.clear = clearInterval
})

it(
    'fetches initial values',
    featureBoardFixture(
        {},
        () => [
            http.get(
                'https://client.featureboard.app/all',
                () =>
                    HttpResponse.json<FeatureConfiguration[]>([
                        {
                            featureKey: 'my-feature',
                            audienceExceptions: [],
                            defaultValue: 'service-default-value',
                        },
                    ]),
                { once: true },
            ),
        ],
        async () => {
            interval.set = vi.fn(() => {}) as any
            const client = createServerClient({
                environmentApiKey: 'fake-key',
                updateStrategy: 'polling',
            })
            await client.waitForInitialised()

            const value = client
                .request([])
                .getFeatureValue('my-feature', 'default-value')
            expect(value).toEqual('service-default-value')
        },
    ),
)

it(
    'sets up interval correctly',
    featureBoardFixture(
        {},
        () => [
            http.get(
                'https://client.featureboard.app/all',
                () =>
                    HttpResponse.json<FeatureConfiguration[]>([
                        {
                            featureKey: 'my-feature',
                            audienceExceptions: [],
                            defaultValue: 'service-default-value',
                        },
                    ]),
                { once: true },
            ),
        ],
        async () => {
            const handle = {}
            interval.set = vi.fn(() => {
                return handle
            }) as any
            interval.clear = vi.fn(() => {})

            const client = createServerClient({
                environmentApiKey: 'fake-key',
                updateStrategy: 'polling',
            })
            client.close()

            expect(interval.set).toBeCalled()
            expect(interval.clear).toBeCalledWith(handle)
        },
    ),
)

it(
    'fetches updates when interval fires',
    featureBoardFixture(
        { count: 0 },
        (testContext) => [
            http.get('https://client.featureboard.app/all', () => {
                if (testContext.count > 1) {
                    throw new Error('Too many requests')
                }
                if (testContext.count > 0) {
                    return HttpResponse.json<FeatureConfiguration[]>([
                        {
                            featureKey: 'my-feature',
                            audienceExceptions: [],
                            defaultValue: 'new-service-default-value',
                        },
                    ])
                }

                testContext.count++
                return HttpResponse.json<FeatureConfiguration[]>([
                    {
                        featureKey: 'my-feature',
                        audienceExceptions: [],
                        defaultValue: 'service-default-value',
                    },
                ])
            }),
        ],
        async () => {
            const setMock = vi.fn(() => {})
            interval.set = setMock as any

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
        },
    ),
)

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
