# minpic

图片压缩工具

## 描述

tinypng拥有最好的图片无损压缩服务，但官方api较简单，且单账号每月只能免费压缩500张， 该工具可进行批量压缩，并且可以自动切换账号

## 首先

<https://tinypng.com/developers>

使用邮箱创建账号,并获取API KEY

![](https://raw.githubusercontent.com/BraisedCakes/minpic/master/img/QQ20170717-115649@2x.png)

## 安装

```
$ npm install -g minpic

minpic add ...key 添加刚才你注册的API KEY
```

## 基本用法

```
minpic          //压缩当前目录及所有子目录下的所有图片
minpic src     //压缩src目录下的所有图片
```

## 其他用法

```
//.minpic.json 为储存key信息的文件,放置于系统根目录
minpic path         //查看.minpic.json的路径
minpic list         //查看.minpic.json的内容
minpic add ...key   //添加key
minpic remove ...key //删除key
```

## 提示

1. minpic不会压缩.gitignore中设置的目录
2. minpic会在项目根目录下记录压缩信息，不会重复压缩
3. 当前账号压缩达到上限时，minpic会自动切换账号，可申请多个key存储起来
