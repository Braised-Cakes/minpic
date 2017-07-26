#!/usr/bin/env node

let pkg = require('./package.json');
let minpic = require('./src/index.js')
let program = require('commander');
var fs = require('fs');
program.version(pkg.version);
program.option('-f --force', 'force minify all image');
program.command('add [key]').description('add key').action((key) => {
	minpic.add(key);
});
program.command('remove [key]').description('remove key').action((key) => {
	minpic.remove(key);
});
program.command('list').description('get file content').action(() => {
	minpic.list();
});
program.command('path').description('get file path').action(() => {
	minpic.path();
});
program.arguments('<source> [target]').action((source, target) => {
	minpic.build(source, target);
});
program.parse(process.argv);
if (!program.args.length) {
	minpic.build();
}
module.exports = (source, target) => {
	minpic.build(source, target);
}
