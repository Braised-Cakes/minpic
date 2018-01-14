#!/usr/bin/env node

const Minpic = require('./index')
const program = require('commander')
program.option('-f --force', 'force minify all image')
program.option('-o, --output', 'output fule')

program.arguments('<source> [target]').action((source, target) => {
    new Minpic({
        init(){
            console.log(123)
        }
    })
})


program.parse(process.argv)
