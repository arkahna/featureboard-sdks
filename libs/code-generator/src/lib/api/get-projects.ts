import type { FeatureBoardAuth } from '../queryFeatureBoard'
import { queryFeatureBoard } from '../queryFeatureBoard'

export async function getProjects(apiEndpoint: string, auth: FeatureBoardAuth) {
    return await queryFeatureBoard<{
        projects: Array<{ id: string; name: string }>
    }>(apiEndpoint, 'projects', auth)
}
