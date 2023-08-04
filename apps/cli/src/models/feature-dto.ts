import type { Static } from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'
import { AudienceExceptionDto } from './audience-exception-dto'
import { DataTypes } from './types/data-types'
import { FeatureValue } from './types/feature-value'

export const FeatureDto = Type.Object({
    key: Type.String(),
    name: Type.String(),
    categoryIds: Type.Array(Type.String(), { minItems: 1 }),
    created: Type.String(),
    description: Type.String(),
    dataType: DataTypes,
    audienceExceptions: Type.Array(AudienceExceptionDto),
    defaultValue: FeatureValue,
})

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type FeatureDto = Static<typeof FeatureDto>
