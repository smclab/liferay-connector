
"use strict";

var CACHE = exports.CACHE = {};
exports.isUpperCase = isUpperCase;
exports.normalize = normalize;
exports.normalizeParameter = normalizeParameter;

function isUpperCase(c) {
  return (c !== c.toLowerCase());
}

function normalize(s) {
  if (s in CACHE) return CACHE[ s ];

  var buffer = '';
  var upperCase = false;
  var l = s.length;

  var c, nextUpperCase;
  for (var i = 0; i < s.length; ++i) {
    c = s.charAt(i);

    if (i < (l - 1)) {
      nextUpperCase = isUpperCase(s.charAt(i + 1));
    }

    if ((i > 0) && isUpperCase(c)) {
      if (upperCase && nextUpperCase) {
        c = c.toLowerCase();
      }

      upperCase = true;
    }
    else {
      upperCase = false;
    }

    buffer += c;
  }

  return (CACHE[ s ] = buffer);
}

function normalizeParameter(parameter) {
  var parts = parameter.split('.');
  parts[ 0 ] = normalize(parts[ 0 ]);
  return parts.join('.');
}

/*
require('superagent').get('http://liferay62.smc.it/api/jsonws?discover=*').end(function (err, res) {
  var changed = {};
  var cache = {};
  var errors = [];

  res.body.actions.forEach(function (action) {
    action.parameters.forEach(function (parameter) {
      if (parameter.name in cache) return;

      var normalized = cache[ parameter.name ] = normalize(parameter.name);

      if (parameter.name !== normalized) {
        changed[ parameter.name ] = normalized;
      }
      else {
        return;
      }

      if (normalized !== normalize(normalized)) errors.push(parameter.name);
    });
  });

  console.log(JSON.stringify(changed, null, 2));
});
*/
