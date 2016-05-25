'use strict';

// Shorcuts!
var Translations = require('./lib/translations.js');
var PotAdapter = require('./lib/pot-adapter.js');
var JsonAdapter = require('./lib/json-adapter.js');
var stringify = require('json-stable-stringify');
var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    interpolation = {startDelimiter: '{{', endDelimiter: '}}'};
var debug = require('debug')('tidy');


// Regexs that will be executed on files
var regexs = {
  commentSimpleQuote: '\\/\\*\\s*i18nextract\\s*\\*\\/\'((?:\\\\.|[^\'\\\\])*)\'',
  commentDoubleQuote: '\\/\\*\\s*i18nextract\\s*\\*\\/"((?:\\\\.|[^"\\\\])*)"',
  HtmlFilterSimpleQuote: escapeRegExp(interpolation.startDelimiter) + '\\s*(?:::)?\'((?:\\\\.|[^\'\\\\])*)\'\\s*\\|\\s*translate(:.*?)?\\s*' + escapeRegExp(interpolation.endDelimiter),
  HtmlFilterDoubleQuote: escapeRegExp(interpolation.startDelimiter) + '\\s*(?:::)?"((?:\\\\.|[^"\\\\\])*)"\\s*\\|\\s*translate(:.*?)?\\s*' + escapeRegExp(interpolation.endDelimiter),
  HtmlFilterTernary: escapeRegExp(interpolation.startDelimiter) + '\\s*(?:::)?([^?]*\\?[^:]*:[^|}]*)\\s*\\|\\s*translate(:.*?)?\\s*' + escapeRegExp(interpolation.endDelimiter),
  HtmlDirective: '<(?:[^>"]|"(?:[^"]|\\/")*")*\\stranslate(?:>|\\s[^>]*>)([^<]*)',
  HtmlDirectiveSimpleQuote: '<(?:[^>"]|"(?:[^"]|\\/")*")*\\stranslate=\'([^\']*)\'[^>]*>([^<]*)',
  HtmlDirectiveDoubleQuote: '<(?:[^>"]|"(?:[^"]|\\/")*")*\\stranslate="([^"]*)"[^>]*>([^<]*)',
  HtmlDirectivePluralLast: 'translate="((?:\\\\.|[^"\\\\])*)".*angular-plural-extract="((?:\\\\.|[^"\\\\])*)"',
  HtmlDirectivePluralFirst: 'angular-plural-extract="((?:\\\\.|[^"\\\\])*)".*translate="((?:\\\\.|[^"\\\\])*)"',
  HtmlNgBindHtml: 'ng-bind-html="\\s*\'((?:\\\\.|[^\'\\\\])*)\'\\s*\\|\\s*translate(:.*?)?\\s*"',
  HtmlNgBindHtmlTernary: 'ng-bind-html="\\s*([^?]*?[^:]*:[^|}]*)\\s*\\|\\s*translate(:.*?)?\\s*"',
  JavascriptServiceSimpleQuote: '\\$translate\\(\\s*\'((?:\\\\.|[^\'\\\\])*)\'[^\\)]*\\)',
  JavascriptServiceDoubleQuote: '\\$translate\\(\\s*"((?:\\\\.|[^"\\\\])*)"[^\\)]*\\)',
  JavascriptServiceArraySimpleQuote: '\\$translate\\((?:\\s*(\\[\\s*(?:(?:\'(?:(?:\\.|[^.*\'\\\\])*)\')\\s*,*\\s*)+\\s*\\])\\s*)\\)',
  JavascriptServiceArrayDoubleQuote: '\\$translate\\((?:\\s*(\\[\\s*(?:(?:"(?:(?:\\.|[^.*\'\\\\])*)")\\s*,*\\s*)+\\s*\\])\\s*)\\)',
  JavascriptServiceInstantSimpleQuote: '\\$translate\\.instant\\(\\s*\'((?:\\\\.|[^\'\\\\])*)\'[^\\)]*\\)',
  JavascriptServiceInstantDoubleQuote: '\\$translate\\.instant\\(\\s*"((?:\\\\.|[^"\\\\])*)"[^\\)]*\\)',
  JavascriptFilterSimpleQuote: '\\$filter\\(\\s*\'translate\'\\s*\\)\\s*\\(\\s*\'((?:\\\\.|[^\'\\\\])*)\'[^\\)]*\\)',
  JavascriptFilterDoubleQuote: '\\$filter\\(\\s*"translate"\\s*\\)\\s*\\(\\s*"((?:\\\\.|[^"\\\\\])*)"[^\\)]*\\)'
};

// customRegex = _.isArray(options.customRegex) || _.isObject(options.customRegex) ? options.customRegex : [],
// _.forEach(customRegex, function (regex, key) {
//   if (_.isObject(customRegex) && !_.isArray(customRegex)) {
//     regexs[key] = key;
//   } else {
//     regexs['others_' + key] = regex;
//   }
// });

for(var rk in regexs) {
    regexs[rk] = new RegExp(regexs[rk], "gi");
}

/**
 * Returns the findings in the source code
 */
exports.scanSource = function() {

};

exports.unusedTranslations = function(options,done) {

    interpolation = options.interpolation || {startDelimiter: '{{', endDelimiter: '}}'};

    var cwd = options.cwd || process.cwd(),
        lang = options.lang || [],
        nullEmpty = options.nullEmpty || false,
        namespace = options.namespace || false,
        safeMode = options.safeMode ? true : false,
        existingJSON = {};

    if (options.angularJSON) {
        lang.forEach(function(lang) {
            existingJSON[lang] = [];
            options.angularJSON.forEach(function(json) {
                existingJSON[lang].push(path.join(cwd,json.replace('*',lang)));
            });
        });
    }
    if (options.angularJSON) options.angularJSON.forEach(function(json) {
        lang.forEach(function(lang) {
        });
    });

    var templates = [];

    options.templates.forEach(function(pattern) {
        glob.sync(pattern, {cwd:cwd}).forEach(function(path) {
            var content = fs.readFileSync(path,'utf8');
            templates.push(content);
        });
    });

    var js = [];

    options.js.forEach(function(pattern) {
        glob.sync(pattern, {cwd:cwd}).forEach(function(path) {
            var content = fs.readFileSync(path,'utf8');
            js.push(content);
        });
    });

    console.info('translations:',Object.keys(existingJSON), 'templates:', templates.length, 'js:', js.length);

    // var files = _file.expand(this.data.src),
    //   dest = this.data.dest || '.',
    //   jsonSrc = _file.expand(this.data.jsonSrc || []),
    //   jsonSrcName = _.union(this.data.jsonSrcName || [], ['label']),
    //   source = this.data.source || '',
    //   defaultLang = this.data.defaultLang || '.',
    //   prefix = this.data.prefix || '',
    //   suffix = this.data.suffix,
    //   stringify_options = this.data.stringifyOptions || null,
    //   keyAsText = this.data.keyAsText || false,
    //   adapter = this.data.adapter || 'json';

    // Parse all extra files to extra


    // Create translation object
    var _translation = new Translations({
      "safeMode": safeMode,
      "tree": namespace,
      "nullEmpty": nullEmpty,
      "existing": existingJSON
    });

    var missing = [];

    _translation.forAllExisting(function(key,config) {
        config.found = foundKey(key);
        // unknown vs missing vs maybe
        if (config.found.unknown) {
            missing.push(key);
        }
    });

    console.info('Total:', Object.keys(_translation.existing.all).length, 'Missing:', missing.length);

    return missing;

    function foundKey(key) {
        var found = { maybe: false, found: false, missing:true },
            prefix = key.split('.')[0] + '.';

        templates.forEach(function(content) {
            if (content.indexOf(key) >= 0) found.knownKey = true;
            if (content.indexOf('>'+ key +'<') >= 0 ||
                content.indexOf('"'+ key +'"') >= 0 ||
                content.indexOf(key) >= 0 ||
                content.indexOf("'"+ key +"'") >= 0) found.maybe = true;
        });
        js.forEach(function(content) {
            if (content.indexOf(key) >= 0) found.knownKey = true;
            if (content.indexOf('"'+ key +'"') >= 0 ||
                content.indexOf("'"+ key +"'") >= 0) found.maybe = true;
        });

        found.unknown = !found.knownKey; // key wasn't found at all
        found.missing = !found.maybe; // doesn't seem to be in the right places

        // Execute all regex defined at the top of this file
        for (var i in regexs) {
          switch (i) {
            // Case filter HTML simple/double quoted
            case "HtmlFilterSimpleQuote":
            case "HtmlFilterDoubleQuote":
            case "HtmlDirective":
            case "HtmlDirectivePluralLast":
            case "HtmlDirectivePluralFirst":
            case "JavascriptFilterSimpleQuote":
            case "JavascriptFilterDoubleQuote":
              // Match all occurences
              var matches = content.match(regexs[i]);
              if (_.isArray(matches) && matches.length) {
                // Through each matches, we'll execute regex to get translation key
                for (var index in matches) {
                  if (matches[index] !== "") {
                    _extractTranslation(i, regexs[i], matches[index], results);
                  }
                }

              }
              break;
            // Others regex
            default:
              _extractTranslation(i, regexs[i], content, results);

          }
        }

        return found;
    }
/*
    // Prepare some params to pass to the adapter
    var params = {
      lang: this.data.lang,
      dest: dest,
      prefix: prefix,
      suffix: suffix,
      source: this.data.source,
      defaultLang: this.data.defaultLang,
      stringifyOptions: this.data.stringifyOptions
    };

    switch(adapter) {
      case 'pot':
        var toPot = new PotAdapter(grunt);
        toPot.init(params);
        _translation.persist(toPot);
        break;
      default:
        var toJson = new JsonAdapter(grunt);
        toJson.init(params);
        _translation.persist(toJson);
    };
*/
};

// Use to escape some char into regex patterns
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

// Extract regex strings from content and feed results object
function _extractTranslation(regexName, regex, content, results) {
  var r;
  _log.debug("---------------------------------------------------------------------------------------------------");
  _log.debug('Process extraction with regex : "' + regexName + '"');
  _log.debug(regex);
  regex.lastIndex = 0;
  while ((r = regex.exec(content)) !== null) {

    // Result expected [STRING, KEY, SOME_REGEX_STUF]
    // Except for plural hack [STRING, KEY, ARRAY_IN_STRING]
    if (r.length >= 2) {
      var translationKey, evalString;
      var translationDefaultValue = "";

      switch (regexName) {
        case 'HtmlDirectiveSimpleQuote':
        case 'HtmlDirectiveDoubleQuote':
          translationKey = r[1].trim();
          translationDefaultValue = (r[2] || "").trim();
          break;
        case 'HtmlDirectivePluralFirst':
          if (!r.length > 2) {
            return;
          }
          var tmp = r[1];
          r[1] = r[2];
          r[2] = tmp;
        case 'HtmlDirectivePluralLast':
          evalString = eval(r[2]);
          if (_.isArray(evalString) && evalString.length >= 2) {
            translationDefaultValue = "{NB, plural, one{" + evalString[0] + "} other{" + evalString[1] + "}" + (evalString[2] ? ' ' + evalString[2] : '') + "}";
          }
          translationKey = r[1].trim();
          break;
        default:
          translationKey = r[1].trim();
      }

      // Avoid empty translation
      if (translationKey === "") {
        return;
      }

      switch (regexName) {
        case "commentSimpleQuote":
        case "HtmlFilterSimpleQuote":
        case "JavascriptServiceSimpleQuote":
        case "JavascriptServiceInstantSimpleQuote":
        case "JavascriptFilterSimpleQuote":
        case "HtmlNgBindHtml":
          translationKey = translationKey.replace(/\\\'/g, "'");
          break;
        case "commentDoubleQuote":
        case "HtmlFilterDoubleQuote":
        case "JavascriptServiceDoubleQuote":
        case "JavascriptServiceInstantDoubleQuote":
        case "JavascriptFilterDoubleQuote":
          translationKey = translationKey.replace(/\\\"/g, '"');
          break;
        case "JavascriptServiceArraySimpleQuote":
        case "JavascriptServiceArrayDoubleQuote":
          var key;

          if(regexName === "JavascriptServiceArraySimpleQuote") {
            key = translationKey.replace(/'/g, '');
          } else {
            key = translationKey.replace(/"/g, '');
          }
          key = key.replace(/[\][]/g, '');
          key = key.split(',');

          key.forEach(function(item){
            item = item.replace(/\\\"/g, '"').trim();
            if (item !== '') {
              results[item] = translationDefaultValue;
            }
          });
          break;
      }

      // Check for customRegex
      if (_.isObject(customRegex) && !_.isArray(customRegex) && customRegex.hasOwnProperty(regexName)) {
        if (_.isFunction(customRegex[regexName])) {
          translationKey = customRegex[regexName](translationKey) || translationKey;
        }
      }

      // Store the translationKey with the value into results
      function defaultValueByTranslationKey(translationKey, translationDefaultValue) {
        if (regexName !== "JavascriptServiceArraySimpleQuote" &&
          regexName !== "JavascriptServiceArrayDoubleQuote") {
          if (keyAsText === true && translationDefaultValue.length === 0) {
            results[translationKey] = translationKey;
          } else {
            results[translationKey] = translationDefaultValue;
          }
        }
      }

      // Ternary operation
      var ternaryKeys = _extractTernaryKey(translationKey)
      if (ternaryKeys) {
        _.forEach(ternaryKeys, function(v) {
          defaultValueByTranslationKey(v);
        });
      } else {
        defaultValueByTranslationKey(translationKey, translationDefaultValue);
      }

    }
  }
}
