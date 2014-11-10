
'use strict';

var errors = require('./errors');
var request = require('./request');
var pkg = require('../package');
var btoa = require('btoa');
var util = require('util');

module.exports = invoker;

var toString = Object.prototype.toString;

function invoker(portalURL, path, auth, payload) {
  if (arguments.length === 3) {
    payload = auth;
    auth = null;
  }

  var guest = (auth == null) || (auth.type === 'guest');
  var batch = util.isArray(payload) || (Object.keys(payload).length > 1);
  var nested = isNested(payload);
  var invoke = !guest;

  if (guest && (batch || nested)) {
    throw new Error("Cannot execute batch or nested invocations as guest");
  }

  var action = null;

  if (invoke) {
    path += '/invoke';
  }
  else {
    action = Object.keys(payload)[0];
    path += action;
  }

  var req = request.post(portalURL + path);

  if (req.parse) {
    // Node.js-style parsing, `data` and `end` events
    req.parse(jsonAdditionalParser);
  }

  req.set({"Accept-Encoding" : ""});

  if (!guest) {
    req.set('Authorization', 'Basic ' + btoa(auth.login + ':' + auth.password));
  }

  req.set({ 'User-Agent': 'liferay-core-connector v' + pkg.version });

  req.redirects(0);

  if (invoke) {
    req.type('json').send(payload);
  }
  else {
    req.type('form').send(payload[ action ]);
  }

  return req;
}

invoker.knownErrors = [];

function knownError(test, act) {
  var re = test;
  var Exc = act;
  var status = act;

  if (toString.call(test) === '[object RegExp]') {
    test = function (input) {
      return re.test(input);
    };
  }

  if (typeof act === 'number') {
    act = function (res) {
      res.setStatusProperties(status);
    };
  }
  else if (act.prototype instanceof Error) {
    act = function (res) {
      throw new Exc(res.exception);
    };
  }

  invoker.knownErrors.push({
    test: test,
    act: act
  });
}

knownError(/no *such/i, errors.NotFound);
knownError(/no *\w+ *exists/i, errors.NotFound);
knownError(/principal *exception/i, errors.PrincipalException);
knownError(/please *sign/i, errors.Unauthorized);
knownError(/authenticated *access/i, errors.Unauthorized);
knownError(/no *json *web *service *action/i, errors.BadRequest);

invoker.parseErrors = parseErrors;
invoker.parseLiferayResponse = parseLiferayResponse;
invoker.retrieveBuildNumber = retrieveBuildNumber;
invoker.getBody = getBody;
invoker.getHost = getHost;

function getBody(res) {
  if (res.text === 'false' && res.type === 'text/javascript') return false;
  else return res.body;
}

var hosts = {};

function getHost(url) {
  if (!hosts[url]) {
    hosts[url] = url.match(/https?:\/\/[^\/]+\//)[0].slice(0, -1);
  }
  return hosts[url];
}

function retrieveBuildNumber(res) {
  var header = res.headers[ 'liferay-portal' ];

  if (!header) {
    throw res;
  }

  var match = header.match(/Build\s+(\d+)/i);

  if (!match) {
    throw res;
  }

  return parseInt(match[1], 10);
}

function parseErrors(err) {
  if (errors[err.error]) {
    throw new errors[err.error]();
  }
  else {
    throw err;
  }
}

function parseLiferayResponse(res) {
  var body = res.body;
  var text = res.text;

  if (res.xhr && res.xhr.clearCookies) {
    res.xhr.clearCookies(getHost(res.xhr.location));
  }

  var exception = body && body.exception || '';

  if (res.unauthorized) {
    throw new errors.Unauthorized(exception || body || text);
  }
  if (res.badrequest) {
    throw new errors.BadRequest(exception || body || text);
  }
  else if (!res.ok) {
    throw res;
  }

  if (!exception) {
    return res;
  }

  res.exception = exception;

  res.setStatusProperties(500);

  invoker.knownErrors.some(function (el) {
    if (el.test(exception)) {
      el.act(res);
      return true;
    }
  });

  throw res;
}

function isNested(payload) {
  Object.keys(payload).some(function (key) {
    return Object.keys(payload[ key ]).some(function (param) {
      return param.trim().charAt(0) === '$';
    });
  });
}

function jsonAdditionalParser(res, fn) {
  /*jshint validthis:true */
  var mime = res.headers['content-type'].split(/ *; */).shift();
  var type = mime.split('/').shift();
  var text = type === 'text';
  var parse = request.parse[ mime ] || (text ? request.parse.text : null);
  if (parse) return parse.call(this, res, fn);
  else fn(null);
}
