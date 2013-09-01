"use strict";

var indexOf = require('buffertools').indexOf;

var splitBuffer = module.exports.splitBuffer = function(data, splitters, cnt) {
  splitters = splitters || [0x20, 0x09];
  cnt       = cnt || 0;

  var i      = 0,
      j      = 0,
      c      = data[0],
      ltrim  = false,
      inWord = splitters.indexOf(c) === -1,
      skip   = 0,
      len    = data.length,
      res    = [];

  for (;;) {
    c = data[i];
    if (c == 0x5c && i < len) { // Skip characters preceeded by a backslash
      skip = 2;
    }
    if (inWord && (!skip && splitters.indexOf(c) >= 0 || i == len)) {
      if (i !== j || !ltrim) {
        cnt--;
        if (cnt == 0) i = len;
        res.push(data.slice(j, i));
      }
      inWord = false;
      if (i == len) return res;
    } else if (!inWord && splitters.indexOf(c) === -1) {
      inWord = true;
      j = i;
      if (i == len) return res;
    }
    if (skip) skip--;
    i++;
  }
}


var chopComment = module.exports.chopComment = function(data) {
  var p = data.indexOf(new Buffer('#'));
  if (p == -1) p = data.length;
  for (p--; p >= 0 && (data[p] == 0x20 || data[p] == 0x09); p--);
  return data.slice(0, p + 1);
}


var splitOnMorphInfo = module.exports.splitOnMorphInfo = function(data) {
  var i = 0,
      dp = 0,
      dp2,
      mb,
      len,
      colon = new Buffer(':');

  // split buffer into word and morphological description
  while ((dp = data.indexOf(colon, dp)) >= 0) {
    if ((dp > 3) && (data[dp - 3] == 0x20 || data[dp - 3] == 0x09)) {
    	mb = dp - 2;
      for (dp -= 4; dp >= 0 && (data[dp] == 0x20 || data[dp] == 0x09); dp--);
      if (dp >= 0) {
        dp++;
      }
      break;
    }
    dp++;
  }

  // tabulator is the old morphological field separator
  dp2 = data.indexOf(new Buffer('	'));
  if (dp2 >= 0 && (dp < 0 || dp2 < dp)) {
    dp = dp2;
    for (mb = dp, len = data.length; mb < len && (data[mb] == 0x20 || data[mb] == 0x09); mb++);
  }

  if (dp < 0) return [data, new Buffer('')];
  return [data.slice(0, dp), data.slice(mb)];
}
