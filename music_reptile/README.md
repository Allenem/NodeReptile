# Introduction of music_reptile

A reptile to download music(s) from [QQmusic](https://y.qq.com)

## Quick Start

```bash
git clone https://github.com/Allenem/NodeReptile.git

cd music_reptile

npm install

node main.js
```

## Dependences

* superagent
* request
* cheerio // I haven't needed this dependence in this app.

>Small progressive client-side HTTP request library, and Node.js module with the same API, sporting many high-level HTTP client features

>Request is designed to be the simplest way possible to make http calls. It supports HTTPS and follows redirects by default.

>Fast, flexible & lean implementation of core jQuery designed specifically for the server.

## Codeing Process

```bash
yarn init

yarn add superagent request
```

1. Install `json-viewer` extension for Chrome from https://chrome.google.com/webstore/detail/json-viewer/gbmdgpbipfallnflgajpaliibnhdgobh or https://github.com/tulios/json-viewer

2. Login QQ music at https://y.qq.com

3. Press `F12` open `Network` and clear, search music by inputing song name, select `XHR`(XMLHttpRequest), find `client_search_cp?ct=24&qqmusic_ver=1298&new_json=1…et=utf-8&notice=0&platform=yqq.json&needNewCode=0` and open it in new tab.

4. Copy url of `client...`, spice `encodeURI('songName')` & `qq` with url, then we get url to get songlist.

5. Click play button to play a song, find `musicu.fcg?-=getplaysongvkey781759131174834&g_tk=7…3A%22json%22%2C%22ct%22%3A24%2C%22cv%22%3A0%7D%7D` in console and open it in new tab, spice `encodeURI('songMid')` & `qq` with url, then we get url1(including req & req_0) to get url2(`req_0.data.sip[0]+req_0.data.midurlinfo[0].purl`) to download song, use `filename.split('.')` get `songSuffix`.

6. Function `download` has 1 object containing 4 arguments `{songUrl,songSuffix,singer,songName}`, which uses `fs` & `request` to `mkdir` & `createWriteStream`.

Well Done!!!