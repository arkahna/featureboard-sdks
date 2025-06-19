import {
    createBrowserClient,
    type BrowserClient,
    type FeatureBoardClient
} from '@featureboard/js-sdk';
import {
    ErrorCode,
    EvaluationContext,
    JsonValue,
    Logger,
    OpenFeatureEventEmitter,
    Provider,
    ProviderEvents,
    ResolutionDetails,
    StandardResolutionReasons
} from '@openfeature/web-sdk';

export interface FeatureBoardProviderOptions {
    /**
     * The environment API key for your FeatureBoard environment
     */
    environmentApiKey: string;
    
    /**
     * The audiences to use for feature evaluation
     * @default []
     */
    audiences?: string[];
    
    /**
     * Initial values for testing/offline mode
     */
    initialValues?: Array<{ featureKey: string; value: any }>;
    
    /**
     * The update strategy for the FeatureBoard client
     * @default 'polling'
     */
    updateStrategy?: 'manual' | 'polling';
}

/**
 * FeatureBoard OpenFeature Provider for Web SDK
 * 
 * This provider integrates FeatureBoard's feature flag service with OpenFeature's
 * standardized API for web applications.
 */
export class FeatureBoardOpenFeatureProvider implements Provider {
    public readonly runsOn = 'client' as const;
    
    public readonly metadata = {
        name: 'FeatureBoardProvider',
    } as const;

    public readonly events = new OpenFeatureEventEmitter();
    
    private browserClient: BrowserClient;
    private featureBoardClient: FeatureBoardClient;
    private readonly options: FeatureBoardProviderOptions;

    constructor(options: FeatureBoardProviderOptions) {
        this.options = options;
        
        // Initialize the FeatureBoard browser client
        this.browserClient = createBrowserClient({
            environmentApiKey: options.environmentApiKey,
            audiences: options.audiences || [],
            initialValues: options.initialValues,
            updateStrategy: options.updateStrategy || 'polling',
        });
        
        this.featureBoardClient = this.browserClient.client;
        
        // Subscribe to initialization changes to emit provider events
        this.browserClient.subscribeToInitialisedChanged((initialised) => {
            if (initialised) {
                this.events.emit(ProviderEvents.Ready, {
                    providerName: this.metadata.name,
                });
            } else {
                this.events.emit(ProviderEvents.Stale, {
                    providerName: this.metadata.name,
                });
            }
        });
    }

    /**
     * Initialize the provider by waiting for the FeatureBoard client to be ready
     */
    async initialize(context?: EvaluationContext): Promise<void> {
        try {
            await this.browserClient.waitForInitialised();
        } catch (error) {
            this.events.emit(ProviderEvents.Error, {
                providerName: this.metadata.name,
                message: error instanceof Error ? error.message : 'Failed to initialize FeatureBoard client',
            });
            throw error;
        }
    }

    /**
     * Clean up the provider by closing the FeatureBoard client
     */
    async onClose(): Promise<void> {
        await this.browserClient.close();
    }

    /**
     * Handle context changes by updating audiences if needed
     */
    async onContextChange(oldContext: EvaluationContext, newContext: EvaluationContext): Promise<void> {
        // For now, we'll emit a reconciling event but not update audiences
        // In the future, this could map evaluation context to FeatureBoard audiences
        this.events.emit(ProviderEvents.Reconciling, {
            providerName: this.metadata.name,
        });
        
        // TODO: Map evaluation context to FeatureBoard audiences
        // Example: 
        // const audiences = this.mapContextToAudiences(newContext);
        // await this.browserClient.updateAudiences(audiences);
        
        // For now, just emit ready again
        this.events.emit(ProviderEvents.Ready, {
            providerName: this.metadata.name,
        });
    }

    resolveBooleanEvaluation(
        flagKey: string,
        defaultValue: boolean,
        context: EvaluationContext,
        logger: Logger
    ): ResolutionDetails<boolean> {
        try {
            // Use type assertion since FeatureBoard's Features interface is extensible
            const value = (this.featureBoardClient as any).getFeatureValue(flagKey, defaultValue);
            
            if (typeof value !== 'boolean') {
                logger.warn(`Flag ${flagKey} returned non-boolean value: ${value}. Using default.`);
                return {
                    value: defaultValue,
                    reason: StandardResolutionReasons.ERROR,
                    errorCode: ErrorCode.TYPE_MISMATCH,
                };
            }
            
            return {
                value,
                reason: value === defaultValue ? StandardResolutionReasons.DEFAULT : StandardResolutionReasons.TARGETING_MATCH,
            };
        } catch (error) {
            logger.error(`Error evaluating boolean flag ${flagKey}:`, error);
            return {
                value: defaultValue,
                reason: StandardResolutionReasons.ERROR,
                errorCode: ErrorCode.GENERAL,
            };
        }
    }

    resolveStringEvaluation(
        flagKey: string,
        defaultValue: string,
        context: EvaluationContext,
        logger: Logger
    ): ResolutionDetails<string> {
        try {
            // Use type assertion since FeatureBoard's Features interface is extensible
            const value = (this.featureBoardClient as any).getFeatureValue(flagKey, defaultValue);
            
            if (typeof value !== 'string') {
                logger.warn(`Flag ${flagKey} returned non-string value: ${value}. Using default.`);
                return {
                    value: defaultValue,
                    reason: StandardResolutionReasons.ERROR,
                    errorCode: ErrorCode.TYPE_MISMATCH,
                };
            }
            
            return {
                value,
                reason: value === defaultValue ? StandardResolutionReasons.DEFAULT : StandardResolutionReasons.TARGETING_MATCH,
            };
        } catch (error) {
            logger.error(`Error evaluating string flag ${flagKey}:`, error);
            return {
                value: defaultValue,
                reason: StandardResolutionReasons.ERROR,
                errorCode: ErrorCode.GENERAL,
            };
        }
    }

    resolveNumberEvaluation(
        flagKey: string,
        defaultValue: number,
        context: EvaluationContext,
        logger: Logger
    ): ResolutionDetails<number> {
        try {
            // Use type assertion since FeatureBoard's Features interface is extensible
            const value = (this.featureBoardClient as any).getFeatureValue(flagKey, defaultValue);
            
            if (typeof value !== 'number') {
                logger.warn(`Flag ${flagKey} returned non-number value: ${value}. Using default.`);
                return {
                    value: defaultValue,
                    reason: StandardResolutionReasons.ERROR,
                    errorCode: ErrorCode.TYPE_MISMATCH,
                };
            }
            
            return {
                value,
                reason: value === defaultValue ? StandardResolutionReasons.DEFAULT : StandardResolutionReasons.TARGETING_MATCH,
            };
        } catch (error) {
            logger.error(`Error evaluating number flag ${flagKey}:`, error);
            return {
                value: defaultValue,
                reason: StandardResolutionReasons.ERROR,
                errorCode: ErrorCode.GENERAL,
            };
        }
    }

    resolveObjectEvaluation<T extends JsonValue>(
        flagKey: string,
        defaultValue: T,
        context: EvaluationContext,
        logger: Logger
    ): ResolutionDetails<T> {
        try {
            // Use type assertion since FeatureBoard's Features interface is extensible
            const value = (this.featureBoardClient as any).getFeatureValue(flagKey, defaultValue);
            
            // For objects, we need to ensure the value is a valid JSON value
            if (value === null || (typeof value !== 'object' && typeof value !== 'boolean' && typeof value !== 'number' && typeof value !== 'string')) {
                logger.warn(`Flag ${flagKey} returned invalid object value: ${value}. Using default.`);
                return {
                    value: defaultValue,
                    reason: StandardResolutionReasons.ERROR,
                    errorCode: ErrorCode.TYPE_MISMATCH,
                };
            }
            
            return {
                value: value as T,
                reason: value === defaultValue ? StandardResolutionReasons.DEFAULT : StandardResolutionReasons.TARGETING_MATCH,
            };
        } catch (error) {
            logger.error(`Error evaluating object flag ${flagKey}:`, error);
            return {
                value: defaultValue,
                reason: StandardResolutionReasons.ERROR,
                errorCode: ErrorCode.GENERAL,
            };
        }
    }
}