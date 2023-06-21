(async (global)=>{ global.arc = {
    version : "6.0.0:06202023"
};
console.log("v"+global.arc.version);
var Config = global?.Config ?? top?.Config ?? {
    NAMESPACE : null,
    USE_COMPRESSED_BUILD : false,
    FILENAME : "index.*js",
    DYNAMICLOAD : true,
    CHARSET : "utf-8",
    ROOTPATH : "../../../",
    SRC_PATH : "/src/",
    ENVIRONMENT : "prod",
    LOGGING : true,
    ENABLE_TRANSPILER : true,
    DEFAULT_TEMPLATE_ENGINE_MIMETYPE : "template/literals",
    TEMPLATE_NAMES_USE_ENGINE_EXTENSION : false,//ex: "index.kruntch.html"
    IMPORTS_CACHE_POLICY : { cache: "force-cache", priority: 'high'}, //"default", "no-store", "reload", "no-cache", "force-cache", or "only-if-cached"  (https://fetch.spec.whatwg.org/)
    DEBUG:true,
    DEFAULT_VIEW : "ui.views.Home",
    ROUTER : 'system.http.Router',
    AUTOLOAD_IMPORT_MAPS : true,
    IMPORT_MAPS:true,
    USES_NAMESPACE_FOR_TAGNAMES : true,
    ARROW_FUNCTIONS_FOR_WORLD_LOOP : true,
    INTERPOLATE_CSS : false,
    APPCONFIG_LOADS_ONCE : true
};
global.Config = Config;
try{module.exports = Config;}catch(e){}
//
//
;String.prototype.toNode = function(fragment=false){
  var n = document.createRange().createContextualFragment(this.toString())
  return fragment?fragment:n.firstElementChild;
}
//
document.on = (evtName, handler, bool=false, el) => {
    document.addEventListener(evtName, handler, bool, el);
}
;var wait = sleep = ms => new Promise((r, j)=>setTimeout(r, ms));
global.wait=wait;

function reflect(target, source) {
    for (let key of Reflect.ownKeys(source)) {
        if(typeof key != Symbol && !/Symbol|namespace|constructor|ancestor|classname|prototype|name/.test(key)){
            let desc = Object.getOwnPropertyDescriptor(source, key);
            Object.defineProperty(target, key, desc);
        }
    }
    target.traits=target.traits||{};
    target.traits[source.constructor.name]=source.constructor;
};

Function.prototype.with = function(...mixin) {
    let _mixin_ = class extends this {}

    for(let m of mixin){
        if(typeof m =="object") {
            reflect(_mixin_.prototype, m);
        } else{
            reflect(_mixin_.prototype, m.prototype);
        }
    }
    return _mixin_;
};




//

window.toAbsoluteURL = function(url) {
    const a = document.createElement("a");
    a.setAttribute("href", url);
    return a.cloneNode(false).href; 
}

window.classof = function(ns){ return NSRegistry[ns] }
window.imported_classes = window.imported_classes || {};
window.imports = async function (x, opts, isError) {
    opts = opts || Config.IMPORTS_CACHE_POLICY || {cache:"force-cache"}
    return new Promise(async (resolve, reject) => {
        var path = x;
        path = path.replace(/^\/+/, Config.ROOTPATH);
        var error = "404 import: " + toAbsoluteURL(path)||path;
        if (window.imported_classes[x]) {
            resolve(window.imported_classes[x]);
            return;
        }
        try {
            const response = await fetch(path, opts);
            if (response.ok) {
                var src = await response.text();
                window.imported_classes[x] = src;
                resolve(src);
            } else {
                var src = await response.text();
                throw new Error;
                console.error(error);
                resolve("");
            }
        } catch (e) {
            try{
              var request = new XMLHttpRequest();
              request.open('GET', path, false);
              request.send(null);
            } catch(xe){
                console.error("404 import: " + toAbsoluteURL(path), xe);
                resolve("");
            }
            if (request.status == 0 || request.status == 200) {
                src = request.responseText;
                window.imported_classes[x] = src;
                resolve(src);
            }
            else {
                console.error("404 import: " + toAbsoluteURL(path));
                resolve("");
            }
        }
    });
};


async function initImportMap () {
  window.importmap={};
  async function importmap(){
      if(!Config.IMPORT_MAPS){return}
      var importMapScript = document.head.querySelector("script[type='importmap']");
      if( importMapScript) {
        window.importmap = JSON.parse(importMapScript.textContent).imports;
      }
      else {
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

  var modulemap = window.modulemap = window.importmap;
  async function importModule(url) {
    //TODO: Use error code
    var error = !/\//.test(url) && !/\.m?js/.test(url) ? `Unable to resolve import, '${url}'. Missing .importmap specifier`:null;
    url = (modulemap[url]||url).replace(/^\/+/, Config.ROOTPATH);
    var absURL = toAbsoluteURL(url);
    var mod=modulemap[absURL];
    if (mod) { return mod};
    return new Promise(async (resolve, reject) => {
      if (mod) { resolve(mod)};
      var s1 = document.createElement("script");
          s1.type = "module";
          s1.onerror = () => {console.error(error||`404: ${absURL}`); resolve();}
          s1.onload  = () => {
            resolve(modulemap[absURL]); URL.revokeObjectURL(s1.src); s1.remove();
          };
      const loader = `import * as m from "${absURL}"; modulemap['${absURL}'] = m;`;
      const blob = new Blob([loader], { type: "text/javascript" });
      s1.src = URL.createObjectURL(blob);
      document.head.appendChild(s1);
    });
  };

  window.load = importModule;
  if(typeof require == "undefined"){
    window.require = importModule;
  }
};
//
function relativeToAbsoluteFilePath(path, ns, appendRoot){
    ns = ns||this.namespace;
    ns = ns.replace(/\./gim,"/");
    if(path.indexOf("/./") >= 0){
        path = path.replace("./", ns+"/");
    } 
    if(/^\.\//.test(path)){
        path = path.replace("./", Config.SRC_PATH+ns+"/");
    } 
    path = /http:/.test(path)? path : path.replace("//","/");
    return path;
}
global.relativeToAbsoluteFilePath = relativeToAbsoluteFilePath;

window.stylesheets = function stylesheets (target, paths){
    target.prototype['@stylesheets'] = [];
    console.warn(`@stylesheets decorator on '${target.prototype.namespace}' is deprecated. Use:\nthis?.stylesheets?.unshift("my.css") in constructor() instead`)
    paths && paths.forEach(p => {
        var filepath = relativeToAbsoluteFilePath(p,target.prototype.namespace,false);
        target.prototype['@stylesheets'].unshift(filepath)
    });
}

window.cascade = function cascade(target,shouldCascade){
    target.prototype['@cascade'] = shouldCascade;
}

window.prop = function prop(target,key,val){
    target.prototype[key] = val;
}

window.theme = function(target, name){
 target.prototype.theme = name
}

window.tag = function tag(target, name){
    if(target.is){return}
    target.prototype["ns-trait-tagname"]=name;
    try{
        target.define(target.prototype)
    }catch(e){console.error(e)}
    console.warn(`@tag decorator on class '${target.prototype.namespace}' is deprecated`);
    return;
}

window.field = function field(target, type, key, val){
    console.warn(`@${type} decorator on class '${target.prototype.namespace}' is deprecated.`);
    target = (type=="static") ? target : target.prototype;
    target[key] = val;
};



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

    var fromNS = function(ns){
        var parts = ns.split(/\./g); 
        return parts.reduce((acc, next) => acc&&acc[next] ? acc[next] : (null), env);
    };
    env.fromNS=fromNS;

    var createClass = function(func){
        try {
            var proto  = func.prototype;
                proto.ancestor = proto.__proto__.constructor;
                try{  func.define(proto) } catch(e){};
                return func;
        } catch(e){ return func }
        return func
    };
})(this);
class Observer {
    addEventListener(name, cb, capture){
        this.subscribers=this.subscribers||{};
        if (!this.subscribers[name]) {
            this.subscribers[name] = [];}
        this.subscribers[name].push({name, func:cb});
    }
    
    dispatchEvent(name, data, scope=this||window) {
        this.subscribers=this.subscribers||{};
        var cbs = this.subscribers[name]||[];
            cbs.forEach(cb => cb.func.call(scope, data));  
    }
    
    removeEventListener(name, cb){
        this.subscribers=this.subscribers||{};
        var subs = this.subscribers[name]||[];
            subs.remove(i => i.name === name && i.func === cb);
    }
};
window.Observer = window.IEventTarget = Observer;



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
    class Repository extends IEventTarget {
        static get storage(){
            //TODO: replace check for "seeds" | Deprecate @public seeds decorator
            var p = "seeds" in this.prototype?this.prototype:this;
            var Storage = p.device_driver||p.driver;
                Storage = typeof Storage=="string"?NSRegistry[Storage]:Storage;
            this.interface = this.interface||new Storage(this);
            if(p.device_driver){console.warn(`@public device_driver is deprecated. Use @public driver. See:`,p.namespace)}
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
            return new Promise((resolve,reject) =>{
                this.storage.find((result, error)=>{
                    cb?cb(result, error):resolve(result, error);
                },query)
            })
        }

        static onDataReceived (data, xhr){
            var self=this;
            data = this.transform(data);
            this.setData(data.table||data.name, data);
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

        static async seed (uri, params, force){
            //TODO: replace this.prototype.seeds with this.seeds | Deprecate @public seeds decorator
            uri = "seeds" in this.prototype?this.prototype.seeds:this.seeds;
            return new Promise(async (resolve,reject) =>{
                if(!this.isSeedable()) {
                    this.prototype.dispatchEvent("loaded", {controller: this}, this);
                    resolve();
                    return;
                };
                force = (typeof force == "boolean") ? force:false;
                if(force||!this.storage.isSeeded()){
                    var response = await fetch(uri[Config.ENVIRONMENT]);
                    var json = await response.json();
                    var res = this.onDataReceived(json);
                    this.storage.setSeeded(true)
                    this.commit();
                    this.prototype.dispatchEvent("loaded", {controller: this}, this);
                    resolve(res)
                } else {
                    this.prototype.dispatchEvent("loaded", {controller: this}, this);
                    this.storage.setSeeded(true)
                    this.commit();
                    resolve()
                }  
            })
        }
    }
);

Collection = window.Collection = domain.collections.Repository;



namespace `system.machines` (
    class Automata extends Array {
        constructor() {
            super();
        }

        get state(){
            return this[0]
        }

        //called by game loop
        onUpdate(timestamp, delta){
            var state = this[0];
                //================AWAKE IF SLEEPING======
                state&&state.isSleeping&&state.onAwake();
                state&&(state.isSleeping=false);
                //========================================
                state&&!state.isSleeping&&state.onUpdate&&state.onUpdate(timestamp, delta);
        }

        //called by game loop
        onFixedUpdate(time){
            var state = this[0];
                state&&!state.isSleeping&&state.onFixedUpdate&&state.onFixedUpdate(time);
        }

        //called by game loop
        onDraw(interpolation){
            var state = this[0];
                state&&!state.isSleeping&&state.onDraw&&state.onDraw(interpolation);
        }

        

        //called by user to push in a new Component
        push(state){
            if(this[0]==state){return}
            this[0]&&this[0].onSleep();
            this[0]&&(this[0].isSleeping=true);
            state && !state.isStarted && state.onStart();
            state && state.onAwake();
            state.isSleeping=false
            // this.pop();
            this.unshift(state);
        }

        //called by machine
        pop(item){
            if(item){
                var current = this[0];
                if(current && current==item){
                    if(!current.isFinished){
                        current.onSleep()
                        current.isSleeping=true;
                    }
                    else {
                        current.onExit();
                        this[0]=null;
                    }
                    this.shift();
                    this[0].onAwake();
                    this[0].isSleeping=false;
                }
            } else {
                var s = this.shift();
                    s.onSleep();
                this[0] && this[0].onAwake()
                this[0].isSleeping=false;
            }   
            // this.shift();
        }
    }
);




namespace `system.machines` (
    class State {
        constructor(element, machine){
            this.element = element;
            this.machine = machine||element.machine||element.behaviors;
		}
		//------------------------------MACHINE CALLED----------------------------
        onAwake(){
            console.log(this.namespace + " Awake");
        }

        onSleep(){
            console.log(this.namespace + " Sleeping");
        }

        //Called once if never started
        onStart(dir) {
			this.isStarted=true;
            console.log(this.namespace + " Started");
		}

        //Called if isFinished; 
        onExit(){
            console.log(this.namespace + " Exit")
        }

        //runs 1x per frame. Handle user input
       	onUpdate(timestamp, delta){}

        //runs many times per frame. For physics/collision/ai
        onFixedUpdate(time) {}

        //runs 1x per frame. Paint here
        onDraw(interpolation){}
    }
);
global.MonoBehavior = global.MonoBehavior||system.machines.State;


namespace `system.http` (
    class Router {
        constructor(app,hostWindow){
            this.activities = {};
            this.preloaded={};
        	this.window = hostWindow;
        	this.application = app;

            var hashchangeCb = this.application.onHashChange?
                this.application.onHashChange.bind(this.application):
                this.onHashChange.bind(this);

            this.window.addEventListener("hashchange", (e)=> hashchangeCb(e), false)
            if(this.window.location.hash.length > 0){
                hashchangeCb()
            }
        }

        async onHashChange (e){
            var ns = this.window.location.hash.split("#")[1];
            if(!ns){return}
            var scrollTo = ns.split("?el=");
            ns=scrollTo[0];
            scrollTo = scrollTo[1];

            if(!NSRegistry[ns]){
                this.application.onLoadingActivity(ns);
                await new system.http.ClassLoader().import(ns)
            }
            // this.onActivityLoaded(ns,NSRegistry[ns],scrollTo);
            var i = setInterval(e=> {
                if(NSRegistry[ns]) {
                    clearInterval(i)
                    this.onActivityLoaded(ns,NSRegistry[ns],scrollTo);
                }
            },100)
        }

        async onActivityLoaded(ns,_class,scrollTo){
            await wait(100);
            var a = this.application.onFindActivitySlot().querySelector(`*[namespace='${ns}']`);
            if(a){
                this.application.onEnterActivity(a,scrollTo);
                this.activities[ns]  =a;
                this.current_activity=a;
                return;
            }
            var c = this.activities[ns]||new _class;
            this.current_activity && this.application.onExitCurrentActivity(this.current_activity)
            this.application.onEnterActivity(c,scrollTo);
            this.activities[ns] = c;
            this.current_activity=c;
        }

        destroy(activityInstance){
            this.activities = this.activities||{};
            delete this.activities[activityInstance.namespace];
        }
    }
);



namespace `core.drivers.templating` (
    class Manager {
        constructor(){
            this.engines = {}
            this.defaultMimetype = Config.DEFAULT_TEMPLATE_ENGINE_MIMETYPE||"template/literals";
        }

        define(mimeType, engine){
            if(!this.engines[mimeType]){
                this.engines[mimeType] = engine;
                engine.install();
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


(() => {
    var TemplateLiterals = {
        name : "TemplateLiterals",
        ext : "",
        parse : function(tempStr, data, self){
            var parse = (tempStr, templateVars) => {
                if(!/\<\s*template\s*\>/.test(tempStr)){
                    if(Config.INTERPOLATE_CSS) {
                        tempStr = tempStr.replace(/\\/gm, "\\\\");//escape backslashes before octal chars
                        tempStr = tempStr.replace(/\`/gm, "\\`");//escape backticks `
                    }
                    else {
                        return tempStr
                    }
                }
                return new Function("return `"+tempStr +"`;").call(templateVars);
            }
            return parse(tempStr, data)
        },
        install : function(){}
    };
    

    window.customTemplateEngines.define("template/literals", TemplateLiterals);
})();


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
    class WebComponent extends HTMLElement {
        constructor(el,options={}) {
            super();
            this.options = options;
            this.element = el;
            var template = this.firstElementChild;
            this._template = template && template instanceof HTMLTemplateElement ? template:null;
            this.internals  = this.attachInternals && this.attachInternals();
            this.hasDeclarativeShadow    = this.internals?.shadowRoot||this._template;
            this.__proto    = this.constructor.prototype;
            // globalThis._eventData = globalThis._eventData||{};
            // globalThis._eventFired= globalThis._eventFired||{}
            globalThis._eventObjects= globalThis._eventObjects||[];

            this._eventData = {};
            this._eventFired = {};
            this._eventObjects = {};

            if(this.element && this.isExistingDomNode(this.element)){
                this.root = this.element
                this.connectedCallback();
            }
            else {
                // this.root = !this.inShadow() ? 
                //     this : 
                //     this.internals?.shadowRoot||this.attachShadow({mode:'open'});
                if(this.hasDeclarativeShadow) {
                    if(this.hasOwnTemplate()){
                        this.hasDeclarativeShadow=false;
                        this._template && this._template.remove();
                        this._template=null;
                        this.root = this.attachShadow({mode:'open'});
                    }
                    else {
                        // this.root = this.internals.shadowRoot
                        this.root = !this.inShadow() ? 
                            this : 
                            this.internals?.shadowRoot||this.attachShadow({mode:'open'});
                    }
                }
                else {
                    // this.root = this.attachShadow({mode:'open'});
                    this.root = !this.inShadow() ? 
                        this : 
                        this.internals?.shadowRoot||this.attachShadow({mode:'open'});
                }
            }
            
            // else {
            //     if(this.hasDeclarativeShadow && this.hasOwnTemplate()) {
            //         this.hasDeclarativeShadow=false;
            //         this._template && this._template.remove();
            //         this.root = this.inShadow() ? 
            //             this.attachShadow({mode:'open'}) : 
            //             (this.element||this);
            //     }
            //     else {
            //         if(!this.hasDeclarativeShadow){
            //             this.root = this.inShadow() ? 
            //                 this.attachShadow({mode:'open'}) : 
            //                 (this.element||this);
            //         }
            //         else if(this.hasDeclarativeShadow && this.internals?.shadowRoot) {
            //             this.root = this.internals.shadowRoot
            //         }
            //         else if(this.hasDeclarativeShadow && this._template) {
            //             if(this.inShadow()) {
            //                 this.root = this.attachShadow({ mode: 'open' });
            //                 this.root.append(this._template.content);
            //                 template && template.remove();
            //             }
            //             else {
            //                 this.root=this;
            //             }
            //         }
            //         else {
            //             this.root=this;
            //         }
            //     }
            // }
        }

        //only checked when page has components with inline shadowDOM <template> (when this.hasDeclarativeShadow==true)
        hasOwnTemplate() {
            return false
        }
        
        async loadTemplate() {   
            return new Promise(async (resolve, reject) => {
                var tem  =  this.getTemplateToLoad();
                var opts = Config.IMPORTS_CACHE_POLICY || {cache:"force-cache"}
                if(/\/*\.html$/.test(tem)){
                    var src=tem;
                        src = src.replace("/./", this.namespace.replace(/\./gim, "/") + "/");
                    this._template = await window.imports(src, opts);
                    resolve(this._template)
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

        getTemplateToLoad(){
            var skin = this.__skin__||this.getSkin();
            var engine = this.getTemplateEngine();
            return  this.querySelector("template")||    //node
                    this.template||                     //string(html or path)
                    this.element||                      //node
                    Config.SRC_PATH+`/./${skin.path}index` + (engine.ext||"") + ".html"
        }

        get application() {
            return false
        }

        async ensureApplication(timeout) {
            var start = Date.now();
            var waitFor = async (resolve, reject) => {
                if (Config.APP_WAITS_ON_SPLASH || window.application) {
                    resolve(true);
                }
                else if (timeout && (Date.now() - start) >= timeout) {
                    resolve(true);
                }
                else {
                    await sleep(20);
                    waitFor(resolve, reject);
                }
            }
            return new Promise(waitFor);
        }

        get isConnected(){return this._is_dom_ready}

        async connectedCallback() {
            this.application && await this.ensureApplication(3000);
            await this.onConnected();
            this.onAwake();
        }

        async onConnected(data=this) { 
            !this.hasDeclarativeShadow && await this.loadTemplate();
            await this.onTemplateLoaded();
            !this.hasDeclarativeShadow && await this.render(data);

            if(!this.inShadow()) {
                this.assignSlots(this._template.content)
            }
            this._is_dom_ready=true;
            setTimeout(e=>this.onRendered(),0);
            this.fire("connected")
        }
        
        async disconnectedCallback(){
            await this.onDisconnected();
            this.onSleep();
        }

        async onDisconnected(){}

        // assignSlots(temNode) {
        //     if(!temNode) { return}
        //     if (!this.inShadow() && this.isComposable()) {
        //         var defaultSlot = temNode.querySelector("slot");
        //         if(defaultSlot){
        //             let nodes = Array.from(this.children);
        //             for(let n of nodes){
        //                 if(n instanceof HTMLTemplateElement) { continue}
        //                 var slotName = n.getAttribute('slot');
        //                 var ph = slotName==null?
        //                     temNode.querySelector(`slot:not([name])`):
        //                     temNode.querySelector(`slot[name="${slotName}"]`)||null;
        //                 if( ph && !ph.emptied){
        //                     (ph.innerHTML="");
        //                     (ph.emptied=true);
        //                 }
        //                 ph?(ph).appendChild(n):slotName?n.remove():null;
        //             }
        //         }
                
        //     }
        //     this.root.innerHTML = "";
		// 	this.root.appendChild(temNode);
        // }
        assignSlots(temNode) {
            if(!temNode) { return}
            if (!this.inShadow() && this.isComposable()) {
                var defaultSlot = temNode.querySelector("slot");
                if(defaultSlot){
                    let nodes = Array.from(this.children);
                    for(let n of nodes){
                        if(n instanceof HTMLTemplateElement) { continue}
                        var slotName = n.getAttribute('slot');
                        var ph = !slotName?
                            temNode.querySelector("slot:not([name])") : 
                            temNode.querySelector(`slot[name="${slotName}"]`)||defaultSlot;
                        if( ph && !ph.emptied){
                            (ph.innerHTML="");
                            (ph.emptied=true);
                        }
                        // ph ? (ph).appendChild(n) : slotName?n.remove():null;
                        ph&&ph.appendChild(n);
                    }
                }
                
            }
            this.root.innerHTML = "";
			this.root.appendChild(temNode);
            
            // if(this.inShadow()){
            //     // this.root.innerHTML = "";
            //     this.root.appendChild(temNode);
            // }
            // else {
            //     // this.root.innerHTML = "";
			//     super.appendChild(temNode);
            // }
        }
        
        appendChild(n, slot){
            var defaultSlot = (slot) ? this.querySelector(`slot[name='${slot}']`):null;
            if(!this.inShadow()) {
                defaultSlot = defaultSlot||this.querySelector("slot:not([name])");
                if(defaultSlot) {defaultSlot.appendChild(n)}
                else {
                    return super.appendChild(n)
                }
            }
            else {
                if(defaultSlot) { return defaultSlot.appendChild(n) }
                return (this.element) ? this.element.appendChild(n):super.appendChild(n);
            }
        }

        // appendChild(n){
        //     return this.element && n!=this.element  ? this.root.appendChild(n):super.appendChild(n)
        // }
        
        async render(data={}, t=this._template, outputEl) {
			if(this.isExistingDomNode(this.element)){
				this.onTemplateRendered(temNode);
				// this.dispatchEvent("connected",{target:this})
				return
			}
			else if (t && typeof t=="string") {
				var html = await this.evalTemplate(t, data);
				var temNode = html.toNode();
					if(!temNode?.content){
						console.error(`${this.namespace} - invalid <template>`, {template:this._template, owner:this.parentNode});
						return
					}
					temNode = temNode.content;
                    this.assignSlots(temNode)
				this.onTemplateRendered(temNode);
			}
			else if(t && typeof t == "function"){
				await this.render(data,t.call(data))
			}
		}

        onAwake(){
            if(this.onUpdate||this.onDraw||this.onFixedUpdate){
                document.component2d_instances = document.component2d_instances||[];
                document.component2d_instances.push(this);
            }
        }

		onSleep(){}
        
        isExistingDomNode(el){
            return el && el.parentNode && el.parentNode.nodeType==1
        }
        
        static define(proto,bool){
            proto.ancestor = proto.__proto__.constructor
            var ce = window.customElements;
            var r = /([a-zA-Z])(?=[A-Z0-9])/g;
            var tag = (proto.constructor.is ? 
                proto.constructor.is : 
                Config.USES_NAMESPACE_FOR_TAGNAMES ? 
                    proto.namespace:
                    proto.constructor.name).replace(r, (f,m)=> `${m}-`).replace(/\./g,"-").toLowerCase();
                tag = /\-/.test(tag)? tag:proto["ns-trait-tagname"];
                                
            if(/\-/.test(tag)){
                if(ce.get(tag)){return}
                proto["ns-tagname"] = tag;
                delete proto["ns-trait-tagname"]
                this.defineAncestors();
                this.defineAncestralClassList();
                try{ce && ce.define(tag, this)}catch(e){}
            }    
        }

        async setStylesheet () {
            if(this.inShadow()){
                var css = this.cssStyle();
                css && this.onAppendStyle(
                    `<style>\n${await this.onTransformStyle(css, this.constructor)}\n</style>`.toNode()
                )
            } else {
                var css = this.cssStyle();
                (!!css && this.__proto._style != css) ? 
                    (this.onAppendStyle(
                        `<style>\n${await this.onTransformStyle(css, this.constructor)}\n</style>`.toNode()),
                        this.__proto._style = css
                    ) : null;
            }
        }

        get SKINPATH (){
            var skin = this.__skin__||this.getSkin();
            var path = Config.ROOTPATH + Config.SRC_PATH + this.namespace.replace(/\./g,"/") + (skin.path?"/":"") + skin.path;
            path = path.replace(/\/{2}/gm, "/");
            return path
        }
        
        setAttribute(name, val){
            return (this.element) ? 
                this.root.setAttribute(name, val) : super.setAttribute(name, val)
        }

        querySelector(cssSel){
			if(/\>{3}/.test(cssSel)) {
				return this.$(cssSel)
			}
			else {
				var res;
				if(this.inShadow()||this.element){
					res = this.root.querySelector(cssSel);
				}
				if(!res) {
					res = super.querySelector(cssSel)
				}
				return res;
			}
        }

        querySelectorAll(cssSel){
			if(/\>{3}/.test(cssSel)) {
				return this.$_(cssSel)
			}
			else {
				var res;
				if(this.inShadow()||this.element){
					res = this.root.querySelectorAll(cssSel);
				}
				if(!res||!res?.length) {
					res = super.querySelectorAll(cssSel)
				}
				return res;
			}
        }

        $(css) {
            var res = this.$_(css);
            return res?.length ? res[0]:null
        }

        $_(css) {
            var queries = css.split(/\s?\,\s?/);
            var results = [];
            for(let css of queries) {
                let doc_scope = /^\s?BODY/i.test(css) ? 'document':'this';
                css = `return ${doc_scope}.querySelector("` + css.replace(/\s?>{3}\s?/gm, "\").shadowRoot.querySelector(\"") + `")`;
                css = css.replace(/\bquerySelector\b(?!.*?\bquerySelector\b)/, "querySelectorAll")
                let el = null;
                try { 
                    el = new Function(css).call(this);
                    results.push(Array.from(el))
                } catch(e) {console.error(e)}
            }
            return results.flat(10);
        }

        onAppendStyle(stylesheet) {
            if(this.inShadow()){
                try{
                    var sheet = new CSSStyleSheet();
                        sheet.replace(stylesheet.innerText);
                    this.root.adoptedStyleSheets=this.root.adoptedStyleSheets.concat([sheet]);
                } catch(e){
                    try{
                        setTimeout(e=> {
                            var style = document.createElement("style");
                                style.setAttribute("type", 'text/css');
                                style.setAttribute("rel",  'stylesheet');
                                style.textContent = stylesheet.innerText;
                            this.root.appendChild(style)
                        },20)
                    } catch(be){
                        console.error(be)
                    }
                    console.warn(`${this.namespace}#onAppendStyle(): adoptedStyleSheets not yet supported. See https://bugzilla.mozilla.org/show_bug.cgi?id=1520690.`);//TODO: use code
                }
            }
            else { document.head.appendChild(stylesheet) }
        }

        onStyleComputed(stylesheet){}

        dispatchEvent(type, data={}, element) {
            data.target = data.target||this;
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
                super.dispatchEvent(evt);
                return evt
            }
        }

        on(evtName, handler, bool=false, el) {
            this.addEventListener(evtName, handler, bool, el);
        }

        addEventListener(evtName, handler, bool=false, el) {
            if (typeof el == "string") {
                this.addEventListener(evtName, e => {
					var t = (e.composedPath&&e.composedPath().find(node => node.matches&&node.matches(el)))||e.target;
					    t && t.matches(el) && (e.matchedTarget = t) && handler(e);
                }, bool);
            } else {
                if(this.element && this.isExistingDomNode(this.element)){
                    this.element.addEventListener(evtName, handler, bool);
                }
                else{
                    super.addEventListener(evtName, handler, bool);
                }
            }
        }

        subscribe(eventType, listener, capture) {
            const previousEvent = this._eventObjects[eventType];
            if (previousEvent && this.isConnected) {
                listener(previousEvent);
            }
            return this.addEventListener(eventType, listener, capture);
        }

        // register(eventType, listener, capture) {
        //     const previousEvents = globalThis._eventObjects[eventType];
        //     if (previousEvents?.length) {
        //         for(let e of previousEvents) {
        //             listener(e);
        //         }
        //     }
        //     return this.addEventListener(eventType, listener, capture);
        // }

        fire(type, data={}, element) {
            const eventType = type;//event.type;
            this._eventData[eventType] = data;
            this._eventFired[eventType] = true;
            
            var evt = this.dispatchEvent(type, data, element||this);
            this._eventObjects[eventType] = evt;
            globalThis._eventObjects[eventType] = globalThis._eventObjects[eventType]||[];
            globalThis._eventObjects[eventType].push(evt);
            return evt;
        }

        get stylesheets() {
            var proto = this.constructor.prototype;
                proto["@stylesheets"]=proto["@stylesheets"]||[];
            return proto["@stylesheets"]
        }

        onStylesheetLoaded(style) { }

        async onTransformStyle(cssText, cls, ns=this.namespace){
            ns=ns.replace(/\./g,"/");
            var skin = this.__skin__||this.getSkin();
            var attrbSkinSelector = skin&&skin.name ? `[skin="${skin.name}"]`:'';
            if(!this.inShadow()){
                cssText = cssText.replace(/\:host\(([^\)]*)\)/gm, (full, sel) => `:host${sel}`);
                cssText = cssText.replace(/\:host/gm, (full, sel) => `:host${attrbSkinSelector||''}`);
                cssText = cssText.replace(/\:+host/gm, `.${cls.name}`);
                cssText = this.hasOwnSkin()?await this.evalTemplate(cssText,this):cssText;
                return cssText;
            }
            if(this.inShadow() && attrbSkinSelector){
                cssText = cssText.replace(/\:host\(([^\)]*)\)/gm, (full, sel) => `:host(${attrbSkinSelector||''}${sel})`);
                cssText = cssText.replace(/\:host\s+/gm, (full, sel) => `:host(${attrbSkinSelector||''}) `);
                cssText = this.hasOwnSkin()?await this.evalTemplate(cssText,this):cssText;
            }
            return cssText
        }

        setCssTextAttribute(_cssText, stylenode) {
            if (stylenode && stylenode.styleSheet) {
                stylenode.styleSheet.cssText = _cssText;
            }
            else { stylenode.appendChild(document.createTextNode(_cssText)) }
        }

        onRendered(){}

        isComposable(){ return true }

        async append(el, container=this.root){
            return new Promise(async (resolve,reject) => {
                requestAnimationFrame( async e=>{container.appendChild(el);resolve(el)} );
            })
        }

        // appendChild(n){
        //     return this.element && n!=this.element  ? this.root.appendChild(n):super.appendChild(n)
        // }

        async evalTemplate(template, data) {
            var eng = this.getTemplateEngine();
            return await eng.parse(template, data, this);
        }

        getTemplateEngine() {
            return window.customTemplateEngines.default;
        }

        async onTemplateLoaded() {
            this.setClassList();
            this.setSkinAttribute();
            this.setPrototypeInstance();
            await this.setStyleDocuments();
        }

        setSkinAttribute(){
            var skin = this.__skin__||this.getSkin();
                skin && skin.name && this.setAttribute("skin", skin.name)
        }

        onTemplateRendered(){
            // this.dispatchEvent("connected",{target:this});
        }

        inShadow() { 
            return this.internals?.shadowRoot||this.shadowRoot
        }

        // attachShadow(options) {
        //     this._usesShadow = true;
        //     return super.attachShadow(options);
        // }

        cloneAttributes(target=this, source) {
            return [...source.attributes].forEach( attr => { target.setAttribute(attr.nodeName ,attr.nodeValue) })
        }

        cssStyle(){ return "" }

        hasParentSkin(){
            return true
		}

        //TODO: Remove deprecation warning in 6.0.0
		hasOwnSkin(){
            if("onLoadInstanceStylesheet" in this) {
                console.warn(`${this.namespace}#onLoadInstanceStylesheet() method name is deprecated. Rename to hasOwnSkin().`)
                return this.onLoadInstanceStylesheet()
            }
            return true
		}

        static defineAncestors(){
            this.ancestors=[];
            var a=this;
            while(a && this.ancestors.push(a)){a = a.prototype.ancestor}
        }

        static defineAncestralClassList(){
            this.prototype.classes = [];
            for(let ancestor of this.ancestors){ this.prototype.classes.unshift(ancestor.prototype.constructor.name) }
        }

        getNSStyleSheet(ns){
            var skin = this.__skin__||this.getSkin();
            return relativeToAbsoluteFilePath(Config.SRC_PATH+`/./${skin.path}index.css`,ns);
        }

        getSkin(){
            if(this.__skin__){return this.__skin__}
            var name = Config.SKIN||this.getAttribute("skin")||this.constructor.skin||"";
            var path = name ? `skins/${name}/`:"";
            this.__skin__ = {name, path};
            return this.__skin__;
        }

        setClassList(el=this.element||this) {
                var cls = this.__proto.classes.filter(c => c != "_mixin_")
                el.className += " " + (cls.join(" ")).trim();
                el.className = el.className.trim();
        }
 
        async setStyleDocuments() {
            await this.loadcss();
            this.setStylesheet();
            this.onStyleComputed(this.stylesheets);
        }

        async loadcss() {
            var ignoredClasses=[WebComponent,Application,World,HTMLElement];
            var ancestors = this.constructor.ancestors.toReversed();
            var stylesheets = window.loaded_stylesheets = window.loaded_stylesheets|| {};
            var skin = this.__skin__||this.getSkin();
            return new Promise(async (resolve,reject) => {
                for(let ancestor of ancestors){
                    if(ancestor.name =="_mixin_"){continue}
                    if(!ignoredClasses.includes(ancestor) && ancestor.prototype.hasOwnSkin() ){
                        var paths = [];
						if(ancestor != this.constructor && this.hasParentSkin()){
							if(ancestor.skin == skin.name||(!ancestor.skin && !skin.name)){
								paths = paths.concat([relativeToAbsoluteFilePath(Config.SRC_PATH+`/./${skin.path}index.css`,ancestor.prototype.namespace)]);
                                paths = paths.concat((ancestor.prototype["@stylesheets"]||[]).reverse());
							}
						}
						else if(ancestor == this.constructor){
							if(this.hasOwnSkin()){
								paths.push(this.getNSStyleSheet(this.namespace))
							}
							if(this.__proto.hasOwnProperty("@stylesheets")){
                                let file_paths = [...this.__proto["@stylesheets"].reverse()||[]];
                                file_paths.forEach(_path => {
                                    /\//.test(_path) ?
                                        paths.push(_path):
                                        paths.push(relativeToAbsoluteFilePath(Config.SRC_PATH+`/./${skin.path}${_path}`,this.namespace));
                                })
							}
						}
                        for(let path of paths){
                            if(stylesheets[path] && !this.inShadow()){continue}
                            path = this.onLoadStyle(path);
                            if((path && !stylesheets[path]) || this.inShadow()){
                                !this.inShadow() && (stylesheets[path]=true);
                                var tagName = /^http/.test(path) ? "link" : "style";
                                var tag = document.createElement(tagName);
                                    tag.setAttribute("type", 'text/css');
                                    tag.setAttribute("rel",  'stylesheet');
                                    tag.setAttribute("href",  path);
                                    tag.setAttribute("component", ancestor.prototype.namespace);
                                    !this.inShadow() && await this.onAppendStyle(tag)
                                if(tagName == "style"){
                                    var _cssText;
									try{_cssText = await window.imports(path);}catch(e){}
                                    if( _cssText){
                                        _cssText = await this.onTransformStyle(_cssText, ancestor);
                                        _cssText && this.setCssTextAttribute(_cssText, tag);
                                        this.inShadow() && await this.onAppendStyle(tag)
                                        this.onStylesheetLoaded(tag);
                                    }
                                }
                                else { document.head.append(tag) }
                            }
                        }
                    }
                }
                resolve(true);
            })
        }

        onLoadStyle(url){ return url }
        
        setPrototypeInstance() {
            this.setAttribute("namespace", this.namespace);
        }

        hasChildComponents(){return false}

        watch(object,prop,cb=null,force,engine=system.drivers.watchers.Watcher){
            object = typeof object == "string"?this.querySelector(object):object;
            if(object){ return engine.watch(object,prop,cb,force,this)}
        }

        getBoundingClientRect(el){
            var c = el?el.getBoundingClientRect():super.getBoundingClientRect();
            c.center = {x : c.left + c.width/2, y : c.top  + c.height/2};
            return c;
        }
    }
);
global.WebComponent = global.WebComponent||core.ui.WebComponent;
global.Component = global.Component||core.ui.WebComponent;
namespace `w3c.ui` (core.ui.WebComponent);


namespace `core.ui` (
    class Component2D extends WebComponent {
        constructor(el,options={}) {
            super(el,options={});
            this.behaviors = this.machine = new system.machines.Automata;
        }

        onAwake(){
            if(this.onUpdate||this.onDraw||this.onFixedUpdate){
                document.component2d_instances = document.component2d_instances||[];
                document.component2d_instances.push(this);
            }
        }

        hasOwnSkin(){
            if(this.namespace == "core.ui.Component2D"){return false}
            return true
        }
    }
);
window.Component2D = window.Component2D||core.ui.Component2D;
cascade(core.ui.Component2D,false);


;

namespace `core.ui` (
	class Application extends core.ui.WebComponent {
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

        subscribe(eventType, listener, capture) {
            const previousEvents = [...globalThis._eventObjects[eventType]||[]].reverse();
            if (previousEvents?.length) {
                for(let e of previousEvents) {
                    listener(e);
                }
            }
            return this.addEventListener(eventType, listener, capture);
        } 
	}
);
window.Application = window.Application||core.ui.Application;
namespace `w3c.ui` (core.ui.Application);


;

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


!function(a){function b(a){if(x=q(b),!(a<e+l)){for(d+=a-e,e=a,t(a,d),a>i+h&&(f=g*j*1e3/(a-i)+(1-g)*f,i=a,j=0),j++,k=0;d>=c;)if(u(c),d-=c,++k>=240){o=!0;break}v(d/c),w(f,o),o=!1}}var c=1e3/60,d=0,e=0,f=60,g=.9,h=1e3,i=0,j=0,k=0,l=0,m=!1,n=!1,o=!1,p="object"==typeof window?window:a,q=p.requestAnimationFrame||function(){var a=Date.now(),b,d;return function(e){return b=Date.now(),d=Math.max(0,c-(b-a)),a=b+d,setTimeout(function(){e(b+d)},d)}}(),r=p.cancelAnimationFrame||clearTimeout,s=function(){},t=s,u=s,v=s,w=s,x;a.MainLoop={getSimulationTimestep:function(){return c},setSimulationTimestep:function(a){return c=a,this},getFPS:function(){return f},getMaxAllowedFPS:function(){return 1e3/l},setMaxAllowedFPS:function(a){return"undefined"==typeof a&&(a=1/0),0===a?this.stop():l=1e3/a,this},resetFrameDelta:function(){var a=d;return d=0,a},setBegin:function(a){return t=a||t,this},setUpdate:function(a){return u=a||u,this},setDraw:function(a){return v=a||v,this},setEnd:function(a){return w=a||w,this},start:function(){return n||(n=!0,x=q(function(a){v(1),m=!0,e=a,i=a,j=0,x=q(b)})),this},stop:function(){return m=!1,n=!1,r(x),this},isRunning:function(){return m}},"function"==typeof define&&define.amd?define(a.MainLoop):"object"==typeof module&&null!==module&&"object"==typeof module.exports&&(module.exports=a.MainLoop)}(this);
function Ecmascript6ClassTranspiler() {}
Ecmascript6ClassTranspiler.prototype.imports = window.imports;
Ecmascript6ClassTranspiler.prototype.transpile = function (src, doc) {
    var doTranspile = Config.ENABLE_TRANSPILER||location.protocol == "file:";
    if (doTranspile) {
        src = this.transpileToLevel(src);
        return src;
    } else {
        return src;
    }
}

Ecmascript6ClassTranspiler.prototype.transpileToLevel = function (src) {
    var nsReg = /namespace\s?`([^\s`]*)/;
    var clsReg = /class\s+([^\s]*)[\s\n\t]*[\{|extends]/;

    var nsMatch = src.match(nsReg);
    var classMatch = src.match(clsReg);
    if(!nsMatch && !classMatch){
        return this.transipleImportsDestructuring(src);
    }
    else {
        nsMatch = nsMatch ? nsMatch[1] : "";
        classMatch = classMatch?classMatch[1]:"";
        nsMatch = nsMatch + "." + classMatch;
        src = this.transipleDecoratorFields(nsMatch, src);
        src = this.transipleClassFields(nsMatch, src);
        src = this.transipleRelativeFolderImports(nsMatch,src);
        src = this.transipleImportsDestructuring(src);
        return src;
    }
}

Ecmascript6ClassTranspiler.prototype.transipleRelativeFolderImports = function (nsMatch,src) {
    if(/webpack/.test(src)||typeof module == "object"){return src}
    var regex = /import\s+['"]+.{1}\/{1}([^;]*)['"]+;+/gm;//ex: import './test.js';
        nsMatch = nsMatch.replace(/\./gm,"/");
        src = src.replace(regex, function(full, src_path) {
            return `import '${Config.SRC_PATH}${nsMatch}/${src_path}';`
        })
    return src;
}

Ecmascript6ClassTranspiler.prototype.transipleDecoratorFields = function (ns,src) {
    var regex = /@([^\W]*)\({1}([^\;]*)\){1};{1}/gm; //Feb 7 2019 - to support @matchmedia queries having ('s)
    var props = [];
    if (ns) {
        src = src.replace(regex, (full, method, args) => {
            props.push(`${method}(${ns}, ${args});`);
            return "";
        });
        var fullsrc = src + "\n" + props.join("\n");
    } else {
        src = src.replace(regex, (full, method, args) => {return ""});
        fullsrc = src;
    }
    return fullsrc;
}

Ecmascript6ClassTranspiler.prototype.transipleImportsDestructuring = function (src) {
    if(/webpack/.test(src)||typeof module == "object"){return src}
    var regex = /import(?:["'\s]*(?<dest>[\w*{}\n\r\t, ]+)from\s*)?(?<src>["'\s]?.*([@\w_-]+)["'\s]?.*);$/gm;
        src = src.replace(regex, (full, dest, src, d) => {
            if(dest){
                dest = dest.replace(/\s+as\s+/gm, ":");
                if(dest.includes("*")){
                    dest = dest.replace(/\*\:/gm, "");
                    return `var ${dest} = await load(${src});`;
                }
                else if(/[\{\}]/gm.test(dest)){
                    dest = dest.replace(/\*\:/gm, "");
                    return `var ${dest} = await load(${src});`;
                }
                else{
                    return `let ${dest} = await load(${src}); ${dest} = ${dest.trim()}.default;`;
                }
            }
            return full;
        })
    return src;
}

Ecmascript6ClassTranspiler.prototype.transipleClassFields = function (ns, src) {
    var regex = new RegExp(/(\@static|@public|\@private)[\s\t\n]+([^\s]*)\s+\=([^\;]*)\;/gm);
    var props = [];
    if (ns) {
        src = src.replace(regex, (full, type, name, val) => {
            type = type.replace("@", "");
            props.push(`field(${ns}, "${type}", "${name}", ${val});`);
            return "";
        });
        var fullsrc = src + "\n" + props.join("\n");
    } else {
        src = src.replace(regex, (full, type, name, val) => {return "" });
        fullsrc = src;
    }
    return fullsrc;
};

namespace `system.http` ( 
    class ClassLoader {
        constructor (){
            window.run = this.run.bind(this);//TODO:check dynamic transpilation
            return this;
        }

        run(src, cb){
            this.build(src, output => {
                var head   = document.getElementsByTagName("head").item(0);
                var script = document.createElement("script");
                script.setAttribute("type", "text/javascript");
                script.setAttribute("charset", (Config.CHARSET || "utf-8"));
                script.text = output;
                head.appendChild(script);
                cb(script);
            });
        }

        async load (ns, filepath, cb) {
            var cfFailure = xhr => cb?cb(xhr):null;
            var src = await window.imports(ns,filepath);
                src ? this.run(src,cb) : cfFailure(src,"no xhr"); 
        }

        async import(ns,path=null){
            return new Promise(async (resolve, reject) => {
                if(!path){
                    var filename_path = Config.SRC_PATH + (ns.replace(/\./g, "/"))  + "/" + Config.FILENAME;
                    path = Config.USE_COMPRESSED_BUILD ? 
                        filename_path.replace("*", Config.DEBUG ? "src.":"min."):
                        filename_path.replace("*","");
                }
                if(Config.ENABLE_TRANSPILER||location.protocol == "file:") {
                        let src;
                        try{src = await window.imports(path);}catch(e){ reject(e);return }
                        if(src){ this.run(src, source => resolve(source))} 
                        else {reject("Unable to import: " + path)}
                }
                else {
                    try{await import(path);}catch(e){console.error(e)}finally{
                        resolve()
                    }
                }
            })
        }

        async build(src, cb) {
            if((Config.ENABLE_TRANSPILER||location.protocol == "file:") && !globalThis.Ecmascript6ClassTranspiler) {
                // var {Ecmascript6ClassTranspiler} = await load("/src/libs/test/safari.js");
                globalThis.Ecmascript6ClassTranspiler = Ecmascript6ClassTranspiler;
                this.constructor.prototype.es6Transpiler = this.constructor.prototype.es6Transpiler||new globalThis.Ecmascript6ClassTranspiler();
            }
            src = this.es6Transpiler.transpile(src);
            var reg = /^import\!?\s+[\'\"]{1}([^\'\"]*)[\'\"]{1}\;?/m;
            while (reg.test(src)) {
                var match = src.match(reg);
                var ns = match[1];
                src = src.replace(reg, this.es6Transpiler.transpile(
                    (window.imported_classes[ns] ? ";" : await this.imports(match))||""
                ))
            } cb(`(async (global)=>{ ${src} })(this)`);
        }

        async imports(match){
            var res=null;
            var paths = this.pathsToTry(match);
            for(let path of paths){
                var res = await window.imports(path);
                if(res){break}
            }
            return res;
        }

        pathsToTry(match){
            var ns = match[1];
            if(/\.m?js$/.test(ns)){
                return [ns]
            }
            ns=ns.replace(/\./gm,"/");
            var root = Config.SRC_PATH;
            var paths   = [];
            match[0].includes("!") ? 
            paths.push(root+ns + ".js"):null;
            ns.includes("@") ? 
            paths.push(root+ns.replace("@","") + ".js"):null;
            paths.push(root+ns + "/index.js")
            paths.push(root+ns + "/index.min.js");
            return paths;
        }
    }
);




document.addEventListener("DOMContentLoaded", async e => {
  let assetsloaded = false;

  try{await initImportMap();}catch(e){}
  await wait(10);


  if(Config.SPLASH){
    let path = Config.SRC_PATH + Config.SPLASH.replace(/\./gm,"/") + "/index.js";
    if(location.protocol == "file:") {
        let s = new system.http.ClassLoader;
        await s.import(Config.SPLASH, path).catch(e => {console.error(e); assetsloaded=true});
        await sleep(30);
    }
    else {
        try{await import(path)}catch(e){console.error(e); assetsloaded=true}
    }
    var Splash = classof(Config.SPLASH)
    if(Splash){
        var splash = document.body.querySelector(`#splash, [namespace='${Config.SPLASH}']`)||new Splash;
            splash.addEventListener("loaded", e=> assetsloaded=true, true)
            splash.setAttribute("duration", Config.SPLASH_FADE_DELAY)
        document.body.appendChild(splash);
        document.body.style.opacity=1;
    }else {assetsloaded=true}
  } else {assetsloaded=true; document.body.style.opacity=1;};

  let ns = (document.head.querySelector("script[namespace]")||document.body).getAttribute("namespace")||Config.NAMESPACE;

  async function bootup() {
    if (ns && Config.DYNAMICLOAD) {
      if(Config.APP_WAITS_ON_SPLASH && !assetsloaded){
        await sleep(100);
        bootup();
        return;
      }
      else {
        var filename_path = Config.SRC_PATH + (ns.replace(/\./g, "/"))  + "/" + Config.FILENAME;
        var path = Config.USE_COMPRESSED_BUILD ? 
          filename_path.replace("*", Config.DEBUG ? "src.":"min."):
          filename_path.replace("*","");

        let c = new system.http.ClassLoader;
            c.import(ns,path).then(async function init(){
              if(!NSRegistry[ns]) {
                await wait(1000/20);init();return;
              }
              let app = window.application = (
                window.application||new NSRegistry[ns](document.body)
              );
              if((typeof World =="function" && app instanceof World) || app && app.isSimulation) {
                window.world=app;
                let af=1 && Config.ARROW_FUNCTIONS_FOR_WORLD_LOOP==true;
                try{eval("class T {do=()=>{}}")}catch(e){af=0}
                let loop = MainLoop;
                app.onUpdate      && loop.setBegin(af?app.onUpdate:app.onUpdate.bind(app));
                app.onFixedUpdate && loop.setUpdate(af?app.onFixedUpdate:app.onFixedUpdate.bind(app));
                app.onDraw        && loop.setDraw(af?app.onDraw:app.onDraw.bind(app));
                app.onUpdateEnd   && loop.setEnd(af?app.onUpdateEnd:app.onUpdateEnd.bind(app));
                loop.setSimulationTimestep(app.getSimulationTimestep());
              }
            });
      }
    }
    else {
      let app = new NSRegistry['core.ui.Application'](document.body);
      // await app.initializeChildComponents();
    }
  };

  ("cordova" in window) ? 
    document.addEventListener('deviceready', ()=>{
      AndroidFullScreen && AndroidFullScreen.immersiveMode(e=>{}, e=>{}); bootup()
    }, false) : bootup()
}, false);


 })(this)