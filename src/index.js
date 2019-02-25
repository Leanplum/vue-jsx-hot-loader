const util = require("lodash");
const path = require("path");
const hash = require("hash-sum");

module.exports = function vueJsxHotLoader(output, sourceMap) {
    if (util.isFunction(this.cacheable)) {
        this.cacheable();
    }

    const api = JSON.stringify(require.resolve("./api"));

    const moduleId = `_vue_jsx_hot-${hash(this.resourcePath)}`;
    const fileName = path.basename(this.resourcePath);
    const hotId = JSON.stringify(`${moduleId}/${fileName}`);

    this.callback(
        null,
        `${output}
        // VUE JSX HOT LOADER //
        module.hot && require(${api}).default({
            Vue: require('vue'),
            ctx: eval('this'),
            module: module,
            hotId: ${hotId}
        });`,
        sourceMap
    );
};
