#!/usr/bin/env node

function getWord() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.some((elt) => elt === '-h' || elt === '--help')) {
    console.log(`
Usage: bing-dict WORD...
       bing-dict -h|--help`.trimStart());
    process.exit();
  }
  return args.join(' ');
}

const word = getWord();

const querystring = require('querystring');
const http = require('http');
const { JSDOM } = require('jsdom');

const baseUrl = "http://www.bing.com/dict/search?mkt=zh-cn&q=";
const url = baseUrl + querystring.escape(word);

function hasMachineTranslation(dom) {
  return dom.window.document.querySelector('.smt_hw');
}

function machineTranslation(dom) {
  return dom.window.document.querySelector('.p1-11').textContent;
}

function definitions(dom) {
  const defs = dom.window.document.querySelectorAll('.def');
  return [...defs].map((def) => {
    const pos = def.previousElementSibling;
    return pos.textContent + ' ' + def.textContent;
  })
}

function pronunciation(dom) {
  const pron = dom.window.document.querySelector('.hd_prUS');
  // pron.innerHTML looks like:
  // '美&nbsp;'
  // 'US&nbsp;'
  // 'US&nbsp;[heˈləʊ]'
  return pron ? pron.innerHTML.match('&nbsp;(.*)')[1].trim() : '';
}

let rawData = '';
http.get(url, (res) => {
  res.setEncoding('utf8');
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    const dom = new JSDOM(rawData);
    // FIXME: The same url works fine with curl and emacs, but not node, don't know why
    // $ curl http://www.bing.com/dict/search?mkt=zh-cn&q=We%20will%20proudly%20break%20the%20sanctions'
    if (hasMachineTranslation(dom)) {
      // Machine translation: We will proudly break the sanctions -> 我们可以骄傲地打破制裁
      console.log(`Machine translation: ${word} -> ${machineTranslation(dom)}`);
    } else {
      const defs = definitions(dom);
      if (defs.length > 0) {
        const pron = pronunciation(dom);
        // hello [heˈləʊ]: int. 你好；喂；您好；哈喽 | 网络 哈罗；哈啰；大家好
        console.log(`${word} ${pron}: ${defs.join(' | ')}`)
      } else {
        console.log('No result');
      }
    }
  })
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
})
