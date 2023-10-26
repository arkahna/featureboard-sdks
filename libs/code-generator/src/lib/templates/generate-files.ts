/* Copied from https://github.com/nrwl/nx/blob/ff04be51885b3ab2f635de6c13f3b29dec1859ba/packages/devkit/src/generators/generate-files.ts with permission from the MIT licence on the 8/8/2023) */
import * as ejs from 'ejs'
import { readFile, readdir, stat } from 'fs/promises'
import * as path from 'path'
import type { Tree } from '../tree/tree'
/**
 * Generates a folder of files based on provided templates.
 *
 * While doing so it performs two substitutions:
 * - Substitutes segments of file names surrounded by __
 * - Uses ejs to substitute values in templates
 *
 * Examples:
 * ```typescript
 * generateFiles(tree, path.join(__dirname , 'files'), './tools/scripts', {tmpl: '', name: 'myscript'})
 * ```
 * This command will take all the files from the `files` directory next to the place where the command is invoked from.
 * It will replace all `__tmpl__` with '' and all `__name__` with 'myscript' in the file names, and will replace all
 * `<%= name %>` with `myscript` in the files themselves.
 * `tmpl: ''` is a common pattern. With it you can name files like this: `index.ts__tmpl__`, so your editor
 * doesn't get confused about incorrect TypeScript files.
 *
 * @param tree - the file system tree
 * @param srcFolder - the source folder of files (absolute path)
 * @param target - the target folder (relative to the tree root)
 * @param substitutions - an object of key-value pairs
 */
export async function generateFiles(
    tree: Tree,
    srcFolder: string,
    target: string,
    substitutions: { [k: string]: any },
): Promise<void> {
    const files = await allFilesInDir(srcFolder)
    if (files.length === 0) {
        throw new Error(
            `generateFiles: No files found in "${srcFolder}". Are you sure you specified the correct path?`,
        )
    } else {
        for (let i = 0; i < files.length; i++) {
            const filePath = files[i]
            let newContent: Buffer | string
            const computedPath = computePath(
                srcFolder,
                target,
                filePath,
                substitutions,
            )

            if (isTemplate(filePath)) {
                const template = await readFile(filePath, 'utf-8')
                try {
                    newContent = ejs.render(template, substitutions, {})
                } catch (e) {
                    console.error(
                        `Error in ${filePath.replace(`${tree.root}/`, '')}:`,
                    )
                    throw e
                }
            } else {
                newContent = await readFile(filePath)
            }
            tree.write(computedPath, newContent)
        }
    }
}

function computePath(
    srcFolder: string,
    target: string,
    filePath: string,
    substitutions: { [k: string]: any },
): string {
    const relativeFromSrcFolder = path.relative(srcFolder, filePath)
    let computedPath = path.join(target, relativeFromSrcFolder)
    if (computedPath.endsWith('.template')) {
        computedPath = computedPath.substring(0, computedPath.length - 9)
    }
    Object.entries(substitutions).forEach(([propertyName, value]) => {
        computedPath = computedPath.split(`__${propertyName}__`).join(value)
    })
    return computedPath
}

async function allFilesInDir(parent: string): Promise<string[]> {
    let res: string[] = []
    try {
        const files = await readdir(parent)
        for (let i = 0; i < files.length; i++) {
            const child = path.join(parent, files[i])
            try {
                const s = await stat(child)
                if (!s.isDirectory()) {
                    res.push(child)
                } else if (s.isDirectory()) {
                    res = [...res, ...(await allFilesInDir(child))]
                }
            } catch {
                /* Ignore errors in getting template files */
            }
        }
    } catch {
        /* Ignore errors in getting template files */
    }
    return res
}

function isTemplate(filePath: string) {
    return filePath.match(/.*\.template/)
}
