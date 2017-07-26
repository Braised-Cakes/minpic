const crypto = require('crypto')
const fs = require('fs')
const glob = require('glob')
const program = require('commander');
const path = require('path')
const tinify = require("tinify")
const md5 = require('md5')
const ProgressBar = require('progress')
const readChunk = require('read-chunk');
const fileType = require('file-type');
let cwd = process.cwd();
let json = {}
let cacheData = []
let bar;
const LOCALPATH = process.env.HOME || process.env.USERPROFILE; //本地根目录
let FILENAME = LOCALPATH + '/' + '.minpic.json';
/**
 *
 * @return {Boolean} [description]
 */
function create() {
	if (!fs.existsSync(FILENAME)) {
		fs.writeFileSync(FILENAME, JSON.stringify({
			key: '',
			keylist: []
		}, null, 4), 'utf-8')
	}
	json = JSON.parse(fs.readFileSync(FILENAME, 'utf-8'))
	let key = json.key || json.keylist[0]
	if (!key) {
		return false;
	}
	tinify.key = key
	return true
}
//压缩图片
function zip(item) {
	let image = tinify.fromFile(item.from)
	image.toFile(item.to, (rs) => {
		if (rs && /limit/.test(rs.message)) {
			//需要切换账号
			console.log(rs)
		} else if (!rs) {
			//添加md5信息
			fs.appendFileSync(path.resolve(cwd, '.minpic.txt'), '\n' + md5(fs.readFileSync(item.to)))
			bar.tick()
		}
	})
}
/**
 * 该图片是否被压缩过
 * @param  {String}  path 文件路径
 * @return {Boolean}
 */
function isMinify(path) {
	return cacheData.includes(md5(fs.readFileSync(path)))
}
module.exports.list = () => {
	create()
	console.log(JSON.parse(fs.readFileSync(FILENAME, 'utf-8')))
}
module.exports.add = (key) => {
	create()
	if (!key) {
		console.log('您忘填key啦')
	} else if (json.keylist.indexOf(key) != -1) {
		console.log('已存在此key');
	} else {
		json.keylist.push(key);
		fs.writeFileSync(FILENAME, JSON.stringify(json, null, 4));
		console.log('添加成功');
	}
}
module.exports.remove = (key) => {
	create()
	let pos = json.keylist.indexOf(key);
	if (pos == -1) {
		console.log('不存在此key')
		return;
	}
	json.keylist.splice(pos, 1);
	fs.writeFileSync(FILENAME, JSON.stringify(json, null, 4));
	console.log('删除成功');
}
module.exports.path = (key) => {
	console.log(FILENAME)
}
module.exports.build = () => {
	if (!create()) {
		console.log('请添加key')
		return
	}
	//缓存文件存在， 就获取缓存内容，否则就创建文件
	if (!fs.existsSync(path.resolve(cwd, '.minpic.txt'))) {
		fs.writeFileSync('.minpic.txt', '', 'utf-8')
	} else {
		cacheData = fs.readFileSync(path.resolve(cwd, '.minpic.txt'), 'utf-8').split('\n')
	}
	const list = glob.sync(path.resolve(cwd, '**/*.@(jpg|png|jpeg)'))
	list.forEach((item, index) => {
		list[index] = {
			from: item,
			to: item
		}
	})
	//去除不需要压缩的文件
	for (let i = list.length - 1; i >= 0; i--) {
		let item = list[i]
		if (!program.force && isMinify(item.from)) {
			list.splice(i, 1)
		} else {
			//获取文件真正的类型
			const type = fileType(readChunk.sync(item.from, 0, 4100))
			if (!type || !/png|jpg/.test(type.ext)) {
				list.splice(i, 1)
			}
		}
	}
	if (list.length == 0) {
		console.log('没有需要压缩的图片')
	}
	bar = new ProgressBar(':bar 共' + list.length + '张, 已压缩:current张', {
		total: list.length,
		width: 100
	});
	for (let i = 0; i < list.length; i++) {
		let item = list[i]
		zip(item)
	}
}
