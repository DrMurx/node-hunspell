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
var Readable = require('stream').Duplex;

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

  this.resetters.forEach(function(resetter) { resetter.call(self); });
}

Reader.prototype.load = function(cb) {
  var self = this;
  this.loadAffixFile(function() {
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
      bom = null,
      bs, ts;

  if (!file) {
    if (end) end();
    return;
  }

  bs = new BufferStream({
    size: 'flexible',
    split: ["\n", "\r\n"]
  }).on('split', function(data, token) {
    bs.emit('data', data);
  });

  ts = through(function(data) { 
    if (bom === null) {
      if (data[0] == 0xfe && data[1] == 0xff || 
          data[0] == 0xff && data[1] == 0xfe) {
        data = data.slice(2);
      } else if (data[0] == 0xef && data[1] == 0xbb && data[2] == 0xbf || 
                 data[0] == 0xef && data[1] == 0xbf && data[2] == 0xbe) {
        data = data.slice(3);
      }
      bom = true;
    }
    // Strip comments
    data = tools.chopComment(data);

    // Skip empty lines and comments
    var line = data.toString('ascii').trim(), c0;
    if (!line.length || (c0 = line.charAt(0)) == '#' || c0 == '/') return;

    parse.call(self, data);

  }, function() {
    this.queue(null);
    end();
  });

/*
//  ps = pausestream();

  self.on("word_count", function() {
    ts.pause();
  })
  ts.pause = function() {
console.log("PAUSE!");
    ps.pause();
    bs.disable(["\n", "\r\n"]);
  }
  ts.resume = function() {
console.log("RESUME!");
    ps.resume();
//    bs.enable();
  }

  if (file.match(/dct$/)) {
    return fs.createReadStream(file)
      .pipe(bs)
      .pipe(ps)
      .pipe(ts);
  }
*/
  return fs.createReadStream(file)
    .pipe(bs)
    .pipe(ts);
}

Reader.prototype.loadAffixFile = function(cb) {
  var self = this;

  self.emit('begin_affix');

  var endFunc = function() {
    self.emit('end_affix');
    if (cb) {
      process.nextTick(function() {
        cb(null, self);
      });
    }
  };

  return this.analyzeFile(this.affixFile, this.parseAffixLine, endFunc);
}


Reader.prototype.loadDictFile = function(cb) {
  var self = this;

  self.emit('begin_dict');

  var endFunc = function() {
    self.emit('end_dict');
    if (cb) {
      process.nextTick(function() {
        cb(null, self);
      });
    }
  };

  return this.analyzeFile(this.dictFile, this.parseDictLine, endFunc);
}


Reader.prototype.parseAffixLine = function(data) {
  var res, option, parser;

  // Parse OPTION
  res    = tools.splitBuffer(data, [0x20, 0x09],  2);
  option = res[0].toString('ascii');
  data   = res[1] || new Buffer('');

  this.emit('raw_affix_data', option, data);

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
  if (this.wordCount === null) {
    this.wordCount = parseInt(data.toString('ascii').trim());
    this.emit('word_count', null, this.wordCount);
  }

  var res   = tools.splitOnMorphInfo(data),
      wrd   = tools.splitBuffer(res[0], [0x2f], 2),
      word  = this.iconv.convert(wrd[0]).toString(),
      flags = !wrd[1]
            ? []
            : (this.affixFlagSetsLen > 0)
               ? this.affixFlagSets[wrd[1].toString()]
               : this.flagEncoder.split(wrd[1]),
      morph  = !res[1]
             ? null
             : this.iconv.convert(res[1]).toString();
  var record = {
    'word':  word,
    'flags': flags,
    'morph': morph
  };
  this.words.push(record);
  this.emit('word', null, record);
}
