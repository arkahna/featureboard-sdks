import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree, readProjectConfiguration } from '@nx/devkit'

import { codeGenGenerator } from './generator'
import { CodeGenGeneratorSchema } from './schema'

describe('code-gen generator', () => {
    let tree: Tree
    const options: CodeGenGeneratorSchema = { name: 'test' }

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace()
    })

    it('should run successfully', async () => {
        await codeGenGenerator(tree, options)
        const config = readProjectConfiguration(tree, 'test')
        expect(config).toBeDefined()
    })
})
