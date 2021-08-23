import {
    ClientConnection,
    FeatureBoardService,
    FeatureBoardServiceOptions,
} from '@featureboard/js-sdk'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePrevious } from './use-previous'

export function useClient({
    apiKey,
    audiences,
    ...initOptions
}: {
    apiKey: string | undefined
    audiences: Array<string | undefined | false>
} & FeatureBoardServiceOptions) {
    const [stableInitOptions] = useState(initOptions)
    const [clientSdk, setClientSdk] = useState<ClientConnection | undefined>(
        undefined,
    )
    const [initError, setInitError] = useState<string | undefined>(undefined)

    // Removed undefined/false audiences and sort to make as stable list as possible
    const filteredAudiences = audiences
        .filter((aud): aud is string => !!aud)
        .sort()
    const stableAudiences = useMemo(
        () => filteredAudiences,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [filteredAudiences.join()],
    )
    const previousStableAudiences = usePrevious(stableAudiences)

    const connect = useCallback(
        async function connect() {
            if (initError) {
                setInitError(undefined)
            }
            // Cleanup old client
            if (clientSdk) {
                clientSdk.close()
            }

            if (apiKey) {
                try {
                    const sdk = await FeatureBoardService.init(
                        apiKey,
                        stableAudiences,
                        stableInitOptions,
                    )

                    setClientSdk(sdk)
                } catch (err) {
                    setInitError(err.message || 'Unknown initialization error')
                }
            }
        },
        [apiKey, clientSdk, initError, stableAudiences, stableInitOptions],
    )

    useEffect(() => {
        if (stableAudiences !== previousStableAudiences) {
            connect()
        }
    }, [apiKey, clientSdk, connect, previousStableAudiences, stableAudiences])

    return {
        client: clientSdk,
        initError,
        reconnect: () => {
            connect()
        },
    }
}
