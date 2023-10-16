import { expect, it } from 'vitest'
import { createManualClient } from '../create-manual-client'

it('can be intialised with initial values', () => {
    const client = createManualClient({
        audiences: [],
        values: {
            foo: 'bar',
        },
    })

    expect(client.getFeatureValue('foo', 'default')).toBe('bar')
})

it('can set value', () => {
    const client = createManualClient({
        audiences: [],
        values: {
            foo: 'bar',
        },
    })

    client.set('foo', 'baz')

    expect(client.getFeatureValue('foo', 'default')).toBe('baz')
})

declare module '@featureboard/js-sdk' {
    interface Features {
        foo: string
    }
}
