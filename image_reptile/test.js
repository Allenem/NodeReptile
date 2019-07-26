// 测试该网站图片是否反爬虫

const request = require('request');
const fs = require('fs');

request('http://t1.hxzdhn.com/uploads/tu/201906/9999/00d0077c39.jpg').pipe(fs.createWriteStream(__dirname+'/downloadImg/'+'test.jpg'));