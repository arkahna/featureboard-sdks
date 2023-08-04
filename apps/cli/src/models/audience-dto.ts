import type { Static } from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'

export const AudienceDto = Type.Object({
    id: Type.String(),
    categoryId: Type.String(),
    key: Type.String(),
    name: Type.String(),
    description: Type.String(),
})
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AudienceDto = Static<typeof AudienceDto>
