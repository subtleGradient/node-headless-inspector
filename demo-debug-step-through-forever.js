#!/usr/bin/env node
/*jshint asi:true*/

var createHeadlessInspector = require('./lib/HeadlessInspector').createHeadlessInspector
var launchChrome = require('./lib/launchChrome');



var ansi = require('ansi')
  , cursor = ansi(process.stdout)

var THE_URL_TO_DEBUG = process.argv[2] || 'http://www.quirksmode.org/dom/events/tests/click.html';

launchChrome(['--homepage=about:blank'], function(error, chrome, json){
  if (error) throw Error(error)
  
  var webSocketDebuggerUrl = json[0].webSocketDebuggerUrl
  createHeadlessInspector({ws:webSocketDebuggerUrl}, function(error, inspector){
    if (error) return console.error(error);
    var scripts = {};

    inspector.on('Debugger.scriptParsed', function(scriptId, url, startLine, startColumn, endLine, endColumn, isContentScript, sourceMapURL) {
      console.log('Debugger.scriptParsed', scriptId, url)
      scripts[scriptId] = {
        scriptId: scriptId,
        url: url,
        startLine: startLine,
        startColumn: startColumn,
        endLine: endLine,
        endColumn: endColumn,
        isContentScript: isContentScript,
        sourceMapURL: sourceMapURL
      }
      inspector.DebuggerAgent.getScriptSource(scriptId, function(error, scriptSource) {
        scripts[scriptId].source = scriptSource
      })
      // inspector.DebuggerAgent.setBreakpointByUrl(startLine, url, undefined, startColumn, undefined, function(){});
    })

    // inspector.on('Debugger.breakpointResolved', function(breakpointId, location) {
    //   console.log('Debugger.breakpointResolved', breakpointId, location)
    // })
    // inspector.on('Debugger.resumed', function(){
    //   // console.log('——Debugger.resumed——');
    // })
    // inspector.on('Debugger.paused', function(callFrames, reason, data){
    //   if (reason && reason != 'other') console.warn('——Debugger.paused——', reason, data)
    // })

    inspector.DebuggerAgent.enable(function(){
      breakAllThePoints()
    });

    inspector.on('Debugger.paused', function(callFrames, reason, data) {
      if (reason && reason != 'other') console.warn('\n——Debugger.paused——', reason, data);

      // var times = 10;
      // while (--times) inspector.DebuggerAgent.stepInto();
      inspector.DebuggerAgent.stepInto();

      // console.warn('——DebuggerAgent.stepInto——');
      // console.warn('——Debugger.paused——')
      // console.log(callFrames, reason, data)
      // steps.push(callFrames)
      // console.log(callFrames.map(function(callFrame){return scripts[callFrame.location.scriptId]&&scripts[callFrame.location.scriptId].url}))

      // var log = []
      // for (var location, callFrame, index = callFrames.length; --index >= 0;) {
      //   callFrame = callFrames[index];
      //   location = callFrame.location;
      //   log.push('/*'+ callFrame.functionName +'*/');
      //   log.push('/*'+(scripts[location.scriptId] && scripts[location.scriptId].source || '').split('\n')[location.lineNumber - 1]);
      // }
      // console.log(log.join('\t'))

      // console.log(locations[0])

      var locations = callFrames.map(function(callFrame){return callFrame.location});

      ;[locations[0]].map(function(location){
      
        var line = (scripts[location.scriptId] && scripts[location.scriptId].source || '').split(/\r?\n/)[location.lineNumber-1];
        if (!line) line = '';
        var maxColumn = 80;
        var minColumn = location.columnNumber-maxColumn;
        if (minColumn < 0) minColumn = 0;
        
        var prefixCode = line.substring(minColumn,location.columnNumber).replace(/\t/g,'    ');
        var postfixCode = line.substring(location.columnNumber,maxColumn).replace(/\t/g,'    ');
        
        var codeLength =  + maxColumn - prefixCode.length - postfixCode.length + 1;
        
        cursor
          .bg.grey()
          .write(prefixCode)
          .bg.reset()
          .write(postfixCode + Array(codeLength >= 0 ? codeLength : 0).join(' '))
        ;
      })

      cursor.write('\t')
      cursor.write(
        scripts[callFrames[0].location.scriptId] && scripts[callFrames[0].location.scriptId].url
        +':'+
        callFrames[0].location.lineNumber
        +':'+
        callFrames[0].location.columnNumber
      );

      cursor.write('\t')
      cursor.write(
        callFrames.map(function(callFrame){return callFrame.functionName}).reverse().join(' → ')
      );

      cursor.write('\n')
    })


    // inspector.ConsoleAgent.enable()
    // inspector.TimelineAgent.setIncludeMemoryDetails(true)

/*
    inspector.TimelineAgent.start()
    inspector.on('Timeline.eventRecorded', function(record) {
      console.log('Timeline.eventRecorded', record.data && record.data && record.data.type || record.type)
    })
*/

    function code(props) {
      setTimeout(function(){
        location = props.location;
      }, 1000);
    }
    inspector.RuntimeAgent.evaluate('(' + code.toString() + '.call(window, '+JSON.stringify({
      location:THE_URL_TO_DEBUG,
    })+'))', function(error, result, wasThrown) {
      paws();
    });

    function paws(callback){
      inspector.DebuggerAgent.enable();
      // inspector.DebuggerAgent.resume();
      inspector.DebuggerAgent.pause(callback);
      // inspector.RuntimeAgent.evaluate('Date.now()', function(error, result, wasThrown){
      //   inspector.DebuggerAgent.enable(function(){
      //     inspector.DebuggerAgent.resume(function(){
      //       inspector.DebuggerAgent.pause(callback);
      //     });
      //   });
      // });
    }

    function breakAllThePoints(callback) {

      // inspector.DOMAgent.setTouchEmulationEnabled(true)

      inspector.DebuggerAgent.setBreakpointsActive(true)

      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("requestAnimationFrame")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("cancelAnimationFrame")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("animationFrameFired")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("resize")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("scroll")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("zoom")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("focus")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("blur")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("select")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("change")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("submit")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("reset")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("copy")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("cut")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("paste")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("beforecopy")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("beforecut")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("beforepaste")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("DOMActivate")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("DOMFocusIn")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("DOMFocusOut")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("DOMAttrModified")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("DOMCharacterDataModified")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("DOMNodeInserted")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("DOMNodeInsertedIntoDocument")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("DOMNodeRemoved")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("DOMNodeRemovedFromDocument")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("DOMSubtreeModified")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("DOMContentLoaded")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("deviceorientation")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("devicemotion")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("dragenter")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("dragover")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("dragleave")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("drop")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("keydown")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("keyup")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("keypress")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("input")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("load")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("beforeunload")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("unload")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("abort")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("error")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("hashchange")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("popstate")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("click")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("dblclick")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("mousedown")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("mouseup")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("mouseover")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("mousemove")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("mouseout")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("mousewheel")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("wheel")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("setTimer")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("clearTimer")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("timerFired")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("touchstart")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("touchmove")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("touchend")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("touchcancel")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("webglErrorFired")
      inspector.DOMDebuggerAgent.setEventListenerBreakpoint("webglWarningFired")

      inspector.DebuggerAgent.setBreakpointsActive(true, callback)

/*
      inspector.DOMDebuggerAgent.removeEventListenerBreakpoint("DOMContentLoaded")
      inspector.DOMDebuggerAgent.removeEventListenerBreakpoint("keydown")
      inspector.DOMDebuggerAgent.removeEventListenerBreakpoint("keyup")
      inspector.DOMDebuggerAgent.removeEventListenerBreakpoint("keypress")
      inspector.DOMDebuggerAgent.removeEventListenerBreakpoint("textInput")
      inspector.DOMDebuggerAgent.removeEventListenerBreakpoint("click")
      inspector.DOMDebuggerAgent.removeEventListenerBreakpoint("dblclick")
      inspector.DOMDebuggerAgent.removeEventListenerBreakpoint("mousedown")
      inspector.DOMDebuggerAgent.removeEventListenerBreakpoint("mouseup")
      inspector.DOMDebuggerAgent.removeEventListenerBreakpoint("mouseover")
      inspector.DOMDebuggerAgent.removeEventListenerBreakpoint("mousemove")
      inspector.DOMDebuggerAgent.removeEventListenerBreakpoint("mouseout")
      inspector.DOMDebuggerAgent.removeEventListenerBreakpoint("mousewheel")
*/

    }

  })

});
