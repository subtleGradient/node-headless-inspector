#!/usr/bin/env node
/*jshint asi:true*/

var repl = require("repl")
var child_process = require('child_process')
var http = require('http')
var url = require('url')

module.exports = launchChrome;
function launchChrome(args, callback){
  // http://peter.sh/experiments/chromium-command-line-switches/
  var bin = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  args = args.concat(['--no-first-run', '--remote-debugging-port=9223', "--js-flags=--expose-gc", '--enable-memory-info', '--user-data-dir='+process.env.TMPDIR+'/.chrome-user-data',
    'about:blank'
  ])
  args.reverse()
  console.warn()
  console.warn('bin', bin)
  console.warn('args', args)
  var chrome = child_process.spawn(bin, args)
  chrome.on('exit', function(exitCode){
    console.log(bin, 'exited with', exitCode)
    process.exit(exitCode)
  })
  process.on('exit', function(){
    chrome.kill()
  })
  tryToConnectSoon()

  var connectionAttempts = 10;
  function tryToConnectSoon(){
    --connectionAttempts;
    if (connectionAttempts <= 0) {
      chrome.kill();
      callback(Error("Timed out trying to connect to Chrome"));
      return;
    }
    setTimeout(tryToConnect, 250);
  }
  function tryToConnect(){
    http.get(url.parse('http://localhost:9223/json'), function(response){
      response.on('readable', function(){
        callback(null, chrome, JSON.parse(''+this.read()));
      });
    }).on('error', function(error){
      tryToConnectSoon();
    });
  }
}

if (module.id == '.') {
  launchChrome(['--homepage=about:blank'], function(error, chrome, json){
    console.log(arguments)
  });
}
