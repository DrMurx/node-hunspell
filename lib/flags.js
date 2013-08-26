"use strict";

var
  Iconv = require('iconv').Iconv,
  iconv = new Iconv('iso8859-1', 'utf-8'),
  convert = iconv.convert;


var FlagEncoder = module.exports.FlagEncoder = function(flagEnc) {
  if (functions[flagEnc]) return functions[flagEnc];
  throw "Unknown flag encoding " + flagEnc;
};


var functions = {
  'ascii': {
    read: function(data) {
      return convert(data).toString();
    },
    split: function(data) {
      return convert(data).toString().split('');
    }
  },
  'utf-8': {
    read: function(data) {
      return data.toString();
    },
    split: function(data) {
      return data.toString().split('');
    }
  },
  'long': {
    read: function(data) {
      return convert(data).toString();
    },
    split: function(data) {
      return convert(data).toString().replace(/(..)(?!$)/g, '$1,').split(',');
    }
  },
  'num': {
    read: function(data) {
      return data.toString();
    },
    split: function(data) {
      return data.toString().split(',');
    }
  }
};

