import compile from "./compile";

import fs from "fs";
import path from "path";
import webpack from "webpack";
import WS from "websocket";
import http from "http";
import tempfile from "temp";
const temp = tempfile.track();

const entry = "require(\"Main\").main();";

export default function() {
  const server = http.createServer((req, res) => {
    console.log(req.method + " " + req.url);
    res.writeHead(404);
    res.end("nope");
  });

  server.listen(31336, "localhost");

  const ws = new WS.server({
    httpServer: server
  });

  ws.on("request", (req) => {
    temp.mkdir("psc", function(err, codepath) {
      if (err) return cb(err);
      const socket = req.accept("purescript-repl", req.origin);
      const compiler = webpack({
        cache: true,
        context: codepath,
        entry: "./entry",
        output: {
          path: path.join(codepath, "dist"),
          filename: "compiled.js"
        },
        resolve: {
          root: [
            path.join(codepath, "output"),
            path.join(__dirname, "..", "node_modules")
          ]
        }
      });
      console.log("** CONNECT", socket.remoteAddress, codepath);
      socket.on("close", () => {
        console.log("** CLOSE", socket.remoteAddress);
      });
      socket.on("message", (data) => {
        if (data.type !== "utf8") {
          socket.send(JSON.stringify({
            error: "unknown message type " + data.type
          }));
        } else {
          const msg = JSON.parse(data.utf8Data);
          const respond = function(err, response) {
            if (err) response = { error: err.toString() };
            response.messageId = msg.messageId;
            console.log("sending response");
            socket.send(JSON.stringify(response));
          };
          console.log("** MSG", msg);
          if (msg.compile) {
            console.log("Compiling...");
            fs.writeFile(path.join(codepath, "entry.js"), entry, "utf-8", (err) => {
              if (err) {
                return respond(err, {});
              }
              compile(codepath, msg.compile, (err, result) => {
                if (err) {
                  return respond(err, {});
                }
                console.log("Webpacking...");
                compiler.run((err, stats) => {
                  if (err) {
                    console.log("Webpack failed.", err);
                    respond(err, {});
                  } else {
                    fs.readFile(path.join(codepath, "dist", "compiled.js"), "utf-8", (err, data) => {
                      result.result = data;
                      console.log("Done.");
                      respond(err, result);
                    });
                  }
                });
              });
            });
          } else {
            respond("unknown message");
          }
        }
      });
    });
  });
}
