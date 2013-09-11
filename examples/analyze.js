var optimist   = require('optimist')
                 .usage('Usage: $0 --lang [en_US]')
                 .alias('l', 'lang')
                 .describe('l', 'Language to load'),
    argv       = optimist.argv,
    fs         = require('fs'),
    lib        = require('..');


function read(dictFile) {
  var reader     = new lib.Reader(dictFile);
  var dictionary = new lib.Dictionary(reader);

  function info(label, info) {
    console.log(dictFile + ": " + label, info);
  }

  reader
    .on('error', function(err) {
      throw err;
    })
    .on('begin', function(dictFile) {
    })
    .on('end', function(entry) {
    })

    // Word file
    .on('begin_dict_file', function(fileRecord) {
    })
    .on('end_dict_file', function(fileRecord) {
      info('Dictfile', fileRecord);
    })
    .on('word_count', function(count) {
      info("Word count", count);
    })
    .on('data', function(entry) {
      info('Word', entry);
    })

    // Affix file
    .on('begin_affix_file', function(fileRecord) {
    })
    .on('end_affix_file', function(fileRecord) {
      info('Affixfile', fileRecord);
    })
    .on('lang', function(lang) {
      info('Language', lang);
    })
    .on('name', function(name) {
      info('Name', name);
    })
    .on('home', function(home) {
      info('URL', home);
    })
    .on('version', function(version) {
      info('Version', version);
    })
    .on('set', function(encoding) {
      info('Encoding', encoding);
    })
    .on('flag', function(flagEnc) {
      info('Flag encoding', flagEnc);
    })
    .on('affix_flag_set', function(id, set) {
      info('AF', id + ' ' + set);
    })
    .on('key', function(keys) {
      info('Key', keys.join(', '));
    })
    .on('prefix', function(flag, affix) {
      info('Prefix', flag);
    })
    .on('suffix', function(flag, affix) {
      info('Suffix', flag);
    })
    ;

  reader.load(function() {
//    console.log(reader);
  });

  return dictionary;
}

if (argv.lang) {
  read('./dicts/' + argv.lang + '.dic');
} else {
  fs.readdir('./dicts', function(err, files) {
    files.forEach(function(file) {
      if (!file.match(/\.dic$/)) return;
      read('./dicts/' + file);
    });
  });
}
