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
      });
      c.stderr.on("data", function(data) {
        err += data;
        console.log("ERR", data.toString("utf-8"));
      });
      c.stdout.on("end", function() {
        console.log(out);
        cb(null, {output: out, error: err});
      });
    });
  });
};