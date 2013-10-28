#!/usr/bin/env node
/*jshint asi:true*/

var createHeadlessInspector = require('./lib/HeadlessInspector').createHeadlessInspector

exports.repl = function(){
  
  console.log('Launching HeadlessInspector for Google Chrome Canary...')
  console.log('    everything you type in this repl will be executed in the context of the currently open window')
  
  var child_process = require('child_process')
  var http = require('http')
  var url = require('url')
  var repl = require("repl")
  
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
      
      remoteEval('location = ' + JSON.stringify(process.argv[2] || 'http://localhost:8080/'), function(){
        console.warn(arguments)
      })
      
    })
  })
  
  function launchChrome(args, callback){
    // http://peter.sh/experiments/chromium-command-line-switches/
    var bin = '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary'
    args = args.concat(['--no-first-run', '--remote-debugging-port=9223', "--js-flags=--expose-gc", '--enable-memory-info', '--user-data-dir='+process.env.TMPDIR+'/.chrome-user-data',
      'about:blank'
    ])
    args.reverse()
    console.warn()
    console.warn('bin', bin)
    console.warn('args', args)
    var chrome = child_process.execFile(bin, args)
    chrome.on('exit', function(exitCode){
      console.log(bin, 'exited with', exitCode)
      process.exit(exitCode)
    })
    process.on('exit', function(){
      chrome.kill()
    })
    // process.on('uncaughtException', function(error){
    //   chrome.kill()
    //   console.error('uncaughtException', error)
    // })
    setTimeout(function(){
      http.get(url.parse('http://localhost:9223/json'), function(response){
        response.on('data', function(data){
          callback(null, chrome, JSON.parse(''+data))
        })
      }).on('error', function(error){
        chrome.kill()
        callback(error)
      })
    }, 250)
  }
  
}

////////////////////////////////////////////////////////////////////////////////
if (module.id == '.') exports.repl()
