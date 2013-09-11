"use strict";

module.exports.parser = {

  'LANG': function(data) {
    emit(this, 'lang', data);
  },

  'NAME': function(data) {
    emit(this, 'name', data);
  },

  'HOME': function(data) {
    emit(this, 'home', data);
  },

  'VERSION': function(data) {
    emit(this, 'version', data);
  }

}


function emit(parser, tag, data) {
  parser.emit(tag, parser.iconv.convert(data).toString().trim());
}
