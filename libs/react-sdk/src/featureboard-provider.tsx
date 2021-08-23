import { FeatureBoardClient } from '@featureboard/js-sdk'
import React from 'react'

export interface FeatureBoardProviderProp {
    client: FeatureBoardClient
}

export const FeatureBoardContext =
    React.createContext<
        | {
              client: FeatureBoardClient
          }
        | undefined
    >(undefined)

export function FeatureBoardProvider(props: React.PropsWithChildren<FeatureBoardProviderProp>) {
    return (
        <FeatureBoardContext.Provider value={{ client: props.client }}>
            {props.children}
        </FeatureBoardContext.Provider>
    )
}
