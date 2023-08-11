/* Copied from https://github.com/nrwl/nx/blob/ff04be51885b3ab2f635de6c13f3b29dec1859ba/packages/nx/src/generators/tree.ts with permission from the MIT licence on the 8/8/2023) */
import {
    Mode,
    chmodSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    statSync,
    unlinkSync,
    writeFileSync,
} from 'fs'
import { dirname, join, relative, sep } from 'path'

/**
 * Options to set when writing a file in the Virtual file system tree.
 */
export interface TreeWriteOptions {
    /**
     * Permission to be granted on the file, given as a string (e.g `755`) or octal integer (e.g `0o755`).
     * The logical OR operator can be used to separate multiple permissions.
     * See https://nodejs.org/api/fs.html#fs_file_modes
     */
    mode?: Mode
}

/**
 * Virtual file system tree.
 */
export interface Tree {
    /**
     * Root of the workspace. All paths are relative to this.
     */
    root: string

    /**
     * Read the contents of a file.
     * @param filePath A path to a file.
     */
    read(filePath: string): Buffer | null

    /**
     * Read the contents of a file as string.
     * @param filePath A path to a file.
     * @param encoding the encoding for the result
     */
    read(filePath: string, encoding: BufferEncoding): string | null

    /**
     * Update the contents of a file or create a new file.
     */
    write(
        filePath: string,
        content: Buffer | string,
        options?: TreeWriteOptions,
    ): void

    /**
     * Check if a file exists.
     */
    exists(filePath: string): boolean

    /**
     * Delete the file.
     */
    delete(filePath: string): void

    /**
     * Rename the file or the folder.
     */
    rename(from: string, to: string): void

    /**
     * Check if this is a file or not.
     */
    isFile(filePath: string): boolean

    /**
     * Returns the list of children of a folder.
     */
    children(dirPath: string): string[]

    /**
     * Returns the list of currently recorded changes.
     */
    listChanges(): FileChange[]
}

/**
 * Description of a file change in the Nx virtual file system/
 */
export interface FileChange {
    /**
     * Path relative to the workspace root
     */
    path: string

    /**
     * Type of change: 'CREATE' | 'DELETE' | 'UPDATE'
     */
    type: 'CREATE' | 'DELETE' | 'UPDATE'

    /**
     * The content of the file or null in case of delete.
     */
    content: Buffer | null
    /**
     * Options to set on the file being created or updated.
     */
    options?: TreeWriteOptions
}

export class FsTree implements Tree {
    private recordedChanges: {
        [path: string]: {
            content: Buffer | null
            isDeleted: boolean
            options?: TreeWriteOptions
        }
    } = {}

    /**
     * Signifies if operations on the tree instance
     * are allowed. Set to false after changes are written
     * to disk, to prevent someone trying to use the tree to update
     * files when the tree is no longer effective.
     */
    private locked = false

    constructor(
        readonly root: string,
        private readonly isVerbose: boolean,
        private readonly logOperationId?: string,
    ) {}

    read(filePath: string): Buffer | null
    read(filePath: string, encoding: BufferEncoding): string | null
    read(filePath: string, encoding?: BufferEncoding): Buffer | string | null {
        filePath = this.normalize(filePath)
        try {
            let content: Buffer
            if (this.recordedChanges[this.rp(filePath)]) {
                content =
                    this.recordedChanges[this.rp(filePath)].content ??
                    Buffer.from('')
            } else {
                content = this.fsReadFile(filePath)
            }

            return encoding ? content.toString(encoding) : content
        } catch (e) {
            if (this.isVerbose) {
                console.error(e)
            }
            return null
        }
    }

    write(
        filePath: string,
        content: Buffer | string,
        options?: TreeWriteOptions,
    ): void {
        this.assertUnlocked()
        filePath = this.normalize(filePath)

        // Remove any recorded changes where a parent directory has been
        // deleted when writing a new file within the directory.
        let parent = dirname(this.rp(filePath))
        while (parent !== '.') {
            if (this.recordedChanges[parent]?.isDeleted) {
                delete this.recordedChanges[parent]
            }
            parent = dirname(parent)
        }

        if (
            this.fsExists(this.rp(filePath)) &&
            Buffer.from(content).equals(this.fsReadFile(filePath))
        ) {
            // Remove recorded change because the file has been restored to it's original contents
            delete this.recordedChanges[this.rp(filePath)]
            return
        }

        try {
            this.recordedChanges[this.rp(filePath)] = {
                content: Buffer.from(content),
                isDeleted: false,
                options,
            }
        } catch (e) {
            if (this.isVerbose) {
                console.error(e)
            }
        }
    }

    overwrite(
        filePath: string,
        content: Buffer | string,
        options?: TreeWriteOptions,
    ): void {
        filePath = this.normalize(filePath)
        this.write(filePath, content, options)
    }

    delete(filePath: string): void {
        this.assertUnlocked()
        filePath = this.normalize(filePath)
        if (this.filesForDir(this.rp(filePath)).length > 0) {
            this.filesForDir(this.rp(filePath)).forEach(
                (f) =>
                    (this.recordedChanges[f] = {
                        content: null,
                        isDeleted: true,
                    }),
            )
        }
        this.recordedChanges[this.rp(filePath)] = {
            content: null,
            isDeleted: true,
        }

        // Delete directory when is not root and there are no children
        if (
            filePath !== '' &&
            this.children(dirname(this.rp(filePath))).length < 1
        ) {
            this.delete(dirname(this.rp(filePath)))
        }
    }

    exists(filePath: string): boolean {
        filePath = this.normalize(filePath)
        try {
            if (this.recordedChanges[this.rp(filePath)]) {
                return !this.recordedChanges[this.rp(filePath)].isDeleted
            } else if (this.filesForDir(this.rp(filePath)).length > 0) {
                return true
            } else {
                return this.fsExists(filePath)
            }
        } catch {
            return false
        }
    }

    rename(from: string, to: string): void {
        this.assertUnlocked()
        from = this.normalize(from)
        to = this.normalize(to)
        if (from === to) {
            return
        }

        if (this.isFile(from)) {
            const content = this.read(this.rp(from))
            this.write(this.rp(to), content ?? Buffer.from(''))
            this.delete(this.rp(from))
        } else {
            for (const child of this.children(from)) {
                this.rename(join(from, child), join(to, child))
            }
        }
    }

    isFile(filePath: string): boolean {
        filePath = this.normalize(filePath)
        try {
            if (this.recordedChanges[this.rp(filePath)]) {
                return !this.recordedChanges[this.rp(filePath)].isDeleted
            } else {
                return this.fsIsFile(filePath)
            }
        } catch {
            return false
        }
    }

    children(dirPath: string): string[] {
        dirPath = this.normalize(dirPath)
        let res = this.fsReadDir(dirPath)

        res = [...res, ...this.directChildrenOfDir(this.rp(dirPath))]
        res = res.filter((q) => {
            const r =
                this.recordedChanges[this.normalize(join(this.rp(dirPath), q))]
            return !r?.isDeleted
        })
        // Dedupe
        return Array.from(new Set(res))
    }

    listChanges(): FileChange[] {
        const res = [] as FileChange[]
        Object.keys(this.recordedChanges).forEach((f) => {
            if (this.recordedChanges[f].isDeleted) {
                if (this.fsExists(f)) {
                    res.push({ path: f, type: 'DELETE', content: null })
                }
            } else {
                if (this.fsExists(f)) {
                    res.push({
                        path: f,
                        type: 'UPDATE',
                        content: this.recordedChanges[f].content,
                        options: this.recordedChanges[f].options,
                    })
                } else {
                    res.push({
                        path: f,
                        type: 'CREATE',
                        content: this.recordedChanges[f].content,
                        options: this.recordedChanges[f].options,
                    })
                }
            }
        })
        return res
    }

    private assertUnlocked() {
        if (this.locked) {
            console.error({
                title: `File changes have already been written to disk. Further changes were attempted ${
                    this.logOperationId
                        ? ` while running ${this.logOperationId}.`
                        : '.'
                }`,
                bodyLines: [
                    'The file system can no longer be modified. This commonly happens when a generator attempts to make further changes in its callback, or an asynchronous operation is still running after the generator completes.',
                ],
            })
            throw new Error('Tree changed after commit to disk.')
        }
    }

    private normalize(path: string) {
        return relative(this.root, join(this.root, path)).split(sep).join('/')
    }

    private fsReadDir(dirPath: string) {
        try {
            return readdirSync(join(this.root, dirPath))
        } catch {
            return []
        }
    }

    private fsIsFile(filePath: string): boolean {
        const stat = statSync(join(this.root, filePath))
        return stat.isFile()
    }

    private fsReadFile(filePath: string): Buffer {
        return readFileSync(join(this.root, filePath))
    }

    private fsExists(filePath: string): boolean {
        try {
            const stat = statSync(join(this.root, filePath))
            return stat.isFile() || stat.isDirectory()
        } catch {
            return false
        }
    }

    private filesForDir(path: string): string[] {
        return Object.keys(this.recordedChanges).filter(
            (f) =>
                f.startsWith(`${path}/`) && !this.recordedChanges[f].isDeleted,
        )
    }

    private directChildrenOfDir(path: string): string[] {
        const res: Record<string, boolean> = {}
        if (path === '') {
            return Object.keys(this.recordedChanges).map(
                (file) => file.split('/')[0],
            )
        }
        Object.keys(this.recordedChanges).forEach((f) => {
            if (f.startsWith(`${path}/`)) {
                // Remove the current folder's path from the directory
                const file = f.substring(path.length + 1)
                // Split the path on segments, and take the first one
                const basePath = file.split('/')[0]
                // Mark it as a child of the current directory
                res[basePath] = true
            }
        })

        return Object.keys(res)
    }

    private rp(pp: string): string {
        return pp.startsWith('/') ? pp.substring(1) : pp
    }
}

export function flushChanges(root: string, fileChanges: FileChange[]): void {
    fileChanges.forEach((f) => {
        const fpath = join(root, f.path)
        if (f.type === 'CREATE') {
            mkdirSync(dirname(fpath), { recursive: true })
            writeFileSync(fpath, f.content ?? Buffer.from('', 'utf8'))
            if (f.options?.mode) chmodSync(fpath, f.options.mode)
        } else if (f.type === 'UPDATE') {
            writeFileSync(fpath, f.content ?? Buffer.from('', 'utf8'))
            if (f.options?.mode) chmodSync(fpath, f.options.mode)
        } else if (f.type === 'DELETE') {
            unlinkSync(fpath)
        }
    })
}

export function printChanges(fileChanges: FileChange[], indent = ''): void {
    fileChanges.forEach((f) => {
        if (f.type === 'CREATE') {
            console.log(`${indent}${console.log('CREATE')} ${f.path}`)
        } else if (f.type === 'UPDATE') {
            console.log(`${indent}${console.log('UPDATE')} ${f.path}`)
        } else if (f.type === 'DELETE') {
            console.log(`${indent}${console.log('DELETE')} ${f.path}`)
        }
    })
}
