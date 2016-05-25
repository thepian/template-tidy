/**
 * grunt-angular-translate
 * https://github.com/firehist/grunt-angular-translate
 *
 * Copyright (c) 2013 "firehist" Benjamin Longearet, contributors
 * Licensed under the MIT license.
 *
 */

'use strict';

var _file;
var debug = require('debug')('tidy');
var Utils = require('./utils.js');
var Translations = require('./translations.js');

module.exports = JsonAdapter;

function JsonAdapter(grunt) {
_file = grunt.file;
}

JsonAdapter.prototype.init = function(params) {
    this.dest = params.dest || '.';
    this.lang = params.lang;
    this.prefix = params.prefix;
    this.suffix = params.suffix || '.json';
    this.source = params.source;
    this.defaultLang = params.defaultLang;
    this.stringifyOptions = params.stringifyOptions;
};

JsonAdapter.prototype.persist = function(_translation) {
var lang = this.lang;
var dest = this.dest;
var prefix = this.prefix;
var suffix = this.suffix;
var source = this.source || '';
var defaultLang = this.defaultLang || '.';
var stringify_options = this.stringifyOptions || null;

  // Build all output language files
lang.forEach(function (lang) {

  var destFilename = dest + '/' + prefix + lang + suffix,
    filename = source,
    translations = {},
    json = {};

  // Test source filename
  if (filename === '' || !_file.exists(filename)) {
    filename = destFilename;
  }

  debug('Process ' + lang + ' : ' + filename);

  var isDefaultLang = (defaultLang === lang);
  if (!_file.exists(filename)) {
    debug('File doesn\'t exist');

    debug('Create file: ' + destFilename + (isDefaultLang ? ' (' + lang + ' is the default language)' : ''));
    translations = _translation.getMergedTranslations({}, isDefaultLang);

  } else {
    debug('File exist');
    json = _file.readJSON(filename);
    translations = _translation.getMergedTranslations(Translations.flatten(json), isDefaultLang);
  }

  var stats = _translation.getStats();
  var statEmptyType = _translation.params.nullEmpty ? "null" : "empty";
  var statPercentage =  Math.round(stats[statEmptyType] / stats["total"] * 100);
  statPercentage = isNaN(statPercentage) ? 100 : statPercentage;
  var statsString = "Statistics : " +
    statEmptyType + ": " + stats[statEmptyType] + " (" + statPercentage + "%)" +
    " / Updated: " + stats["updated"] +
    " / Deleted: " + stats["deleted"] +
    " / New: " + stats["new"];

  debug.writeln(statsString);

  // Write JSON file for lang
  var utils = new Utils();
  _file.write(destFilename, utils.customStringify(translations, stringify_options) + '\n');

});
};
