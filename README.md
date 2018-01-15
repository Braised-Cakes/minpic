# minpic

图片压缩工具

## Description

tinypng拥有最好的图片无损压缩服务，但官方api较简单，只能压缩单个图片，且单账号每月只能免费压缩500张，该工具可进行批量压缩，并且超出500张后自动切换账号。

该工具更适合团队使用，可将minpic集成到团队内部的构建工具中，团队注册并共享多个账号，代码发布前进行图片压缩，优化前端性能。


## First

<https://tinypng.com/developers>

使用邮箱创建账号,并获取API KEY

## Install

```
$ npm install minpic --save-dev

```

## Usage(webpack)

```javascript
const minpic = require('minpic');

const webpackConfig = {
    plugins: [
        new minpic()
    ]
}
```
### Options

* `disabled` 禁用， 默认 false
* `keyFilePath` 存放key的文件路径，默认系统根目录/.minpic.json
* `cacheFilePath` 存放图片压缩信息的文件路径，默认项目根目录/.minpic.txt
* `force`是否强制压缩图片，默认false

### Callback
* `init` 项目启动时的初始化方法
* `completeOnce({now, all})` 每当图片压缩完成一次后，就会调用一次
* `success` 所有图片压缩完成后调用
* `error` 所有key都达到上限后调用该方法

## Tips

1. minpic不会压缩.gitignore中设置的目录
2. minpic会记录压缩信息，不会重复压缩
3. 当前账号压缩达到上限时，minpic会自动切换账号

