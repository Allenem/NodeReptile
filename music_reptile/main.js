const superagent = require("superagent");  // 请求数据
const request = require("request");  // 请求数据，获取下载管道
const readline = require('readline');  // 读取命令行输入
const fs = require("fs");  // 文件读写

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 具体登录QQ音乐的QQ号，根据具体情况修改，可能绿钻用户能下载VIP的歌曲，非会员下载的文件会出错(*/ω＼*)
const qq = '1820988819';
let count = 0;
init();

// 初始化函数
function init() {
  console.clear();
  console.log('输入.exit退出');
  rl.question('请输入歌曲名：', answer => {
    if(answer === '.exit'){
      rl.close();
      return;
    }
    console.log(`歌曲名为：${answer}`);
    let songName = answer;
    fetchSongList(songName); // 获取搜索到的歌曲列表
  });
}

// 获取歌曲列表
function fetchSongList(songName) {
  superagent.get('https://c.y.qq.com/soso/fcgi-bin/client_search_cp?ct=24&qqmusic_ver=1298&new_json=1&remoteplace=txt.yqq.song&searchid=56189420827714850&t=0&aggr=1&cr=1&catZhida=1&lossless=0&flag_qc=0&p=1&n=10&w='+encodeURIComponent(songName)+'&g_tk=799132815&loginUin='+qq+'&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0')
  .end((err,res) => {
    if(err) throw err;
    let songObj = JSON.parse(res.body); // JSON obj -> JS obj
    if(!songObj.code){
      songList = songObj.data.song.list;
      listSongInfo(songList);
    }
  });
}

// 列出歌曲列表信息
function listSongInfo(songList) {
  console.clear();
  console.log('\n搜索结果如下：\n序号'+'--'+'歌名'+'--'+'歌手\n');

  songList.forEach((element,index) => {
    index+=1;
    console.log(`${index}--${element.name}--${element.singer[0].name}`);
  });

  rl.question('\n请输入要下载的歌曲序号(输入c返回上一步,直接回车默认下载第一首歌,键入all下载10首)：', answer => {
    if(answer === 'c'){
      init();
    }else{
      if(answer === 'all'){
        answer = [0,1,2,3,4,5,6,7,8,9];
        answer.forEach((ele,index)=>{
          let songMid = songList[ele].mid;
          let singer = songList[ele].singer[0].name;
          let songName = index+'-'+songList[ele].name;
          fetchSongUrl(songMid,singer,songName);
        })
      }else{
        if(!answer){
          answer = 0;
        }else{
          answer -= 1;
        }
        let songMid = songList[answer].mid;
        let singer = songList[answer].singer[0].name;
        let songName = songList[answer].name;
        fetchSongUrl(songMid,singer,songName);
      }
    }
  });
}

// 获取歌曲下载地址
function fetchSongUrl(songMid,singer,songName) {
  superagent.get('https://u.y.qq.com/cgi-bin/musicu.fcg?-=getplaysongvkey781759131174834&g_tk=799132815&loginUin='+qq+'&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0&data=%7B%22req%22%3A%7B%22module%22%3A%22CDN.SrfCdnDispatchServer%22%2C%22method%22%3A%22GetCdnDispatch%22%2C%22param%22%3A%7B%22guid%22%3A%22514105576%22%2C%22calltype%22%3A0%2C%22userip%22%3A%22%22%7D%7D%2C%22req_0%22%3A%7B%22module%22%3A%22vkey.GetVkeyServer%22%2C%22method%22%3A%22CgiGetVkey%22%2C%22param%22%3A%7B%22guid%22%3A%22514105576%22%2C%22songmid%22%3A%5B%22'+songMid+'%22%5D%2C%22songtype%22%3A%5B0%5D%2C%22uin%22%3A%22'+qq+'%22%2C%22loginflag%22%3A1%2C%22platform%22%3A%2220%22%7D%7D%2C%22comm%22%3A%7B%22uin%22%3A'+qq+'%2C%22format%22%3A%22json%22%2C%22ct%22%3A24%2C%22cv%22%3A0%7D%7D')
  .then(res => {
    let json = JSON.parse(res.text);
    if(!json.req_0.code){
      // url 拼接
      let songAddrData = json.req_0.data;
      let urlPrefix = songAddrData.sip[0];
      let urlSuffix = songAddrData.midurlinfo[0].purl;
      let songUrl = urlPrefix + urlSuffix;
      // 获取文件名后缀
      let filename = songAddrData.midurlinfo[0].filename;
      let arr = filename.split('.');
      let songSuffix = arr[arr.length-1];

      download({
        songUrl,songSuffix,singer,songName
      });
    }
  }).catch(err=>console.log(err));
}

// 下载函数
function download(obj) {
  let {songUrl,songSuffix,singer,songName} = obj;

  // 同步判断是否有该文件夹
  if(!fs.existsSync('./music')){
    fs.mkdirSync('./music');
  }

  // 拼接音乐名
  let songLocalName = songName + '-' + singer + '.' + songSuffix;

  console.log('\n歌曲下载中 . . .');
  console.log('将下载到当前目录下的music文件夹中（若没有music文件夹将创建它）');
  request(songUrl).pipe(fs.createWriteStream(__dirname+'/music/'+songLocalName));
  console.log(songLocalName+'歌曲下载成功 ~');
  count++;

  rl.question('键入cn继续下载歌曲，任意键退出：', answer => {
    if(answer === 'cn'){
      init();
    }else{
      console.log('\n本次成功下载歌曲：\n'+count+'首\n欢迎下次使用٩(๑>◡<๑)۶ ');
      rl.close();
    }
  })
}