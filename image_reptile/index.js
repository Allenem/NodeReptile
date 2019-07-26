// 妹子图网站照片下载

const request = require('request');
const cheerio = require('cheerio');
const async = require('async');
const fs = require('fs');
const iconv = require('iconv-lite');

let itemTitle = [];  // 每组图的名称
let count = 0; // 记录下载的图片组数

init();

// 初始化函数
function init() {
  // 存取所有主页的链接信息
  let linkGroups = [];
  //先生成主页地址链接的数组
  for (var i = 1; i < 2; i++) {
    var obj = {
      url: 'https://www.meizitu.com/a/list_1_' + i + '.html',
      headers: {
        'User-Agent': 'request'
      },
      encoding: null  // 关键代码
    }
    linkGroups.push(obj);
  }
  console.log(linkGroups);
  fetchItem(linkGroups);
}


// 获取每个页面每个项目信息
function fetchItem(linkGroups) {
  // ES2017 async functions
  async.mapLimit(linkGroups, 3, async function (linkGroup) {
    const response = await request(linkGroup, fetchCallback);
    return response.body;
  }, (err, results) => {
    if (err) throw err;
    // results is now an array of the response bodies
    // console.log(results);
    console.log('全部主页检索完毕');

  })
}

// 获取每个页面每个项目信息的回调函数
function fetchCallback(error, response, body) {
  let html = iconv.decode(body, 'gb2312')
  let $ = cheerio.load(html, {decodeEntities: false});  // 解析html
  let itemA = [];  // a标签
  let itemLink = [];  // 每组图的地址
  // let itemTitle = [];  // 每组图的名称
  let item = { itemTitle, itemLink }; // 传出去的每一页组图对象

  // 由于每个li标签中有两个a标签（都一样），所以取0,2,4...个
  $('.wp-list a').toArray().forEach((ele, index) => {
    if (index % 2 == 0) {
      itemA.push(ele);
      itemLink.push(ele.attribs.href);
    }
  })

  // 测试查看属性使用，勿删
  /*
    let attr = [];
    for(let i in itemA[0].attribs){
      attr.push(i);
    }
    console.log(attr);
  */

  let itemNum = itemLink.length;
  console.log('该页有这么多组图：' + itemNum);

  // 获取组名方法1
  // $('.wp-list').find('h3').each(function () {
  //   itemTitle.push($(this).eq(0).text().trim());
  // });

  // 获取组名方法2
  $('.wp-list img').toArray().forEach((ele, index) => {
    let alt = ele.attribs.alt.replace(/<[^>]*>|<\/[^>]*>/g, '');
    itemTitle.push(alt);
  })
  // console.log(item);
  fetchImgPage(item);
}

function makeDir(dir) {
  if(!fs.existsSync('./downloadImg/')){
    fs.mkdirSync('./downloadImg/');
    fs.mkdirSync('./downloadImg/'+count+dir+'/');
  }else{
    if (!fs.existsSync('./downloadImg/'+count+dir+'/')) {
      fs.mkdirSync('./downloadImg/'+count+dir+'/');
      return true;
    } else {
      return true;
    }
    console.log(itemTitle+'文件夹创建失败');
    return false;
  }
}

function fetchImgPage(item) {
  let { itemTitle, itemLink } = item;
  // console.log(itemTitle, itemLink);

  // 存取所有item的链接信息
  let itemGroups = [];
  for (var i = 0; i < itemTitle.length; i++) {
    var obj = {
      url: itemLink[i],
      headers: {
        'User-Agent': 'request'
      },
      encoding: null  // 关键代码
    }
    itemGroups.push(obj);
  }

  async.mapLimit(itemGroups, 3, async function (itemGroup) {
    const response = await request(itemGroup, getImg);
    return response.body;
  }, (err, results) => {
    if (err) throw err;
    // console.log(results);
    console.log('全部item检索完毕');
  });

}

function getImg(error, response, body) {
  let html = iconv.decode(body, 'gb2312')
  let $ = cheerio.load(html, {decodeEntities: false});  // 解析html
  let imgLink = [];  // 每组图的地址
  let imgTitle = [];  // 每组图的名称
  let img = [ imgTitle, imgLink ]; // 传出去的每一页组图对象

  // 获取图片链接，名称
  $('#picture img').toArray().forEach((ele, index) => {
    imgLink.push(ele.attribs.src);
    let alt = ele.attribs.alt.replace(/<[^>]*>|<\/[^>]*>/g, '');
    imgTitle.push(alt);
  })
  // console.log(img);
  downloadImages(img);
}

function downloadImages(img) {
  console.log('第 '+count+' 组图片开始下载 . . .\n');
  for (let i = 0; i < img[0].length; i++) {
    let dir = itemTitle[count];
    let fileLink = img[1][i];
    console.log('图片地址：'+fileLink);
    let temp = img[1][i];
    let arr = temp.split('.');
    let fileSuffix = arr[arr.length-1];
    let fileName = img[0][i] + '.' + fileSuffix;
    makeDir(dir);
    console.log(fileName+' 图片下载中 . . .');
    request(fileLink, {end: false}).pipe(fs.createWriteStream(__dirname+'/downloadImg/'+count+dir+'/'+fileName));
    console.log(fileName+' 图片下载成功 ~\n');
  }
  count++;
}