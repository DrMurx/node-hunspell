"use strict";

var
  tools        = require('../tools');


module.exports.reset = function() {
  this.prefixes = {};
  this.suffixes = {};

  this.fullStrip       = false;
  this.complexPrefixes = false;

  this.affixFlagSetsLen = 0;
  this.affixFlagSets    = [];

  this.needAffixFlags = {};
}

module.exports.parser = {

  'PFX': function(flag, data) {
    afx.call(this, 'prefix', this.prefixes, flag, data);
  },

  'SFX': function(flag, data) {
    afx.call(this, 'suffix', this.suffixes, flag, data);
  },

  'FULLSTRIP': function(data) {
    this.fullStrip = true;
    this.emit('full_strip');
  },

  'COMPLEXPREFIXES': function(data) {
    this.complexPrefixes = true;
    this.emit('complex_prefixes');
  },

  'AF': function(data) {
    if (this.affixFlagSetsLen === 0)
      this.affixFlagSetsLen = parseInt(data.toString());
    else {
      var set = this.flagEncoder.split(data);
      this.affixFlagSets.push(set);
      this.emit('affix_flag_set', null, this.affixFlagSets.length, set);
    }
  },

  'NEEDAFFIX': needAffix,

  'PSEUDOROOT': needAffix // deprecated

}


function needAffix(flag, data) {
  this.needAffixFlags[flag] = true;
  this.emit('need_affix', flag);
}


function afx(type, hash, flag, data) {
  var res;

  if (!hash[flag]) {
    res = data.toString('ascii').split(/^\s*(\S)\s+(\S+)\s*$/);

    hash[flag] = {
      'cross':    res[1] == 'Y',
      'count':    parseInt(res[2]),
      'elements': []
    };
    return;
  }

  var affix = hash[flag];

  res = tools.splitBuffer(data, [0x20, 0x09], 4);

  var strip  = this.iconv.convert(res[0]).toString(),
      wrd    = tools.splitBuffer(res[1], [0x2f]),
      append = this.iconv.convert(wrd[0]).toString(),
      flags  = !wrd[1] 
             ? []
             : (this.affixFlagSetsLen > 0)
               ? this.affixFlagSets[wrd[1].toString()]
               : this.flagEncoder.split(wrd[1]),
      cond   = !res[2]
             ? '.'
             : this.iconv.convert(res[2]).toString(),
      morph  = !res[3]
             ? null
             : this.iconv.convert(res[3]).toString();

  if (!strip) {
    console.log(this.dictionary + " Can't read ", data);
  }

  affix.elements.push({
    'strip':  strip  === '0' ? 0    : strip.length,
    'append': append === '0' ? ''   : append,
    'flags':  flags,
    'cond':   cond,
    'morph':  morph
  });

  // As soon as we've catched enough elements, emit event
  if (affix.elements.length == affix.count) {
    this.emit(type, null, flag, affix);
  }

}