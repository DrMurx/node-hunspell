"use strict";

module.exports.reset = function() {
  this.language = null;
  this.name     = null;
  this.home     = null;
  this.version  = null;
}

module.exports.parser = {

  'LANG': function(data) {
    this.language = this.iconv.convert(data).toString().trim();
    this.emit('lang', null, this.language);
  },

  'NAME': function(data) {
    this.name = this.iconv.convert(data).toString().trim();
    this.emit('name', null, this.name);
  },

  'HOME': function(data) {
    this.home = this.iconv.convert(data).toString().trim();
    this.emit('home', null, this.home);
  },

  'VERSION': function(data) {
    this.version = this.iconv.convert(data).toString().trim();
    this.emit('version', null, this.version);
  }

}
