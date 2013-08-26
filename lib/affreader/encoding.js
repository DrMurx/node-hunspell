"use strict";

var encodings = {
  'tis620-2533': 'tis620.2533-0',
  'microsoft-cp1251': 'cp1251' 
}

module.exports.reset = function() {
  this.encoding      = 'ISO8859-1';
  this.flagEncoding  = 'ascii';
}

module.exports.parser = {

  'SET': function(data) {
    var err      = null,
        encoding = data.toString().trim().toLowerCase();

    encoding = encodings[encoding] || encoding;
    try {
      this.setEncoding(encoding);
    } catch (e) {
      err = 'Unknown encoding (' + e + ')';
    }
    this.emit('set', err, encoding);
  },

  'FLAG': function(data) {
    var err          = null,
        flagEncoding = data.toString().trim().toLowerCase();

    try {
      this.setFlagEncoding(flagEncoding);
    } catch (e) {
      err = 'Unknown flag encoding (' + e + ')';
    }

    if (this.prefixes.length || this.suffixes.length || this.affixFlagSetsLen) {
      err = "FLAG defined after AF, SFX or PFX section!";
    }

    this.emit('flag', err, flagEncoding);
  }

}
