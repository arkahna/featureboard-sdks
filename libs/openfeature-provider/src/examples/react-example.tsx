import { OpenFeatureProvider, useFlag } from '@openfeature/react-sdk';
import { OpenFeature, ProviderEvents } from '@openfeature/web-sdk';
import { useEffect } from 'react';
import { FeatureBoardOpenFeatureProvider } from '../featureboard-provider';

// Initialize the provider
const provider = new FeatureBoardOpenFeatureProvider({
    environmentApiKey: 'YOUR_ENVIRONMENT_API_KEY', // Replace with your actual key
    audiences: ['web-users'],
    updateStrategy: 'polling',
    // Example initial values for testing
    initialValues: [
        { featureKey: 'welcome-banner', value: true },
        { featureKey: 'theme-mode', value: 'dark' },
        { featureKey: 'max-items-per-page', value: 25 },
        { featureKey: 'ui-config', value: { showSidebar: true, enableNotifications: false } }
    ]
});

// Set up event listeners
OpenFeature.addHandler(ProviderEvents.Ready, (eventDetails) => {
    console.log('✅ FeatureBoard provider ready:', eventDetails.providerName);
});

OpenFeature.addHandler(ProviderEvents.Error, (eventDetails) => {
    console.error('❌ FeatureBoard provider error:', eventDetails.message);
});

OpenFeature.addHandler(ProviderEvents.ConfigurationChanged, () => {
    console.log('🔄 Feature flags updated');
});

// Main App component
export function App() {
    useEffect(() => {
        // Initialize the provider
        OpenFeature.setProviderAndWait(provider)
            .then(() => console.log('Provider initialized successfully'))
            .catch((error) => console.error('Failed to initialize provider:', error));
    }, []);

    return (
        <OpenFeatureProvider>
            <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
                <h1>FeatureBoard + OpenFeature React Example</h1>
                <WelcomeBanner />
                <ThemeSelector />
                <ItemsList />
                <UIConfigExample />
            </div>
        </OpenFeatureProvider>
    );
}

// Component that uses a boolean flag
function WelcomeBanner() {
    const { value: showBanner } = useFlag('welcome-banner', false);

    if (!showBanner) return null;

    return (
        <div style={{ 
            background: '#e3f2fd', 
            padding: '15px', 
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #2196f3'
        }}>
            <h3>🎉 Welcome to our application!</h3>
            <p>This banner is controlled by the 'welcome-banner' feature flag.</p>
        </div>
    );
}

// Component that uses a string flag
function ThemeSelector() {
    const { value: themeMode } = useFlag('theme-mode', 'light');

    const themeStyle = {
        background: themeMode === 'dark' ? '#333' : '#fff',
        color: themeMode === 'dark' ? '#fff' : '#333',
        padding: '15px',
        borderRadius: '5px',
        marginBottom: '20px',
        border: '1px solid #ccc'
    };

    return (
        <div style={themeStyle}>
            <h3>🎨 Theme Mode</h3>
            <p>Current theme: <strong>{themeMode}</strong></p>
            <p>This theme is controlled by the 'theme-mode' string flag.</p>
        </div>
    );
}

// Component that uses a number flag
function ItemsList() {
    const { value: maxItems } = useFlag('max-items-per-page', 10);

    const items = Array.from({ length: maxItems }, (_, i) => `Item ${i + 1}`);

    return (
        <div style={{ marginBottom: '20px' }}>
            <h3>📋 Items List</h3>
            <p>Showing {maxItems} items (controlled by 'max-items-per-page' number flag):</p>
            <ul style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: '10px',
                listStyle: 'none',
                padding: 0
            }}>
                {items.map((item, index) => (
                    <li key={index} style={{ 
                        background: '#f5f5f5', 
                        padding: '8px', 
                        borderRadius: '3px',
                        textAlign: 'center'
                    }}>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Component that uses an object flag
function UIConfigExample() {
    const { value: uiConfig } = useFlag('ui-config', { 
        showSidebar: false, 
        enableNotifications: true 
    });

    return (
        <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '5px', 
            padding: '15px' 
        }}>
            <h3>⚙️ UI Configuration</h3>
            <p>This configuration is controlled by the 'ui-config' object flag:</p>
            <ul>
                <li>
                    Sidebar: {uiConfig.showSidebar ? '✅ Visible' : '❌ Hidden'}
                </li>
                <li>
                    Notifications: {uiConfig.enableNotifications ? '🔔 Enabled' : '🔕 Disabled'}
                </li>
            </ul>
            <pre style={{ 
                background: '#f8f9fa', 
                padding: '10px', 
                borderRadius: '3px',
                fontSize: '12px'
            }}>
                {JSON.stringify(uiConfig, null, 2)}
            </pre>
        </div>
    );
}

export default App;