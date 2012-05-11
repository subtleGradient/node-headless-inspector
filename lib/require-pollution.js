#!/usr/bin/env node
/*jshint asi:true*/

var fs = require('fs')
var vm = require('vm')

exports.cache = {}
exports.require = function(paths){
  var id = String(paths)
  if (!Array.isArray(paths)) paths = [paths]
  if (exports.cache[paths]) return exports.cache[id]
  var sources = []

  // Resolve all the paths
  for (var index=0; index < paths.length; index++) {
    paths[index] = require.resolve(paths[index])
  }
  
  var exportedGlobalObject = vm.createContext({console:console})
  vm.runInContext('window = this', exportedGlobalObject)
  
  for (var index=0; index < paths.length; index++) {
    vm.runInContext(fs.readFileSync(paths[index]), exportedGlobalObject, paths[index])
  }
  delete exportedGlobalObject.window
  return exports.cache[id] = exportedGlobalObject
}

var exportGlobals = function(){
  var exports = {}
  for (var key in this) exports[key] = this[key]
  return exports
}

////////////////////////////////////////////////////////////////////////////////
if (module.id == '.') {
  var tests = require('./require-pollution.test')
  Object.keys(tests).forEach(function(testName){
    tests[testName]()
  })
}
