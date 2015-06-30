var child = require("child_process");
var glob = require("glob");
var path = require("path");
var fs = require("fs");

function getModName(code) {
  var m = code.split("\n").join(" ").match(/module\s+(\S+)\s+where/);
  return m ? m[1] : null;
}

module.exports = function(codepath, code, cb) {
  var p = path.resolve(__dirname, "../bower_components");
  var modName = getModName(code);
  glob(p + "/purescript-*/src/**/*.purs", {}, function(err, deps) {
    if (err) return cb(err);
    // deps = deps.filter(function(i) {
    //   return /purescript-(dom|signal|timers|easy-ffi)/.exec(i);
    // });
    var fileName = path.join(codepath, "out.purs");
    fs.writeFile(fileName, code, function(err) {
      if (err) return cb(err);
      var out = "";
      err = "";
      var c = child.spawn("psc-make", [
        "-o", path.join(codepath, "output"),
        fileName
      ].concat(deps), {
        stdio: "pipe"
      });
      c.stdin.end(code);
      c.stdout.on("data", function(data) {
        out += data;
        process.stdout.write(data);
      });
      c.stderr.on("data", function(data) {
        err += data;
        process.stderr.write(data);
      });
      c.on("exit", function(code, signal) {
        cb(code ? "Process terminated with return code " + code : null, {stdout: out, stderr: err});
      });
    });
  });
};
