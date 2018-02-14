const fs = require('fs')
const glob = require('glob')
const path = require('path')
const tinify = require("tinify")
const md5 = require('md5')
const util = require('util')
const cwd = process.cwd()
let minList = [] //需要压缩的图片列表
let cacheData = [] //存储压缩信息md5的列表
let keyFile = {} //key文件的json格式化
let keyIndex = 0 //当前用的key在keyFile中的位置
let usedkeyIndexList = [] //此次压缩过程中，使用到的key的索引的集合
let compressedNum = 0 //压缩过的图片数量
let firstEmit = true
let webpackCallback = null
class Minpic {

    constructor(options = {}) {
        let defaults = {
            disabled: false, //是否禁止启用
            keyFilePath: path.resolve(process.env.HOME || process.env.USERPROFILE, '.minpic.json'), //存储key的文件路径
            cacheFilePath: path.resolve(cwd, '.minpic.txt'), //存储压缩信息的文件路径
            force: false, //是否强制压缩
            source: '', //压缩哪个目录下的
            shell : false,  //命令行启动
            init() {},
            completeOnce() {},
            success() {},
            error() {}
        }

        for (let attr in defaults) {
            if (typeof options[attr] === 'undefined') {
                options[attr] = defaults[attr]
            }
        }

        this.options = options

        if(this.options.shell){
            this.first()
        }
        
    }

    first(){
        if (this.options.disabled) {
            return true
        }
        this.options.init()
        this.init()
        this.build()
    }

    apply(compiler) {
        if (this.options.disabled) {
            return true
        }
        compiler.plugin("emit", (compilation, callback) => {
            webpackCallback = callback
            if (firstEmit) {
                this.options.init()
                this.init()
                this.build()
                firstEmit = false
            } else {
                callback()
            }
        })
    }

    /**
     * 初始化
     */
    init() {
        // 如果key文件不存在，则生成
        if (!fs.existsSync(this.options.keyFilePath)) {
            fs.writeFileSync(this.options.keyFilePath, JSON.stringify({
                now: '',
                list: []
            }, null, 4), 'utf-8')
        }
        keyFile = JSON.parse(fs.readFileSync(this.options.keyFilePath, 'utf-8'))
        const key = keyFile.now || keyFile.list[0]
        keyIndex = keyFile.list.indexOf(key)
        usedkeyIndexList.push(keyIndex)
        if (!key) {
            return false;
        }
        tinify.key = key
            //缓存文件存在， 就获取缓存内容，否则就创建文件
        if (!fs.existsSync(this.options.cacheFilePath)) {
            fs.writeFileSync(this.options.cacheFilePath, '', 'utf-8')
        } else {
            cacheData = fs.readFileSync(path.resolve(cwd, this.options.cacheFilePath), 'utf-8').split('\n')
        }
    }

    /**
     * 
     * @param {*} source 
     * @param {*} target
     */
    build() {
        let source = path.resolve(this.options.source)
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

        // 筛选出需要压缩的图片
        minList = minList.filter(item => {
            return this.options.force || !this.isCompressed(item.source)
        })

        if (minList.length == 0) {
            this.success()
            return
        }
        minList.forEach((item, index) => {
            this.toCompress(item)
        })
    }

    /**
     * 改变tinypng的key
     * @param {Object} item 
     */
    changeKey(item) {
        const newIndex = keyFile.list.indexOf(keyFile.list[item.keyIndex + 1] || keyFile.list[0])
        if (usedkeyIndexList.length == keyFile.list.length && newIndex == usedkeyIndexList[0]) {
            return true
        }
        if (usedkeyIndexList.indexOf(newIndex) != -1) {
            return false
        }
        usedkeyIndexList.push(newIndex)
        keyFile.now = keyFile.list[keyIndex + 1] || keyFile.list[0]
        item.keyIndex = keyIndex = newIndex
        fs.writeFileSync(this.options.keyFilePath, JSON.stringify(keyFile, null, 4));
        tinify.key = keyFile.now
    }

    /**
     * 压缩图片
     * @param {Object} item
     */
    toCompress(item) {
        let image = tinify.fromFile(item.source)
        image.toFile(item.target, err => {
            if (err && err.status == 429) {
                if (this.changeKey(item)) {
                    this.error()
                }
                this.toCompress(item)
            } else {
                ++compressedNum
                fs.appendFileSync(this.options.cacheFilePath, '\n' + md5(fs.readFileSync(item.source)))
                this.options.completeOnce({
                    now: compressedNum,
                    all: minList.length
                })
                console.log(compressedNum, minList.length)
                if (compressedNum == minList.length) {
                    this.success()
                }
            }
        })
    }

    /**
     * 判断是否被压缩过
     * @param   {String}  path 
     * @returns {Boolean}
     */
    isCompressed(path) {
        return cacheData.includes(md5(fs.readFileSync(path)))
    }

    success() {
        webpackCallback && webpackCallback()
        this.options.success()
    }

    error() {
        webpackCallback && webpackCallback()
        this.options.error()
    }
}

module.exports = Minpic;
