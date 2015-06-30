var hellojoe = require("hellojoe");
var cluster = require("cluster");

var prod = (process.env["NODE_ENV"] && process.env["NODE_ENV"] !== "development");
var config = prod ? {} : {
  cores: 1
};

if (cluster.isMaster && !prod) {
  require("chokidar").watch("src/**/*.js*", {
    persistent: false,
    ignoreInitial: true,
    usePolling: false
  }).on("all", function(event, path) {
    console.log("→→→ Project changed; restarting!");
    process.exit(0);
  });
}

hellojoe.serve(config, function() {
  require("babel/register");
  require("./src/server")();
});
