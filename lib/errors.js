
'use strict';

var errors = module.exports;

function defineError(clazz, parent) {
  /*jshint proto:true */
  parent || (parent = BaseError);
  clazz.__proto__ = parent;
  clazz.prototype = Object.create(parent.prototype);
  clazz.prototype.constructor = clazz;
  /*errors[clazz.name] = clazz;*/
  return clazz;
}

function BaseError () {
  // Ironic
  throw new Error("BaseError cannot be instantiated");
}

BaseError.__proto__ = Error;
BaseError.prototype = Object.create(Error.prototype);
BaseError.prototype.constructor = BaseError;

BaseError.prototype.toString = function () {
  return this.name + ': ' + this.message;
};

function prepareError(self, args, message) {
  Error.call(self);

  if (Error.captureStackTrace) {
    Error.captureStackTrace(self, self.constructor);
  }

  self.name = self.constructor.name;
  self.message = message || self.name;
}

// Errors

errors.BaseError = BaseError;

errors.UnrecognizedLiferayVersion = defineError(function UnrecognizedLiferayVersion(version) {
  this.version = version;
  prepareError(this, arguments, "Cannot recognize liferay version " + version);
});

errors.PrincipalException = defineError(function PrincipalException(message) {
  prepareError(this, arguments, message);
});

errors.Unauthorized = defineError(function Unauthorized(message) {
  prepareError(this, arguments, message);
});

errors.BadRequest = defineError(function BadRequest(message) {
  prepareError(this, arguments, message);
});

errors.NotFound = defineError(function NotFound(message) {
  prepareError(this, arguments, message);
});
