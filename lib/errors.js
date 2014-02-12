
var errors = module.exports;

function defineError(clazz, parent) {
  /*jshint proto:true */
  parent || (parent = BaseError);
  clazz.__proto__ = parent;
  clazz.prototype = Object.create(parent.prototype);
  clazz.prototype.constructor = clazz;
  errors[clazz.name] = clazz;
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
  return this.name + ': ' +this.message;
};

function prepareError(self, args, message) {
  Error.call(self);
  Error.captureStackTrace && Error.captureStackTrace(self, args.callee);
  self.name = self.constructor.name;
  self.message = message || this.name;
}

// Errors

errors.BaseError = BaseError;

defineError(function UnrecognizedLiferayVersion(version) {
  this.version = version;
  prepareError(this, arguments, "Cannot recognize liferay version " + version);
});

defineError(function PrincipalException(message) {
  this.version = version;
  prepareError(this, arguments, message);
});

defineError(function Unauthorized(message) {
  prepareError(this, arguments, message);
});

defineError(function NotFound(message) {
  prepareError(this, arguments, message);
});
