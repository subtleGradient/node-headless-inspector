#!/usr/bin/env node
/*jshint asi:true*/

var createHeadlessInspector = require('./lib/HeadlessInspector').createHeadlessInspector
var launchChrome = require('./lib/launchChrome');

exports.repl = function(){
  
  console.log('Launching HeadlessInspector for Google Chrome...')
  console.log('    everything you type in this repl will be executed in node.js, not the browser. To speak to the browser, use the `i` object.')
  
  var child_process = require('child_process')
  var http = require('http')
  var url = require('url')
  var repl = require("repl")
  
  launchChrome(['--homepage=about:blank'], function(error, chrome, json){
    if (error) throw Error(error)
    
    var webSocketDebuggerUrl = json[0].webSocketDebuggerUrl
    createHeadlessInspector({ws:webSocketDebuggerUrl}, function(error, inspector){
      if (error) throw Error(error)
      
      // See vendor/devtools_frontend/InspectorBackendStub.js for available events and methods
      
      process.nextTick(function(){
        // var replClient = repl.start("i> ", null, remoteEval)
        
        console.log("Type `i.` and press ⇥ (tab) to see the available methods.")
        console.log('\ti — inspector object')
        console.log('\te — remoteEval')
        
        var replClient = repl.start("i> ")
        replClient.context.i =
        replClient.context.inspector = inspector
        replClient.context.chrome = chrome
        replClient.context.e = function(code){
          remoteEval(code, function(error, result){
            console.log('')
            if (result) console[error?'error':'log']('remoteEval result', result)
          })
        }
      })
      
      inspector.ConsoleAgent.enable()
      var lastConsoleMessage
      inspector.on("Console.messageAdded", function(message){
        console.warn('')
        console.warn('Console.messageAdded', lastConsoleMessage = message)
      })
      inspector.on("Console.messageRepeatCountUpdated", function(count){
        console.warn('')
        lastConsoleMessage.repeatCount = count
        console.warn('Console.messageRepeatCountUpdated', lastConsoleMessage)
      })
      // inspector.on("Console.messagesCleared", function(){})
      
      // inspector.TimelineAgent.start()
      // inspector.TimelineAgent.setIncludeMemoryDetails(true)
      // inspector.on('Timeline.eventRecorded', function(record) {
      //   console.warn('Timeline.eventRecorded', record.type, JSON.stringify(record))
      // })
      
      // inspector.on('Debugger.paused', function(callFrames, reason, data){
      //   console.log(callFrames)
      // })
      
      function remoteEvalWrapped(code, context, file, callback){
        remoteEval(code, callback)
      }
      function remoteEval(code, callback){
        inspector.RuntimeAgent.evaluate(code, function(error, result, wasThrown){
          if (error) return callback(error, result)
          if (wasThrown) return callback(JSON.stringify(result,null,2), result)
          callback(null, result)
        })
      }
      
      // inspector.DebuggerAgent.enable(function() {
      // })
      
    })
  })
  
}

////////////////////////////////////////////////////////////////////////////////
if (module.id == '.') exports.repl()
