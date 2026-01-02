import type { FlagValue, ResolutionDetails } from '@openfeature/server-sdk'
import { ErrorCode, StandardResolutionReasons } from '@openfeature/server-sdk'

/**
 * Map FeatureBoard value to OpenFeature ResolutionDetails with type validation.
 *
 * @param value - The raw value from FeatureBoard
 * @param expectedType - The type expected by the OpenFeature evaluation method
 * @param flagKey - The feature flag key (for error messages)
 * @returns ResolutionDetails with value and appropriate reason/error codes
 */
export function mapToFlagValue<T extends FlagValue>(
    value: unknown,
    expectedType: 'boolean' | 'string' | 'number' | 'object',
    flagKey: string,
): ResolutionDetails<T> {
    // Handle undefined/null - return with DEFAULT reason
    if (value === undefined || value === null) {
        return {
            value: value as T,
            reason: StandardResolutionReasons.DEFAULT,
        }
    }

    // Type validation
    const actualType = typeof value

    if (expectedType === 'object') {
        // For objects, check if it's actually an object (and not null)
        if (typeof value === 'object') {
            return {
                value: value as T,
                reason: StandardResolutionReasons.TARGETING_MATCH,
            }
        }

        // FeatureBoard stores complex values as JSON strings - try to parse
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value)
                if (typeof parsed === 'object' && parsed !== null) {
                    return {
                        value: parsed as T,
                        reason: StandardResolutionReasons.TARGETING_MATCH,
                    }
                }
            } catch {
                // Not valid JSON, fall through to type mismatch
            }
        }
    } else if (actualType === expectedType) {
        // Primitive types match directly
        return {
            value: value as T,
            reason: StandardResolutionReasons.TARGETING_MATCH,
        }
    }

    // Type mismatch - return value but include error information
    return {
        value: value as T,
        errorCode: ErrorCode.TYPE_MISMATCH,
        errorMessage: `Flag '${flagKey}' expected type '${expectedType}' but got '${actualType}'`,
        reason: StandardResolutionReasons.ERROR,
    }
}
