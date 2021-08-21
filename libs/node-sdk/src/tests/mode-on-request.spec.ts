import { FeatureValues } from '@featureboard/contracts'
import fetchMock from 'fetch-mock'
import { FeatureBoardService } from '..'

let fetch: fetchMock.FetchMockSandbox

beforeEach(() => {
    fetch = fetchMock.sandbox()
    // Default to internal server error
    fetch.catch(500)
})

describe('On request update mode', () => {
    it('fetches initial values', async () => {
        const values: FeatureValues[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        fetch.get('https://client.featureboard.app/all', {
            status: 200,
            body: values,
        })

        const client = await FeatureBoardService.init('fake-key', {
            updateStrategy: 'on-request',
            fetch,
        })

        expect(
            (await client.request([])).getFeatureValue(
                'my-feature',
                'default-value',
            ),
        ).toEqual('service-default-value')
    })

    it('throws if request() is not awaited in request mode', async () => {
        const values: FeatureValues[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        fetch.get('https://client.featureboard.app/all', {
            status: 200,
            body: values,
        })

        const client = await FeatureBoardService.init('fake-key', {
            updateStrategy: 'on-request',
            fetch,
        })

        expect(() =>
            client.request([]).getFeatureValue('my-feature', 'default-value'),
        ).toThrow(
            'request() must be awaited when using on-request update strategy',
        )
    })

    // To reduce load on the FeatureBoard server, we only fetch the values once they are considered old
    // The maxAge can be configured in the client to be 0 to always check for updates
    it('does not fetch update when response is not expired', async () => {
        const values: FeatureValues[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        fetch.getOnce('https://client.featureboard.app/all', {
            status: 200,
            body: values,
        })

        const connection = await FeatureBoardService.init('fake-key', {
            updateStrategy: 'on-request',
            fetch,
        })

        const newValues: FeatureValues[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'new-service-default-value',
            },
        ]
        fetch.getOnce(
            'https://client.featureboard.app/all',
            {
                status: 200,
                body: newValues,
            },
            { overwriteRoutes: true },
        )

        const client = await connection.request([])
        expect(client.getFeatureValue('my-feature', 'default-value')).toEqual(
            'service-default-value',
        )
    })

    it('fetches update when response is expired', async () => {
        const values: FeatureValues[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'service-default-value',
            },
        ]
        fetch.getOnce('https://client.featureboard.app/all', {
            status: 200,
            body: values,
        })

        const connection = await FeatureBoardService.init('fake-key', {
            updateStrategy: { kind: 'on-request', options: { maxAgeMs: 1 } },
            fetch,
        })

        const newValues: FeatureValues[] = [
            {
                featureKey: 'my-feature',
                audienceExceptions: [],
                defaultValue: 'new-service-default-value',
            },
        ]
        fetch.getOnce(
            'https://client.featureboard.app/all',
            {
                status: 200,
                body: newValues,
            },
            { overwriteRoutes: true },
        )

        // Ensure response has expired
        await new Promise((resolve) => setTimeout(resolve, 2))

        const client = await connection.request([])
        expect(client.getFeatureValue('my-feature', 'default-value')).toEqual(
            'new-service-default-value',
        )
    })
})

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
