var Pink = require("pink");

require("pink/css/themes/simon.less");
require("pink/node_modules/highlight.js/styles/vs.css");

new Pink("#slides", {
  "background": require("pink/modules/background"),
  "image": require("pink/modules/image"),
  "highlight": require("pink/modules/highlight"),
  "psrepl": require("./modules/psrepl")(),
  "editor": require("pink/modules/editor")([
    require("./modules/editor/language/purescript")
  ])
});
