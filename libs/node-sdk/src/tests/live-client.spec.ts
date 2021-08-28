import { StateOfTheWorldNotification } from '@featureboard/contracts'
import { FeatureBoardService } from '../client'
import { connectToWsClient } from './ws-helper'

describe('live client', () => {
    it('can connect to featureboard', async () => {
        const client = await FeatureBoardService.init('fake-key', {
            updateStrategy: {
                kind: 'live',
                options: {
                    websocketFactory: () =>
                        connectToWsClient((msg, ws) => {
                            if (msg.kind === 'subscribe') {
                                const stateOfTheWorld: StateOfTheWorldNotification =
                                    {
                                        kind: 'state-of-the-world',
                                        features: [
                                            {
                                                featureKey: 'my-feature',
                                                audienceExceptions: [],
                                                defaultValue: 'some-value',
                                            },
                                        ],
                                    }

                                ws.send(JSON.stringify(stateOfTheWorld))
                            }
                        }),
                },
            },
        })

        expect(
            client.request([]).getFeatureValue('my-feature', 'default-val'),
        ).toBe('some-value')
    })
})
