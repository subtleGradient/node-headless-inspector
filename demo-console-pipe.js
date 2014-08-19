#!/usr/bin/env node
/*jshint asi:true*/

var createHeadlessInspector = require('./lib/HeadlessInspector').createHeadlessInspector
var launchChrome = require('./lib/launchChrome');

exports.repl = function(){
  
  console.log('Launching HeadlessInspector for Google Chrome...')
  console.log('    everything you type in this repl will be executed in the context of the currently open window')
  
  launchChrome(['--homepage=about:blank'], function(error, chrome, json){
    if (error) throw Error(error)
    
    var webSocketDebuggerUrl = json[0].webSocketDebuggerUrl
    createHeadlessInspector({ws:webSocketDebuggerUrl}, function(error, inspector){
      if (error) console.error(error);

      inspector.ConsoleAgent.enable()
      var lastConsoleMessage
      inspector.on("Console.messageAdded", function(message){
        lastConsoleMessage = message
        console[lastConsoleMessage.type](lastConsoleMessage.text)
      })
      inspector.on("Console.messageRepeatCountUpdated", function(count){
        lastConsoleMessage.repeatCount = count
        console[lastConsoleMessage.type](lastConsoleMessage.text)
      })
      
      function remoteEval(code, callback){
        inspector.RuntimeAgent.evaluate(code, function(error, result, wasThrown){
          if (error) return callback(error, result)
          if (wasThrown) return callback(JSON.stringify(result,null,2), result)
          callback(null, result)
        })
      }
      
      remoteEval('location = ' + JSON.stringify(process.argv[2] || 'http://www.quirksmode.org/dom/events/tests/click.html'), function(){
        console.warn(arguments)
      })
      
    })
  })
  
  
}


////////////////////////////////////////////////////////////////////////////////
if (module.id == '.') exports.repl()
