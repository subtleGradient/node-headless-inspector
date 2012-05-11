#!/usr/bin/env bash

function download () {
  local NAME="$1"
  local ROOT="$(dirname "$0")"
  THE_PATH="$ROOT/$NAME"
  local THE_ZIP="${TMPDIR}$NAME.zip"

  if [[ -d "$THE_PATH" ]]; then
    echo "$THE_PATH already exists. Delete it if you want '$(basename "$0")' to re-fetch it." >&2
    return 0
  fi

  local LAST_CHANGE=$(curl -s http://commondatastorage.googleapis.com/chromium-browser-continuous/Mac/LAST_CHANGE)
  local THE_ZIP_URL="http://commondatastorage.googleapis.com/chromium-browser-continuous/Mac/$LAST_CHANGE/$NAME.zip"

  if [[ -f "$THE_ZIP" ]]; then
    echo "NOT downloading '$THE_ZIP_URL', it already exists here: '$THE_ZIP'" >&2
  else
    echo "Downloading '$THE_ZIP_URL'" >&2
    curl --output "$THE_ZIP" --silent --location "$THE_ZIP_URL"
  fi
  unzip "$THE_ZIP" -d "$THE_PATH"
  echo $LAST_CHANGE > "$THE_PATH.LAST_CHANGE.txt"
  echo "$THE_PATH"
}

function get () {
  download "$1"
  pushd "$THE_PATH/.."
    pushd "$THE_PATH"
    if [[ -d "$1" ]]; then
      pushd "$1"
      mv * ../
      popd
      rmdir -p "$THE_PATH/$1"
    fi
    [ $(ls|wc -l) == "1" ] && mv * ../
    popd
    rmdir -p "$THE_PATH"
  popd
  echo
}

# get "remoting-webapp"
get devtools_frontend
# get chrome-mac
