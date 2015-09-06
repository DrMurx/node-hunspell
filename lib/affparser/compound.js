"use strict";

// OPTIONS FOR COMPOUNDING
/*
  'BREAK',
  'COMPOUNDRULE',
  'COMPOUNDMIN',
  'COMPOUNDFLAG',
  'COMPOUNDFIRST',
  'COMPOUNDBEGIN',
  'COMPOUNDMIDDLE',
  'COMPOUNDLAST',
  'COMPOUNDEND',

  'COMPOUNDPERMITFLAG',
  'COMPOUNDFORBIDFLAG',

  'COMPOUNDROOT',
  'COMPOUNDWORDMAX',
  'CHECKCOMPOUNDDUP',
  'CHECKCOMPOUNDREP',
  'CHECKCOMPOUNDCASE',
  'CHECKCOMPOUNDTRIPLE',
  'SIMPLIFIEDTRIPLE',
  'CHECKCOMPOUNDPATTERN',
  'COMPOUNDSYLLABLE',
  'SYLLABLENUM',


*/

module.exports.reset = function() {
  this.onlyInCompoundFlag = null;
}


module.exports.parser = {

  'ONLYINCOMPOUND': function(flag, data) {
    this.onlyInCompoundFlag = flag;
    this.emit('only_in_compound', flag);
  }

}
