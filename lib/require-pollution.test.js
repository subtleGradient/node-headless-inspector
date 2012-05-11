#!/usr/bin/env node
/*jshint asi:true*/

exports.testGlobalRequire = function(){
  var oldWindow = global.window
  var exportedGlobals = require('./require-pollution').require(['./require-pollution.mock', './require-pollution.mock1'])
  console.assert(exportedGlobals.pollution)
  console.assert(exportedGlobals.pollution1)
  console.assert(exportedGlobals.pollution.pollution1 === exportedGlobals.pollution1)
  
  console.assert(!('window' in exportedGlobals), 'must not create a global window object')
  console.assert(oldWindow === global.window, 'must not change the value of global.window')
  console.assert(exportedGlobals.pollution, 'must export the pollution')
  console.assert(exportedGlobals.pollution.isSilly, 'must export the pollution without breaking it or something')
  
  var exportedGlobalsAgain = require('./require-pollution').require(['./require-pollution.mock', './require-pollution.mock1'])
  
  console.assert(require('util') === require('util'), 'must return the same exact object every time it is called')
  console.assert(exportedGlobalsAgain === exportedGlobals, 'must return the same exact object every time it is called')
}

if (module.id == '.') Object.keys(exports).forEach(function(testName){ exports[testName]() })
