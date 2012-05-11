#!/usr/bin/env node
/*jshint asi:true*/

var EventEmitter = require('events').EventEmitter
var WebSocket = require('ws')
var createInspectorBackend = require('./InspectorBackend').createInspectorBackend
var async = require('async')

exports.createHeadlessInspector = function(config, callback){
  createInspectorBackend({debug:config.debug}, function(error, inspector){
    if (error) {callback(error);return}
    
    Object.keys(EventEmitter.prototype).forEach(function(key){
      Object.defineProperty(inspector, key, Object.getOwnPropertyDescriptor(EventEmitter.prototype, key))
    })
    EventEmitter.call(inspector)
    
    initWebSocket(config.ws, function(error, ws){
      if (error) {callback(error);return}
      inspector.socket = ws
      
      inspector.InspectorFrontendHost.sendMessageToBackend = ws.send.bind(ws)
      var inspector_InspectorBackend_dispatch = inspector.InspectorBackend.dispatch.bind(inspector.InspectorBackend)
      ws.on('message', inspector_InspectorBackend_dispatch)
      ws.on('close', function(){
        ws.removeListener('message', inspector_InspectorBackend_dispatch)
        delete inspector.InspectorFrontendHost.sendMessageToBackend
        // TODO: See if there's some official way to emit disconnection
      })
      
      initDispatchers(inspector, inspector.emit.bind(inspector))
      callback(null, inspector)
    })
  })
}


function initWebSocket(url, callback){
  var ws = new WebSocket(url)
  ws.on('open', function(){
    callback(null, ws)
  })
  ws.on('error', callback)
}

function initDispatchers(inspector, emit){
  var eventArgs = inspector.InspectorBackend._eventArgs
  var domains = {}
  Object.keys(eventArgs).forEach(function(methodName){
    var emitMethod = emit.bind(null, methodName)
    methodName = methodName.split('.')
    var domain = domains[methodName[0]]
    if (!domain) domain = domains[methodName[0]] = {}
    domain[methodName[1]] = emitMethod
  })
  Object.keys(domains).forEach(function(domainName){
    inspector.InspectorBackend.registerDomainDispatcher(domainName, domains[domainName])
  })
}

////////////////////////////////////////////////////////////////////////////////
// if (module.id == '.') {}
