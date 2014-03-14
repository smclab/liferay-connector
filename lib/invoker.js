var errors = require('./errors');
var request = require('./request');
var package = require('../package');
var btoa = require('btoa');

module.exports = invoker;

var toString = Object.prototype.toString;

function invoker(portalURL, path, auth, payload) {
  var req = request.post(portalURL + path);

  req.parse && req.parse(request.parse[ 'application/json' ]);
  req.set({"Accept-Encoding" : ""});

  if (arguments.length === 3) {
    payload = auth;
    auth = null;
  }

  if (auth != null) {
    req.set('Authorization', 'Basic ' + btoa(auth.login + ':' + auth.password));
  }

  req.set({ 'User-Agent': 'liferay-core-connector v' + package.version });

  req.redirects(0);

  req.type('json').send(payload);

  return req;
}

invoker.knownErrors = [];

function knownError(test, act) {
  var re = test;
  var exc = act;
  var status = act;

  if (toString.call(test) === '[object RegExp]') {
    test = function (input) {
      return re.test(input);
    };
  }

  if (typeof act === 'number') {
    act = function (res) {
      res.setStatusProperties(el.status);
    };
  }
  else if (act.prototype instanceof Error) {
    act = function (res) {
      throw new exc(res.exception);
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

invoker.parseLiferayResponse = parseLiferayResponse;
invoker.retrieveBuildNumber = retrieveBuildNumber;
invoker.getBody = getBody;
invoker.getHost = getHost;

function getBody(res) {
  return res.body;
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

  var found = invoker.knownErrors.some(function (el) {
    if (el.test(exception)) {
      el.act(res)
      return true;
    }
  });

  throw res;
}
