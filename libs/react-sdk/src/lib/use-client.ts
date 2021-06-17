import {
    FeatureBoardClient,
    FeatureBoardService,
    FeatureBoardServiceOptions,
} from '@featureboard/js-sdk'
import { useEffect, useMemo, useState } from 'react'

export function useClient(
    {
        apiKey,
        audiences,
    }: { apiKey: string | undefined; audiences: Array<string | undefined | false> },
    initOptions?: FeatureBoardServiceOptions,
) {
    const [clientSdk, setClientSdk] = useState<FeatureBoardClient | undefined>(undefined)

    // Removed undefined/false audiences
    const filteredAudiences = audiences.filter((aud): aud is string => !!aud)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const stableAudiences = useMemo(() => filteredAudiences, [filteredAudiences.join()])

    useEffect(() => {
        let close = () => {}
        async function connect() {
            if (apiKey) {
                const sdk = await FeatureBoardService.init(apiKey, stableAudiences, initOptions)
                close = sdk.close.bind(sdk)
                setClientSdk(sdk.client)
            }
        }

        connect()

        return () => {
            close()
        }
        // Need to exclude initOptions, we don't want to re-initialise when they change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey, stableAudiences])

    return clientSdk
}
