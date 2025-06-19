import { OpenFeature } from '@openfeature/web-sdk'
import { FeatureBoardProvider } from '../src/featureboard-provider'

// Example usage of the FeatureBoard OpenFeature provider
export function setupFeatureBoardProvider() {
    // Create the provider with your environment key
    const provider = new FeatureBoardProvider({
        environmentKey: 'your-environment-key-here',
    })

    // Register the provider with OpenFeature
    OpenFeature.setProvider(provider)

    // Get the OpenFeature client
    const client = OpenFeature.getClient()

    // Example: Get a boolean flag value
    const isFeatureEnabled = client.getBooleanValue('my-feature', false)
    console.log('Feature enabled:', isFeatureEnabled)

    // Example: Get a string flag value
    const welcomeMessage = client.getStringValue('welcome-message', 'Hello!')
    console.log('Welcome message:', welcomeMessage)

    // Example: Get a number flag value
    const maxItems = client.getNumberValue('max-items', 10)
    console.log('Max items:', maxItems)

    // Example: Get an object flag value
    const config = client.getObjectValue('ui-config', { theme: 'light' })
    console.log('UI config:', config)
}

// Example with async initialization
export async function setupFeatureBoardProviderAsync() {
    const provider = new FeatureBoardProvider({
        environmentKey: 'your-environment-key-here',
    })

    OpenFeature.setProvider(provider)

    // Wait for the provider to be ready
    await provider.initialize()

    const client = OpenFeature.getClient()

    // Now the provider is ready and flags can be evaluated
    const isFeatureEnabled = client.getBooleanValue('my-feature', false)
    console.log('Feature enabled (after init):', isFeatureEnabled)
}
