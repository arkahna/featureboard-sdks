// eslint-disable-next-line @nx/enforce-module-boundaries
import { TemplateType } from '@featureboard/cli'

export interface CodeGenGeneratorSchema {
    templateType: TemplateType
    projectName: string
    featureBoardProjectName: string
    featureBoardKey: string
    subFolder: string
}
