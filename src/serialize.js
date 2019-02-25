import indexOf from "lodash/indexOf";
import isArray from "lodash/isArray";
import isFunction from "lodash/isFunction";
import isObject from "lodash/isObject";
import mapValues from "lodash/mapValues";
import size from "lodash/size";
import serialize from "serialize-javascript";

const toString = object => {
    if (typeof object.toString === "function") {
        return object.toString();
    }
    return Object.prototype.toString.call(object);
};

// Native objects aren't serializable by the 'serialize-javascript' package,
// so we'll just transform it to strings.
//
// We'll use a local cache to prevent transforming cyclic objects.
const transformUnserializableProps = (item, localCache = null) => {
    if (localCache == null) {
        localCache = [];
    } else if (indexOf(localCache, item) !== -1) {
        return null;
    }

    if (!item) {
        return item;
    }

    const serializedItem = toString(item);

    // https://github.com/yahoo/serialize-javascript/blob/adfee60681dd02b0c4ec73793ad4bb39bbff46ef/index.js#L15
    const isNative = /\{\s*\[native code\]\s*\}/g.test(serializedItem);
    if (isNative) {
        return serializedItem;
    }

    if (isFunction(item)) {
        return item;
    }

    if ((isObject(item) || isArray(item)) && size(item) > 0) {
        localCache.push(item);
        return mapValues(item, value =>
            transformUnserializableProps(value, localCache),
        );
    }

    return item;
};

export default function(obj) {
    return serialize(transformUnserializableProps(obj), { space: 0 });
}
