import { OpenFeatureProvider, useFlag } from '@openfeature/react-sdk'
import { OpenFeature } from '@openfeature/web-sdk'
import React from 'react'
import { FeatureBoardProvider } from '../src/featureboard-provider'

// Initialize the provider
const provider = new FeatureBoardProvider({
    environmentKey: 'your-environment-key-here',
})

OpenFeature.setProvider(provider)

// Example component using feature flags
function FeatureComponent() {
    const { value: isEnabled } = useFlag('my-feature', false)
    const { value: welcomeMessage } = useFlag('welcome-message', 'Hello!')
    const { value: maxItems } = useFlag('max-items', 10)

    return (
        <div>
            <h1>Feature Flags Demo</h1>

            {isEnabled ? (
                <div className="new-feature">
                    <h2>🎉 New Feature is Enabled!</h2>
                    <p>
                        This content is only shown when the feature flag is on.
                    </p>
                </div>
            ) : (
                <div className="legacy-feature">
                    <h2>📋 Legacy Version</h2>
                    <p>
                        This is the default content when the feature flag is
                        off.
                    </p>
                </div>
            )}

            <div className="welcome">
                <h3>{welcomeMessage}</h3>
            </div>

            <div className="items">
                <p>Maximum items to display: {maxItems}</p>
            </div>
        </div>
    )
}

// App wrapper with OpenFeature provider
export function App() {
    return (
        <OpenFeatureProvider>
            <FeatureComponent />
        </OpenFeatureProvider>
    )
}

// Example with Suspense for loading states
export function AppWithSuspense() {
    return (
        <OpenFeatureProvider>
            <React.Suspense fallback={<div>Loading feature flags...</div>}>
                <FeatureComponent />
            </React.Suspense>
        </OpenFeatureProvider>
    )
}
