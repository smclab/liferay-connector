
var Promise = require('bluebird');
var inherits = require('../inherits');
var invoker = require('../invoker');
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

  raw: function (payload) {
    throw new Error("raw() not available on base connector");
  },

  mangle: function (payload) {
    return payload;
  },

  invoke: function (payload, callback) {
    return this.raw(payload)
    .end()
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

Connector.matches = function (buildnumber) {
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
