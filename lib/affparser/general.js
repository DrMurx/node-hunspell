"use strict";

module.exports.parser = {

  'FORBIDDENWORD': function(flag, data) {
    this.emit('forbidden_word', flag);
  }

}
