![Headless Inspector](https://github.com/subtleGradient/node-headless-inspector/raw/master/headless-inspector.png)

# headless-inspector
## Headless Remote WebKit Inspector Client


### Usage

1. Launch a browser with remote webkit inspector server enabled

    open -a "Google Chrome Canary" --args --remote-debugging-port=9222 --user-data-dir="$TMPDIR/.chrome-user-data" about:blank

2. Find the first available debugger socket

    DEBUGGER_SOCKET=$(curl -s "http://localhost:9222/json"|grep webSocketDebuggerUrl|cut -d'"' -f4| head -1)


