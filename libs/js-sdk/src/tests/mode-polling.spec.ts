import { EffectiveFeatureValue } from '@featureboard/contracts'
import fetchMock from 'fetch-mock'
import { FeatureBoardService } from '..'
import { interval } from '../interval'

let fetch: fetchMock.FetchMockSandbox

beforeEach(() => {
    fetch = fetchMock.sandbox()
    // Default to internal server error
    fetch.catch(500)
    interval.set = setInterval
    interval.clear = clearInterval
})

describe('Polling update mode', () => {
    it('fetches initial values', async () => {
        interval.set = jest.fn(() => {}) as any
        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        fetch.get('https://client.featureboard.app/effective?audiences=', {
            status: 200,
            body: values,
        })

        const connection = await FeatureBoardService.init('fake-key', [], {
            updateStrategy: 'polling',
            fetch,
        })

        expect(
            connection.client.getFeatureValue('my-feature', 'default-value'),
        ).toEqual('service-default-value')
    })

    it('sets up interval correctly', async () => {
        const handle = {}
        interval.set = jest.fn(() => {
            return handle
        }) as any
        interval.clear = jest.fn(() => {})

        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        fetch.get('https://client.featureboard.app/effective?audiences=', {
            status: 200,
            body: values,
        })

        const connection = await FeatureBoardService.init('fake-key', [], {
            updateStrategy: 'polling',
            fetch,
        })
        connection.close()

        expect(interval.set).toBeCalled()
        expect(interval.clear).toBeCalledWith(handle)
    })

    it('fetches updates when interval fires', async () => {
        const setMock = jest.fn(() => {})
        interval.set = setMock as any

        const values: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'service-default-value',
            },
        ]
        fetch.get('https://client.featureboard.app/effective?audiences=', {
            status: 200,
            body: values,
        })

        const client = await FeatureBoardService.init('fake-key', [], {
            updateStrategy: 'polling',
            fetch,
        })

        const newValues: EffectiveFeatureValue[] = [
            {
                featureKey: 'my-feature',
                value: 'new-service-default-value',
            },
        ]
        fetch.get(
            'https://client.featureboard.app/effective?audiences=',
            {
                status: 200,
                body: newValues,
            },
            { overwriteRoutes: true },
        )

        const pollCallback = (setMock.mock.calls[0] as any)[0]
        await pollCallback()

        expect(
            client.client.getFeatureValue('my-feature', 'default-value'),
        ).toEqual('new-service-default-value')
    })
})

declare module '@featureboard/js-sdk' {
    interface Features extends Record<string, string | number | boolean> {}
}
