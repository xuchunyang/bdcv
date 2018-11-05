#!/usr/bin/env node

const querystring = require('querystring');

const baseUrl = "http://www.bing.com/dict/search?mkt=zh-cn&q=";
const word = 'hello world';
const url = baseUrl + querystring.escape(word);

console.log(`TODO: Fetching ${url}...`);
