#!/usr/bin/env node

const Minpic = require('./index')
const program = require('commander')
const ora = require('ora')

program.option('-f --force', 'force minify all image')

program.parse(process.argv)
const spinner = ora(`计算中...`)

new Minpic({
    shell : true,
    force : program.force,
    init(){
        spinner.start()
    },
    completeOnce({now, all}){
        spinner.text = `共${all}张图片，已压缩${now}张`
    },
    success(){
        spinner.text = `压缩完成`
        spinner.stop()
    },
    error(){
        console.log('所有账号均上限')
        spinner.stop()
    }
})