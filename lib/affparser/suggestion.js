/*
  'MAXCPDSUGS',
  'MAXNGRAMSUGS',
  'MAXDIFF',
  'ONLYMAXDIFF',
  'SUGSWITHDOTS',
  'REP',
  'MAP',
  'PHONE',
  'FORBIDWARN',
*/

"use strict";

module.exports.parser = {

  'KEY': function(data) {
    this.emit('key', this.iconv.convert(data).toString().trim().split('|'));
  },

  'TRY': function(data) {
    this.emit('try', this.iconv.convert(data).toString().trim());
  },

  'NOSUGGEST': function(flag, data) {
    this.emit('no_suggest', flag);
  },

  'NOSPLITSUGS': function() {
    this.emit('no_split_suggest', true);
  },

  'WARN': function(flag, data) {
    this.emit('warn', flag);
  }

}
