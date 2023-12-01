import { queryFeatureBoard, type FeatureBoardAuth } from '../queryFeatureBoard'

export async function getProjectFeatures(
    apiEndpoint: string,
    project: { id: string },
    auth: FeatureBoardAuth,
) {
    return await queryFeatureBoard<{
        features: FeatureBoardFeature[]
    }>(apiEndpoint, `projects/${project.id}/features`, auth)
}

export interface FeatureBoardProject {
    id: string
    name: string
}
export interface FeatureBoardFeature {
    name: string
    created: string
    key: string
    categoryIds: string[]
    description: string
    dataType:
        | {
              kind: 'boolean'
          }
        | {
              kind: 'number'
          }
        | {
              kind: 'string'
          }
        | {
              kind: 'options'
              options: string[]
          }
    audienceExceptions: {
        audienceId: string
        value: string | number | boolean
    }[]
    defaultValue: string | number | boolean
}
