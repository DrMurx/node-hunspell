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
//var Readable = require('stream').Duplex;

require('buffertools');


var Reader = module.exports.Reader = function(dictFile) {
  events.EventEmitter.call(this);

  this.dictFileRecord  = {
    file:         dictFile,
    lines:        null,
    commentLines: 0,
    validLines:   0,
    invalidLines: 0
  };
  this.affixFileRecord = {
    file:         dictFile.replace(/\.dic$/g, '.aff'),
    lines:        null,
    commentLines: 0,
    validLines:   0,
    invalidLines: 0
  };

  this.reset();
};


util.inherits(Reader, events.EventEmitter);


(function() {
  var resetters = Reader.prototype.resetters = [];
  var parser    = Reader.prototype.parser    = {};
  var parseModules = [
    'meta',
    'encoding',
    'tokenizer',
    'general',
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
})();


Reader.prototype.reset = function() {
  var self = this;

  self.flagEncodingSeen = false;
  self.wordCountSeen    = false;

  self.setEncoding('iso8859-1');
  self.setFlagEncoding('char');

  self.resetters.forEach(function(resetter) {
    resetter.call(self);
  });
}


Reader.prototype.load = function(cb) {
  var self = this;

  self.emit('begin');
  self._loadAffixFile(function() {
    self._loadDictFile(function() {
      self.emit('end');
      if (cb) {
        process.nextTick(function() {
          cb(null, self);
        });
      }      
    })
  })
}


Reader.prototype.setEncoding = function(encoding) {
  this.encoding = encoding;
  this.iconv    = new Iconv(encoding, 'utf-8');
}


Reader.prototype.setFlagEncoding = function(flagEncoding) {
  if (this.flagEncoderUsed) {
    this.emit('error', "Flag encoding defined as " + flagEncoding + ", but already used!");
  }
  this.flagEncoding = flagEncoding;
  this.flagEncoder  = new FlagEncoder(flagEncoding);
}




Reader.prototype._loadAffixFile = function(cb) {
  var self = this,
      fileRecord = self.affixFileRecord,
      optionBacklog = [];

  self.emit('begin_affix_file', fileRecord);
  self._analyzeFile(fileRecord, 
    function(data) {
      self._parseAffixLine(data, fileRecord, optionBacklog);
    },
    function() {
      self.emit('end_affix_file', fileRecord);
      process.nextTick(cb);
    }
  );
}


Reader.prototype._parseAffixLine = function(data, fileRecord, optionBacklog) {
  var res, option, parser;

  // Parse OPTION
  res    = tools.splitBuffer(data, [0x20, 0x09],  2);
  option = res[0].toString('ascii');
  data   = res[1] || new Buffer('');

  this.emit('raw_affix_data', option, data);

  // Find proper parser
  if (!(parser = this.parser[option])) {
    fileRecord.invalidLines++;
    this.emit('unknown_option', option, data);
    return;
  }

  fileRecord.validLines++;

  // Split buffer
  res = tools.splitBuffer(data, [0x20, 0x09], parser.length);
  // If there are more than 2 parameters on the parser function, first one is a flag
  if (parser.length >= 2) {
    res[0] = this.flagEncoder.read(res[0]);
  }

  if (!this.flagEncodingSeen) {
    if (option == 'FLAG') {
      parser.apply(this, res);
      this.flagEncodingSeen = true;
      this._drainAffixBacklog(optionBacklog);
      return;
    }
    if (option == 'PFX' || option == 'SFX') {
      this.flagEncodingSeen = true;
      this._drainAffixBacklog(optionBacklog);
    } else if (parser.length >= 2) {
      // Defer options with flag until we've seen FLAG
      optionBacklog.push([option, parser, res]);
      return;      
    }
  }

  parser.apply(this, res);
}


Reader.prototype._drainAffixBacklog = function(optionBacklog) {
  var res, option, parser;

  while (optionBacklog.length) {
    res = optionBacklog.shift();
    option = res[0];
    parser = res[1];
    res    = res[2];
    parser.apply(this, res);
  }  
}




Reader.prototype._loadDictFile = function(cb) {
  var self = this,
      fileRecord = self.dictFileRecord;

  self.emit('begin_dict_file', fileRecord);
  self._analyzeFile(fileRecord, 
    function(data) {
      self._parseDictLine(data, fileRecord);
    },
    function() {
      self.emit('end_dict_file', fileRecord);
      process.nextTick(cb);
    }
  );  
}


Reader.prototype._parseDictLine = function(data, fileRecord) {
  fileRecord.validLines++;

  if (!this.wordCountSeen) {
    this.wordCountSeen = true;
    this.emit('word_count', parseInt(data.toString('ascii').trim()));
    return;
  }

  var res   = tools.splitOnMorphInfo(data),
      wrd   = tools.splitBuffer(res[0], [0x2f], 2),
      word  = this.iconv.convert(wrd[0]).toString(),
      flags = !wrd[1]
            ? []
            : (this.affixFlagSetsLen > 0)
               ? this.affixFlagSets[wrd[1].toString()]
               : this.flagEncoder.split(wrd[1]);
  var record = {
    'word':  word,
    'flags': flags,
    'morph': res[1] ? this.iconv.convert(res[1]).toString() : null
  };
  this.emit('data', record);
}




Reader.prototype._analyzeFile = function(fileRecord, write, end) {
  var self = this,
      bs, cs, ts;

  if (!fileRecord || !fileRecord.file) {
    end();
    return;
  }

  bs = this._getSplitStream(fileRecord);
  cs = this._getChopStream(fileRecord);
  ts = through(write, end);

  try {
    return fs.createReadStream(fileRecord.file).pipe(bs).pipe(cs).pipe(ts);
  } catch (err) {
    this.emit('error', err);
  }
}


Reader.prototype._getSplitStream = function(fileRecord) {
  var bs;
  return bs = new BufferStream({
    size: 'flexible',
    split: ["\n", "\r\n"]
  }).on('split', function(data, token) {
    fileRecord.lines++;
    bs.emit('data', data);
  });
}


Reader.prototype._getChopStream = function(fileRecord) {
  var firstLine = true;

  return through(function(data) {
    // Chop away byte order mark
    if (firstLine) {
      if (data[0] == 0xfe && data[1] == 0xff || 
          data[0] == 0xff && data[1] == 0xfe) {
        data = data.slice(2);
      } else if (data[0] == 0xef && data[1] == 0xbb && data[2] == 0xbf || 
                 data[0] == 0xef && data[1] == 0xbf && data[2] == 0xbe) {
        data = data.slice(3);
      }
      firstLine = false;
    }

    // Strip comments
    data = tools.chopComment(data);

    // Skip empty lines and comments
    var line = data.toString('ascii').trim(), c0;
    if (!line.length || (c0 = line.charAt(0)) == '#' || c0 == '/') {
      fileRecord.commentLines++;
      return;
    }

    this.emit('data', data);
  });

}
