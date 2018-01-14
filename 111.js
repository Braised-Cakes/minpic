#!/usr/bin/env node

const fs = require('fs')
const glob = require('glob')
const path = require('path')
const program = require('commander')
const tinify = require("tinify")
const ora = require('ora')
const md5 = require('md5')
const pkg = require('./package.json')
const cwd = process.cwd()
console.log(999)
let minList = []
let bar
let cacheData = []
const keyFilePath = path.resolve(process.env.HOME || process.env.USERPROFILE, '.minpic.json')
let keyFile = {}
let keyIndex = 0
let keyList = []
let compressedNum = 0
const cacheFile = '.minpic.txt'
const spinner = ora(`计算中...`)

function init() {
    if (!fs.existsSync(keyFilePath)) {
        fs.writeFileSync(keyFilePath, JSON.stringify({
            now: '',
            list: []
        }, null, 4), 'utf-8')
    }

    keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf-8'))
    const key = keyFile.now || keyFile.list[0]
    keyIndex = keyFile.list.indexOf(key)
    keyList.push(keyIndex)
    if (!key) {
        return false;
    }

    tinify.key = key

    //缓存文件存在， 就获取缓存内容，否则就创建文件
    if (!fs.existsSync(path.resolve(cwd, cacheFile))) {
        fs.writeFileSync(cacheFile, '', 'utf-8')
    } else {
        cacheData = fs.readFileSync(path.resolve(cwd, cacheFile), 'utf-8').split('\n')
    }
}




program.version(pkg.version)
program.option('-f --force', 'force minify all image')
program.option('-o, --output', 'output fule')
program.arguments('<source> [target]').action((source, target) => {
    // console.log(source, target)
    // console.log(program.force)
    // return
    init()
    //判断文件or文件夹是否存在
    source = path.resolve(source)

    fs.accessSync(source)

    //获取图片列表
    minList = glob.sync(path.resolve(source, '**/*.@(jpg|png|jpeg)'), {
        ignore: [path.resolve(cwd, 'node_modules/**')]
    })

    minList = minList.map((item) => {
        return {
            source: item,
            target: item,
            keyIndex: keyIndex
        }
    })
    // 筛选出没有压缩过的图片
    minList = minList.filter(item => {
        return program.force || !isCompressed(item.source)
    })
    
    if (minList.length == 0) {
        console.log('没有需要压缩的图片')
        return
    }

    spinner.start()
    spinner.text = `共${minList.length}张图片，已压缩${compressedNum}张`
    minList.forEach((item, index) => {
        toCompress(item)
    })
})

/**
 * 更换key
 * @return {Boolean} true : 没有可更换的了
 */
function changeKey(item) {
    const newIndex = keyFile.list.indexOf(keyFile.list[item.keyIndex + 1] || keyFile.list[0])
    if (keyList.length == keyFile.list.length && newIndex == keyList[0]) {
        return true
    }
    if (keyList.indexOf(newIndex) != -1) {
        return false
    }
    keyList.push(newIndex)
    keyFile.now = keyFile.list[keyIndex + 1] || keyFile.list[0]
    item.keyIndex = keyIndex = newIndex
    fs.writeFileSync(keyFilePath, JSON.stringify(keyFile, null, 4));
    tinify.key = keyFile.now
}

/**
 * 压缩指定图片
 * @param {Object}
 */
function toCompress(item) {
    let image = tinify.fromFile(item.source)
    image.toFile(item.target, err => {
        if (err && err.status == 429) {
            if (changeKey(item)) {
                error()
            }
            toCompress(item)
        } else {
            spinner.text = `共${minList.length}张图片，已压缩${++compressedNum}张`
            fs.appendFileSync(path.resolve(process.cwd(), '.minpic.txt'), '\n' + md5(fs.readFileSync(item.source)))
            if (compressedNum == minList.length) {
                success()
            }
        }
    })
}

/**
 * 判断某图片是否被压缩过
 * @param  {String}  path 文件路径
 * @return {Boolean}
 */
function isCompressed(path) {
    return cacheData.includes(md5(fs.readFileSync(path)))
}

/**
 * 压缩完成
 */
function success() {
    spinner.stop()
    console.log('压缩完成')
}

/**
 * 压缩失败
 */
function error() {
    console.log('所有账号均超出限制，请添加新账号')
    process.exit(1)
    spinner.stop()
}

program.parse(process.argv)