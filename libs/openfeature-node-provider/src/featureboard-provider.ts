import type { ServerClient } from '@featureboard/node-sdk'
import { createServerClient } from '@featureboard/node-sdk'
import type {
    EvaluationContext,
    FlagValue,
    Hook,
    JsonValue,
    Logger,
    Provider,
    ProviderMetadata,
    ResolutionDetails,
} from '@openfeature/server-sdk'
import {
    ErrorCode,
    OpenFeatureEventEmitter,
    ProviderStatus,
    StandardResolutionReasons,
} from '@openfeature/server-sdk'
import { extractAudiences } from './audience-extractor'
import { debugLog } from './log'
import { mapToFlagValue } from './type-mapper'
import type { FeatureBoardProviderOptions } from './types'

const providerDebug = debugLog.extend('provider')

/**
 * OpenFeature Provider for FeatureBoard.
 *
 * This provider wraps @featureboard/node-sdk to enable FeatureBoard
 * feature flags with the OpenFeature standard.
 *
 * @example
 * ```typescript
 * import { OpenFeature } from '@openfeature/server-sdk'
 * import { FeatureBoardProvider } from '@featureboard/openfeature-node-provider'
 *
 * const provider = new FeatureBoardProvider({
 *   environmentApiKey: 'your-api-key',
 * })
 *
 * await OpenFeature.setProviderAndWait(provider)
 * const client = OpenFeature.getClient()
 *
 * // Use standard OpenFeature API with string flag keys
 * const value = await client.getBooleanValue('my-feature', false, {
 *   targetingKey: 'user-123',
 *   audiences: ['premium', 'org:acme'],
 * })
 * ```
 */
export class FeatureBoardProvider implements Provider {
    public readonly metadata: ProviderMetadata = {
        name: 'FeatureBoard',
    }

    public readonly runsOn = 'server' as const

    /**
     * Event emitter for provider lifecycle events.
     * OpenFeature SDK uses this to listen for READY, ERROR, CONFIGURATION_CHANGED events.
     */
    public readonly events = new OpenFeatureEventEmitter()

    /**
     * Optional hooks for the provider.
     */
    public readonly hooks?: Hook[]

    private serverClient: ServerClient | null = null
    private options: FeatureBoardProviderOptions
    private _status: ProviderStatus = ProviderStatus.NOT_READY

    constructor(options: FeatureBoardProviderOptions) {
        this.options = options
    }

    /**
     * Get the current provider status.
     */
    get status(): ProviderStatus {
        return this._status
    }

    /**
     * Initialize the provider.
     * Called by OpenFeature SDK when provider is set.
     *
     * @param context - Optional initial evaluation context
     */
    async initialize(context?: EvaluationContext): Promise<void> {
        providerDebug('Initializing provider with context: %o', context)

        try {
            this._status = ProviderStatus.NOT_READY

            // Build update strategy configuration
            const updateStrategy = this.buildUpdateStrategy()

            // Create FeatureBoard server client
            // Handle api option: convert string to FeatureBoardApiConfig
            const api =
                typeof this.options.api === 'string'
                    ? { http: this.options.api, ws: this.options.api }
                    : this.options.api
            this.serverClient = createServerClient({
                environmentApiKey: this.options.environmentApiKey,
                api,
                updateStrategy,
                externalStateStore: this.options.externalStateStore,
            })

            // Wait for initial state load
            await this.serverClient.waitForInitialised()

            this._status = ProviderStatus.READY
            providerDebug('Provider initialized successfully')
        } catch (error) {
            this._status = ProviderStatus.ERROR
            providerDebug('Provider initialization failed: %o', error)
            throw error
        }
    }

    /**
     * Called when provider is shut down.
     */
    async onClose(): Promise<void> {
        providerDebug('Closing provider')

        if (this.serverClient) {
            await this.serverClient.close()
            this.serverClient = null
        }
        this._status = ProviderStatus.NOT_READY
    }

    /**
     * Resolve boolean flag value.
     */
    resolveBooleanEvaluation(
        flagKey: string,
        defaultValue: boolean,
        context: EvaluationContext,
        _logger: Logger,
    ): Promise<ResolutionDetails<boolean>> {
        return Promise.resolve(
            this.resolveValue(flagKey, defaultValue, context, 'boolean'),
        )
    }

    /**
     * Resolve string flag value.
     */
    resolveStringEvaluation(
        flagKey: string,
        defaultValue: string,
        context: EvaluationContext,
        _logger: Logger,
    ): Promise<ResolutionDetails<string>> {
        return Promise.resolve(
            this.resolveValue(flagKey, defaultValue, context, 'string'),
        )
    }

    /**
     * Resolve number flag value.
     */
    resolveNumberEvaluation(
        flagKey: string,
        defaultValue: number,
        context: EvaluationContext,
        _logger: Logger,
    ): Promise<ResolutionDetails<number>> {
        return Promise.resolve(
            this.resolveValue(flagKey, defaultValue, context, 'number'),
        )
    }

    /**
     * Resolve object flag value.
     */
    resolveObjectEvaluation<T extends JsonValue>(
        flagKey: string,
        defaultValue: T,
        context: EvaluationContext,
        _logger: Logger,
    ): Promise<ResolutionDetails<T>> {
        return Promise.resolve(
            this.resolveValue(flagKey, defaultValue, context, 'object'),
        )
    }

    /**
     * Build update strategy configuration from provider options.
     */
    private buildUpdateStrategy() {
        const strategyKind = this.options.updateStrategy ?? 'polling'

        switch (strategyKind) {
            case 'polling':
                return {
                    kind: 'polling' as const,
                    intervalMs: this.options.intervalMs,
                }
            case 'on-request':
                return {
                    kind: 'on-request' as const,
                    maxAgeMs: this.options.maxAgeMs,
                }
            case 'manual':
                return {
                    kind: 'manual' as const,
                }
            default:
                return strategyKind
        }
    }

    /**
     * Core resolution logic.
     * Extracts audiences from context, calls FeatureBoard, and maps the result.
     */
    private resolveValue<T extends FlagValue>(
        flagKey: string,
        defaultValue: T,
        context: EvaluationContext,
        expectedType: 'boolean' | 'string' | 'number' | 'object',
    ): ResolutionDetails<T> {
        // Check if provider is ready
        if (!this.serverClient || this._status !== ProviderStatus.READY) {
            providerDebug(
                'Provider not ready, returning default for flag: %s',
                flagKey,
            )
            return {
                value: defaultValue,
                reason: StandardResolutionReasons.ERROR,
                errorCode: ErrorCode.PROVIDER_NOT_READY,
                errorMessage: 'FeatureBoard provider is not ready',
            }
        }

        try {
            // Extract audiences from context using configured mapping
            const audiences = extractAudiences(
                context,
                this.options.audiencePropertyMap,
                this.options.audienceMapper,
            )

            providerDebug(
                'Resolving flag %s with audiences: %o',
                flagKey,
                audiences,
            )

            // Create request-scoped client with audiences
            const client = this.serverClient.request(audiences)

            // Get feature value from FeatureBoard
            // Cast to any for the call since Features interface is empty by default
            // but the runtime accepts any string key
            const value = (
                client.getFeatureValue as (
                    featureKey: string,
                    defaultValue: unknown,
                ) => unknown
            )(flagKey, defaultValue)

            providerDebug('Flag %s resolved to value: %o', flagKey, value)

            // Map to OpenFeature response with type checking
            return mapToFlagValue<T>(value, expectedType, flagKey)
        } catch (error) {
            providerDebug('Error resolving flag %s: %o', flagKey, error)
            return {
                value: defaultValue,
                reason: StandardResolutionReasons.ERROR,
                errorCode: ErrorCode.GENERAL,
                errorMessage: `Error evaluating flag '${flagKey}': ${error}`,
            }
        }
    }
}
