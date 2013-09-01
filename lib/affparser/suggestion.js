/*  // OPTIONS FOR SUGGESTION
  'TRY',
  'MAXCPDSUGS',
  'MAXNGRAMSUGS',
  'MAXDIFF',
  'ONLYMAXDIFF',
  'NOSPLITSUGS',
  'SUGSWITHDOTS',
  'REP',
  'MAP',
  'PHONE',
  'WARN',
  'FORBIDWARN',
*/

"use strict";

module.exports.reset = function() {
  this.keys = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  this.noSuggestFlag = null;
}

module.exports.parser = {

  'KEY': function(data) {
    this.keys = this.iconv.convert(data).toString().trim().split('|');
    this.emit('key', null, this.keys);
  },

  'NOSUGGEST': function(data) {
    this.noSuggestFlag = this.iconv.convert(data).toString().trim();
    this.emit('no_suggest', null, this.noSuggestFlag);
  }

}
