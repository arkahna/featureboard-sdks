import {
    ClientConnection,
    FeatureBoardService,
    FeatureBoardServiceOptions,
} from '@featureboard/js-sdk'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { reactSdkDebugLog } from './log'

export function useClient({
    apiKey,
    audiences,
    ...initOptions
}: {
    apiKey: string | undefined
    audiences: Array<string | undefined | false>
} & FeatureBoardServiceOptions) {
    const [stableInitOptions] = useState(initOptions)
    const client = useMemo(() => createClient(), [])
    const [connectionConnection, setClientSdk] = useState<
        ClientConnection | undefined
    >(undefined)
    const [initError, setInitError] = useState<string | undefined>(undefined)
    const connectionValues = useRef<{
        audiences: string[] | undefined
        apiKey: string | undefined
    }>({ apiKey: undefined, audiences: undefined })

    // Removed undefined/false audiences and sort to make as stable list as possible
    const filteredAudiences = audiences
        .filter((aud): aud is string => !!aud)
        .sort()
    const stableAudiences = useMemo(
        () => filteredAudiences,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [filteredAudiences.join()],
    )

    const connect = useCallback(
        async function connect() {
            if (initError) {
                setInitError(undefined)
            }

            // Cleanup old client
            if (connectionConnection) {
                connectionConnection.close()
            }

            if (apiKey) {
                try {
                    connectionValues.current.apiKey = apiKey
                    connectionValues.current.audiences = stableAudiences

                    if (connectionConnection) {
                        connectionConnection.updateAudiences(stableAudiences)
                    } else {
                        const sdk = await FeatureBoardService.init(
                            apiKey,
                            stableAudiences,
                            stableInitOptions,
                        )

                        setClientSdk(sdk)
                    }
                } catch (err: any) {
                    setInitError(err.message || 'Unknown initialization error')
                }
            }
        },
        [
            apiKey,
            connectionConnection,
            initError,
            stableAudiences,
            stableInitOptions,
        ],
    )

    useEffect(() => {
        if (
            stableAudiences !== connectionValues.current.audiences ||
            apiKey !== connectionValues.current.apiKey
        ) {
            reactSdkDebugLog(
                'useClient arguments changed, re-initialising client',
            )
            connect()
        }
    }, [apiKey, connectionConnection, connect, stableAudiences])

    return {
        client,
        connectionConnection,
        initError,
        reconnect: () => {
            connect()
        },
    }
}
