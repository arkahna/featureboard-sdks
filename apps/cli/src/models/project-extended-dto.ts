import { Static, Type } from '@sinclair/typebox'
import { AudienceDto } from './audience-dto'
import { EnvironmentDto } from './environment-dto'
import { FeatureDto } from './feature-dto'

export const ProjectExtendedDto = Type.Object({
    id: Type.String(),
    name: Type.String(),
    created: Type.Optional(Type.String()),
    environments: Type.Array(EnvironmentDto),
    features: Type.Array(FeatureDto),
    audiences: Type.Array(AudienceDto),
})
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ProjectExtendedDto = Static<typeof ProjectExtendedDto>
