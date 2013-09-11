/*
  'IGNORE',
  'KEEPCASE',
  'CHECKSHARPS',
  
  'ICONV',
  'OCONV',
*/

"use strict";

module.exports.parser = {

  'WORDCHARS': function(data) {
    this.emit('word_chars', this.iconv.convert(data).toString().trim());
  }

}
