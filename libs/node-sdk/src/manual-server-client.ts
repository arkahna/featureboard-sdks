import type { Features } from '@featureboard/js-sdk'
import { createManualClient } from '@featureboard/js-sdk'
import type { ServerClient } from '.'
import { makeRequestClient } from './server-client'

export function createManualServerClient(
    calculateFeatures: (audiences: string[]) => {
        [K in keyof Features]: Features[K]
    },
): ServerClient {
    return {
        request(audiences) {
            return makeRequestClient(
                createManualClient({
                    audiences,
                    values: calculateFeatures(audiences),
                }),
            )
        },
        close() {},
        initialised: true,
        updateFeatures() {
            return Promise.resolve()
        },
        waitForInitialised() {
            return Promise.resolve(true)
        },
    }
}
