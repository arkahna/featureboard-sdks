import type { TemplateType } from '@featureboard/code-generator'

export interface CodeGenGeneratorSchema {
    templateType: TemplateType
    projectName: string
    featureBoardProjectName: string
    featureBoardKey: string
    subFolder: string
}
