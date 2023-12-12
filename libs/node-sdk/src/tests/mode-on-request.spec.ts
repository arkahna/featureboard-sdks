import type { FeatureConfiguration } from '@featureboard/contracts'
import { HttpResponse, http } from 'msw'
import { expect, it } from 'vitest'
import { createServerClient } from '../server-client'
import { featureBoardFixture } from '../utils/featureboard-fixture'

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
        },
    ),
)

it(
    'throws if request() is not awaited in request mode',
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
        },
    ),
)

// To reduce load on the FeatureBoard server, we only fetch the values once they are considered old
// The maxAge can be configured in the client to be 0 to always check for updates
it(
    'does not fetch update when response is not expired',
    featureBoardFixture(
        { count: 0 },
        (testContext) => [
            http.get('https://client.featureboard.app/all', () => {
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
            const connection = createServerClient({
                environmentApiKey: 'fake-key',
                updateStrategy: 'on-request',
            })

            const client = await connection.request([])

            expect(
                client.getFeatureValue('my-feature', 'default-value'),
            ).toEqual('service-default-value')
        },
    ),
)

it(
    'fetches update when response is expired',
    featureBoardFixture(
        { count: 0 },
        (testContext) => [
            http.get('https://client.featureboard.app/all', () => {
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
        },
    ),
)

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
