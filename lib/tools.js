"use strict";

var splitBuffer = module.exports.splitBuffer = function(data, splitters, cnt) {
  var i      = 0,
      j      = 0,
      c      = data[0],
      inWord = splitters.indexOf(c) === -1,
      len    = data.length,
      res    = [];

  for (;;) {
    c = data[i];
    if (inWord && (splitters.indexOf(c) >= 0 || i == len)) {
      if (i !== j) {
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
    i++;
  }
}
