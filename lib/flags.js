"use strict";


var FlagEncoder = module.exports.FlagEncoder = function(flagEnc) {
  if (functions[flagEnc]) return functions[flagEnc];
  throw "Unknown flag encoding " + flagEnc;
};


var functions = {
  'char': {
    read: function(data) {
      return data[0];
    },
    split: function(data) {
      return data.toJSON();
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
      return data.readUInt16BE(0);
    },
    split: function(data) {
      var res = [];
      for (var i = 0, len = Math.floor(data.length / 2) * 2; i < len; i += 2) {
        res.push(data.readUInt16BE(i));
      }
      return res;
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

