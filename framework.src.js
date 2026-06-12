(async (global)=>{ 
global = globalThis;
global.arc = {
    version : "8.2.2.06122026"
};
console.log("v"+global.arc.version);
const kernel_script = document.head?.querySelector("script[data-kernel], script[data-namespace], script[src*='framework.src.js']");

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
            ADOPTED_STYLESHEET: "CSSFILENAME",
            FILENAME:    "CONTROLLER",
            CONTROLLER:   "FILENAME"
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
                    return obj[prop] || obj[origProp];
                }
                // NAMESPACE: body attribute takes priority over script attribute
                if (prop === "NAMESPACE") {
                    var nsVal = kernel_script?.attributes[_attrMap[prop]]?.value || document.body?.attributes?.namespace?.value || obj[prop];
                    return nsVal;
                }
                // Script attribute fallback, then declared default
                
                const attrVal = kernel_script?.attributes[_attrMap[prop]]?.value;
                return attrVal !== undefined ? attrVal : obj[prop]||obj[origProp];
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
                if (_deprecated.has(prop)) `Config.${prop} is deprecated. Use Config.${_aliases[prop]} instead.`.deprecated();
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
    FILENAME : "index.*js",
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


async function initImportMap () {
  window.importmap={};
  async function importmap(){
      if(!Config.IMPORT_MAPS){return}
      var importMapScript = document.head.querySelector("script[type='importmap']");
      if( importMapScript && importMapScript.textContent) {
        window.importmap = JSON.parse(importMapScript.textContent).imports;
      }
      else {
        importMapScript && importMapScript.remove();
        let data = await (await fetch(Config.ROOTPATH+".importmap")).text();
          data = data||"{}";
        var s = document.createElement("script");
            s.setAttribute("type", "importmap");
            s.textContent = data;
        document.head.append(s)
        window.importmap = JSON.parse(data).imports;
      }
  }
  try{await importmap();}catch(e){console.error("initImportMap()",e)}
};


if (!('scheduler' in globalThis)) {
  globalThis.scheduler = {
      yield: () => new Promise(resolve => {
          // Use setTimeout with 0ms to yield to the browser's event loop
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
        static declarative = true;
        static csstext = true;
        lazy = this.hasAttribute("lazy") || false;

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

        // async defineAncestralStylesheets() {
        //     var ignore = ["WebComponent", "HtmlComponent", "Application", "HTMLElement", "IHtmlComponent", "_mixin_"];

        //     for (let ancestor of this.constructor.ancestors) {
        //         if (ancestor == this.constructor && !this.hasOwnSkin()) {
        //             continue
        //         }
        //         if (ignore.includes(ancestor.name)) {
        //             continue
        //         }
        //         if (!ancestor.prototype.hasOwnSkin()) {
        //             break
        //         }

        //         var ns = ancestor.prototype.namespace;
        //         var skin = ancestor.getSkin();
        //         var pathname = window.location.pathname;
        //             pathname = pathname.substring(0, pathname.lastIndexOf(Config.SRC_PATH)+1);
        //         var cssPath = `${pathname}${Config.SRC_PATH}${ns.replace(/\./gim, "/")}/${skin.path}index.css`;
        //             cssPath = cssPath.replace(/\/\//g, "/");
        //         var sheet;

        //         try {
        //             var _module = await this.importCSS(cssPath, ancestor,{with: { type: "css" } });
        //             sheet = _module.default;
        //         } catch (e) {console.warn(e);}

        //         if(sheet && !this.inShadow()){
        //             var shownError=false;
        //             var rules = sheet.cssRules;
        //             for(let rule of rules){
        //                 if(rule?.selectorText?.includes(":host")){
        //                     if(this instanceof Application) {
        //                         !shownError && `Replace ':host' CSS declarations with ':root', in application, '${this.namespace}'`.deprecated("final")//console.error(`Replace ':host' declarations with ':root in application'`, this, sheet);
        //                         shownError = true;
        //                     }
        //                     rule.selectorText = 
        //                         rule.selectorText
        //                             .replace(/\:host\(([^\)]*)\)/gm, (full, sel) => `:host${sel}`)
        //                             .replace(/\:+host/gm, `.${ancestor.name}`);
        //                 }
        //             }
        //         }

        //         if(sheet){
        //             sheet.constructor = ancestor;
        //             sheet && this.stylesheets.add(sheet);
        //         }
        //     }
        // }

        async defineAncestralStylesheets() {
            var ignore = ["WebComponent", "HtmlComponent", "Application", "HTMLElement", "IHtmlComponent", "_mixin_"];

            for (let ancestor of this.constructor.ancestors) {
                if (ancestor == this.constructor && !this.hasOwnSkin()) {
                    continue
                }
                if (ignore.includes(ancestor.name)) {
                    continue
                }
                // if (!ancestor.prototype.hasOwnSkin()) {
                //     break
                // }
                var sheet;
                if(ancestor.prototype.hasOwnSkin()) {
                    var ns = ancestor.prototype.namespace;
                    var skin = ancestor.getSkin();
                    var pathname = window.location.pathname;
                        pathname = pathname.substring(0, pathname.lastIndexOf(Config.SRC_PATH)+1);
                    var cssPath = `${pathname}${Config.SRC_PATH}${ns.replace(/\./gim, "/")}/${skin.path}index.css`;
                        cssPath = cssPath.replace(/\/\//g, "/");
                    

                    var NSPATH = ns.replace(/\./g, "/") + "/";
                    // var url = new URL(Config.SRC_PATH.replace(/^\//, "") + NSPATH + `${skin.path}index.css`, new URL(Config.ROOTPATH, location.href).href);
                    var url = new URL(Config.SRC_PATH.replace(/^\//, "") + NSPATH + `${skin.path}index.css`, new URL(Config.ROOTPATH, document.baseURI).href);

                    try {
                        var _module = await this.importCSS(url.href, ancestor,{with: { type: "css" } });
                        sheet = _module.default;
                    } catch (e) {console.warn(e);}

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
            if (sel) {
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

        async find(cssSel, scan_interval=300, scan_duration=3000) {
            return new Promise(async (resolve, reject) => {
                var el = this.querySelector(cssSel);
                if(el) { resolve(el); return }
                var timerid = setInterval(_ => {
                    el = this.querySelector(cssSel);
                    el && (clearInterval(timerid),resolve(el))
                }, scan_interval);
                setTimeout(_ =>(clearInterval(timerid), resolve(null)), scan_duration);
            });
        }

        async findAll(cssSel, {expect : count, scan_interval = 300, scan_duration = 3000} = {}) {
            return new Promise((resolve, reject) => {
                let nodes = Array.from(this.querySelectorAll(cssSel));
                var interval_id;
                var timer_id;
                var observer;
                var cleanup = () => {
                    clearInterval(interval_id);
                    clearInterval(timer_id);
                }

                this.subscribe("connected", e=> {
                    cleanup();
                    interval_id = setInterval(
                        () => {
                            nodes = Array.from(this.querySelectorAll(cssSel))
                            if(count && nodes?.length >= count || !count && nodes?.length > 1 ) {
                                cleanup();
                                resolve(nodes);
                                return
                            }
                        }, scan_interval
                    );

                    timer_id = setTimeout(
                        () => {cleanup(); resolve(nodes); return}, scan_duration
                    );
                })
            });
        }

        querySelectorAll(cssSel) {
            if (/\>{3}/.test(cssSel)) {
                return this.$_(cssSel); // returns all matches as an array
            } else {
                var res;
                if (this.inShadow() || this.element) {
                    res = this.root.querySelectorAll(cssSel);
                }
                if (!res || !res?.length) {
                    res = super.querySelectorAll(cssSel);
                }
                return res;
            }
        }

        querySelector(cssSel) {
            if (/\>{3}/.test(cssSel)) {
                const res = this.$_(cssSel);
                return res?.length ? res[0] : null;
            } else {
                var res;
                if (this.inShadow() || this.element) {
                    res = this.root.querySelector(cssSel);
                }
                if (!res) {
                    res = super.querySelector(cssSel);
                }
                return res;
            }
        }

        $(css) {
            var res = this.$_(css);
            return res?.length ? res[0]:null
        }

        $_(css) {
            const selectors = css.split(/\s*>>>\s*/);
            var length = selectors.length;
            let roots = [this.root];
            for (let i = 0; i < length; i++) {
                const sel = selectors[i].trim();
                let nextRoots = [];
                for (const root of roots) {
                    const nodes = Array.from(root.querySelectorAll(sel));
                    if (i === length - 1) {
                        nextRoots.push(...nodes);
                    } else {
                        var jlength = nodes.length;
                        for (let j = 0; j < jlength; j++) {
                            if (nodes[j].shadowRoot) nextRoots.push(nodes[j].shadowRoot);
                        }
                    }
                }
                roots = nextRoots;
            }
            return roots;
        }
 
        async disconnectedCallback(){
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
            this.data = data;
            await this.defineAncestralStylesheets();
            await scheduler?.yield?.();
            await this.loadStylesheets();
            await scheduler?.yield?.();
            await this.render(this.data);
            await scheduler?.yield?.();
            await this.setInternalAttributes();
            await scheduler?.yield?.();
            try {
                this.internals?.states?.add("connected");
            } 
			catch {
                this.internals?.states?.add("--connected");
            }
            await scheduler?.yield?.();
            this.onAwake();
            this.fire("connected");
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
                await scheduler?.yield?.();
                var template = await this.loadTemplate(data);
                await scheduler?.yield?.();
                var {fragment} = await engine.parse(template, data, this);
				await scheduler?.yield?.();
                this.root.innerHTML = ""; 
                this.root.appendChild(fragment);
                await scheduler?.yield?.();
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

        async loadStylesheets() {
            if(this.styles) {
                var styles = this.styles;
                for(let css of styles) {
                    this.stylesheets.add(css)
                }
            }
            // Inline css() is now handled per-ancestor inside defineAncestralStylesheets()
            // to preserve correct interleaving: A.css → A.css() → B.css → B.css()
            await this.onAdoptStylesheets();
        }

        // async loadStylesheets() {
        //     if(this.styles) {
        //         var styles = this.styles;
        //         for(let css of styles) {
        //             this.stylesheets.add(css)
        //         }
        //     }
        //     await this.setInlineStylesheet()
        //     await this.onAdoptStylesheets();
        // }

        // getCascadedCSS() {
        //     let css = "";
        //     const ancestors = this.constructor.ancestors || [];
        //     for (let i = ancestors.length - 1; i >= 0; i--) {
        //         const proto = ancestors[i].prototype;
        //         if (proto) {
        //             if (proto.hasOwnProperty("css")) {
        //                 css += proto.css.call(this) + "\n";
        //             } else if (proto.hasOwnProperty("cssStyle")) {
        //                 // TODO - Optional: warn about deprecation
        //                 `${ancestors[i].name || ancestors[i].constructor.name}: cssStyle() is deprecated. Please use css() instead.`.deprecated();
        //                 css += proto.cssStyle.call(this) + "\n";
        //             }
        //         }
        //     }
        //     return css;
        // }

        // async setInlineStylesheet () {
        //     if(this.constructor.csstext) {
        //         var css = this.getCascadedCSS();
        //         if(!css) { return }
        //         var cctor = this.constructor;
        //         css = await this.onTransformStyle(css, cctor);
        //         css = this.createCSSStyleSheet(css, cctor);
        //         this.stylesheets.push(css);
        //     }
        // }

        async onAppendStyle(stylesheet) {
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
                root.adoptedStyleSheets.push(//when shadow dom is supported
                    stylesheet instanceof CSSStyleSheet ? 
                        stylesheet : new CSSStyleSheet().replaceSync(stylesheet.innerText)
                );
            }
        }


        get stylesheets() {
            this._stylesheets = this._stylesheets || [];
            if (!this._stylesheets.add) {
                this._stylesheets.add = (sheet) => {
                    if (!this._stylesheets.includes(sheet)) {
                        this._stylesheets.unshift(sheet);
                    }
                }
            }
            return this._stylesheets;
        }

        async onAdoptStylesheets() {
            var sheets = this.stylesheets;
            for(let sheet of sheets){
                if(sheet instanceof CSSStyleSheet){
                    this.onAppendStyle(sheet);
                }
                else {
                    var pathname = window.location.pathname;
                    pathname = pathname.substring(0, pathname.lastIndexOf(Config.SRC_PATH)+1);
                    var cssPath = `${pathname}${Config.SRC_PATH}${this.namespace.replace(/\./g, "/")}/${sheet}`;
                        cssPath = cssPath.replace(/\/\//g, "/");
                    var NSPATH = this.namespace.replace(/\./g, "/") + "/";
                 // var url = new URL(Config.SRC_PATH.replace(/^\//, "") + NSPATH + `${sheet}`, new URL(Config.ROOTPATH, location.href).href);
                    var url = new URL(Config.SRC_PATH.replace(/^\//, "") + NSPATH + `${sheet}`, new URL(Config.ROOTPATH, document.baseURI).href);

                    try {
                        var _module = await this.importCSS(url.href, this.constructor, {with: { type: "css" } });
                        sheet = _module.default;
                        sheet.constructor = this.constructor;
                        this.onAppendStyle(sheet);
                    } catch (e) {
                        console.error(e);
                    }
                }
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

!function(t){var n=1e3/60,e=0,i=0,o=60,u=.9,r=1e3,f=0,s=0,a=0,c=0,m=!1,d=!1,l=!1,p="object"==typeof window?window:t,h=p.requestAnimationFrame||(b=Date.now(),function(t){return y=Date.now(),A=Math.max(0,n-(y-b)),b=y+A,setTimeout(function(){t(y+A)},A)}),w=p.cancelAnimationFrame||clearTimeout,p=function(){},F=p,M=p,g=p,x=p,S,b,y,A;function D(t){if(S=h(D),!(t<i+c)){for(e+=t-i,F(i=t,e),f+r<t&&(o=u*s*1e3/(t-f)+(1-u)*o,f=t,s=0),s++,a=0;n<=e;)if(M(n),e-=n,240<=++a){l=!0;break}g(e/n),x(o,l),l=!1}}t.MainLoop={getSimulationTimestep:function(){return n},setSimulationTimestep:function(t){return n=t,this},getFPS:function(){return o},getMaxAllowedFPS:function(){return 1e3/c},setMaxAllowedFPS:function(t){return 0===(t=void 0===t?1/0:t)?this.stop():c=1e3/t,this},resetFrameDelta:function(){var t=e;return e=0,t},setBegin:function(t){return F=t||F,this},setUpdate:function(t){return M=t||M,this},setDraw:function(t){return g=t||g,this},setEnd:function(t){return x=t||x,this},start:function(){return d||(d=!0,S=h(function(t){g(1),m=!0,f=i=t,s=0,S=h(D)})),this},stop:function(){return d=m=!1,w(S),this},isRunning:function(){return m}},"function"==typeof define&&define.amd?define(t.MainLoop):"object"==typeof module&&null!==module&&"object"==typeof module.exports&&(module.exports=t.MainLoop)}(this);
//# sourceMappingURL=mainloop.min.js.map


;async function adoptDocumentStylesheet(url) {
    var proto = IHtmlComponent.prototype;
    if (url) {
        try {
            const {default: sheet} = await proto.importCSS.call(proto, url);
            sheet.url = url;
            document.adoptedStyleSheets.push(sheet);
        } catch (e) {
            console.error(e);
        }
    }
}


setTimeout(() => {
    var url;
    if (Config.CSSFILENAME) {
        let ns = (document.head.querySelector("script[namespace]")||document.body)?.getAttribute?.("namespace")||Config.NAMESPACE;
        var nsPath = ns ? ns.replace(/\./g, "/") + "/" : "";
        if (/^[.\/]/.test(Config.CSSFILENAME)) {
            // Explicit prefix (/, ./, ../) — resolve relative to current page
            // url = new URL(Config.CSSFILENAME, location.href).href;
            url = new URL(Config.CSSFILENAME, document.baseURI).href;
        } else {
            // No prefix — load from namespace's src path
            // url = new URL(Config.SRC_PATH.replace(/^\//, "") + nsPath + Config.CSSFILENAME, new URL(Config.ROOTPATH, location.href).href).href;
            url = new URL(Config.SRC_PATH.replace(/^\//, "") + nsPath + Config.CSSFILENAME, new URL(Config.ROOTPATH, document.baseURI).href).href;
        }
        url = url.replace(/\/src\/src\//, "/src/");
        // var preload = document.createElement('link');
        //     preload.rel = 'preload';
        //     preload.as = 'style';
        //     preload.href = url;
        //     document.head.appendChild(preload);
    }
    setTimeout(() => {
        adoptDocumentStylesheet(url);
    }, 0);
}, kernel_script?.attributes["data-kernel"] ? 0 : 50); // Immediate adoption if kernel script is present, otherwise delay to allow for potential late configuration


document.addEventListener("DOMContentLoaded", async e => {
  setTimeout(()=>{
    // Only run ResourceLoader in content pages, not in frameset shells
    const isFramesetShell = document.querySelector('iframe#mainFrame');
    if (!isFramesetShell) {
        if(Config?.ENABLE_SPLASH == undefined || Config?.ENABLE_SPLASH){
            const loader = new ResourceLoader();
            try{loader.init()}catch (e) {console.error(e)} 
        }
        else {
            window.dispatchEvent(new CustomEvent("page:rendered"), {
                detail: location.href,
                bubbles: true,
                cancelable: true
            });
        }
    }
  }, 300)
  
  
  //TODO: Fix this
  globalThis.Session = (top.Session || globalThis.Session);
  let assetsloaded = false;

  try{await initImportMap();}catch(e){}
  await wait(10);


  if(Config.SPLASH){
    let path = Config.SRC_PATH + Config.SPLASH.replace(/\./gm,"/") + "/index.js";
    try{await import(path)}catch(e){console.error(e); assetsloaded=true}
    var Splash = classof(Config.SPLASH)
    if(Splash){
        var splash = document.body.querySelector(`#splash, [namespace='${Config.SPLASH}']`)||new Splash;
            splash.addEventListener("loaded", e=> assetsloaded=true, true)
            splash.setAttribute("duration", Config.SPLASH_FADE_DELAY)
        document.body.appendChild(splash);
        document.body.style.opacity=1;
    }else {assetsloaded=true}
  } else {
    assetsloaded=true; 
    setTimeout(()=>document.body.style.opacity=1, 300)
  };

  let ns = (document.head.querySelector("script[namespace]")||document.body)?.getAttribute?.("namespace")||Config.NAMESPACE;

//   async function bootup() {
//     if (ns && Config.DYNAMICLOAD) {
//       if(Config.APP_WAITS_ON_SPLASH && !assetsloaded){
//         await sleep(100);
//         bootup();
//         return;
//       }
//       else {
//         var filename = Config.FILENAME||(location.pathname.split("/").pop()||"index.html").replace(/\.html?$/i, ".*js");
//         var filename_path = "../../" + Config.SRC_PATH + (ns.replace(/\./g, "/"))  + "/" + filename;
//         var path = Config.USE_COMPRESSED_BUILD ? 
//           filename_path.replace("*", Config.DEBUG ? "src.":"min."):
//           filename_path.replace("*","");
//           path = path.replace(/\/\//g, "/"); 

//         await import(path).then(async function init(){
//           if(!NSRegistry[ns]) {
//             await wait(50);init();return;
//           }
//           let app = window.application = (
//             window.application||new NSRegistry[ns](document)
//           );
//           if(typeof World =="function" && app instanceof World) {
//             window.world=app;
//             let loop = MainLoop;
//             app.onUpdate      && loop.setBegin(app.onUpdate);
//             app.onFixedUpdate && loop.setUpdate(app.onFixedUpdate);
//             app.onDraw        && loop.setDraw(app.onDraw);
//             app.onUpdateEnd   && loop.setEnd(app.onUpdateEnd);
//             loop.setSimulationTimestep(app.getSimulationTimestep());
//           }
//         });
//       }
//     }
//     else {
//       let app = new NSRegistry['core.ui.Application'](document);
//     }
//   };

//   bootup();
// }, false);


async function bootup() {
    // const ns = Config.NAMESPACE;
    var NSPATH = ns ? ns.replace(/\./g, "/") + "/" : "";

    // var url = new URL(Config.SRC_PATH.replace(/^\//, "") + NSPATH + Config.FILENAME, new URL(Config.ROOTPATH, location.href).href);
    //     url = new URL(url.href.replace(/\/src\/src\//, "/src/"));
    var url = new URL(Config.SRC_PATH.replace(/^\//, "") + NSPATH + Config.FILENAME, new URL(Config.ROOTPATH, document.baseURI).href);

    console.log("Bootloader: Loading controller from", url);
    if (ns && Config.DYNAMICLOAD) {
      var filename_path = url.href;//"../../" + Config.SRC_PATH + (ns.replace(/\./g, "/")) + "/" + Config.CONTROLLER;
      var path = Config.USE_COMPRESSED_BUILD ?
        filename_path.replace("*", Config.DEBUG ? "src." : "min.") :
        filename_path.replace("*", "");
        // path = path.replace(/\/\//g, "/");
        path = new URL(path);
      await import(path.href).then(async function init() {
        if (!NSRegistry[ns]) {
          await wait(50); init(); return;
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

  bootup();
}, false);




class ResourceLoader {
    constructor() {
        this.totalResources = 0;
        this.loadedResources = 0;
        this.totalLoadTime = 0;
        this.criticalResourcesLoaded = false;
        this.lastProgress = 0;
        this.preloadedDispatched = false;
        this.criticalLoadedDispatched = false;
        this.criticalResources = new Set(); // Tracks loaded critical resources
        this.requiredCriticalResources = new Set();
    }

    async init() {
        this.debouncedUpdate = this.updateProgress.debounce(await this.getDebounceTime());
        this.observer = new PerformanceObserver(this.handleEntries.bind(this));
        this.observer.observe({ type: 'resource', buffered: true });

        this.parseCriticalResources();
        // --- Fallback Timeout: ---
        var timeOut = await this.getTimeoutDuration();
        this._timeoutId = setTimeout(() => this.finalize('timeout'), timeOut);

        return this;
    }

    parseCriticalResources() {
        if (!Config.CRITICAL_RESOURCES) return;
        const criticalPatterns = Config.CRITICAL_RESOURCES.split('|');
        this.requiredCriticalResources = new Set(criticalPatterns);
    }

    async getTimeoutDuration() {
        const speed = await this.calculateNetworkSpeed();
        const timeouts = {
            fast: window.location.protocol === "file:" ? 500 : 15000,    // 15 seconds for fast connections
            medium: 30000,  // 30 seconds for medium connections
            slow: 60000     // 60 seconds for slow connections
        };
        return timeouts[speed] || 30000; // Default to 30 seconds
    }

    async calculateNetworkSpeed() {
        return await top?.window.detectNetworkSpeed?.()||"fast"
    }

    async getDebounceTime() {
        const speed = await this.calculateNetworkSpeed();
        const times = {
            fast: this.criticalResourcesLoaded ? 100 : 100,
            medium: this.criticalResourcesLoaded ? 800 : 800,
            slow: this.criticalResourcesLoaded ? 1500 : 2000
        };
        return times[speed] || 1000;
    }

    calculateProgress() {
        var progress = Math.min(Math.round((this.loadedResources / Math.max(this.totalResources, 1)) * 100), 100);
        return progress;
    }

    handleEntries = async (list) => {
        const entries = list.getEntriesByType('resource');
        this.totalResources += entries.length;

        for (let entry of entries) {
            if (entry.responseEnd > 0) {
                this.loadedResources++;

                this.trackCriticalResource(entry.name);

                const currentProgress = this.calculateProgress();
                if (currentProgress !== this.lastProgress) {
                    this.lastProgress = currentProgress;
                    
                    // Dispatch preloaded event once at 75% progress
                    if (!this.preloadedDispatched && currentProgress >= 75) {
                        this.preloadedDispatched = true;
                        this.dispatch("page:initial:loaded");
                    }
                }

                this.debouncedUpdate();
                await scheduler?.yield?.();
            }
        }
    }

    trackCriticalResource(resourceName) {
        for (let criticalPattern of this.requiredCriticalResources) {
            const regEx = new RegExp(criticalPattern);
            if (regEx.test(resourceName)) {
                this.criticalResources.add(criticalPattern);
                break;
            }
        }
        if (this.isAllCriticalResourcesLoaded()) {
            this.criticalResourcesLoaded = true;
            
            // Dispatch critical resources loaded event once
            if (!this.criticalLoadedDispatched) {
                this.criticalLoadedDispatched = true;
                this.dispatch("page:critical:loaded");
            }
            
            this.debouncedUpdate();
        }
    }

    isAllCriticalResourcesLoaded() {
        if (this.requiredCriticalResources.size === 0) return true;
        return this.requiredCriticalResources.size === this.criticalResources.size;
    }

    updateProgress = () => {
        this.parseCriticalResources();
        const percent = this.calculateProgress();
        if (percent === 100) {
            // If there are critical resources, require them to be loaded
            if (this.requiredCriticalResources.size > 0) {
                if (this.criticalResourcesLoaded) {
                    this.finalize();
                }
            } else {
                // No critical resources: finalize as soon as all resources loaded
                this.finalize();
            }
        }
    }

    dispatch(evtName){
        window.dispatchEvent(new CustomEvent(evtName), {
            detail: location.href,
            bubbles: true,
            cancelable: true
        });
    }

    finalize(reason) {
        this.dispatch("page:pre:rendered");
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    // window.dispatchEvent(new CustomEvent("page:rendered"), {
                    //     detail: location.href,
                    //     bubbles: true,
                    //     cancelable: true
                    // });
                    this.dispatch("page:rendered");
                    if(reason ==='timeout' && this.requiredCriticalResources.size !== this.criticalResources.size){
                        console.group("🚨 ResourceLoader: Finalized due to timeout");
                        // Create comparison table
                        const resourceComparison = {};
                        this.requiredCriticalResources.forEach(resource => {
                            resourceComparison[resource] = {
                                Required: "✓",
                                Loaded: this.criticalResources.has(resource) ? "✓" : "❌"
                            };
                        });
                        console.table(resourceComparison);
                        console.error(`Missing ${this.requiredCriticalResources.size - this.criticalResources.size} critical resources`);
                        console.groupEnd();
                    }
                }, Config.SPLASH_TIMEOUT); 
                this.observer.disconnect();
            });
        });
    }
};
 })(this)