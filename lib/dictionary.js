"use strict";

var Dictionary = module.exports.Dictionary = function(reader) {
  this.setup(reader);
  this.reset();
}


Dictionary.prototype.reset = function() {
  // META
  this.language = null;
  this.name     = null;
  this.home     = null;
  this.version  = null;

  // AFFIX
  this.prefixes = {};
  this.suffixes = {};

  this.fullStrip       = false;
  this.complexPrefixes = false;

  this.affixFlagSetsLen = 0;
  this.affixFlagSets    = [];

  this.needAffixFlag = null;

  // SUGGESTIONS
  this.keys = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  this.noSuggestFlag = null;

  // GENERAL
  this.forbiddenWordFlag = 65510;

  // WORDS
  this.wordCount = null;
  this.words     = [];
}


Dictionary.prototype.setup = function(reader) {
  var self = this;

  for (var property in self.handler) {
    if (!self.handler.hasOwnProperty(property)) continue;

    (function() {
      var flag = property;
      reader.on(flag, function() {
        self.handler[flag].apply(self, arguments);
      });
    })();
  }
}


Dictionary.prototype.handler = {
  // META
  'lang': function(lang) {
    this.language = lang;
  },
  'name': function(name) {
    this.name = name;
  },
  'home': function(home) {
    this.home = home;
  },
  'version': function(version) {
    this.version = version;
  },

  // AFFIX
  'prefix': function(flag, affix) {
    this.prefixes[flag] = affix;
  },
  'suffix': function(flag, affix) {
    this.suffixes[flag] = affix;
  },  
  'full_strip': function(fullStrip) {
    this.fullStrip = fullStrip;
  },
  'complex_prefixes': function(complexPrefixes) {
    this.complexPrefixes = complexPrefixes;
  },
  'need_affix': function(flag) {
    this.needAffixFlag = flag;
  },

  // SUGGESTIONS
  'key': function(keys) {
    this.keys = keys;
  },
  'no_suggest': function(noSuggestFlag) {
    this.noSuggestFlag = noSuggestFlag;
  },

  // WORD
  'word_count': function(count) {
    this.wordCount = count;
  },
  'data': function(entry) {
    this.words.push(entry);
  }

}
