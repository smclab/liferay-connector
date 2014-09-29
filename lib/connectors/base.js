
'use strict';

var Promise = require('bluebird');
var inherits = require('../inherits');
var invoker = require('../invoker');
var errors = require('../errors');
var camelcase = require('../camelcase');
var slice = Array.prototype.slice;

module.exports = Connector;

function Connector(portalURL, auth) {
  this.portalURL = portalURL;
  this.auth = auth || {};

  this.auth.type || (this.auth.type = 'basic');

  this.invoke = this.invoke.bind(this);
}

Object.defineProperty(Connector.prototype, 'version', {
  enumerable: false,
  configurable: true,
  get: function () {
    return this.constructor.version;
  }
});

inherits.methods(Connector, {

  raw: function (/* payload */) {
    throw new Error("raw() not available on base connector");
  },

  mangle: function (payload) {
    return payload;
  },

  getDefaultParameterType: function (parameter) {
    if (parameter === 'serviceContext') {
      return 'com.liferay.portal.service.ServiceContext';
    }
  },

  mangleInstantiation: function (payload) {
    var that = this;
    if (Array.isArray(payload)) {
      return payload.map(this.mangleInstantiation, this);
    }
    else {
      return Object.keys(payload).reduce(function (outer, path) {
        outer[ path ] = that.mangleInstantiationCommandBody(payload[ path ]);
        return outer;
      }, {});
    }
  },

  mangleInstantiationCommandBody: function (command) {
    var that = this;
    return Object.keys(command).reduce(function (memo, parameter) {
      var parts, name, type;
      var value = command[ parameter ];
      if (parameter.trim().charAt(0) === '$') {
        memo[ parameter ] = that.mangleInstantiationCommandBody(value);
      }
      else if (typeof value === 'object') {
        parts = parameter.match(/^\+?([^:]+):?([\s\S]+)?$/);
        name = parts[ 1 ];
        type = parts[ 2 ] || that.getDefaultParameterType(parameter);
        if (type) {
          memo[ '+' + name ] = type;
          Object.keys(value).reduce(function (memo, key) {
            memo[ name + '.' + key ] = value[ key ];
            return memo;
          }, memo);
        }
        else {
          memo[ parameter ] = value;
        }
      }
      else {
        memo[ parameter ] = value;
      }
      return memo;
    }, {});
  },

  mangleCamelCase: function (payload) {
    var that = this;
    if (Array.isArray(payload)) {
      return payload.map(this.mangleCamelCase, this);
    }
    else {
      return Object.keys(payload).reduce(function (outer, path) {
        outer[ path ] = that.mangleCamelCaseCommandBody(payload[ path ]);
        return outer;
      }, {});
    }
  },

  mangleCamelCaseCommandBody: function (command) {
    var that = this;
    return Object.keys(command).reduce(function (memo, parameter) {
      if (parameter.trim().charAt(0) === '$') {
        memo[ parameter ] = that.mangleCamelCaseCommandBody(command[ parameter ]);
      }
      else {
        memo[ camelcase.normalizeParameter(parameter) ] = command[ parameter ];
      }
      return memo;
    }, {});
  },

  invoke: function (payload, callback) {
    return this.raw(payload)
    .end()
    .catch(invoker.parseErrors)
    .then(invoker.parseLiferayResponse)
    .then(invoker.getBody)
    .nodeify(callback);
  },

  all: function () {
    return Promise.all(payloads(arguments).map(this.invoke)).cancellable();
  },

  any: function () {
    return Promise.any(payloads(arguments).map(this.invoke)).cancellable();
  }

});

Connector.matches = function (/* buildnumber */) {
  return false;
};

Connector.authenticate = function (portalURL, auth) {
  var connection = new this(portalURL, auth);

  return connection.invoke({
    "/group/get-user-sites": {}
  })
  .then(function (sites) {
    connection.sites = sites;

    if (sites.length) {
      connection.companyId = sites[0].companyId;
    }

    return connection.getUser();
  })
  .catch(errors.NotFound, function () {
    throw new errors.Unauthorized("Could not retrieve user informations");
  })
  .then(function (user) {
    connection.user = user;
    return connection;
  });
};


// Utils

function payloads(args) {
  var results;

  if (args.length === 1) {
    results = args[0];
  }
  else {
    results = slice.call(args);
  }

  return results.filter(function (payload) {
    return payload != null;
  });
}
