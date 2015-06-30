import text from "pink/lib/text";

module.exports = (CodeMirror, languages) => {
  CodeMirror.defineMIME("text/x-purescript", "haskell");

  function connect(url, proto) {
    let socket = new WebSocket(url, proto);
    let queue = {};
    let counter = 0;
    let connected = false;
    let backlog = [];

    const open = () => {
      console.log("REPL socket connected.");
      connected = true;
      if (backlog.length) {
        backlog.forEach((m) => socket.send(m));
        backlog = [];
      }
    };

    const close = () => {
      console.log("REPL socket closed.");
      connected = false;
      socket = new WebSocket(url, proto);
      init(socket);
      console.log("Reconnecting to REPL socket.");
    };

    const error = (err) => {
      console.error("REPL socket error:", err);
    };

    const message = ({data}) => {
      let msg = JSON.parse(data);
      console.log("Message from REPL:", msg);
      let id = msg.messageId;
      let callback = queue[id];
      if (callback) {
        delete queue[id];
        callback(msg);
      }
    };

    function init(socket) {
      socket.onopen = open;
      socket.onerror = error;
      socket.onclose = close;
      socket.onmessage = message;
    }

    init(socket);

    function send(obj, callback) {
      console.log("Sending to REPL:", obj);
      obj.messageId = "" + (++counter);
      queue[obj.messageId] = callback;
      obj = JSON.stringify(obj);
      if (connected) {
        socket.send(obj);
      } else {
        console.log("Backlogged:", obj);
        backlog.push(obj);
      }
    }

    function cleanup() {
      socket.onclose = undefined;
      socket.close();
      console.log("REPL socket cleaned up.");
    }

    return { send, close: cleanup };
  }

  function PureScript() {
    const socket = connect("ws://localhost:31336", "purescript-repl");

    this.cleanup = function cleanup() {
      socket.close();
    }

    this.compile = function compile(code, callback) {
      socket.send({compile: code, type: "text/x-purescript"}, (msg) => {
        if (msg.error.trim().length) {
          let m = msg.error.match(/line +(\d+), column (\d+)/m);
          if (m) {
            let line = parseInt(m[1], 10) - 1, col = parseInt(m[2], 10) - 1;
            let errmsg = msg.error.split("\n").slice(1, -1).join("\n");
            console.log(line, col, errmsg);
            callback(null, {errors: [{message: errmsg, pos: {line: line, col: col}}],
                            code: null})
          } else {
            callback("Unknown error output: " + msg.error);
          }
        } else {
          callback(null, {code: msg.result, errors: []});
        }
      });
    }

    this.evalCode = function evalCode(form, callback) {
      console.error("Eval not implemented!");
    }

    this.comment = function comment(code) {
      return "-- " + code;
    }
  }

  var out = Object.create(languages);
  out["text/x-purescript"] = PureScript;
  return out;
};
