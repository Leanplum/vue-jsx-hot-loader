import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import omit from "lodash/omit";
import once from "lodash/once";
import api from "vue-hot-reload-api";
import serialize from "./serialize";

const install = once(Vue => {
    api.install(Vue, false);

    // Compatibility can be checked via api.compatible after installation.
    if (!api.compatible) {
        throw new Error(
            "vue-hot-reload-api is not compatible with the version of Vue you are using.",
        );
    }
});

// We'll store here the serialized components.
// The cache will be used to decide whenever
// a reload or just a rerender is needed.
const cache = {};

const findComponent = ({ ctx, module }) => {
    // Babel did not transform modules
    if (!module.exports) {
        return ctx.__esModule ? ctx.default : ctx.a;
    }

    return module.exports.__esModule ? module.exports.default : module.exports;
};

const isVueFunction = value => {
    return typeof(value) === 'function' && value.toString().startsWith('function VueComponent');
};

const isVueComponent = component => {
    const name = get(component, 'super.name');
    return name === 'Vue' || name === 'VueComponent' || isVueFunction(component);
};

export default function({ Vue, ctx, module, hotId }) {
    // Make the API aware of the Vue that you are using.
    // Also checks compatibility.
    install(Vue);

    // Accept the hot replacement.
    module.hot.accept();

    const reloadComponent = (id, component) => {
        // Serialize everything but the render function.
        // We'll use it to decide if we need to reload or rerender.
        const serialized = serialize(omit(component, ["render"]));

        if (!module.hot.data) {
            // If no data, we need to create the record.
            api.createRecord(id, component);
        } else if (cache[id] === serialized) {
            // Rerender only since the component hasn't changed.
            api.rerender(id, component);
        } else {
            // Reload the component.
            api.reload(id, component);
        }

        // Save the serialized component to the cache.
        cache[id] = serialized;
    };


    if (module.exports && module.exports.__esModule && !module.exports.default) {
        // Loop over all module exports, reload components
        Object.values(module.exports)
            .filter(isVueComponent)
            .forEach(component => reloadComponent(`${hotId}_${component.name}`, component));
    } else {
        // Retrieve the exported component. Handle ES and CJS modules as well as
        // untransformed ES modules (env/es2015 preset with modules: false).
        const component = findComponent({ ctx, module });
        if (component && !isEmpty(component) && isVueComponent(component)) {
            reloadComponent(hotId, component);
        }
    }
}
