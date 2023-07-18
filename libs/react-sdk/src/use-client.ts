import type { BrowserClient } from '@featureboard/js-sdk'
import { useEffect, useMemo, useState } from 'react'

export function useClient({
    browserClient,
    audiences,
}: {
    browserClient: BrowserClient
    audiences: Array<string | undefined | false>
}) {
    // Removed undefined/false audiences and sort to make as stable list as possible
    const filteredAudiences = audiences
        .filter((aud): aud is string => !!aud)
        .sort()
    const stableAudiences = useMemo(
        () => filteredAudiences,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [filteredAudiences.join()],
    )
    const [, forceRender] = useState(0)
    useEffect(() => {
        return browserClient.subscribeToInitialisedChanged((init: boolean) =>
            forceRender((curr) => curr + 1),
        )
    })

    useEffect(() => {
        browserClient.updateAudiences(stableAudiences)
    }, [browserClient, stableAudiences])
    return browserClient.client
}
