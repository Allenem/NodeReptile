// 唯一图库照片下载

const request = require('request');
const requests = require('sync-request');
const cheerio = require('cheerio');
const async = require('async');
const fs = require('fs');
const iconv = require('iconv-lite');

let itemTitle = [];  // 每组图的名称
let count = 0; // 记录下载的图片组数
let pages = 1; // 记录每组图片的页码总数

init();

// 初始化函数
function init() {
  // 存取所有主页的链接信息
  let linkGroups = [];
  //先生成主页地址链接的数组
  for (let i = 2; i < 3; i++) {
    let obj = {
      url: 'http://www.mmonly.cc/ktmh/dmmn/list_29_' + i + '.html',
      headers: {
        'User-Agent': 'request'
      },
      encoding: null  // 关键代码
    }
    linkGroups.push(obj);
  }
  // console.log(linkGroups);
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
  let item = { itemTitle, itemLink }; // 传出去的每一页组图对象

  // 由于每个li标签中有两个a标签（都一样），所以取0,2,4...个
  $('.item_list a').toArray().forEach((ele, index) => {
    if (index % 4 == 0) {
      itemA.push(ele);
      itemLink.push(ele.attribs.href);
    }
  })
  // console.log(itemLink);

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

  // 获取组名方法2
  $('.item_list img').toArray().forEach((ele, index) => {
    let alt = ele.attribs.alt.replace(/<[^>]*>|<\/[^>]*>/g, '');
    itemTitle.push(alt);
  })
  // console.log(item);
  fetchImgPage(item);
}

function fetchImgPage(item) {
  let { itemTitle, itemLink } = item;

  // 存取所有item的链接信息
  let itemGroups = [];
  for (let i = 0; i < itemTitle.length; i++) {
    let obj = {
      url: itemLink[i],
      headers: {
        'User-Agent': 'request'
      },
      encoding: null  // 关键代码
    }
    itemGroups.push(obj);
    let html = requests('GET', itemGroups[i].url).getBody().toString(); 
    getPages(html);
    getImgUrl(itemGroups[i].url);
  }
}

// 获取图集总共的页码，执行图集个数次
function getPages(html) {
  let $ = cheerio.load(html, {decodeEntities: false});  // 解析html
  pages = (($('.pages li').length-3)<1)?1:($('.pages li').length-3);
  // console.log(pages);
}

// 获取每个图集所有图片名称，地址，执行图集个数次
function getImgUrl(url){
  let urls = [];
  // let imgAllofGroup = []; // 存放每组中所有图片信息，emmmm没用到
  baseUrl = url.replace('.html','');
  // console.log(baseUrl);
  for (var i = 1; i < (pages+1); i++) {
    var tmp =  (i==1)?(baseUrl + '.html'):(baseUrl + '_'+i+'.html');
    urls.push(tmp);
  }
  // console.log(urls); // 每个变量urls存一组图片网页地址

  // 存取所有item的链接信息
  let urlGroups = [];
  for (var i = 0; i < urls.length; i++) {
      var obj = {
        url: urls[i],
        headers: {
          'User-Agent': 'request'
        },
        encoding: null  // 关键代码
      }
      urlGroups.push(obj);
  }
  
  // 异步函数，获取一组中所有图片src
  async.mapLimit(urlGroups, 3, async function (urlGroup) {
    const response = await request(urlGroup, getImg);
    return response.body;
  }, (err, results) => {
    if (err) throw err;
    // console.log(results);
    console.log('该组图片的全部url检索完毕');
  });

  /*
  // 想同步来着，就可以分文件夹了，但是汉字乱码 T^T
  for (var i = 0; i < urls.length; i++) {

    let imgLink = [];  // 每组图的地址
    let imgTitle = [];  // 每组图的名称
    let img = [ imgTitle, imgLink ]; // 传出去的每一页组图对象

    let html = requests('GET', urls[i]).getBody().toString(); 
    let $ = cheerio.load(html, {decodeEntities: false});  // 解析html

    // 获取图片链接，名称
    $('#big-pic img').toArray().forEach((ele, index) => {
      imgLink.push(ele.attribs.src);
      let alt = ele.attribs.alt.replace(/<[^>]*>|<\/[^>]*>/g, '');
      imgTitle.push(alt);
    })
    // console.log(img.toString()); // 实际一页只有一张图
    imgAllofGroup.push(img.toString().split(','));
  }
  imgAllofGroup = imgAllofGroup.toString().split(',')
  console.log(imgAllofGroup); // 可惜乱码 ε(┬┬﹏┬┬)3 
  downloadImages(imgAllofGroup)
  count++;
  */

}

function getImg(error, response, body) {
  let html = iconv.decode(body, 'gb2312');
  let $ = cheerio.load(html, {decodeEntities: false});  // 解析html
  let imgLink = [];  // 每组图的地址
  let imgTitle = [];  // 每组图的名称
  let img = [ imgTitle, imgLink ]; // 传出去的每一页组图对象

  // 获取图片链接，名称
  $('#big-pic img').toArray().forEach((ele, index) => {
    imgLink.push(ele.attribs.src);
    let alt = ele.attribs.alt.replace(/<[^>]*>|<\/[^>]*>/g, '');
    imgTitle.push(alt);
  })
  // console.log(imgTitle); // 实际一页只有一张图
  
  downloadImages(img);
}

function downloadImages(img) {
  for (let i = 0; i < img[0].length; i++) {
    makeDir();
    let fileLink = img[1][i];
    let arr = fileLink.split('.');
    let fileSuffix = arr[arr.length-1];
    let fileName = img[0][i] + '.' + fileSuffix;
    console.log('第 '+count+' 张图片下载中 . . .');
    console.log('“ '+fileName+' ”下载中 . . .');
    request(fileLink, {end: false}).pipe(fs.createWriteStream(__dirname+'/downloadWeiyiImg/'+count+fileName));
    console.log('第 '+count+' 张图片“ '+fileName+' ”下载成功 ~\n');
  };
  count++;
}

function makeDir() {
  if(!fs.existsSync('./downloadWeiyiImg/')){
    fs.mkdirSync('./downloadWeiyiImg/');
  }else{
    return true;
  }
  console.log('文件夹创建失败');
  return false;
}