#!/usr/bin/env node
/*jshint asi:true*/

var requirePollution = require('./require-pollution')

exports.createInspectorBackend = function(config, callback){
  
  var inspector = requirePollution.require([
    '../vendor/devtools_frontend/InspectorBackend',
    './InspectorFrontendHostStubStub',
    config.stub || '../vendor/devtools_frontend/InspectorBackendStub'
  ])
  
  config.debug = Boolean(config.debug)
  inspector.InspectorBackend.dumpInspectorProtocolMessages = config.debug
  // inspector.InspectorBackend.dumpInspectorTimeStats = config.debug
  inspector.console = Object.create(console)
  
  for (var key in inspector.InspectorBackend) {
    if (key.charAt(0) !== '_') continue
    Object.defineProperty(inspector.InspectorBackend, key, {enumerable:false, value:inspector.InspectorBackend[key]})
  }
  
  // this is quasi-async now because it may become async later and I don't want to have to change the API
  process.nextTick(function(){
    callback(null, inspector)
  })
}

////////////////////////////////////////////////////////////////////////////////
if (module.id == '.') {
  exports.createInspectorBackend({debug:true}, function(error, inspector){
    console.assert(inspector.console !== console)
    console.log(inspector)
  })
}
