// eslint-disable-next-line @nx/enforce-module-boundaries
import { TemplateType } from '@featureboard/cli'

export interface CodeGenGeneratorSchema {
    templateType: TemplateType
    projectName: string
    featureBoardprojectName: string
    featureBoardKey: string
    subFolder: string
}
