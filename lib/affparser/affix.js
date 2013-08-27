"use strict";

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
      this.affixFlagSets.push(data);
      this.emit('affix_flag_set', null, this.affixFlagSets.length, data);
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
  var _aff, affix;

  if (!hash[flag]) {
    _aff = data.toString('ascii').split(/^\s*(\S)\s+(\S+)\s*$/);

    hash[flag] = {
      'cross':    _aff[1] == 'Y',
      'count':    parseInt(_aff[2]),
      'elements': []
    };
    return;
  }

  data = this.iconv.convert(data).toString();

  affix = hash[flag];
  _aff = data.split(/^\s*(\S+)\s+([^ \/]*)(?:\/(\S+))?\s*(\S*)\s*(.*)/);
  if (!_aff[1]) {
    console.log(this.dictionary + " Can't read ", data);
  }

  affix.elements.push({
    'strip':  _aff[1] === '0' ? 0    : _aff[1].length,
    'append': _aff[2] === '0' ? ''   : _aff[2],
    'flags':  typeof _aff[3] === 'undefined' ? [] : this.flagEncoder.split(_aff[3]),
    'cond':   _aff[4] === ''  ? '.'  : _aff[4],
    'morph':  _aff[5] === ''  ? null : _aff[5]
  });

  // As soon as we've catched enough elements, emit event
  if (affix.elements.length == affix.count) {
    this.emit(type, null, flag, affix);
  }

}