import { FeatureBoardProvider } from '@featureboard/openfeature-provider'
import { OpenFeatureProvider, useFlag } from '@openfeature/react-sdk'
import { OpenFeature } from '@openfeature/web-sdk'
import React from 'react'

// Initialize the provider
const provider = new FeatureBoardProvider({
    environmentKey: process.env.REACT_APP_ENVIRONMENT_KEY || 'test-key',
})

OpenFeature.setProvider(provider)

function TestComponent() {
    const { value: isEnabled } = useFlag('new-feature', false)
    const { value: welcomeMessage } = useFlag('welcome-message', 'Hello!')
    const { value: maxItems } = useFlag('max-items', 10)
    const { value: userType } = useFlag('user-type', 'standard')

    return (
        <div data-testid="test-app">
            <h1>OpenFeature React SDK Test</h1>
            <div data-testid="boolean-feature">
                {isEnabled ? (
                    <div
                        className="new-feature"
                        data-testid="new-feature"
                        aria-hidden="false"
                    >
                        <h2>🎉 New Feature is Enabled!</h2>
                        <p>
                            This content is only shown when the feature flag is
                            on.
                        </p>
                    </div>
                ) : (
                    <div
                        className="legacy-feature"
                        data-testid="legacy-feature"
                        aria-hidden="false"
                    >
                        <h2>📋 Legacy Version</h2>
                        <p>
                            This is the default content when the feature flag is
                            off.
                        </p>
                    </div>
                )}
            </div>
            <div className="welcome" data-testid="welcome-section">
                <h3 data-testid="welcome-message">{welcomeMessage}</h3>
            </div>
            <div className="items" data-testid="items-section">
                <p data-testid="max-items">
                    Maximum items to display: {maxItems}
                </p>
            </div>
            <div className="user-type" data-testid="user-type-section">
                <p data-testid="user-type-display">User type: {userType}</p>
            </div>
            <div data-testid="loading-indicator" className="loading">
                Loading feature flags...
            </div>
        </div>
    )
}

export function App() {
    return (
        <OpenFeatureProvider>
            <TestComponent />
        </OpenFeatureProvider>
    )
}

export function AppWithSuspense() {
    return (
        <OpenFeatureProvider>
            <React.Suspense
                fallback={
                    <div data-testid="suspense-loading">
                        Loading feature flags...
                    </div>
                }
            >
                <TestComponent />
            </React.Suspense>
        </OpenFeatureProvider>
    )
}
