"use strict";

var 
  util         = require('util'),
  events       = require('events'),
  fs           = require('fs'),
  BufferStream = require('bufferstream'),
  Iconv        = require('iconv').Iconv,
  through      = require('through'),
  tools        = require('./tools'),
  FlagEncoder  = require('./flags').FlagEncoder;

require('buffertools');


var Reader = module.exports.Reader = function(dictFile, affFile) {
  events.EventEmitter.call(this);

  this.dictFile  = dictFile;
  this.affixFile = affFile;
  this.reset();
};

util.inherits(Reader, events.EventEmitter);


var resetters = Reader.prototype.resetters = [];
var parser    = Reader.prototype.parser    = {};
var parseModules = [
  'meta',
  'encoding',
  'tokenizer',
  'affix',
  'suggestion'
];

parseModules.forEach(function(module) {
  if ((module = require('./affparser/' + module)) == null) return;

  if (module.reset) resetters.push(module.reset);

  for (var property in module.parser) {
    if (module.parser.hasOwnProperty(property)) {
      parser[property] = module.parser[property];
    }
  }
});



Reader.prototype.reset = function() {
  var self = this;

  self.wordCount = null;
  self.words     = [];

  self.setEncoding('iso8859-1');
  self.setFlagEncoding('ascii');

  this.resetters.forEach(function(resetter) { resetter.call(self); });
}

Reader.prototype.load = function(cb) {
  var self = this;

  self.loadAffixFile(function() {
    self.loadDictFile(cb);
  });
}


Reader.prototype.setEncoding = function(encoding) {
  this.encoding = encoding;
  this.iconv    = new Iconv(encoding, 'utf-8');
}


Reader.prototype.setFlagEncoding = function(flagEncoding) {
  this.flagEncoding = flagEncoding;
  this.flagEncoder  = new FlagEncoder(flagEncoding);
}



Reader.prototype.analyzeFile = function(file, parse, end) {
  var self = this,
      bs;

  if (!file) {
    if (end) end();
    return;
  }

  bs = new BufferStream({
    size: 'flexible',
    split: ["\n", "\r\n"]
  });
  bs.on('split', function(data, token) {
    bs.emit('data', data);
  });

  fs.createReadStream(file)
    .pipe(bs)
    .pipe(through(function(data) {
      // Skip empty lines and comments
      var line = data.toString('ascii').trim(), c0;
      if (!line.length || (c0 = line.charAt(0)) == '#' || c0 == '/') return;

      parse.call(self, data);

    }, function() {
      this.queue(null);
      end();
    }));

}

Reader.prototype.loadAffixFile = function(cb) {
  var self = this;

  var endFunc = function() {
    self.emit('end_affix');
    if (cb) {
      process.nextTick(function() {
        cb(null, self);
      });
    }
  };

  this.analyzeFile(this.affixFile, this.parseAffixLine, endFunc);
}


Reader.prototype.loadDictFile = function(cb) {
  var self = this;

  var endFunc = function() {
    self.emit('end_dict');
    if (cb) {
      process.nextTick(function() {
        cb(null, self);
      });
    }
  };

  this.analyzeFile(this.dictFile, this.parseDictLine, endFunc);
}


Reader.prototype.parseAffixLine = function(data) {
  var res, option, parser;

  // Parse OPTION
  res    = tools.splitBuffer(data, [0x20, 0x09],  2);
  option = res[0].toString('ascii');
  data   = res[1] || new Buffer('');

  this.emit('rawdata', option, data);

  // Find proper parser
  if (!(parser = this.parser[option])) return;

  // Split buffer
  res = tools.splitBuffer(data, [0x20, 0x09], parser.length);
  // We've to parse a flag if there are more than 2 parameters on the parser function
  if (parser.length >= 2) {
    res[0] = this.flagEncoder.read(res[0]);
  }
  parser.apply(this, res);
}


Reader.prototype.parseDictLine = function(data) {
  if (this.count === null) {
    this.count = parseInt(data.toString('ascii').trim());
    return;
  }

  var res = tools.splitBuffer(data, [0x2f, 0x20, 0x09], 3);

  var record = {
    'word':  this.iconv.convert(res[0]).toString(),
    'flags': res[1] ? this.flagEncoder.split(res[1]) : [],
    'morph': res[2] ? res[2].toString() : null
  };
  this.words.push(record);
  this.emit('word', null, record);
}
