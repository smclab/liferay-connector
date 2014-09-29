
'use strict';

module.exports = function inherits(ctor, superCtor, methods) {
  var props = {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  };

  if (methods) {
    Object.keys(methods).forEach(function (name) {
      props[ name ] = {
        value: methods[ name ],
        enumerable: false,
        writable: true,
        configurable: true
      };
    });
  }

  ctor.__proto__ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, props);
};

module.exports.methods = function (ctor, methods) {
  var props = {};

  Object.keys(methods).forEach(function (name) {
    props[ name ] = {
      value: methods[ name ],
      enumerable: false,
      writable: true,
      configurable: true
    };
  });

  Object.defineProperties(ctor.prototype, props);
};
