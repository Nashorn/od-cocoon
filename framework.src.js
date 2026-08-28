//# allFunctionsCalledOnLoad
(async (global)=>{ 
global = globalThis;
global.arc = {
    version : "8.6.1.08282026"
};
console.log("v"+global.arc.version);
const kernel_script = document.currentScript || document.head?.querySelector("script[data-kernel], script[data-namespace], script[src*='framework.src.js']");

class ConfigurationManager {
    constructor(data) {
        if(!globalThis.Config) {
            this._locked = false;
            globalThis.Config = globalThis.Config || this.createProxy();
            Object.assign(this, data);
        }
        return globalThis.Config;
    }

    createProxy() {
        const _userSet = new Set();
        const _aliases = {
            CSSFILENAME: "ADOPTED_STYLESHEET",
            FILENAME:    "CONTROLLER"
        };
        const _fallbacks = {
            ADOPTED_STYLESHEET: "CSSFILENAME",
            CONTROLLER: "FILENAME"
        };
        const _deprecated = new Set(Object.keys(_aliases));
        const _attrMap = {
            ADOPTED_STYLESHEET:   "data-adopted-stylesheet",
            ROOTPATH:             "data-rootpath",
            SRC_PATH:             "data-src-path",
            NAMESPACE:            "data-namespace",
            ENABLE_SPLASH:        "data-enable-splash",
            DYNAMICLOAD:          "data-dynamicload",
            CONTROLLER:           "data-controller",
            USE_COMPRESSED_BUILD: "data-use-compressed-build",
            DEBUG:                "data-debug",
            SPLASH_TIMEOUT:       "data-splash-timeout",
            CRITICAL_RESOURCES:   "data-critical-resources",
            IMPORT_MAPS:          "data-import-maps",
            FILENAME:             "data-controller"
        };
        return new Proxy(this, {
            get: (obj, prop) => {
                var origProp = prop;
                if (prop in _aliases) prop = _aliases[prop];
                // const kernel_script = document.head?.querySelector("script[data-kernel]");
                
                // Pass through: symbols, internal props, unmapped keys, or explicitly set values
                if (typeof prop !== "string" || prop.startsWith("_") || !(prop in _attrMap) || _userSet.has(prop)) {
                    return obj[prop] ?? obj[origProp] ?? obj[_fallbacks[prop]];
                }
                // NAMESPACE: body attribute takes priority over script attribute
                if (prop === "NAMESPACE") {
                    var nsVal = kernel_script?.getAttribute(_attrMap[prop]) || document.body?.getAttribute("namespace") || obj[prop];
                    return nsVal;
                }
                // Script attribute fallback, then declared default
                
                const attrVal = kernel_script?.getAttribute(_attrMap[prop]);
                return attrVal !== null && attrVal !== undefined ? attrVal : obj[prop] ?? obj[origProp] ?? obj[_fallbacks[prop]];
            },
            set: (obj, prop, value) => {
                if(this._frozen) {
                    console.warn(`Config.${prop} is frozen and cannot be changed`);
                    return true;
                }
                if(this._locked && prop !== "_locked" && Object.hasOwn(obj, prop)) {
                    console.warn(`Config.${prop} has been locked against changes`)
                    return true
                }
                if (_deprecated.has(prop)) {
                    const msg = `Config.${prop} is deprecated. Use Config.${_aliases[prop]} instead.`;
                    msg.deprecated ? msg.deprecated() : console.warn(`Deprecation: ${msg}`);
                }
                if (prop in _aliases) prop = _aliases[prop];
                if (typeof prop === "string" && !prop.startsWith("_")) _userSet.add(prop);
                obj[prop] = value;
                return true;
            }
        });
    }

    freeze() {
        this._frozen = true;
    }

    lock() {
        this._locked = true;
    }

    unlock() {
        this._locked = false;
    }
}
globalThis.ConfigurationManager = ConfigurationManager;

globalThis.Config = globalThis.Config || new ConfigurationManager({
    DYNAMICLOAD : true,
    CHARSET : "utf-8",
    FILENAME : (location.pathname.split("/").pop() || "index.html").replace(/\.html?$/i, ".*js"),
    ROOTPATH : "../../../",
    SRC_PATH : "/src/",
    ENVIRONMENT : "prod",
    DEFAULT_TEMPLATE_ENGINE_MIMETYPE : "template/literals",
    TEMPLATE_NAMES_USE_ENGINE_EXTENSION : false,//ex: "index.kruntch.html"
    IMPORTS_CACHE_POLICY : { cache: "force-cache", priority: 'high'}, //"default", "no-store", "reload", "no-cache", "force-cache", or "only-if-cached"  (https://fetch.spec.whatwg.org/)
    DEBUG:true,
    ROUTER : 'system.http.Router',
    IMPORT_MAPS:true,
    USES_NAMESPACE_FOR_TAGNAMES : true,
    TEST: "This is a test value"
});

//
//
;String.prototype.toNode = function(fragment=false){
  var n = document.createRange().createContextualFragment(this.toString())
  return fragment?n:n.firstElementChild;
}


// ;String.prototype.decode = function(type="html") {
//   const ta = document.createElement('textarea');
//   ta.innerHTML = this.toString();
//   return ta.value;
// };

;String.prototype.decode = (function() {
  const decoder = document.createElement('textarea');
  return function(type="html") {
    decoder.innerHTML = this.toString();
    const result = decoder.value;
    decoder.innerHTML = ''; // Reset for next use
    return result;
  };
})();


;String.prototype.deprecated = function(type) {
  let color = type == "final" ? 'background: red; color: black' : 'background: yellow; color: black';
  console.log('%c Deprecation: ', color, this.toString());
}
//
document.on = (evtName, handler, bool=false, el) => {
    document.addEventListener(evtName, handler, bool, el);
}

document.appendChild = (el) => {
    document.body.appendChild(el);
}
;var wait;var sleep;

wait = sleep = ms => new Promise((r, j)=>setTimeout(r, ms));
global.wait=wait; global.sleep=wait;

function reflect(target, source) {
    for (let key of Reflect.ownKeys(source)) {
        if(typeof key != "symbol" && !/Symbol|namespace|constructor|ancestor|classname|prototype|name|length/.test(key)){
            let desc = Object.getOwnPropertyDescriptor(source, key);
            Object.defineProperty(target, key, desc);
        }
    }
    target.traits=target.traits||{};
    target.traits[source.constructor.name]=source.constructor;
};

Function.prototype.with = function(...mixin) {
    const isNativeBuiltin = (cls) =>
        typeof cls === "function" &&
        /^HTML.*Element$/.test(cls.name) &&
        cls !== HTMLElement;

    let _mixin_;
    if (isNativeBuiltin(this)) {
        _mixin_ = class extends this {
            constructor(...args) {
                super(...args);
                this?.initialize?.();
            }
        }
    } else {
        _mixin_ = class extends this {}
    }

    for(let m of mixin){
        if(typeof m =="object") {
            reflect(_mixin_.prototype, m);
        } else{
            reflect(_mixin_.prototype, m.prototype);
        }
        reflect(_mixin_, m);
    }
    
    return _mixin_;
};

Function.prototype.debounce = function (delay, immediate=true) {
    let timeout;
    const func = this;
    if(immediate) {
        func.apply(this, arguments);
    }
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};


//
;window.inherit = !window.inherit && Symbol('inherit');

window.classof = function(ns){ return NSRegistry[ns] }


async function initImportMap() {
  window.importmap = {};
  if (!Config.IMPORT_MAPS) { return }

  try {
    var script = document.head.querySelector("script[type='importmap']");
    var data = script?.textContent?.trim();

    if (!data) {
      data = (await (await fetch(Config.ROOTPATH + ".importmap")).text()).trim() || "{}";
      script?.remove();
      script = document.createElement("script");
      script.type = "importmap";
      script.textContent = data;
      document.head.append(script);
    }

    window.importmap = JSON.parse(data).imports || {};
  } catch (e) {
    console.error("initImportMap()", e);
  }
};


if (!('scheduler' in globalThis)) {
  globalThis.scheduler = {
      yield: () => new Promise(resolve => {
          setTimeout(resolve, 0);
      })
  };
}

//used by IHtmlComponent
globalThis._eventObjects = globalThis._eventObjects || new Map();


if(!("innerText" in CSSStyleSheet.prototype)) {
    Object.defineProperty(CSSStyleSheet.prototype, "innerText", {
        get: function() {
            let cssText = '';
            for (var rule of this.cssRules) {
                cssText += rule.cssText;
            }
            return cssText;
        }
    })
}
//
//

; (function(env) {
    env.NSRegistry = env.NSRegistry||{};
    try{env.Meta= class{};}catch(e){};
    env.namespace = function(ns){
        ns = ns[0];
        /\.\*$/.test(ns) ? createNS(ns.split(/\.\*$/)[0],{}):null;
        return /\.\*$/.test(ns) ? 
            createNS(ns.split(/\.\*$/)[0],{}):
            function(...defs){
                let fns="";
                defs.forEach(def => {
                    def=def||{};
                    var nsparts=ns.match(/\.([A-Z]+[a-zA-Z0-9\_]*)\b$/);
                    var k = def.prototype||def;
                        k.classname = nsparts?nsparts[1]:def.name;
                        fns = ns+"."+k.classname;
                        var cls = NSRegistry[fns];
                        if(cls && cls.prototype instanceof WebComponent){ return }
                        k.namespace = fns;
                        return env.NSRegistry[fns] = (typeof def == "function") ?
                            createNS(fns,createClass(def||{})):
                            createNS(ns,(def||{})), 
                                delete def.namespace, 
                                delete def.classname;
                });
                return env.NSRegistry[fns];
            }
    }
    var createNS = function(aNamespace, def){
        var parts       = aNamespace.split(/\./g); 
        var classname   = parts.pop();
        var scope = parts.reduce((acc, next) => acc[next] ? 
            acc[next] : (acc[next]={}), env);
        scope[classname] = def;
        return scope[classname];
    };
    var createClass = function(func){
        try {
            var proto  = func.prototype;
                proto.ancestor = proto.__proto__.constructor;
                if(func.define) {
                    try{  func.define(proto, func) } catch(e){};
                }
                return func;
        } catch(e){ return func }
        return func
    };
})(globalThis);
// import 'src/system/traits/IEventTarget.js';

namespace `domain` (
    class IStorageDriver {
        constructor (collection, storage_device){
            console.log(`storage device for ${collection.prototype.classname}`, this)
        }

        isSeedingEnabled(){
            return false;
        }
        
        static driver(){
            return Config.IStorageDriver||this
        }

        commit(){}

        isSeeded(){}

        setSeeded(){}

        setCollection (name){}

        add(obj, cb){}

        update(obj, cb){}
 
        remove(cb,query){}

        find(cb, query){}

        sort(cursor, attrb, order){}
    }
);

namespace `domain.collections` (
    class Repository extends EventTarget {
        static get storage(){
            var p = "seeds" in this.prototype?this.prototype:this;
            var Storage = p.device_driver||p.driver;
                Storage = typeof Storage=="string"?NSRegistry[Storage]:Storage;
            this.interface = this.interface||new Storage(this);
            return this.interface;
        }

        static isSeedable(){
            return this.storage.isSeedingEnabled();
        }

        static commit() {
            this.storage.commit();
        }

        static async add(obj,cb){
            var results = await this.storage.add(obj,cb);
            return results;
        }

        static async update(obj,cb){
            var results = await this.storage.update(obj,cb);
            return results;
        }

        static async all(cb){
            var results = await this.storage.all(cb);
            return results;
        }

        static async remove(query={},cb){
            return new Promise((resolve,reject) =>{
                this.storage.remove((result, error)=>{
                    cb?cb(result, error):resolve(result, error);
                },query)
            })
        }


        static async find(query={},cb){
            return await this.storage.find(cb, query);
        }

        static onDataReceived (data, xhr){
            var self=this;
            data = this.transform(data);
            this.setData(data.table||data.name, data);
            return data;
        }

        static transform (data, xhr){
            return data;
        }

        static setData (name,data){
            if(data && data.items){
                for(let obj of data.items){
                    this.add(obj, (res)=> {});
                }
            }
        }

        static onInitializeModelDataObjects (data){
            return this.transform(data);
        }

        static async seed (uri, params, force=true){
            uri = "seeds" in this.prototype?this.prototype.seeds:this.seeds;
            return new Promise(async (resolve,reject) =>{
                if(!this.isSeedable()) {
                    resolve();
                    return;
                };
                force = (typeof force == "boolean") ? force: true;
                if(force||!this.storage.isSeeded()){
                    var response = await fetch(uri[Config.ENVIRONMENT]);
                    var json = await response.json();
                    var res = this.onDataReceived(json);
                    this.storage.setSeeded(true)
                    this.commit();
                    resolve(res)
                } else {
                    this.storage.setSeeded(true)
                    this.commit();
                    resolve()
                }  
            })
        }
    }
);

Collection = window.Collection = domain.collections.Repository;
// import 'src/system/machines/Automata.js';
// import 'src/system/machines/State.js';
// import 'src/system/http/Router.js';
// SelectorResolver — cocoon's boundary-piercing selector engine, extracted into
// a single cohesive, framework-agnostic class.
//
// It owns ALL selector logic (arc parsing, the >>> / ::document walk, querySelector
// /querySelectorAll, and the async find/findAll/_waitFor). IHtmlComponent keeps only
// thin one-line delegators to an instance of this (composition, has-a).
//
// PROPRIETARY SELECTOR GRAMMAR (the on-disk contract — must stay in lockstep):
//   `A >>> B`         → descend from A into A.shadowRoot, then match B
//   `A ::document B`  → descend from A into A.contentDocument (iframe), then match B
//   both chain/nest arbitrarily (iframe-in-iframe, shadow-in-iframe, …).
//
// DUAL-BUNDLE: this file is a PLAIN class declaration (no `namespace`, no globals).
// od-seam wraps each build in one shared IIFE scope, so the class is lexically
// visible to sibling files in BOTH bundles:
//   • arc-kernel  → concatenated into od-cocoon; IHtmlComponent references it.
//   • DemoGeeni   → a copy under src/system/api/libs/ is seamed into preload.build.js;
//                   the authoring overlay uses it in the isolated world.
// Keep the two copies in sync manually for now.
//
// CONTEXT MODES:
//   new SelectorResolver({ component })   → cocoon component; root/host/shadow/element
//                                            are read LIVE off the component (never stale).
//   new SelectorResolver({ root, host, element, shadow })  → explicit.
//   new SelectorResolver()                → standalone: root = document (overlay default).
class SelectorResolver {
    constructor(ctx = {}) {
        this._ctx = ctx || {};
    }

    // --- live context (component mode reads through to the component) ---
    get root() {
        const c = this._ctx.component;
        return c ? c.root : (this._ctx.root || document);
    }
    // The element `super.querySelector*` was invoked on (the native fallback target).
    // Component instances override querySelector*, so we must bypass the override.
    get host() {
        const c = this._ctx.component;
        return c ? c : (this._ctx.host || null);
    }
    get element() {
        const c = this._ctx.component;
        return c ? c.element : (this._ctx.element || null);
    }
    get shadow() {
        const c = this._ctx.component;
        return c ? c.inShadow() : this._ctx.shadow;
    }

    // Native query that bypasses any cocoon override (mirrors `super.querySelector*`).
    // Element instances → use the prototype to dodge the override; Document/ShadowRoot
    // are already native.
    _native(method, target, cssSel) {
        if (!target) return method === 'querySelectorAll' ? [] : null;
        if (target instanceof Element) return Element.prototype[method].call(target, cssSel);
        return target[method](cssSel);
    }

    // Split a selector on the arc operators. Returns [seg, op, seg, op, …] or null
    // when there are no boundaries to pierce (a plain CSS selector).
    arcSelectors(css) {
        const parts = css.split(/\s?(>>>|::document)\s?/);
        return parts.length > 1 ? parts : null;
    }

    // The boundary-piercing walk (was `$_`): for each segment, query within the
    // current roots, then descend into shadowRoot (>>>) / contentDocument (::document).
    walk(css, roots = [this.root], start = 0, visit) {
        const steps = typeof css == "string" ?
            this.arcSelectors(css) || [css] : css;
        for (let i = start; i < steps.length && roots.length; i += 2) {
            visit?.(roots, i);
            const selector = steps[i], operator = steps[i + 1], nodes = [];
            for (const root of roots) nodes.push(...root.querySelectorAll(selector));
            if (!operator) return nodes;

            const previous = roots;
            roots = [];
            for (const node of nodes) {
                let root;
                try {
                    root = operator == ">>>" ? node.shadowRoot :
                        operator == "::document" ? node.contentDocument : null;
                } catch (e) {}
                if (root) roots.push(root);
                if (operator == "::document") visit?.(previous, i, node);
            }
        }
        return [];
    }

    querySelectorAll(cssSel) {
        const steps = this.arcSelectors(cssSel);
        if (steps) {
            return this.walk(steps); // Arc selectors return an array
        } else {
            var res;
            if (this.shadow || this.element) {
                res = this.root.querySelectorAll(cssSel);
            }
            if (!res || !res?.length) {
                res = this._native('querySelectorAll', this.host || this.root, cssSel);
            }
            return res;
        }
    }

    querySelector(cssSel) {
        const steps = this.arcSelectors(cssSel);
        if (steps) {
            const res = this.walk(steps);
            return res?.length ? res[0] : null;
        } else {
            var res;
            if (this.shadow || this.element) {
                res = this.root.querySelector(cssSel);
            }
            if (!res) {
                res = this._native('querySelector', this.host || this.root, cssSel);
            }
            return res;
        }
    }

    // Convenience aliases for standalone callers (e.g. the authoring overlay) that
    // want a settled, synchronous resolve without the find() wait machinery.
    resolve(cssSel) { return this.querySelector(cssSel); }
    resolveAll(cssSel) { return this.querySelectorAll(cssSel); }

    async find(cssSel, scan_interval = 300, scan_duration = 3000) {
        return this._waitFor(cssSel, false, 1, scan_duration);
    }

    async findAll(cssSel, { expect: count, scan_interval = 300, scan_duration = 3000 } = {}) {
        return this._waitFor(cssSel, true, count || 2, scan_duration);
    }

    // Async resolve that awaits late-appearing nodes (mutations + iframe loads) up to
    // `duration`. Host references map to the resolver's host (the component element),
    // null in standalone mode.
    _waitFor(css, all, expect, duration) {
        const steps = this.arcSelectors(css), arc = !!steps;
        const host = this.host;
        return new Promise(resolve => {
            const observers = [], loads = [], watched = new WeakMap(), frames = new WeakSet();
            let value = all ? [] : null, done = false;
            const cleanup = () => {
                done = true;
                clearTimeout(timeout);
                for (const observer of observers) observer.disconnect();
                for (const pair of loads) pair[0].removeEventListener("load", pair[1]);
            };
            const finish = result => {
                value = all ? Array.from(result) : result;
                if ((all ? value.length >= expect : value)) {
                    cleanup();
                    resolve(value);
                    return true;
                }
            };
            const run = (roots = [this.root], index = 0) => {
                if (done) return;
                const result = arc ? this.walk(steps, roots, index, watch) :
                    (all ? this.querySelectorAll(css) : this.querySelector(css));
                finish(all ? result : arc ? result[0] || null : result);
            };
            const watch = (roots, index, frame) => {
                if (frame) {
                    if (frames.has(frame)) return;
                    frames.add(frame);
                    const listener = () => run(roots, index);
                    frame.addEventListener("load", listener);
                    loads.push([frame, listener]);
                    return;
                }
                for (const root of roots) {
                    let indexes = watched.get(root);
                    if (!indexes) watched.set(root, indexes = new Set());
                    if (indexes.has(index)) continue;
                    indexes.add(index);
                    const observer = new MutationObserver(() => run(roots, index));
                    observer.observe(root, {childList:true, subtree:true});
                    observers.push(observer);
                }
            };
            const timeout = setTimeout(() => {
                cleanup();
                resolve(value);
            }, duration);
            if (arc) run();
            else {
                watch([this.root], 0);
                if (host && this.root != host) watch([host], 0);
                const result = all ? this.querySelectorAll(css) : this.querySelector(css);
                finish(result);
            }
        });
    }
}


namespace `core.drivers.templating` (
    class Manager {
        constructor(){
            this.engines = {}
            this.defaultMimetype = "template/template-literal-parser";
        }

        define(mimeType, engine){
            if(!this.engines[mimeType]){
                this.engines[mimeType] = engine;
                engine.install && engine.install();
            }
        }

        getEngineByMimeType(mime){
            return this.engines[mime];
        }

        get default (){
            return this.engines[this.defaultMimetype];
        }

        set default (mimeType){
            this.defaultMimetype = mimeType;
        }
    }
);

window.customTemplateEngines = new core.drivers.templating.Manager;

// ORIGINAL:
// 
//namespace `system.drivers.templating` (
//     class LiteralParser {
//         render(tempStr, data={}, self) {
//             data.api = self;
//             // tempStr = tempStr.decode();
//             tempStr = tempStr;
//             tempStr = tempStr.replace(/\<+\%+\=+/gm, "${(async e => {return ");
//             tempStr = tempStr.replace(/\<+\%+/gm, "${(async e => {");
//             tempStr = tempStr.replace(/\%+\>+/gm, "})()}");
//             return new Function("return `"+tempStr +"`;").call(data);
//         }
//     }
// );


namespace `system.drivers.templating` (
    class LiteralParser {
        async render(tempStr, data={}, self) {
            // data.api = self;
            
            // Simple: make data inherit from self for natural this.method() access
            if (self && !(data instanceof HTMLElement)) {
                Object.setPrototypeOf(data, self);
            }
            
            // tempStr = tempStr.decode();
            // tempStr = tempStr;
            
            // Check if template contains await - use async version only when needed
            if (tempStr.includes('await ')) {
                // Async version for templates with await
                tempStr = tempStr.replace(/\<+\%+\=+/gm, "${(await (async (e) => {return ");
                tempStr = tempStr.replace(/\<+\%+/gm, "${(await (async (e) => {");
                tempStr = tempStr.replace(/\%+\>+/gm, "})())}");
                const AsyncFunction = (async function(){}).constructor;
                const asyncFunction = new AsyncFunction('return `' + tempStr + '`;');
                return await asyncFunction.call(data);
            } else {
                // Sync version for better performance when no async needed
                tempStr = tempStr.replace(/\<+\%+\=+/gm, "${(e => {return ");
                tempStr = tempStr.replace(/\<+\%+/gm, "${(e => {");
                tempStr = tempStr.replace(/\%+\>+/gm, "})()}");
                return new Function("return `"+tempStr +"`;").call(data);
            }
        }
    }
);



namespace `system.drivers.templating` ( 
    class TemplateLiteralParser extends system.drivers.templating.LiteralParser {
        constructor() {
            super();
            this.name = "TemplateLiteralParser";
            this.ext = "";
        }

        async parse(tempStr, data, self){
            let regex = /<template\b[^>]*>(?<content>[\s\S]*?)<\/template>\s*$/;
            tempStr = tempStr.trim().decode();
            tempStr = tempStr.replace(regex, (match, p1, offset, string, groups) => groups.content);
            var temNode = document.createElement("template");
                tempStr = await this.render(tempStr, data, self);
                if(temNode.setHTMLUnsafe) {temNode.setHTMLUnsafe(tempStr);}
                else {
                    temNode.innerHTML = tempStr;
                }
                var content = temNode.content;
                return {
                    content: content,
                    fragment: this.getFragment(content)
                }
        }

        getFragment(content) {
            var fragment = !(content instanceof DocumentFragment) ? 
                    content.toNode()?.content : content;
            return fragment;
        }

        static install(){}
});

window.customTemplateEngines.define("template/template-literal-parser", system.drivers.templating.TemplateLiteralParser);


namespace `system.drivers.watchers` (
    class Watcher {
        static watch(object,prop,cb,force=true,host){
            // cb=cb||function(e){host.value[prop] = e.value};
            var data = {object, prop, old:object[prop], val:object[prop]||null, value:object[prop]||null};
            var _cb = () => {
                data.val=data.value=object[prop];
                data[prop] = data.value;
                cb?cb(data):(host.value[object.id] = object[prop]);
            }
            if(object.addEventListener){
                object.addEventListener("input", _cb,false);
                object.addEventListener("change",_cb,false);
            }
            force && cb?cb(data):null;
            return {
                unwatch : function(){
                    object.removeEventListener("input", _cb, false);
                    object.removeEventListener("change",_cb, false);
                }
            }
        }
    }
);
namespace `core.ui` (
    class IHtmlComponent extends HTMLElement {
        /*
            Styling surface.

            Meant to be set or overridden by a component:

                styles                          sheets this component adopts
                cssStyle()                      inline css as a string
                onTransformStyle(css, cls)      rewrite css before it is adopted
                shouldAdoptDocumentStyleSheets()  which document sheets to pull in

            Everything else here is the machinery those four drive, and a component
            should not need to call it: loadStylesheets(), onAdoptStylesheets(),
            loadStyleSheet(), onAppendStyle(), adoptDocumentStyleSheets(),
            acceptsDocumentStyleSheet(),
            onDocumentStylesheetAdopted(), defineAncestralStylesheets(), importCSS().
        */

        static declarative = true;
        static csstext = true;
        lazy = this.hasAttribute("lazy") || false;

        /*
            Stylesheets this component adopts, in cascade order - the last entry
            wins a tie. Entries may be:

                "index.css"                 resolved against the component's
                                            namespace folder
                "https://cdn/icons.css"     absolute url, taken as-is
                "/assets/theme.css"         "/", "./" and "../" are taken as-is
                someCSSStyleSheet           a live sheet, adopted directly

            Declared here so it exists before loadStylesheets() reads it. Use this
            rather than stylesheets.add(), which is for foundation sheets that must
            sit AHEAD of these - see loadStylesheets().

                styles = ["index.css"];
        */
        styles = null;

        constructor(el,options) {
            super();
            this.initialize(el,options);
        }
        
        async initialize(el, options) {
            this.options = options || this;
            this.element = el;
            this.hasDeclarativeTemplate = this.shadowRoot || this.element?.shadowRoot;
            if (this.element || this.constructor.extends || this.constructor.inline) {
                this.root = this.element || this;
                if (this.inShadow() && !(this.element instanceof HTMLBodyElement)) {
                    this.root = this.hasDeclarativeTemplate ||
                                this.root.attachShadow({mode: 'open'});
                }
                if (this.element) {
                    this.connectedCallback();
                }
            } else {
                this.root = this;
                if (this.inShadow()) {
                    this.internals = this.attachInternals();
                    this.root = (
                        this.internals?.shadowRoot ||
                        this.attachShadow({mode: 'open'}) || this
                    ) || this;
                }
            }
            if (!this.hasDeclarativeTemplate && this.inShadow()) {
                this.root.innerHTML = `<slot></slot>`;
            }
        } 

        static async define(proto=this.prototype,bool){
            var ignore = ["WebComponent","HtmlComponent","HTMLElement","IHtmlComponent"];
            if (ignore.includes(this.name)) { return }
            
            proto.ancestor = Object.getPrototypeOf(proto).constructor;
            proto.namespace = proto?.namespace?.includes?.(proto.constructor.name) ? 
                proto.namespace : proto.constructor.name;
            
            var cctor = proto.constructor;
            var ce = window.customElements;
            var r = /([a-zA-Z])(?=[A-Z0-9])/g;
            var tag = (cctor.hasOwnProperty("tag") || cctor.hasOwnProperty("is"))
                ? (cctor.tag || cctor.is)
                : (proto.namespace || cctor.name);
                tag = tag.replace(r, (f,m) => `${m}-`).replace(/\./g, "-").toLowerCase();
                
            if(/\-/.test(tag)){
                if(ce.get(tag)){return}
                this.defineAncestors();
                this.defineAncestralClassList();
                ce.define(tag, this, cctor.extends ? { extends: cctor.extends }:null);
            }    
        }

        async defineAncestralStylesheets() {
            var ignore = ["WebComponent", "HtmlComponent", "Application", "HTMLElement", "IHtmlComponent", "_mixin_"];

            for (let ancestor of this.constructor.ancestors) {
                if (ancestor == this.constructor && !this.hasOwnSkin()) {
                    continue
                }
                if (ignore.includes(ancestor.name)) {
                    continue
                }

                var sheet;
                if(ancestor.prototype.hasOwnSkin()) {
                    var ns = ancestor.prototype.namespace;
                    var skin = ancestor.getSkin();
                    var pathname = window.location.pathname;
                        pathname = pathname.substring(0, pathname.lastIndexOf(Config.SRC_PATH)+1);
                    // var cssPath = `${pathname}${Config.SRC_PATH}${ns.replace(/\./gim, "/")}/${skin.path}index.css`;
                    //     cssPath = cssPath.replace(/\/\//g, "/");
                    

                    var NSPATH = ns.replace(/\./g, "/") + "/";
                    var stylesheet = this.getDefaultStylesheetFilename(ancestor);
                    var url = new URL(Config.SRC_PATH.replace(/^\//, "") + NSPATH + `${skin.path}${stylesheet}`, new URL(Config.ROOTPATH, document.baseURI).href);

                    // The app's own stylesheet may already be adopted at the
                    // document level via data-adopted-stylesheet; if so, don't
                    // load it a second time here.
                    var isOwnTop = (ancestor == this.constructor);
                    if (!(isOwnTop && this.shouldLoadOwnStyleSheet?.() === false)) {
                        try {
                            var _module = await this.importCSS(url.href, ancestor,{with: { type: "css" } });
                            sheet = _module.default;
                        } catch (e) {console.warn(e);}
                    }

                    if(sheet && !this.inShadow()){
                        var shownError=false;
                        var rules = sheet.cssRules;
                        for(let rule of rules){
                            if(rule?.selectorText?.includes(":host")){
                                if(this instanceof Application) {
                                    !shownError && `Replace ':host' CSS declarations with ':root', in application, '${this.namespace}'`.deprecated("final")//console.error(`Replace ':host' declarations with ':root in application'`, this, sheet);
                                    shownError = true;
                                }
                                rule.selectorText = 
                                    rule.selectorText
                                        .replace(/\:host\(([^\)]*)\)/gm, (full, sel) => `:host${sel}`)
                                        .replace(/\:+host/gm, `.${ancestor.name}`);
                            }
                        }
                    }
                }

                // Unshift inline css() BEFORE unshifting the file sheet so that
                // after both unshifts the per-ancestor order is: [file.css, inline.css()]
                if (this.constructor.csstext) {
                    const proto = ancestor.prototype;
                    let inlineCss = null;
                    if (proto.hasOwnProperty("css")) {
                        inlineCss = proto.css.call(this);
                    } else if (proto.hasOwnProperty("cssStyle")) {
                        inlineCss = proto.cssStyle.call(this);
                    }
                    if (inlineCss) {
                        let transformedCss = await this.onTransformStyle(inlineCss, ancestor);
                        let inlineSheet = this.createCSSStyleSheet(transformedCss, ancestor);
                        this.stylesheets.add(inlineSheet);
                    }
                }
                

                if(sheet){
                    sheet.constructor = ancestor;
                    sheet && this.stylesheets.add(sheet);
                }
            }
        }

        hasOwnSkin() {
            return this.constructor.skin||this.constructor.skin === undefined;
        }

        getDefaultStylesheetFilename(ancestor) {
            if (ancestor == this.constructor && typeof Application == "function" && this instanceof Application) {
                return this.getApplicationStylesheetFilename();
            }
            return "index.css";
        }

        getApplicationStylesheetFilename(filename = Config.FILENAME) {
            return (filename || "index.*js")
                .replace(/\.(src|min)\.js$/i, ".css")
                .replace(/\.\*js$/i, ".css")
                .replace(/\.js$/i, ".css");
        }

        static defineAncestors(){
            this.ancestors=[];
            var a=this;
            while(a && this.ancestors.push(a)){
                a = a.prototype.ancestor;
                if(a == HtmlComponent) {
                    break;
                }
            }
        }

        static defineAncestralClassList(){
            var ignore = ["WebComponent","Application", "HtmlComponent","HTMLElement", "IHtmlComponent","_mixin_"];
            var proto = this.prototype;
                proto.classes = [];
            var ancestors = this.ancestors;
            for(let ancestor of ancestors){ 
                var name = ancestor.prototype.constructor.name;
                if(!name || ignore.includes(name)) { continue }
                proto.classes.unshift(name);
            }
        }

        createCSSStyleSheet(cssText,cctor) {
            var sheet = new CSSStyleSheet();
                sheet.constructor = cctor||this;
                sheet.replaceSync(cssText);
                return sheet;
        }

        static getSkin() {
            const name = this.skin;
            const path = name ? `skins/${name}/` : "";
            return { name, path };
        }
        
        getSkin(){
            return this.constructor.getSkin();
        }

        dispatchEvent(type, data={}, element) {
            let details = { bubbles: true, cancelable: true, composed: true, detail:data?.detail||data||{} };
            delete data.detail;
            delete details.detail.bubbles;
            delete details.detail.cancelable;
            delete details.detail.composed;
            delete details.detail.detail;
            Object.assign(details, data);
            var evt = typeof type =="object" ? type : new CustomEvent(type, details);
            if(data && !evt.data){
                evt.data = details.detail||data;
            };
            var el = element||this.element
            if(el){
                el.dispatchEvent(evt);
                return evt
            }
            else{
                if(this.root instanceof Document){
                    this.root.dispatchEvent(evt);
                }else{
                    super.dispatchEvent(evt);
                }
                return evt
            }
        }

        on(evtName, handler, bool=false, selector) {
            this.addEventListener(evtName, handler, bool, selector);
        }

        addEventListener(evtName, handler, bool=false, sel) {
            if (sel instanceof Node) {
                // Delegate by node identity across shadow boundaries.
                this.root.addEventListener(evtName, e => {
                    var paths = e?.composedPath?.()||[];
					var t = (paths.find(node => node === sel));
					    t && (e.matchedTarget = t) && handler(e);
                }, bool);
            } else if (sel && this._arcSelectors(sel)) {
                // >>> / ::document — let the selector engine resolve the real node
                // (crossing shadow + same-origin iframe boundaries) and bind on it
                // directly; composedPath can't reach across the iframe seam.
                this.find(sel).then(target => {
                    target && target.addEventListener(evtName, e => {
                        e.matchedTarget = target;
                        handler(e);
                    }, bool);
                });
            } else if (sel) {
                this.root.addEventListener(evtName, e => {
                    var paths = e?.composedPath?.()||[];
					var t = (paths.find(node => node?.matches?.(sel)));
					    t && (e.matchedTarget = t) && handler(e);
                }, bool);
            } else {
                var self = this.root;
                if(self instanceof Document){
                    self.addEventListener(evtName, handler, bool);
                }else{
                    super.addEventListener(evtName, handler, bool);
                }
            }
        }

        subscribe(eventType, listener, capture) {
            const globalEvents = globalThis._eventObjects.get(eventType);
            if (globalEvents instanceof Set && globalEvents.size) {
                for (const evt of globalEvents) {
                    listener(evt);
                }
            }
            document.addEventListener(eventType, listener, capture);
            return () => document.removeEventListener(eventType, listener, capture);
        }

        fire(type, data = {}) {
            const eventType = type;
            var evt = this.dispatchEvent(type, data, document);
            if (!globalThis._eventObjects.has(eventType)) {
                globalThis._eventObjects.set(eventType, new Set());
            }
            globalThis._eventObjects.get(eventType).add(evt);
            return evt;
        }

        broadcast(type, data = {}) {
            return this.fire(type, data);
        }

        async append(el, container=this.root){
            return new Promise(async (resolve,reject) => {
                requestAnimationFrame( async e=>{container.append(el);resolve(el)} );
            })
        }

        watch(object,prop,cb=null,force,engine=system.drivers.watchers.Watcher){
            object = typeof object == "string"?this.querySelector(object):object;
            if(object){ return engine.watch(object,prop,cb,force,this)}
        }

        getBoundingClientRect(el){
            var c = el?el.getBoundingClientRect():super.getBoundingClientRect();
            c.center = {x : c.left + c.width/2, y : c.top  + c.height/2};
            return c;
        }

        async loadTemplate(data={}) {   
            return new Promise(async (resolve, reject) => {
                if(this._template) { resolve(this._template); return  }
                var tem  =  this.getTemplateToLoad();
                var opts = Config.IMPORTS_CACHE_POLICY || {cache:"force-cache"}
                if(/\/*\.html$/.test(tem)){
                    var src=tem;
                    this._template = await (await fetch(src, opts)).text();
                    resolve(this._template)
                }
                else if(typeof tem == "function"){//from inner template()
                    Object.setPrototypeOf(data, this);
                    this._template=tem.call(data);
                    resolve(this._template);
                }
                else if(/<\s*\btemplate\b/.test(tem)){//from inner template()
                    this._template=tem;
                    resolve(this._template);
                }
                else if(tem && tem.nodeType==1 && tem.tagName.toLowerCase()=="template"){
                    this._template=tem.outerHTML;
                    resolve(this._template);
                }
                else if(tem && tem.nodeType==1){
                    this._template=`<template>${tem.outerHTML}</template>`;
                    resolve(this._template);
                }
                else {
                    this._template = tem
                    resolve(this._template);
                }
            })
        }

        // Selector engine lives in SelectorResolver (composition). These are thin
        // delegators; component-mode reads root/host/shadow/element live off `this`.
        get _selectors() {
            return this.__selectors ||
                (this.__selectors = new SelectorResolver({ component: this }));
        }

        async find(cssSel, scan_interval = 300, scan_duration = 3000) {
            return this._selectors.find(cssSel, scan_interval, scan_duration);
        }

        async findAll(cssSel, opts) {
            return this._selectors.findAll(cssSel, opts);
        }

        querySelectorAll(cssSel) {
            return this._selectors.querySelectorAll(cssSel);
        }

        querySelector(cssSel) {
            return this._selectors.querySelector(cssSel);
        }

        _arcSelectors(css) {
            return this._selectors.arcSelectors(css);
        }

        $_(css, roots, start, visit) {
            return this._selectors.walk(css, roots, start, visit);
        }

        _waitFor(css, all, expect, duration) {
            return this._selectors._waitFor(css, all, expect, duration);
        }
 
        async disconnectedCallback(){
            this._unsubscribeSheets?.();
            await this.onDisconnected();
            this.onSleep();
        }

        async connectedCallback(data) {
            if (this.lazy || this.constructor.lazy) {
                this.intersectionObserver = new IntersectionObserver(async entries => {
                    var length = entries.length; 
                    for (let i = 0; i < length; i++) {
                        const entry = entries[i];
                        if (entry.isIntersecting) {
                            await this.onConnected(data);
                            this.intersectionObserver.unobserve(this);
                        }
                        await scheduler?.yield?.();
                    }
                });
                this.intersectionObserver.observe(this);
            } else {
                await this.onConnected(data);
            }
        }
        
        async onConnected(data={}) { 
            const token = {};
            document.dispatchEvent(new CustomEvent("render:activity:start", {
                detail: { token, kind: "component", target: this }
            }));

            try {
                this.data = data;
                await this.defineAncestralStylesheets();
                await this.loadStylesheets();
                await this.render(this.data);
                await this.setInternalAttributes();
                try {
                    this.internals?.states?.add("connected");
                }
                catch {
                    this.internals?.states?.add("--connected");
                }
                this.onAwake();
                this.fire("connected");
            } finally {
                document.dispatchEvent(new CustomEvent("render:activity:end", {
                    detail: { token, kind: "component", target: this }
                }));
            }
        }

        onAwake(){
            if(this.onUpdate||this.onDraw||this.onFixedUpdate){
                document.component2d_instances = document.component2d_instances||[];
                document.component2d_instances.push(this);
            }
        }

		onSleep(){}

        async onDisconnected(){}

        hasOwnTemplate() {
            return this.constructor.declarative === false;
        }

        getTemplateToLoad(){
            var skin = this.getSkin();
            var engine = this.getTemplateEngine();
            var path = `${Config.ROOTPATH}${Config.SRC_PATH}${this.namespace.replace(/\./gim, "/")}/${skin.path}index.html`;
                path = path.replace(/\/\//g, "/");
            return this.template||this.html||path;
        }

        shouldParse(html) {
            return /\<+%+=?/.test(html?.decode?.() || this.innerHTML.decode()) || /\<+%+=?/.test(this.root.innerHTML.decode());
        }

        async render(data=this.data) {
             var engine   = await this.getTemplateEngine();
            if(this.constructor.inline) {
                this.onRendered();
                return;
            }
            if (this.hasDeclarativeTemplate && this.shouldParse()) {
                if(this.shouldParse(this.root.innerHTML)) {
                    var {fragment} = await engine.parse(this.root.innerHTML, data, this);
                    this.root.innerHTML = "";
                    this.root.appendChild(fragment);
                }
                await this.parseInnerHTML(engine, data);
            }
            else if((!this.hasDeclarativeTemplate) || this.hasOwnTemplate()){
                var template = await this.loadTemplate(data);
                var {fragment} = await engine.parse(template, data, this);
                this.root.innerHTML = ""; 
                this.root.appendChild(fragment);
                await this.parseInnerHTML(engine, data);
            }
            this.onRendered();
		}

        async parseInnerHTML(engine, data) {
            if(this.shouldParse(this.innerHTML)) {
                var {fragment} = await engine.parse(this.innerHTML, data, this);
                this.innerHTML="";
                this.appendChild(fragment);
            }
        }

        onRendered() {}

        setAttribute(name, val){
            return (this.element) ? 
                this.root.setAttribute(name, val) : super.setAttribute(name, val)
        }

        /*
            Assembles the component's stylesheet list, then adopts it.

            Cascade order in the resulting root, weakest first:

                [ document sheets ] [ ancestral + .add() ] [ styles ]

            Two channels feed the list, and the difference is priority, not taste:

              .add()   unshifts, so it lands FIRST and is overridable. Foundations:
                       ancestral sheets, inline css(), a vendor sheet the component
                       then customises. Must run before this method - nothing reads
                       the array again afterwards.

              styles   pushes, so it lands LAST and wins ties. The component's own
                       voice. A class field, so it is always in time.

            Order only settles ties. Specificity still decides first, and a document
            rule matching the host from outside beats anything in the shadow.
        */
        async loadStylesheets() {
            if(this.styles) {
                var styles = this.styles;
                for(let css of styles) {
                    if(!this.stylesheets.includes(css)) {
                        this.stylesheets.push(css)
                    }
                }
            }
            // Inline css() is now handled per-ancestor inside defineAncestralStylesheets()
            // to preserve correct interleaving: A.css → A.css() → B.css → B.css()
            await this.onAdoptStylesheets();
            await this.adoptDocumentStyleSheets();
        }

        // Which document-level stylesheets this component pulls into its shadow root.
        // Off by default, so components stay isolated. Sheets are matched by url and
        // land ahead of the component's own, so its rules still win any tie.
        //
        //   return false                            // none (default)
        //   return true                             // every document sheet
        //   return ["tabler-icons"]                 // url contains this
        //   return [/tabler/, "tokens.css"]         // any of these
        //   return sheet => sheet.url?.endsWith(".theme.css")
        //
        // The publishing side is 'styles': an Application's root is the document, so
        // styles = [url] there adopts at document level and announces it here.
        shouldAdoptDocumentStyleSheets() { return false; }

        async adoptDocumentStyleSheets() {
            try {
                if (this.shouldAdoptDocumentStyleSheets() && this.root?.adoptedStyleSheets) {
                    this._docSheetCount = 0;
                    this._unsubscribeSheets = this.subscribe("stylesheet:adopted", e => this.onDocumentStylesheetAdopted(e));
                }
            } catch (e) {
                console.warn("Error adopting document stylesheets", e);
            }
        }

        // Document sheets stay ahead of the component's own, so the component
        // keeps the last word in the cascade.
        // Intent, in whichever shape suits the component: true adopts every document
        // sheet, a string/RegExp (or array of them) matches against the sheet url,
        // a function decides per sheet.
        acceptsDocumentStyleSheet(sheet) {
            var want = this.shouldAdoptDocumentStyleSheets();
            if (!want) { return false }
            if (want === true) { return true }
            if (typeof want === "function") { return want(sheet) }
            var href = sheet.url || sheet.href || "";
            return [].concat(want).some(m => m instanceof RegExp ? m.test(href) : href.includes(m));
        }

        onDocumentStylesheetAdopted(event) {
            var sheet = event.detail?.sheet;
            if (!sheet || this.root.adoptedStyleSheets.includes(sheet)) { return }
            if (!this.acceptsDocumentStyleSheet(sheet)) { return }
            var sheets = [...this.root.adoptedStyleSheets];
                sheets.splice(this._docSheetCount++, 0, sheet);
            this.root.adoptedStyleSheets = sheets;
        }

        async onAppendStyle(stylesheet, index = -1) {
            var root=this.shadowRoot||this.root;
            if(!root?.adoptedStyleSheets) {//when shadow dom is not supported
                var styletag = document.head.querySelector(`style[namespace='${stylesheet.constructor.prototype.namespace}']`)
                if(styletag || stylesheet.appended) { return }
                var style = document.createElement("style");
                    style.innerHTML = await this.onTransformStyle(stylesheet.innerText, stylesheet.constructor);
                    style.setAttribute("namespace", stylesheet.constructor.prototype.namespace);
                    document.head.appendChild(style);
                    stylesheet.appended = true;
            }
            else {
                var sheet = stylesheet instanceof CSSStyleSheet ?
                    stylesheet : new CSSStyleSheet().replaceSync(stylesheet.innerText);
                if (index < 0) {
                    root.adoptedStyleSheets.push(sheet);
                }
                else {
                    root.adoptedStyleSheets = [
                        ...root.adoptedStyleSheets.slice(0, index),
                        sheet,
                        ...root.adoptedStyleSheets.slice(index),
                    ];
                }
                // Document-level sheets are shared: announce so shadow roots that
                // opt in can adopt this one too.
                if (root === document) { this.fire("stylesheet:adopted", { sheet }) }
            }
        }


        /*
            The adoption list, in cascade order.

            add() UNSHIFTS on purpose: everything routed through it is a foundation
            the component's own sheets must be able to override, so it has to sit
            ahead of the `styles` entries that loadStylesheets() pushes on.

            The initial walk in onAdoptStylesheets() happens once per connect, so an
            add() after that adopts the sheet directly rather than waiting for a
            second walk that never comes.
        */
        get stylesheets() {
            this._stylesheets = this._stylesheets || [];
            if (!this._stylesheets.add) {
                this._stylesheets.add = (sheet) => {
                    if (this._stylesheets.includes(sheet)) { return }
                    this._stylesheets.unshift(sheet);
                    // Nothing walks the array again after onAdoptStylesheets(), so a
                    // late add adopts itself - behind the document sheets, ahead of
                    // the `styles` entries it must stay overridable by.
                    if (this._stylesheetsLoaded) {
                        this.loadStyleSheet(sheet, this._docSheetCount || 0);
                    }
                }
            }
            return this._stylesheets;
        }

        async onAdoptStylesheets() {
            for(let sheet of this.stylesheets){
                await this.loadStyleSheet(sheet);
            }
            this._stylesheetsLoaded = true;
        }

        /*
            Resolves one entry and hands it to onAppendStyle().

            index is the insertion point in the root's adopted list; the default
            appends, which is what the initial walk wants. A late stylesheets.add()
            passes an index so it lands in foundation position instead of winning.
        */
        async loadStyleSheet(sheet, index = -1) {
            if(sheet instanceof CSSStyleSheet){
                return this.onAppendStyle(sheet, index);
            }

            var NSPATH = this.namespace.replace(/\./g, "/") + "/";
            // An absolute or explicitly prefixed entry names its own location;
            // only a bare filename is resolved against the component's namespace.
            var url = /^([a-z]+:)?\/\//i.test(sheet) || /^[.\/]/.test(sheet) ?
                new URL(sheet, document.baseURI) :
                new URL(Config.SRC_PATH.replace(/^\//, "") + NSPATH + `${sheet}`, new URL(Config.ROOTPATH, document.baseURI).href);

            try {
                var _module = await this.importCSS(url.href, this.constructor, {with: { type: "css" } });
                sheet = _module.default;
                sheet.constructor = this.constructor;
                sheet.url = sheet.url || url.href;
                this.onAppendStyle(sheet, index);
            } catch (e) {
                console.error(e);
            }
        }

        async onTransformStyle(cssText, cls, ns=this.namespace){
            if(!this.inShadow()){
                cssText = cssText.replace(/\:host\(([^\)]*)\)/gm, (full, sel) => `:host${sel}`);
                cssText = cssText.replace(/\:+host/gm, `.${cls.name}`);
            }
            return cssText
        }

        getTemplateEngine() {
            var Engine = window.customTemplateEngines.default;
            return typeof Engine == "function" ? new Engine : Engine;
        }

        async setInternalAttributes(el = this.element?.body || this.element || this) {
            if (this.__has_internal_attrbs) return;
            el.classList.add(...this.constructor.prototype.classes);
            el.setAttribute("namespace", this.namespace);
            this.__has_internal_attrbs = true;
        }

        inShadow() {
            if (!(this instanceof Element)) return false;
            try {
                return this.internals?.shadowRoot || this?.shadowRoot || false;
            } catch (e) {
                return false;
            }
        }

        cssStyle(){ return "" }

        async importCSS(cssPath, ancestor, options) {
            cssPath = new URL(cssPath.replace(/\/src\/src\//, "/src/")).href;
            const token = {};
            document.dispatchEvent(new CustomEvent("render:activity:start", {
                detail: { token, kind: "stylesheet", url: cssPath }
            }));

            try {
                if ('supports' in CSS && CSS.supports('color', 'var(--test)')) {
                    try {
                        const dynamicImport = new Function('cssPath',
                            'return import(cssPath, {with: {type: "css"}})');
                        return await dynamicImport(cssPath);
                    } catch (e) {
                        console.warn(e);
                    }
                }

                const response = await fetch(cssPath);
                const cssText = await response.text();
                const sheet = this.createCSSStyleSheet(cssText, this.constructor);
                return { default: sheet };
            } finally {
                document.dispatchEvent(new CustomEvent("render:activity:end", {
                    detail: { token, kind: "stylesheet", url: cssPath }
                }));
            }
        }
    }
);
global.IHtmlComponent = core.ui.IHtmlComponent;


namespace `core.ui` (
    class HtmlComponent extends IHtmlComponent {}
);

global.HtmlComponent = core.ui.HtmlComponent;
global.WebComponent  = core.ui.HtmlComponent;
global.Component     = core.ui.HtmlComponent;
// import 'src/core/ui/Component2D.js';
namespace `core.ui` (
	class Application extends HtmlComponent {
        static inline = true;
        
	    constructor(el) {
	        super(el);
	        window.application = this;
	    }

        onAwake(){}

        // The app's own stylesheet is adopted early at the document level via the
        // data-adopted-stylesheet script attribute. When that attribute already
        // names this app's css, skip loading it again via the ancestral path.
        shouldLoadOwnStyleSheet() {
            return Config.ADOPTED_STYLESHEET !== this.getApplicationStylesheetFilename();
        }

        onFixedUpdate (time) {
            if(this.isConnected) {
                document.component2d_instances && document.component2d_instances.forEach(c => c.onFixedUpdate(time))
            }
        }

        onUpdate(timestamp, delta){
            if(this.isConnected) {
                document.component2d_instances && document.component2d_instances.forEach(c => c.onUpdate(timestamp, delta))
            }
        }

        onDraw(interpolation){
            if(this.isConnected) {
                document.component2d_instances && document.component2d_instances.forEach(c => c.onDraw(interpolation))
            }
        }

        onUpdateEnd(fps, panic){
            if (panic) {
                var discardedTime = Math.round(MainLoop.resetFrameDelta());
            }
        }

        getSimulationTimestep(){ return 1000/120 }

        async onConnected(data){
            await super.onConnected(data);
            if(this.onEnableRouting()){
                var _router = this.getRouteHandler();
                this.router = new _router(this,window);
            }
            this.fire("application:connected");
        }

        getRouteHandler(){
            return NSRegistry[Config.ROUTER];
        }

        onEnableRouting(){ 
            this._view_slot=this.querySelector('slot[name="view-port"]')||this.querySelector('div[name="view-port"]');
            return this._view_slot;
        }

        onExitActivitySaveScroll(){
            if(this.currentActivity){
                var p = this.onFindScrollableSlotArea();
                this.currentActivity._scrollpos = p.scrollTop;
            }
        }

        onEnterActivityRestoreScroll(scrollToElement=null){
            if(this.currentActivity){
                if(scrollToElement){
                    wait(100).then(_=> {
                        var el = this.currentActivity.querySelector("#"+scrollToElement);
                        if (el) {
                            el.scrollIntoView({
                                behavior : "smooth",
                                block : "start"
                            });
                        }

                    })
                } else {
                    var p = this.onFindScrollableSlotArea();
                    p.scrollTop = this.currentActivity._scrollpos||0;
                }
            }
        }

        onFindScrollableSlotArea(){
            var p = this.onFindActivitySlot();
            if(p instanceof HTMLSlotElement){p=p.parentNode}
            return p;
        }

        onFindActivitySlot(){
            var slot = this._activitySlot||this._view_slot;
            if(!slot) {
                slot=document.body;
                console.warn(`${this.namespace}#onFindActivitySlot() - unable to find a <slot|div name='view-port'></slot|div> for loading views. Using <body> as fallback.`)
            }
            this._activitySlot = slot;
            return slot||this
        }

        onEnterActivity(c,scrollToElement,router){
            console.log("onEnterActivity", c);
            var slot = this.onFindActivitySlot();
            if(this.lastActivity){
                this.lastActivity.onBeforeSleep&&this.lastActivity.onBeforeSleep();
                this.lastActivity.remove();
                this.dispatchEvent("sleep",this.lastActivity);
            }
            else {
                slot.innerHTML="";
            }
            c.onBeforeAwake&&c.onBeforeAwake();
            slot.appendChild(c);
            setTimeout(e=>router&&router.replaceHashes&&router.replaceHashes(c),1000);
            this.currentActivity = c;
            this.onEnterActivityRestoreScroll(scrollToElement);
            this.dispatchEvent("onactivityshown",c);
            this.dispatchEvent("awake",c);
        }

        onExitCurrentActivity(c){
            this.onExitActivitySaveScroll()
            console.log("onExitCurrentActivity", c);
            this.lastActivity=c;
        }

        onLoadingActivity(c){
            console.log("onLoadingActivity", c);
        }
	}
);
global.Application = global.Application||core.ui.Application;

namespace `core.ui` (
    class World extends core.ui.Application {
        async onConnected(data){
            await super.onConnected(data);
            MainLoop.start();
        }
        onUpdate(accumilated, delta){}
        onFixedUpdate(){}
        onDraw(interpolation){}
        onUpdateEnd(fps, panic){
            if (panic) { var discardedTime = Math.round(MainLoop.resetFrameDelta()) }
        }
        getSimulationTimestep(){ return 1000/120 }
    }
);
global.World = global.World||core.ui.World;
/**
 * mainloop.js 1.0.4-20210711
 *
 * @author Isaac Sukin (http://www.isaacsukin.com/)
 * @license MIT
 */

!function(t){var n=1e3/60,e=0,i=0,o=60,u=.9,r=1e3,f=0,s=0,a=0,c=0,m=!1,d=!1,l=!1,p="object"==typeof window?window:t,h=p.requestAnimationFrame||(b=Date.now(),function(t){return y=Date.now(),A=Math.max(0,n-(y-b)),b=y+A,setTimeout(function(){t(y+A)},A)}),w=p.cancelAnimationFrame||clearTimeout,p=function(){},F=p,M=p,g=p,x=p,S,b,y,A;function D(t){if(S=h(D),!(t<i+c)){for(e+=t-i,F(i=t,e),f+r<t&&(o=u*s*1e3/(t-f)+(1-u)*o,f=t,s=0),s++,a=0;n<=e;)if(M(n),e-=n,240<=++a){l=!0;break}g(e/n),x(o,l),l=!1}}t.MainLoop={getSimulationTimestep:function(){return n},setSimulationTimestep:function(t){return n=t,this},getFPS:function(){return o},getMaxAllowedFPS:function(){return 1e3/c},setMaxAllowedFPS:function(t){return 0===(t=void 0===t?1/0:t)?this.stop():c=1e3/t,this},resetFrameDelta:function(){var t=e;return e=0,t},setBegin:function(t){return F=t||F,this},setUpdate:function(t){return M=t||M,this},setDraw:function(t){return g=t||g,this},setEnd:function(t){return x=t||x,this},start:function(){return d||(d=!0,S=h(function(t){g(1),m=!0,f=i=t,s=0,S=h(D)})),this},stop:function(){return d=m=!1,w(S),this},isRunning:function(){return m}},"function"==typeof define&&define.amd?define(t.MainLoop):"object"==typeof module&&null!==module&&"object"==typeof module.exports&&(module.exports=t.MainLoop)}(globalThis);
//# sourceMappingURL=mainloop.min.js.map


;async function adoptDocumentStylesheet(url) {
    var proto = IHtmlComponent.prototype;
    if (url) {
        try {
            const {default: sheet} = await proto.importCSS.call(proto, url);
            sheet.url = url;
            document.adoptedStyleSheets.push(sheet);
            proto.fire.call(proto, "stylesheet:adopted", { sheet });
        } catch (e) {
            console.error(e);
        }
    }
}

function tryAdopt(attempt = 0) {
    if (!Config?.CSSFILENAME && document.readyState === "loading" && attempt < 10) {
        return setTimeout(() => tryAdopt(attempt + 1), 5);
    }
    var url;
    if (Config?.CSSFILENAME) {
        let ns = (document.head.querySelector("script[namespace]")||document.body)?.getAttribute?.("namespace")||Config.NAMESPACE;
        var nsPath = ns ? ns.replace(/\./g, "/") + "/" : "";
        if (/^[.\/]/.test(Config?.CSSFILENAME)) {
            url = new URL(Config?.CSSFILENAME, document.baseURI).href;
        } else {
            url = new URL(Config?.SRC_PATH.replace(/^\//, "") + nsPath + Config?.CSSFILENAME, new URL(Config?.ROOTPATH, document.baseURI).href).href;
        }
        url = url.replace(/\/src\/src\//, "/src/");
    }
    adoptDocumentStylesheet(url);
}

function getNamespace() {
    return (document.head.querySelector("script[namespace]")||document.body)?.getAttribute?.("namespace")||Config.NAMESPACE;
}

function getControllerURL(ns = getNamespace()) {
    if (!ns || !Config.DYNAMICLOAD) { return null }
    var nsPath = ns.replace(/\./g, "/") + "/";
    var filename = new URL(Config.SRC_PATH.replace(/^\//, "") + nsPath + Config.FILENAME, new URL(Config.ROOTPATH, document.baseURI).href).href;
    return new URL(Config.USE_COMPRESSED_BUILD ?
        filename.replace("*", Config.DEBUG ? "src." : "min.") :
        filename.replace("*", ""));
}

async function preloadController(ready) {
    try {
        await ready;
        var url = getControllerURL();
        if (!url) { return }
        var link = document.createElement("link");
        link.rel = "modulepreload";
        link.href = url.href;
        document.head.append(link);
    } catch (e) {
        console.error("preloadController()", e);
    }
}


function isShell() {
    var role = kernel_script?.getAttribute("data-frame-role")
        || document.documentElement?.getAttribute("data-frame-role")
        || Config.FRAME_ROLE;
    if (role) { return role.toLowerCase() === "shell" }
    return !!document.querySelector("iframe#mainFrame");//legacy fallback for shell detection
}

document.addEventListener("DOMContentLoaded", async e => {
  const token = {};
  document.dispatchEvent(new CustomEvent("render:activity:start", {
    detail: { token, kind: "boot" }
  }));

  try {
    //TODO: Fix this
    globalThis.Session = ((() => { try { return top.Session; } catch (e) {} })() || globalThis.Session);
    let assetsloaded = false;

    await importMapReady;

    let ns = getNamespace();

    async function bootup() {
      var path = getControllerURL(ns);
      console.log("Bootloader: Loading controller from", path);
      if (path) {
        await import(path.href).then(async function init() {
          if (!NSRegistry[ns]) {
            await wait(50);
            return init();
          }
          let app = window.application = (window.application || new NSRegistry[ns](document));
          if (typeof World == "function" && app instanceof World) {
            window.world = app;
            let loop = MainLoop;
            app.onUpdate      && loop.setBegin(app.onUpdate);
            app.onFixedUpdate && loop.setUpdate(app.onFixedUpdate);
            app.onDraw        && loop.setDraw(app.onDraw);
            app.onUpdateEnd   && loop.setEnd(app.onUpdateEnd);
            loop.setSimulationTimestep(app.getSimulationTimestep());
          }
        });
      } else {
        let app = new NSRegistry['core.ui.Application'](document);
      }
    };

    await bootup();
  } finally {
    document.dispatchEvent(new CustomEvent("render:activity:end", {
      detail: { token, kind: "boot" }
    }));
  }
}, false);


class PageRenderObserver {
    dispatch(evtName, detail = location.href) {
        PageRenderObserver.dispatch(evtName, detail);
    }

    static dispatch(evtName, detail = location.href) {
        window.dispatchEvent(new CustomEvent(evtName, {
            detail: detail, bubbles: true, cancelable: true,
        }));

        const isMainPage = window !== window.top && window.parent === window.top;
        if (evtName === "page:rendered" && isMainPage) {
            try {
                window.top.dispatchEvent(new window.top.CustomEvent(evtName, { detail: detail }));
            } catch (e) {}
        }
    }

    static QUIET_MS = 300;      /* Quiet period since last activity */
    static DEADLINE_MS = 60000; /* Maximum wait time */

    constructor() {
        this.observers = [];
        this.pendingActivities = new Set();
        this.inflight = 0;
        this.done = false;
        this.fontsReady = false;
        this.blockedBy = "boot";
    }

    watch() {
        if (this._watching) { return this }
        this._watching = true;
        this.armed = false;
        this.started = performance.now();
        this.lastActivity = this.started;
        this._deadlineId = setTimeout(() => this.finalize("deadline"), this.deadline());
        this.watchPerformance();
        this.watchMutations();
        this.watchNetwork();
        this.watchFonts();
        this._onActivityStart = event => {
            var token = event.detail?.token;
            if (!token) { return }
            this.pendingActivities.add(token);
            this.touch(event.detail.kind || "framework activity");
        };
        this._onActivityEnd = event => {
            var token = event.detail?.token;
            if (!token) { return }
            this.pendingActivities.delete(token);
            this.touch(event.detail.kind || "framework activity");
        };
        document.addEventListener("render:activity:start", this._onActivityStart);
        document.addEventListener("render:activity:end", this._onActivityEnd);
        this._tickId = setInterval(() => this.check(), 100);
        return this;
    }

    async init() {
        this.watch();
        return this.armed ? this : this.arm();
    }

    arm() {
        this.armed = true;
        this.check();
        return this;
    }

    stop() {
        this.done = true;
        clearTimeout(this._deadlineId);
        clearInterval(this._tickId);
        this.teardown();
    }

    deadline() {
        return Number(PageRenderObserver.DEADLINE_MS);
    }

    touch(source) {
        this.lastActivity = performance.now();
        this.blockedBy = source;
    }

    watchPerformance() {
        for (let type of ["resource", "layout-shift", "largest-contentful-paint", "paint"]) {
            try {
                var observer = new PerformanceObserver(list => {
                    if (list.getEntries().length) { this.touch(type) }
                });
                observer.observe({ type: type, buffered: true });
                this.observers.push(observer);
            } catch (e) { }
        }
    }

    watchMutations() {
        try {
            this._mutations = new MutationObserver(() => this.touch("dom"));
            this._mutations.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        } catch (e) {}
    }

    watchNetwork() {
        var self = this;
        this._fetch = window.fetch;
        if (typeof this._fetch === "function") {
            window.fetch = function (...args) {
                self.inflight++;
                self.touch("fetch");
                return self._fetch.apply(this, args).finally(() => {
                    self.inflight--;
                    self.touch("fetch");
                });
            };
        }

        this._xhrSend = window.XMLHttpRequest?.prototype?.send;
        if (typeof this._xhrSend === "function") {
            var send = this._xhrSend;
            window.XMLHttpRequest.prototype.send = function (...args) {
                self.inflight++;
                self.touch("xhr");
                this.addEventListener("loadend", () => {
                    self.inflight--;
                    self.touch("xhr");
                }, { once: true });
                return send.apply(this, args);
            };
        }
    }

    teardown() {
        this.observers.forEach(o => { try { o.disconnect() } catch (e) {} });
        try { this._mutations?.disconnect() } catch (e) {}
        document.removeEventListener("render:activity:start", this._onActivityStart);
        document.removeEventListener("render:activity:end", this._onActivityEnd);
        this.restoreNetwork();
    }

    restoreNetwork() {
        if (this._fetch) { window.fetch = this._fetch }
        if (this._xhrSend) { window.XMLHttpRequest.prototype.send = this._xhrSend }
    }

    watchFonts() {
        if (!document.fonts) { this.fontsReady = true; return }
        document.fonts.ready.then(() => { this.fontsReady = true; this.touch("fonts") })
                            .catch(() => { this.fontsReady = true });
    }

    check() {
        if (this.done || !this.armed) { return }
        var now = performance.now();
        if (this.pendingActivities.size) { this.blockedBy = "framework activity"; return }
        if (!this.fontsReady) { this.blockedBy = "fonts"; return }
        if (this.inflight > 0) { this.blockedBy = "network"; return }
        if (now - this.lastActivity < PageRenderObserver.QUIET_MS) { this.blockedBy = "recent activity"; return }
        this.finalize("settled");
    }

    finalize(reason) {
        if (this.done) { return }
        if (!this.armed) { this.stop(); return }
        if (document.readyState === "loading") {
            if (reason === "deadline") { this._finalizeReason = reason }
            else { this._finalizeReason ||= reason }
            if (!this._finalizeOnDOMContentLoaded) {
                this._finalizeOnDOMContentLoaded = true;
                document.addEventListener("DOMContentLoaded", () => {
                    this._finalizeOnDOMContentLoaded = false;
                    var pendingReason = this._finalizeReason;
                    this._finalizeReason = null;
                    pendingReason === "deadline" ? this.finalize(pendingReason) : this.check();
                }, { once: true });
            }
            return
        }
        this.done = true;
        clearTimeout(this._deadlineId);
        clearInterval(this._tickId);
        this.teardown();

        var detail = {
            reason: reason,
            elapsed: Math.round(performance.now() - this.started),
            blockedBy: this.blockedBy,
            href: location.href,
        };
        if (Config.DEBUG) {
            console.log(`page:rendered (${reason}) after ${detail.elapsed}ms, last blocker: ${detail.blockedBy}`);
        }

        this.dispatch("page:pre:rendered", detail);

        var fired = false;
        var announce = () => {
            if (fired) { return }
            fired = true;
            this.dispatch("page:rendered", detail);
        };
        requestAnimationFrame(() => requestAnimationFrame(announce));
        setTimeout(announce, 50);
    }
}

window.addEventListener("page:rendered", e => document.body.style.opacity = 1, { once: true });

globalThis.__pageRenderObserver = (function () {
    // Top-level pages and direct child frames have parent === top; block frames nested any deeper.
    // if (isShell() || window.parent !== window.top) { return null }
    if (isShell()) { return null }
    try {
        var observer = new PageRenderObserver();
        observer.init().catch(e => 
            console.error("Render observer initialization failed", e)
        );
        return observer;
    } catch (e) {
        console.error("RenderObserver", e);
        return null;
    }
})();

tryAdopt();
const importMapReady = initImportMap();
preloadController(importMapReady);

 })(this)