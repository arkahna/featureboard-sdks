#!/usr/bin/env node

import { Command } from '@commander-js/extra-typings'
import fs from 'fs'
import path from 'path'
import { accountCommand } from './commands/account'
import { codeGenCommand } from './commands/code-gen'
import { loginCommand } from './commands/login'
import { selectOrganizationCommand } from './commands/select-organization'
import { titleText } from './lib/title-text'

// dynamically load package.json using fs
const packageJson: { version: string } = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'),
)

const program = new Command()
    .description('A CLI tool to interact with FeatureBoard')
    .version(packageJson.version)
    .addCommand(codeGenCommand())
    .addCommand(loginCommand())
    .addCommand(selectOrganizationCommand())
    .addCommand(accountCommand())
    .action(() => {
        console.log(titleText)
        program.help()
    })

program.parse()
