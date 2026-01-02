import type {
    ExternalStateStore,
    FeatureBoardApiConfig,
} from '@featureboard/node-sdk'
import type { EvaluationContext } from '@openfeature/server-sdk'

/**
 * Property mapping configuration.
 * Maps OpenFeature context properties to FeatureBoard audience strings.
 *
 * @example
 * ```typescript
 * const propertyMap: PropertyMapping = {
 *   // Template: replace {value} with the property value
 *   organizationId: 'org:{value}',
 *   // Function: custom logic for complex mappings
 *   isPremium: (value) => value ? 'premium' : null,
 * }
 * ```
 */
export type PropertyMapping = {
    [contextProperty: string]:
        | string // Template: 'org:{value}' - {value} is replaced with actual value
        | ((value: unknown) => string | null) // Function: custom logic, return null to exclude
}

/**
 * Configuration options for FeatureBoard Provider.
 */
export interface FeatureBoardProviderOptions {
    /**
     * FeatureBoard environment API key.
     */
    environmentApiKey: string

    /**
     * Update strategy for feature state.
     *
     * - `manual` - Will not proactively update, call updateFeatures() manually
     * - `polling` - Checks with FeatureBoard service at configured interval (default 30s)
     * - `on-request` - Checks for updates on every request
     *
     * Note: 'live' (WebSocket) strategy is currently disabled in node-sdk.
     *
     * @default 'polling'
     */
    updateStrategy?: 'manual' | 'polling' | 'on-request'

    /**
     * Update interval in milliseconds (for polling strategy).
     * @default 30000
     */
    intervalMs?: number

    /**
     * Max age in milliseconds before checking for updates (for on-request strategy).
     * @default 30000
     */
    maxAgeMs?: number

    /**
     * External state store for fallback initialization.
     * Used if FeatureBoard API is unavailable during startup.
     */
    externalStateStore?: ExternalStateStore

    /**
     * API endpoint configuration (optional, uses default FeatureBoard endpoint).
     * Can be a string URL or a FeatureBoardApiConfig object.
     */
    api?: FeatureBoardApiConfig | string

    /**
     * Map context properties to audience strings (declarative approach).
     *
     * Use template strings with `{value}` placeholder or functions for custom logic.
     * Takes precedence over default mappings but can be overridden by audienceMapper.
     *
     * @example
     * ```typescript
     * {
     *   // Template: context.organizationId='acme' → 'org:acme'
     *   organizationId: 'org:{value}',
     *
     *   // Direct value: context.tier='premium' → 'premium'
     *   tier: '{value}',
     *
     *   // Function: custom logic
     *   isPremium: (v) => v ? 'premium' : null,
     * }
     * ```
     */
    audiencePropertyMap?: PropertyMapping

    /**
     * Custom function for complete control over audience extraction.
     * Overrides both audiencePropertyMap and default mappings.
     *
     * Use when you need complex logic beyond simple property mapping.
     *
     * @example
     * ```typescript
     * audienceMapper: (context) => {
     *   const audiences: string[] = []
     *   if (context.targetingKey) audiences.push(context.targetingKey)
     *   if (context.organization) audiences.push(`org:${context.organization}`)
     *   if (context.roles) {
     *     for (const role of context.roles as string[]) {
     *       audiences.push(`role:${role}`)
     *     }
     *   }
     *   return audiences
     * }
     * ```
     */
    audienceMapper?: (context: EvaluationContext) => string[]
}

/**
 * Metadata for FeatureBoard Provider.
 */
export interface FeatureBoardProviderMetadata {
    readonly name: 'FeatureBoard'
}
