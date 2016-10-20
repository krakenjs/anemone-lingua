/*───────────────────────────────────────────────────────────────────────────*\
 │  Copyright (C) 2014 eBay Software Foundation                                │
 │                                                                             │
 │hh ,'""`.                                                                    │
 │  / _  _ \  Licensed under the Apache License, Version 2.0 (the "License");  │
 │  |(@)(@)|  you may not use this file except in compliance with the License. │
 │  )  __  (  You may obtain a copy of the License at                          │
 │ /,'))((`.\                                                                  │
 │(( ((  )) ))    http://www.apache.org/licenses/LICENSE-2.0                   │
 │ `\ `)(' /'                                                                  │
 │                                                                             │
 │   Unless required by applicable law or agreed to in writing, software       │
 │   distributed under the License is distributed on an "AS IS" BASIS,         │
 │   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
 │   See the License for the specific language governing permissions and       │
 │   limitations under the License.                                            │
 \*───────────────────────────────────────────────────────────────────────────*/
 
'use strict';

var util = require('util');
var assert = require('assert');
var spundle = require('spundle');
var memoize = require('async').memoize;
var debug = require('debuglog')(require('../package').name);

var debugOptions = {
  colors: true
};

module.exports = function(options) {

  var initialized;
  var loadContent;
  var fallbackCountry;
  var fallbackLanguage;

  debug('initialize with options: ' + util.inspect(options, debugOptions));
  options = options || {};
  assert.strictEqual(typeof options, 'object', 'options must be an object');

  // for lazy initialization on
  // the very first request
  initialized = false;

  // default locale; if fallback is not there
  options.fallback = options.fallback || 'en-US';

  fallbackLanguage = options.fallback.split('-')[0];
  fallbackCountry = options.fallback.split('-')[1];

  // a function that loads the content files for a
  // given locale and then do some clean up.
  function _loadContent(locale, country, language, callback) {

    // use `spundle` to load up the content files
    // https://github.com/aredridel/spundle
    spundle(options.contentPath, country, language, function onSpundleLoad(err, out) {

      if (err) {
        return callback(err);
      }

      out = out[locale];

      if (!out) {
        // no content files were present for
        // the given country and language
        return callback();
      }

      Object.keys(out).map(function(name) {
        // index.properties becomes index
        out[name.replace('.properties', '')] = out[name];
        delete out[name];
      });

      debug('loaded and cleaned content from spundle: ' + util.inspect(out, debugOptions));

      callback(null, out);
    });
  }

  // a hasher generator for the async memoize operation
  // https://github.com/caolan/async#memoize
  function _loadContentHasher(locale, country, language) {
    return locale + country + language;
  }

  // the actual express middleware
  // that gets run for every request.
  return function reactContentLoader(req, res, next) {

    var locale;
    var country;
    var language;

    // middleware initialization happens
    // only once and on the very first request.
    if (!initialized) {
      initialized = !initialized;
      if (req.app.kraken.get('env').development !== true) {
        // memoize the content load operation
        // for non-dev environments!
        loadContent = memoize(_loadContent, _loadContentHasher);
      }
      else {
        loadContent = _loadContent;
      }
    }

    if(res.locals.contentLocale) {
        language = res.locals.contentLocale.language;
        country = res.locals.contentLocale.country;
    } else if (res.locals.context &&
        res.locals.context.locality &&
        res.locals.context.locality.language &&
        res.locals.context.locality.country) {
      language = res.locals.context.locality.language;
      country = res.locals.context.locality.country;
    }

    // use fallback stuff if locality
    // is not present in the `res.locals`
    country = country || fallbackCountry;
    language = language || fallbackLanguage;
    locale = language + '-' + country;

    if (res.locals.context && res.locals.context.locality) {
      debug('locale in req: ' + util.inspect(res.locals.context.locality, debugOptions));
    }
    else {
      debug('locality in req: res.locals.context.locality does not exist ');
    }
    debug('resolved locale: ' + locale);

    // callback after the content is loaded
    var onLoadContent = function onLoadContent(err, out) {
      if (err) {
        return next(err);
      }

      if (!out) {
        // if the content is not found for a given locale,
        // fallback to the specified fallback locale.
        // Note: The provided `fallback locale` should always exist!
        debug('content not found for the resolved locale: ' + locale);
        debug('fetching content for fallback locale: ' + options.fallback);
        return loadContent(options.fallback, fallbackCountry, fallbackLanguage, onLoadContent);
      }

      // attach the loaded content to the
      // message property of `res.locals`.
      res.locals.messages = out;

      // useful for Intl mixin
      // http://formatjs.io/react/
      res.locals.locales = locale;

      next();
    };

    loadContent(locale, country, language, onLoadContent);
  };
};
