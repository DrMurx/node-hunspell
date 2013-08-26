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


var AffixReader = module.exports.AffixReader = function(affFile) {
  events.EventEmitter.call(this);

  this.file = affFile;
  this.reset();
};

util.inherits(AffixReader, events.EventEmitter);


var resetters = AffixReader.prototype.resetters = [];
var parser    = AffixReader.prototype.parser    = {};
var parseModules = [
  'meta',
  'encoding',
  'affix'
];

parseModules.forEach(function(module) {
  module = require('./affreader/' + module);

  resetters.push(module.reset);

  for (var property in module.parser) {
    if (module.parser.hasOwnProperty(property)) {
      parser[property] = module.parser[property];
    }
  }
});


AffixReader.prototype.reset = function() {
  var self = this;

  self.setEncoding('iso8859-1');
  self.setFlagEncoding('ascii');

  this.resetters.forEach(function(resetter) { resetter.call(self); });
}


AffixReader.prototype.setEncoding = function(encoding) {
  this.encoding = encoding;
  this.iconv    = new Iconv(encoding, 'utf-8');
}


AffixReader.prototype.setFlagEncoding = function(flagEncoding) {
  this.flagEncoding = flagEncoding;
  this.flagEncoder  = new FlagEncoder(flagEncoding);
}


AffixReader.prototype.load = function(cb) {
  var self = this,
      bs;

  bs = new BufferStream({
    size: 'flexible',
    split: ["\n", "\r\n"]
  });
  bs.on('split', function(data, token) {
    bs.emit('data', data);
  });

  fs.createReadStream(self.file)
    .pipe(bs)
    .pipe(through(function(data) {
      // Skip comments and empty lines
      var line = data.toString('ascii').trim(), c0;
      if (!line.length || (c0 = line.charAt(0)) == '#' || c0 == '/') return;

      self.parse(data);

    }, function () {
      this.queue(null);
      process.nextTick(function() {
        self.emit('end');
      });
      // Callback if finished
      if (cb) {
        process.nextTick(function() {
          cb(self);
        });
      }
    }));

}


AffixReader.prototype.parse = function(data) {
  var res, option, parser;

  // Parse OPTION
  res    = tools.splitBufferOnSpace(data, [0x20, 0x09],  2);
  option = res[0].toString('ascii');
  data   = res[1] || new Buffer('');

  this.emit('rawdata', option, data);

  // Find proper parser
  if (!(parser = this.parser[option])) return;

  // Split buffer
  res = tools.splitBufferOnSpace(data, [0x20, 0x09], parser.length);
  if (parser.length >= 2) {
    res[0] = this.flagEncoder.read(res[0]);
  }
  parser.apply(this, res);
}
