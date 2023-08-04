import type { Static } from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'

export const EnvironmentDto = Type.Object({
    id: Type.String(),
    name: Type.String(),
    availableFeatures: Type.Array(Type.String()),
})
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type EnvironmentDto = Static<typeof EnvironmentDto>
