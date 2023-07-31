/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BrowserClient, FeatureBoardClient } from '@featureboard/js-sdk'
import { useEffect, useMemo, useState } from 'react'

export function useClient({
    browserClient,
    audiences,
}: {
    browserClient: BrowserClient
    audiences: Array<string | undefined | false>
}): {
    client: FeatureBoardClient | undefined
    isInitialising: boolean
    isError: boolean
    error: any
} {
    const [isInitialising, setInitialising] = useState(
        !browserClient.initialised,
    )
    const [{ error, isError }, setError] = useState({
        error: undefined,
        isError: false,
    })

    // Removed undefined/false audiences and sort to make as stable list as possible
    const filteredAudiences = audiences
        .filter((aud): aud is string => !!aud)
        .sort()
    const stableAudiences = useMemo(
        () => filteredAudiences,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [filteredAudiences.join()],
    )

    useEffect(() => {
        // Check if initialised has changed
        if (isInitialising === browserClient.initialised) {
            setInitialising(!browserClient.initialised)
        }
        return browserClient.subscribeToInitialisedChanged(
            (initialised: boolean) => {
                if (isInitialising === initialised) {
                    // only set isInitialising if changed
                    setInitialising(!initialised)
                }
            },
        )
        // Empty dependency array => browserClient.subscribeToInitialisedChanged is called once after initial render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const update = async () => {
            try {
                browserClient.updateAudiences(stableAudiences)
                await browserClient.waitForInitialised()
            } catch (err: any) {
                setError({ error: err, isError: true })
            }
        }
        update()
    }, [browserClient, stableAudiences])

    return {
        client: browserClient.client,
        isInitialising,
        isError,
        error,
    }
}
