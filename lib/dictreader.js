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


var DictReader = module.exports.DictReader = function(dictFile, affixReader) {
  events.EventEmitter.call(this);

  this.file    = dictFile;
  this.affixReader = affixReader;

  this.count = null;
  this.words = [];
};

util.inherits(DictReader, events.EventEmitter);


DictReader.prototype.load = function(cb) {
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

    }, function() {
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


DictReader.prototype.parse = function(data) {
  if (this.count === null) {
    this.count = parseInt(data.toString('ascii').trim());
    return;
  }

  var res = tools.splitBufferOnSpace(data, [0x2f, 0x20, 0x09], 3);

  var record = {
    'word':  this.affixReader.iconv.convert(res[0]).toString(),
    'flags': res[1] ? this.affixReader.flagEncoder.split(res[1]) : [],
    'morph': res[2] ? res[2].toString() : null
  };
  this.words.push(record);
  this.emit('word', null, record);
}
