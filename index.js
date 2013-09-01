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

  function info(err, label, info) {
    console.log(dictFile + ": " + label + " " + info);
  }

  Reader
    .on('lang', function(err, lang) {
      info(err, 'Language', lang);
    })
    .on('name', function(err, name) {
      info(err, 'Name', name);
    })
    .on('home', function(err, home) {
      info(err, 'URL', home);
    })
    .on('version', function(err, version) {
      info(err, 'Version', version);
    })
    .on('set', function(err, encoding) {
      info(err, 'Encoding', encoding);
    })
    .on('flag', function(err, flagEnc) {
      info(err, 'Flag encoding', flagEnc);
    })
    .on('affix_flag_set', function(err, id, set) {
      info(err, 'AF', id + ' ' + set);
    })
    .on('key', function(err, keys) {
      info(err, 'Key', keys);
    })
    .on('prefix', function(err, flag, affix) {
      info(err, 'Prefix', flag);
    })
    .on('suffix', function(err, flag, affix) {
      info(err, 'Suffix', flag);
    })

    .on('begin_affix', function() {
    })
    .on('end_affix', function() {
    })

    .on('word_count', function(err, count) {
      info(err, "Word count", count);
    })
    .on('word', function(err, entry) {
      info(err, 'Word', entry.word);
    })

    .on('end_dict', function(err, entry) {
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
