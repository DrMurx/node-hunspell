"use strict";

var encodings = {
  'tis620-2533': 'tis620.2533-0',
  'microsoft-cp1251': 'cp1251' 
}

module.exports.parser = {

  'SET': function(data) {
    var encoding = data.toString().trim().toLowerCase();

    encoding = encodings[encoding] || encoding;
    try {
      this.setEncoding(encoding);
      this.emit('set', encoding);
    } catch (e) {
      this.emit('error', 'Unknown encoding (' + e + ')');
    }
  },

  'FLAG': function(data) {
    var flagEncoding = data.toString().trim().toLowerCase();

    try {
      this.setFlagEncoding(flagEncoding);
      this.emit('flag', flagEncoding);
    } catch (e) {
      this.emit('error', 'Unknown flag encoding (' + e + ')');
    }

  }

}
