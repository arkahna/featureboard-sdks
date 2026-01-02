import type { EvaluationContext } from '@openfeature/server-sdk'
import { debugLog } from './log'
import type { PropertyMapping } from './types'

const audienceExtractorDebug = debugLog.extend('audience-extractor')

/**
 * Default property mappings - sensible conventions for common context properties.
 */
const DEFAULT_MAPPINGS: PropertyMapping = {
    userId: 'user:{value}',
    organizationId: 'org:{value}',
    teamId: 'team:{value}',
    role: 'role:{value}',
    tier: 'tier:{value}',
    segment: 'segment:{value}',
}

/**
 * Apply a template string by replacing {value} with the actual value.
 */
function applyTemplate(template: string, value: string | number): string {
    return template.replace('{value}', String(value))
}

/**
 * Extract audiences from OpenFeature EvaluationContext.
 *
 * Priority order (highest to lowest):
 * 1. Custom mapper function - Full control over audience extraction
 * 2. Explicit audiences array - Direct pass-through from context.audiences
 * 3. User-provided property map - Configurable property-to-audience mapping
 * 4. Default property mappings - Sensible defaults for common properties
 *
 * @param context - OpenFeature EvaluationContext with user/request attributes
 * @param propertyMap - Optional custom property-to-audience mappings
 * @param customMapper - Optional function for complete control over extraction
 * @returns Array of audience strings for FeatureBoard
 */
export function extractAudiences(
    context: EvaluationContext,
    propertyMap?: PropertyMapping,
    customMapper?: (ctx: EvaluationContext) => string[],
): string[] {
    // Strategy 1: Custom mapper function (HIGHEST PRIORITY - full control)
    if (customMapper) {
        const audiences = customMapper(context)
        audienceExtractorDebug(
            'Using custom mapper, extracted audiences: %o',
            audiences,
        )
        return audiences
    }

    // Strategy 2: Explicit audiences array (CLEAR - direct pass-through)
    if (context.audiences && Array.isArray(context.audiences)) {
        audienceExtractorDebug(
            'Using explicit audiences from context: %o',
            context.audiences,
        )
        return context.audiences as string[]
    }

    const audiences: string[] = []

    // Strategy 3: User-provided property map (CONFIGURABLE)
    if (propertyMap) {
        for (const [property, mapping] of Object.entries(propertyMap)) {
            const value = context[property]
            if (value === undefined || value === null) continue

            let audience: string | null = null

            if (typeof mapping === 'function') {
                // Function mapping: custom logic
                audience = mapping(value)
            } else if (typeof mapping === 'string') {
                // Template mapping: replace {value}
                if (typeof value === 'string' || typeof value === 'number') {
                    audience = applyTemplate(mapping, value)
                }
            }

            if (audience) {
                audiences.push(audience)
            }
        }

        audienceExtractorDebug(
            'Using property map, extracted audiences: %o',
            audiences,
        )
        return audiences
    }

    // Strategy 4: Default property mapping (FALLBACK - sensible defaults)

    // Include targetingKey as-is (OpenFeature standard property)
    if (context.targetingKey) {
        audiences.push(context.targetingKey)
    }

    // Apply default mappings for common properties
    for (const [property, template] of Object.entries(DEFAULT_MAPPINGS)) {
        const value = context[property]
        if (
            value !== undefined &&
            value !== null &&
            (typeof value === 'string' || typeof value === 'number')
        ) {
            audiences.push(applyTemplate(template as string, value))
        }
    }

    audienceExtractorDebug(
        'Using default mappings, extracted audiences: %o',
        audiences,
    )
    return audiences
}
