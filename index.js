"use strict";

var optimist  = require('optimist')
                .usage('Usage: $0 --lang [en_US]')
                .alias('l', 'lang')
                .describe('l', 'Language to load'),
    argv      = optimist.argv,
    fs        = require('fs'),
    reader    = require('./lib/reader');


function read(dictFile, affFile) {
  if (!dictFile.match(/\.dic$/)) return;
  if (!affFile.match(/\.aff$/)) return;

  var Reader = new reader.Reader(dictFile, affFile);

  Reader
    .on('lang', function(err, lang) {
      console.log(this.file + ": Language " + this.language);
    })
    .on('name', function(err, name) {
      console.log(this.file + ": Name " + this.name);
    })
    .on('home', function(err, home) {
      console.log(this.file + ": URL " + home);
    })
    .on('version', function(err, version) {
      console.log(this.file + ": Version " + version);
    })
    .on('set', function(err, encoding) {
      if (err)
        console.log(this.file + ': ' + err + ' ' + encoding);
      else
        console.log(this.file + ": Encoding " + encoding);
    })
    .on('flag', function(err, flagEnc) {
      console.log(this.file + ': Flag encoding ' + flagEnc);
    })
    .on('prefix', function(err, flag, affix) {
      console.log(this.file + ": Prefix " + flag);
    })
    .on('suffix', function(err, flag, affix) {
      console.log(this.file + ": Suffix " + flag);
    })
    .on('key', function(err, keys) {
      console.log(this.file + ": key ", keys);
    })
    .on('word', function(err, entry) {
      console.log(entry.word);
    })
    ;

  Reader.load();
}

if (argv.lang) {
  read('./dicts/' + argv.lang + '.dic', './dicts/' + argv.lang + '.aff');
} else {
  fs.readdir('./dicts', function(err, files) {
    files.forEach(function(file) {
      read('./dicts/' + file, './dicts/' + file.replace(/\.dic$/g, '.aff'));
    });
  });
}
