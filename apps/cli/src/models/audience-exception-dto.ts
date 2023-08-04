import type { Static } from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'
import { FeatureValue } from './types/feature-value'

export const AudienceExceptionDto = Type.Object({
    audienceId: Type.String(),
    value: FeatureValue,
})
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AudienceExceptionDto = Static<typeof AudienceExceptionDto>
