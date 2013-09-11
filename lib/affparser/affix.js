"use strict";

var tools = require('../tools');


module.exports.reset = function() {
  this.affixFlagSetsLen = null;
  this.affixFlagSets    = [];
  this.prefixes = {};
  this.suffixes = {};  
}

module.exports.parser = {

  'PFX': function(flag, data) {
    afx.call(this, 'prefix', this.prefixes, flag, data);
  },

  'SFX': function(flag, data) {
    afx.call(this, 'suffix', this.suffixes, flag, data);
  },

  'FULLSTRIP': function() {
    this.emit('full_strip', true);
  },

  'COMPLEXPREFIXES': function() {
    this.emit('complex_prefixes', true);
  },

  'AF': function(data) {
    // AffixFlags are collected in the reader and expanded
    if (this.affixFlagSetsLen === null) {
      this.affixFlagSetsLen = parseInt(data.toString());
      this.emit('affix_flag_set_len', this.affixFlagSetsLen);
    } else {
      var set = this.flagEncoder.split(data);
      this.affixFlagSets.push(set);
      this.emit('affix_flag_set', this.affixFlagSets.length, set);
    }
  },

  'NEEDAFFIX': function(flag, data) {
    this.emit('need_affix', flag);
  }
}

// Deprecated handlers
module.exports.parser.PSEUDOROOT = module.exports.parser.NEEDAFFIX;


function afx(type, hash, flag, data) {

  if (!hash[flag]) {
    var res = data.toString('ascii').split(/^\s*(\S)\s+(\S+)\s*$/);

    hash[flag] = {
      'cross':    res[1] == 'Y',
      'count':    parseInt(res[2]),
      'elements': []
    };
    return;
  }

  var res = tools.splitBuffer(data, [0x20, 0x09], 4);
  if (res.length == 1) {
    this.emit('error', "Invalid affix record");
    return;
  }

  var wrd = tools.splitBuffer(res[1], [0x2f], 2);
  if (wrd.length > 2) {
    this.emit('error', "Invalid affix record");
    return;
  }


  var affix  = hash[flag],
      strip  = this.iconv.convert(res[0]).toString(),
      append = this.iconv.convert(wrd[0]).toString(),
      flags  = !wrd[1] 
             ? []
             : (this.affixFlagSetsLen > 0)
               ? this.affixFlagSets[wrd[1].toString()]
               : this.flagEncoder.split(wrd[1]);

  if (!strip) {
    this.emit('error', "Invalid affix record");
    return;
  }

  affix.elements.push({
    'strip':  strip  === '0' ? 0    : strip.length,
    'append': append === '0' ? ''   : append,
    'flags':  flags,
    'cond':   res[2] ? this.iconv.convert(res[2]).toString() : null,
    'morph':  res[3] ? this.iconv.convert(res[3]).toString() : null
  });

  // As soon as we've catched enough elements, emit event
  if (affix.elements.length == affix.count) {
    this.emit(type, flag, affix);
    delete hash[flag];
  }

}