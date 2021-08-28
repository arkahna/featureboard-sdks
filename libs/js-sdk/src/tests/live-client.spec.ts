import { StateOfTheWorldEffectiveValuesNotification } from '@featureboard/contracts'
import { FeatureBoardService } from '../client'
import { connectToWsClient } from './ws-helper'

describe('live client', () => {
    it('can connect to featureboard', async () => {
        const client = await FeatureBoardService.init('fake-key', [], {
            updateStrategy: {
                kind: 'live',
                options: {
                    websocketFactory: () =>
                        connectToWsClient((msg, ws) => {
                            if (msg.kind === 'subscribe') {
                                const stateOfTheWorld: StateOfTheWorldEffectiveValuesNotification =
                                    {
                                        kind: 'state-of-the-world-effective-values',
                                        features: [
                                            {
                                                featureKey: 'my-feature',
                                                value: 'some-value',
                                            },
                                        ],
                                    }

                                ws.send(JSON.stringify(stateOfTheWorld))
                            }
                        }),
                },
            },
        })

        expect(client.client.getFeatureValue('my-feature', 'default-val')).toBe(
            'some-value',
        )
    })
})
