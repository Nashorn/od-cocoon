(async ()=>{ var Session = window.Session = window.Session||{State:{}};
var Config = window.Config = window.Config||{
    NAMESPACE : null,//"applications.MainApp",
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
    IMPORTS_CACHE_POLICY : "no-store", //"default", "no-store", "reload", "no-cache", "force-cache", or "only-if-cached"  (https://fetch.spec.whatwg.org/)
    DEBUG:true
};

try{module.returns = Config;}catch(e){}


//
Object.defineProperty(Object.prototype, 'toQueryString', {
  enumerable: false,
  configurable: false,
  value: function(obj,prefix) {
    obj=obj||this;
    var str = [];
    for(var p in obj) {
      if (obj.hasOwnProperty(p)) {
        var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
        str.push(typeof v == "object" ?
          this.toQueryString(v, k) :
          k + "=" + v);
      }
    }
    return str.join("&");
  }
});
if(!String.prototype.toDomElement){
    String.prototype.toDomElement = function(){
      var n = document.createRange().createContextualFragment(this.toString())
      return n.firstElementChild;
    }
};

//
;var wait = ms => new Promise((r, j)=>setTimeout(r, ms));
window.wait=wait;


if(!Function.prototype.with){
    function reflect(target, source) {
        for (let key of Reflect.ownKeys(source)) {
            if(!/constructor|namespace|ancestor|classname|prototype|name/.test(key)){
                let desc = Object.getOwnPropertyDescriptor(source, key);
                Object.defineProperty(target, key, desc);
            }
        }
    };

  Function.prototype.with = function(...mixin) {
    class c extends this{};
    for(let m of mixin){
        reflect(c.prototype, m.prototype);
    }
    return c
  };
};

/*

//---------------------native class-based traits-----------------
class TraitX {
    foo(){
        alert("foo X")
    }
}

class TraitZ {
    zee(){
        alert("zee")
    }
}

//---------------------classes that mix in traits-----------------

class Y {
    constructor(){
        alert("cctor of Y")
    }
    bar(){
        alert("bar")
    }
}

class T extends Y.with(TraitX,TraitZ) {
    constructor(){
        super();
        this.foo()
    }

    foo(){
        alert("foo T");
        super.foo();//from TraitX
        this.bar()//from Y
        this.zee()////from TraitZ
    }    
}
*/


//
window.registered_tags=window.registered_tags||{};

if (Config.LOGGING==false) {
    for (var k in console) {
        console[k] = function () { };
    }
}

window.getParameterByName = function (name, url) {
    var match = RegExp("[?&]" + name + "=([^&]*)").exec(
        url || window.location.href
    );
    return match && decodeURIComponent(match[1].replace(/\+/g, " "));
};

window.toAbsoluteURL = function(url) {
    const a = document.createElement("a");
    a.setAttribute("href", url);
    return a.cloneNode(false).href; 
}

window.classof = function(ns){ return NSRegistry[ns] }

window.imported_classes = window.imported_classes || {};
window.imports = async function (x, opts, isError) {
    opts = opts || { cache: Config.IMPORTS_CACHE_POLICY || "no-store" };
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
                const res = await response.text().then(src => {
                    window.imported_classes[x] = src;
                    resolve(src);
                });
            } else {
                //then()-else{} when ran from server. catch() block never runs
                var src = await response.text();
                console.error(error);
                resolve(null);
            }
        } catch (e) {
            try{
              var request = new XMLHttpRequest();
              request.open('GET', path, false);
              request.send(null);
            } catch(xe){
              console.error("404 import: " + toAbsoluteURL(path), xe);
              resolve("")
            }
            if (request.status == 0 || request.status == 200) {
                src = request.responseText;
                window.imported_classes[x] = src;
                resolve(src);
            }
        }
    });
};
//
function relativeToAbsoluteFilePath(path, ns, appendRoot){
    ns = ns||this.namespace;
    ns = ns.replace(/\./gim,"/");
    if(path.indexOf("/./") >= 0){
        path = path.replace("./", ns+"/");
    } 
    path = /http:/.test(path)? path : path.replace("//","/");
    return path;
}

window.stylesheets = function stylesheets (target, paths){
    target.prototype['@stylesheets'] = [];
    paths && paths.forEach(p => {
        var filepath = relativeToAbsoluteFilePath(p,target.prototype.namespace,false);
        target.prototype['@stylesheets'].unshift(filepath)
    });
}

function traits(target, __traits){
    var inheritTraits = function(klass, properties){
        properties = properties.reverse();
        properties.forEach(trait => {
            if (typeof trait == "object") {
                defineProps(klass, trait)
            }
            else if (typeof trait == "function") {
                reflect(target.prototype, trait.prototype);
            }
        });
    };
    
    var defineProps = function(proto, trait){
        for (var prop in trait) {
            if(!proto[prop]){
                Object.defineProperty(proto,prop,{
                    value : trait[prop],
                    writable:true
                })
            }
        }
    };

    ;function reflect(target, source) {
        for (let key of Reflect.ownKeys(source)) {
            if(!/constructor|namespace|ancestor|classname|prototype|name/.test(key)){
                let desc = Object.getOwnPropertyDescriptor(source, key);
                Object.defineProperty(target, key, desc);
            }
        }
    };
    inheritTraits(target.prototype, __traits);
};
window.traits = traits;

window.cascade = function cascade(target,shouldCascade){
    target.prototype['@cascade'] = shouldCascade;
}

window.prop = function prop(target,key,val){
    target.prototype[key] = val;
}

window.tag = function tag(target, name){
    target.prototype["ns-trait-tagname"]=name;
    try{
        target.define(target.prototype)
    }catch(e){console.error(e)}
    return;
}

window.field = function field(target, type, key, val){
    target = (type=="static") ? target : target.prototype;
    target[key] = val;
};

; (function(env) {
    env.NSRegistry = env.NSRegistry||{};
    
    env.namespace = function(ns){
        ns = ns[0];
        return function(...defs){
            defs.forEach(def => {
                def=def||{};
                var nsparts=ns.match(/\.([A-Z]+[a-zA-Z0-9\_]*)\b$/);
                var k = def.prototype||def;
                    k.classname = nsparts?nsparts[1]:def.name;
                    var fns = ns+"."+k.classname;
                    k.namespace = fns;
                return env.NSRegistry[fns] = (typeof def == "function") ?
                    createNS(fns,createClass(def||{})):
                    createNS(ns,(def||{})), 
                        delete def.namespace, 
                        delete def.classname;
            })
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
                try{  func.define(proto) }catch(e){};
                return func;
        } catch(e){ return func }
        return func
    };
})(typeof window !="undefined" ? window : global);
// mport 'src/core/lang/Thread.js';
(()=> {
  var modulemap = window.modulemap ={};
  window.require = window.require||async function importModule(url) {
    url = Config.ROOTPATH+url;
    var absURL = toAbsoluteURL(url);
    var mod=modulemap[absURL];
    return new Promise(async (resolve, reject) => {
      if (mod) { return resolve(mod)};
      var s1 = document.createElement("script");
          s1.type = "module";
          s1.onerror = () => reject(new Error(`404: ${url}`));
          s1.onload  = () => {
            resolve(modulemap[absURL]);URL.revokeObjectURL(s1.src);s1.remove();
          };
      const loader = `import * as m from "${absURL}"; modulemap['${absURL}'] = m;`;
      const blob = new Blob([loader], { type: "text/javascript" });
      s1.src = URL.createObjectURL(blob);
      document.head.appendChild(s1);
    });
  };
  function supportsDynamicImport() {
    try { new Function('import("")'); return true;} catch (err) {return false;}
  }
})();

var Observer = function() {
    this.observations = [];
    this.subscribers  = {};
};
 
var Observation = function(name, func) {
    this.name = name;
    this.func = func;
};
 
Observer.prototype = {
    addEventListener : function(name, func, capture){
        this.subscribers[name] = this.subscribers[name]||[];
        this.subscribers[name].push({name, func});
    },
    
    dispatchEvent : function(name, data, scope=this||window) {
        var cbs = this.subscribers[name]||[];
            cbs.forEach(cb => cb.func.call(scope, data));  
    },
    
    removeEventListener : function(name, cb){
        var subs = this.subscribers[name]||[];
            subs.remove(i => i.name === name && i.func === cb);
    }
};
window.Observer=Observer;

// mport 'node_modules/od-paginator/paginator.js';

namespace `core.drivers.storage` (
    class IStorageInterface {
        constructor (collection, storage_device){
            console.log(`storage device for ${collection.prototype.classname}`,storage_device)
        }

        isSeedingEnabled(){
            return false;
        }
    }
);



namespace `core.data` (
    
    class Repository {
        static get IRequestStorage(){
            var driver = this.prototype.device_driver;
            this.interface = this.interface||new NSRegistry[driver](this,driver);
            this.device_driver=driver; 
            return this.interface;
        }

        static async add(obj,cb){
            var results = await this.IRequestStorage.add(obj,cb);
            return results;
        }

        static async all(cb){
            var results = await this.IRequestStorage.all(cb);
            return results;
        }

        static async remove(query,cb){
            var args=arguments;
            if(args.length==1){
                query=args[0];
                cb=null;
            }
            else if(args.length==2){
                query=args[1];
                cb=args[0];
            }
            else if(args.length==0){
                query={};
                cb=null;
            }
            return new Promise((resolve,reject) =>{
                this.IRequestStorage.remove((result, error)=>{
                    cb?cb(result, error):resolve(result, error);
                },query)
            })
        }


        static async find(cb=null,query){
            var args=arguments;
            if(args.length==1){
                query=args[0];
                cb=null;
            }
            else if(args.length==2){
                query=args[1];
                cb=args[0];
            }
            else if(args.length==0){
                query={};
                cb=null;
            }
            return new Promise((resolve,reject) =>{
                this.IRequestStorage.find((result, error)=>{
                    cb?cb(result, error):resolve(result, error);
                },query)
            })
        }

        static isSeedable(){
            return this.prototype.seeds;
        }


        static onDataReceived (data, xhr){
            var self=this;
            data = this.transform(data);
            this.setData(data.table||data.name, data);
        }

        static transform (data, xhr){
            return data;
            /*var tablename = data.table;
            var items = data.items||[];
            for(var i=0; i<=items.length-1; i++) {
                var item = items[i];
                var Model = this['@datatype'];
                var modelObject = new Model(item);
                data.items.splice(i,1, modelObject);
            }
            ;*/
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
            return new Promise(async (resolve,reject) =>{
                if(!this.isSeedable()) {
                    this.prototype.dispatchEvent("loaded", {controller: this}, this);
                    resolve();
                    return;
                };
                force = (typeof force == "boolean") ? force:false;
                uri = uri || this.prototype.seeds;
                if(!this.loaded || force){
                    this.loaded=true;
                    var response = await fetch(uri[Config.ENVIRONMENT]);
                    var json = await response.json();
                    var res = this.onDataReceived(json);
                    this.IRequestStorage.seeded();
                    this.prototype.dispatchEvent("loaded", {controller: this}, this);
                    resolve(res)
                } else {
                    this.prototype.dispatchEvent("loaded", {controller: this}, this);
                    this.IRequestStorage.seeded();
                    resolve()
                }  
            })
        }
    }
);

Collection = window.Collection = core.data.Repository;
traits(core.data.Repository, [new Observer]);

//mport 'src/core/drivers/storage/Cursor.js';
//mport 'src/core/drivers/storage/Memory.js';
namespace `core.http` (
    class Router {
        constructor(app,hostWindow){
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

        onHashChange (e){
            var ns = this.window.location.hash.split("#")[1];
            var scrollTo = ns.split("/");
            ns=scrollTo[0];
            scrollTo = scrollTo[1];
            var nspath = ns.replace(/\./g, "/");

            if(!NSRegistry[ns]){
                this.application.onLoadingActivity &&
                this.application.onLoadingActivity(ns);
                var filename_path = `${Config.SRC_PATH}${nspath}/${Config.FILENAME}`;
                //TODO: add logic for debug path, see bootloader how it uses .src.js and .min.js
                var path = filename_path.replace("*", Config.USE_COMPRESSED_BUILD ? "min.":"");
                var cl = new core.http.ClassLoader;
                cl.load(ns, Config.ROOTPATH + path, data => this.onActivityLoaded(ns,NSRegistry[ns],scrollTo));
            } else {    
                this.application.onResumeActivity && 
                this.application.onResumeActivity(NSRegistry[ns],scrollTo);
                this.onActivityLoaded(ns,NSRegistry[ns],scrollTo)
            }
        }

        destroy(activityInstance){
            this.activities = this.activities||{};
            delete this.activities[activityInstance.namespace];
        }

        onActivityLoaded(ns,_class,scrollTo){
            this.activities = this.activities||{};
            var c = this.activities[ns]||new _class;
            this.application.onExitCurrentActivity && 
            this.application.onExitCurrentActivity(this.current_activity)
            
            this.application.onEnterActivity && 
            this.application.onEnterActivity(c,scrollTo);

            this.activities[ns] = c;
            this.current_activity=c;
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
                return new Function("return `"+tempStr +"`;").call(templateVars);
            }
            return parse(tempStr, data)
        },
        install : function(){}
    };
    

    window.customTemplateEngines.define("template/literals", TemplateLiterals);
})();



namespace `w3c.ui` (
    class WebComponent extends HTMLElement {
        constructor(el) {
            super();
            this.element = el;
            this.__proto = this.constructor.prototype;
            this.root = this.inShadow() ? 
                this.attachShadow({ mode: 'open' }) : 
                (this.element||this);

            if(this.isExistingDomNode(this.element)){
                this.connectedCallback();
            }
        }

        isExistingDomNode(el){
            return el && el.parentNode && el.parentNode.nodeType==1
        }

        static define(proto,bool){
            var ce = window.customElements;
            var tag = proto.classname.replace(/([a-zA-Z])(?=[A-Z0-9])/g, (f,m)=> `${m}-`).toLowerCase();
                tag = /\-/.test(tag)?tag:proto["ns-trait-tagname"];
            if(/\-/.test(tag)){
                if(ce.get(tag)){return}
                proto["ns-tagname"] = tag;
                delete proto["ns-trait-tagname"]
                this.defineAncestors();
                this.defineAncestralClassList();
                try{ce && ce.define(tag, this);}
                catch(e){console.error(e)}
            }     
        }

        setStylesheet () {    
            var css = this.cssStyle();
            !!css && !this.__proto._style_defined ? 
                (this.onAppendStyle(
                    `<style>\n${this.onTransformStyle(css)}\n</style>`.toDomElement()),
                    this.__proto._style_defined=false
                ) : null;
        }

        querySelector(cssSel, e){
            if(e){
                return this.getParentNodeFromEvent(e,cssSel)
            } else {
            return (this.inShadow()||this.element) ?
                this.root.querySelector(cssSel):
                super.querySelector(cssSel)
            }
        }

        querySelectorAll(cssSel, deep){
            return (this.inShadow()||this.element) ?
                this.root.querySelectorAll(cssSel):
                super.querySelectorAll(cssSel)
        }

        onAppendStyle(stylesheet) {
            if(this.inShadow()){
                try{
                    var sheet = new CSSStyleSheet();
                        sheet.replace(stylesheet.innerText);
                    this.root.adoptedStyleSheets = [sheet];
                } catch(e){
                    //TODO: use error code
                    console.error(`${e.message} Unable to adopt stylesheet 
                        into shadow dom -- ${this.namespace}#onAppendStyle(), 
                        see: https://bugzilla.mozilla.org/show_bug.cgi?id=1520690.
                        As a workaround, @import the css from within <template>`)
                }
            }
            else {
                var headNode = document.querySelector("head")
                var configscript = document.querySelector("script");
                headNode.insertBefore(stylesheet, configscript);
            }
        }

        onStyleComputed(stylesheet){}

        adopts(orphan) {
            orphan && orphan.parentNode.replaceChild(this.root, orphan)
            orphan && this.root.appendChild(orphan);
        }

        replaces(orphan) {
            orphan && orphan.parentNode.replaceChild(this.root, orphan);
        }

        dispatchEvent(type, data, details = { bubbles: true, cancelable: true, composed: true }, element = this) {
            var evt = new CustomEvent(type, details);
                evt.data = data;
            if(this.element){return this.element.dispatchEvent(evt);}
            else{return super.dispatchEvent(evt);}
        }

        on(evtName, handler, bool=false, el) {
            this.addEventListener(evtName, handler, bool, el)
        }

        addEventListener(evtName, handler, bool=false, el) {
            var self = this;
            if (typeof el == "string") {
                this.addEventListener(evtName, e => {
                    var t = this.getParentNodeFromEvent(e, el);
                    if (t) {
                        handler({
                            target: t,
                            realtarget: e.target,
                            src: e,
                            preventDefault:  () => e.preventDefault(),
                            stopPropagation: () => e.stopPropagation()
                        });
                    }
                }, bool);
            } else {
                if(this.isExistingDomNode(this.element)){
                    this.element.addEventListener(evtName, handler, bool);
                }
                else{
                    super.addEventListener(evtName, handler, bool);
                }
            }
        }

        getParentBySelectorUntil(elem=this.root, terminator="html", selector) {
            var parent_node = null;
            do {
                if(elem.matches(selector)){
                    parent_node = elem;
                    break;
                }
                if(elem.matches(terminator)){
                    break;
                }
                elem=elem.parentNode;
            } while(elem && elem.matches) 

            return parent_node;
        }

        getParentNodeFromEvent(e, selector, terminator) {
            var el = e.composedPath()[0];
            return this.getParentBySelectorUntil(el, terminator, selector);
        }

        onStylesheetLoaded(style) { }


        onTransformStyle(cssText){
            if(!this.inShadow()){
                return cssText.replace(/\:+host/gm, `.${this.classname}`)
            } else{
                return cssText;
            }
        }

        setCssTextAttribute(_cssText, stylenode) {
            if (stylenode && stylenode.styleSheet) {
                stylenode.styleSheet.cssText = _cssText;
            }
            else {
                stylenode.appendChild(document.createTextNode(_cssText));
            }
        }

        async loadTemplate() {
            return new Promise(async (resolve, reject) => {
                var tem  =  this.getTemplateToLoad();
                if(/\/*\.html$/.test(tem)){
                    var src=this.src||tem;//TODO: bug here?
                    var opts = { cache: "force-cache" };//TODO: use cache policy from appconfig.js
                    src = src.replace("/./", "/" + this.namespace.replace(/\./gim, "/") + "/");
                    this._template = await imports(src, opts);
                }
                else if(/<\s*\btemplate\b/.test(tem)){//from inner template()
                    this._template=tem;
                }
                else if(tem && tem.nodeType==1 && tem.tagName.toLowerCase()=="template"){
                    this._template=tem.outerHTML;
                }
                else if(tem && tem.nodeType==1){
                    this._template=`<template>${tem.outerHTML}</template>`;
                }
                resolve(this._template);
            })
        }

        getTemplateToLoad(){
            var engine = this.getTemplateEngine();

            return  this.querySelector("template")||    //node
                    this.src||                          //uri
                    this.template()||                   //string
                    this.element||
                    Config.SRC_PATH+"/./index" + (engine.ext||"") + ".html" //TODO: default but ignores <Config.TEMPLATE_NAMES_USE_ENGINE_EXTENSION>
        }


        async onConnected(data) { 
            await this.render(data);
        }
        
        async render(data={}) {
            if(this.isExistingDomNode(this.element)){
                this.onTemplateRendered(temNode);
                return
            }
            var t = this._template;
            if (t) {
                var html = await this.evalTemplate(t, data);
                var temNode = html.toDomElement();
                    temNode = temNode.content;
                if (!this.inShadow()) {
                    this.slots.forEach(slot => {
                        var slotName = slot.getAttribute('slot');
                        var placeholder = temNode.querySelector(`slot[name="${slotName}"]`);
                        if( placeholder){
                            if(!placeholder.hasAttribute("append")){
                                placeholder.innerHTML="";
                            }
                        }
                        (placeholder||temNode).appendChild(slot)
                    })
                }
                if(this.element){
                    this.innerHTML = "";
                    this.appendChild(temNode);
                }
                else{
                    this.root.innerHTML = "";
                    this.root.appendChild(temNode);
                }
                this.onTemplateRendered(temNode);
            }
        }

        template(){return null}

        async evalTemplate(template, data) {
            var eng = this.getTemplateEngine();
            return await eng.parse(template, data, this);
        }

        getTemplateEngine() {//TODO: Need to make it configurable, see <Config.DEFAULT_TEMPLATE_ENGINE_MIMETYPE>
            return window.customTemplateEngines.default;
        }

        async connectedCallback() {
            if( this._is_connected){return;}
            this._is_connected=true;
            var html = await this.loadTemplate();
            this.onTemplateLoaded();
        }

        async onTemplateLoaded() {
            this.slots = this.getSlots();
            this.setClassList();
            this.setPrototypeInstance();
            this.defineAncestralStyleList();
            
            await this.onConnected();
            await this.setStyleDocuments();
        }

        getSlots() { return Array.from(this.children) }


        onTemplateRendered(){
            this.initializeChildComponents();
        }
        
        static get observedAttributes() {
            return ['src'];
        }

        get src() {
            return this.getAttribute('src');
        }

        set src(val) {
            this.setAttribute('src', val)
        }

        inShadow() {
            return this.hasAttribute('shadow');
        }

        attachShadow(options) {
            this._usesShadow = true;
            return super.attachShadow(options);
        }

        async attributeChangedCallback(name, oldValue, newValue) {
            if (name == "src"){
                if(!this._is_connected){return;}
                else {
                    var html = await this.loadTemplate();
                    await this.onConnected()
                }
            }
        }

        cssStyle(){ return "" }

        onLoadInstanceStylesheet(){ return true }

        static defineAncestors(){
            this.ancestors=[];
            var a=this;
            while(a && this.ancestors.push(a)){
                  a = a.prototype.ancestor}
        }

        static defineAncestralClassList(){
            this.prototype.classes = [];
            for(let ancestor of this.ancestors){
                var proto = ancestor.prototype;
                if( proto['@cascade']||ancestor==this){
                    this.prototype.classes.unshift(proto.classname)
                } else { break }
            }
        }

        defineAncestralStyleList(){
            var stylesheets = this.prototype["stylesheets"] = this.prototype["stylesheets"]||[];
            if(this.onLoadInstanceStylesheet()){
                stylesheets.push(this.getNSStyleSheet(this.namespace))
            }
            stylesheets.push(...this.prototype["@stylesheets"]||[]);
            if(!this['@cascade']){
                return
            }
            var ancestor = this.__proto.ancestor

            while(ancestor) {
                if( ancestor != w3c.ui.WebComponent && 
                    ancestor != w3c.ui.Application  &&
                    ancestor != core.ui.World       &&
                    ancestor.prototype.onLoadInstanceStylesheet() ){
                    
                    stylesheets.unshift(...ancestor.prototype["@stylesheets"]||[]);
                    stylesheets.unshift(this.getNSStyleSheet(ancestor.prototype.namespace));
                    ancestor = ancestor.prototype.ancestor;

                    //TODO: What if current ancestor is not cascading?
                    //TODO: What if the next ancestor is not cascading?
                    // if(!ancestor.prototype['@cascade']){
                    //     break;
                    // }
                } else { 
                    break 
                }
            }
        }

        getNSStyleSheet(ns){
            return relativeToAbsoluteFilePath(Config.SRC_PATH+"/./index.css",ns);
        }

        /*setClassList() {
            this.root.className = this.root.className + (this["@cascade"]? 
                " " + (this.__proto.classes.join(" ")).trim():
                " " + this.root.classname);
        }*/
        setClassList() {
            this.root.className = this.root.className + (this["@cascade"]? 
                " " + (this.__proto.classes.join(" ")).trim():
                " " + this.root.classname);
        }

        getStyleSheets() {
            var styles = this["stylesheets"]||[];
            if(styles.length<=0 && this.onLoadInstanceStylesheet()){styles.push(this.getNSStyleSheet(this.namespace))}
            return styles.reverse();
        }

        async setStyleDocuments() {
            await this.loadcss(this.getStyleSheets());
            this.setStylesheet();
            this.onStyleComputed(this.stylesheets);
        }

        async loadcss(urls) {
            if(!this.__proto._css_loaded){
                this.__proto._css_loaded={}
            }
            return new Promise(async (resolve,reject) => {
                urls=urls.reverse();
                var stylesheets = window.loaded_stylesheets = window.loaded_stylesheets|| {};
                for(let path of urls){
                    if(this.__proto._css_loaded[path] && !this.inShadow()){continue}
                    path = this.onLoadStyle(path);
                    this.__proto._css_loaded[path]=true;
                    if((path && !stylesheets[path]) || this.inShadow()){
                        var tagName = /^http/.test(path) ? "link" : "style";
                        var tag = document.createElement(tagName);
                            tag.setAttribute("type", 'text/css');
                            tag.setAttribute("rel",  'stylesheet');
                            tag.setAttribute("href",  path);
                            tag.setAttribute("component", this.namespace);
                            stylesheets[path] = tag;
                            if(tagName.toLowerCase() == "style"){
                                var _cssText = await window.imports(path);
                                if( _cssText){
                                    _cssText = this.onTransformStyle(_cssText);
                                    _cssText && this.setCssTextAttribute(_cssText, tag);
                                    this.onAppendStyle(tag);
                                    this.onStylesheetLoaded(tag);
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
            this.prototype = this;
        }

        initializeChildComponents (el){//TODO: called everytime for all components, need to optimize.
            el = el||this.root;
            var nodes = this.querySelectorAll("*");
                nodes = [].slice.call(nodes);
                nodes.forEach(n => {
                    if(n && n.nodeType == 1) {
                        var tag = n.tagName.toLowerCase();
                        var c = window.registered_tags[tag];
                        c && c.define(c.prototype,true);
                    }
                })
        }

        isAnyPartOfElementInViewport(el=this.root) {
            var rect = el.getBoundingClientRect();
            var v = (rect.top  <= window.innerHeight) && ((rect.bottom) >= 0);
            var h = (rect.left <= window.innerWidth)  && ((rect.right)  >= 0);
            return (v && h);
        }
    }
);
window.WebComponent = window.WebComponent||w3c.ui.WebComponent;
cascade(w3c.ui.WebComponent,true);



namespace `core.ui` (
    class ChildComponent extends w3c.ui.WebComponent {
        constructor (element){
            super(element);
        }

        //Child components never gets defined right away as the w3c spec says 
        //they should for normal web components. Child components are (see w3c/moz: window.customElements.define)
        //defined by their parent component owners during render 
        //of parent (see: w3c.ui.WebComponent.initializeChildComponents())

        //defined means the component gets connected to the DOM, fully initialized and rendered.
        //onConnected normally fires where a call to render() shows the template.
        //this never happens with a child component automatically, again, parents
        //control when this happens.

        //override define() to stop auto definition
        static define(proto,bool){
            var tag = proto.classname.replace(/([a-zA-Z])(?=[A-Z0-9])/g, (f,m)=> `${m}-`).toLowerCase();
            if(/\-/.test(tag)){
                proto["ns-tagname"] = tag;
                window.registered_tags=window.registered_tags||{};
                window.registered_tags[tag]=this;
                if(!bool || this.isDefined){return}
                try {
                    this.defineAncestors();
                    this.defineAncestralClassList();
                    window.customElements && window.customElements.define(tag, this);
                    this.isDefined=true;
                }
                catch(e){console.error(e)}
            }       
        }
    }
);



namespace `core.ui` (
    class ChildComponent extends w3c.ui.WebComponent {
        constructor (element){
            super(element);
        }

        //Child components never gets defined right away as the w3c spec says 
        //they should for normal web components. Child components are (see w3c/moz: window.customElements.define)
        //defined by their parent component owners during render 
        //of parent (see: w3c.ui.WebComponent.initializeChildComponents())

        //defined means the component gets connected to the DOM, fully initialized and rendered.
        //onConnected normally fires where a call to render() shows the template.
        //this never happens with a child component automatically, again, parents
        //control when this happens.

        //override define() to stop auto definition
        static define(proto,bool){
            var tag = proto.classname.replace(/([a-zA-Z])(?=[A-Z0-9])/g, (f,m)=> `${m}-`).toLowerCase();
            if(/\-/.test(tag)){
                proto["ns-tagname"] = tag;
                window.registered_tags=window.registered_tags||{};
                window.registered_tags[tag]=this;
                if(!bool || this.isDefined){return}
                try {
                    this.defineAncestors();
                    this.defineAncestralClassList();
                    window.customElements && window.customElements.define(tag, this);
                    this.isDefined=true;
                }
                catch(e){console.error(e)}
            }       
        }
    }
);



namespace `core.ui` (
    class ProtectedChildComponent extends core.ui.ChildComponent {
        async onConnected(){
            application.onAuthStateChanged(async user => {
              if (user) {
                await super.onConnected(user);
                this.classList.add("authenticated")
              }
            })
        }

        onLoadInstanceStylesheet(){return false}
    }
);






;

namespace `w3c.ui` (
    class Application extends w3c.ui.WebComponent {
        constructor(el) {
            super(el);
            window.application = this;
        }

        async onConnected(data){
            await super.onConnected(data);
            if(this.onEnableRouting()){
                this.router = new core.http.Router(this,window);
            }
        }

        async onEnableRouting(){ 
            this._view_slot=this.querySelector('slot[name="view-port"]')||this.querySelector('div[name="view-port"]');
            return this._view_slot;
        }

        onExitActivitySaveScroll(){
            if(this.currentActivity){
                this.currentActivity._scrollpos = this.currentActivity.parentNode.scrollTop;
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
                    this.currentActivity.parentNode.scrollTop = this.currentActivity._scrollpos||0;
                }
            }
        }

        onEnterActivity(c,scrollToElement){
            console.log("onEnterActivity", c);
            var slot = this.onFindActivitySlot();
                slot.appendChild(c);
            this.currentActivity = c;
            this.onEnterActivityRestoreScroll(scrollToElement)
            this.dispatchEvent("onactivityshown",c);
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

        onExitCurrentActivity(c){
            this.onExitActivitySaveScroll()
            console.log("onExitCurrentActivity", c);
            var slot = this.onFindActivitySlot();
                slot.innerHTML="";
        }

        onResumeActivity(c){
            console.log("onResumeActivity", c);
        }

        onLoadingActivity(c){
            console.log("onLoadingActivity", c);
        }
    }
);
window.Application = window.Application||w3c.ui.Application;



;

namespace `core.ui` (
    class World extends w3c.ui.Application {
        constructor(el) {
            super(el);
        }

        onUpdate(accumilated, delta){}

        onFixedUpdate(){}

        onDraw(interpolation){}

        onUpdateEnd(fps, panic){
            if (panic) {
                var discardedTime = Math.round(MainLoop.resetFrameDelta());
            }
        }

        getSimulationTimestep(){ return 1000/60 }
    }
);
window.World = window.World||core.ui.World;


function Ecmascript6ClassTranspiler() { }
Ecmascript6ClassTranspiler.prototype.imports = window.imports;
Ecmascript6ClassTranspiler.prototype.transpile = function (src, doc) {
    var doTranspile = Config.ENABLE_TRANSPILER;
    if (doTranspile) {
        src = this.transpileToLevel(src);
        return src;
    } else {
        return src;
    }
}

Ecmascript6ClassTranspiler.prototype.transpileToLevel = function (src) {
    var nsReg = /namespace\s?`([^\s`]*)/;
    var clsReg = /class\s+([^\s]*)[\s\n\t]?[\{|extends]/;

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
        src = this.transipleImportsDestructuring(src);
        return src;
    }
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
        src = src.replace(regex, (full, method, args) => {
            return "";
        });
        fullsrc = src;
    }
    return fullsrc;
}

Ecmascript6ClassTranspiler.prototype.transipleImportsDestructuring = function (src) {
    var regex = /import\s\{([^\}]*)\}\sfrom\s([^;]*)/gm;
    src = src.replace(regex, (full, destructured_var, src_path) => {
        destructured_var = destructured_var.replace(/\s+as\s+/gm, ":");
        return `var {${destructured_var}} = (()=> {\nimport ${src_path};\n})();`;
    });
    src = src.replace("return", "return");
    return src;
}

Ecmascript6ClassTranspiler.prototype.transipleClassFields = function (ns, src) {
    var regex = new RegExp(
        /(\@static|@public|\@private)\s+([^\s]*)\s+\=([^\;]*)\;/gm
    );
    var props = [];

    if (ns) {
        src = src.replace(regex, (full, type, name, val) => {
            type = type.replace("@", "");
            props.push(`field(${ns}, "${type}", "${name}", ${val});`);
            return "";
        });
        var fullsrc = src + "\n" + props.join("\n");
    } else {
        src = src.replace(regex, (full, type, name, val) => {
            return "";
        });
        fullsrc = src;
    }
    return fullsrc;
};

namespace `core.http` ( 
    class ClassLoader {
        constructor (){
            this.es6Transpiler = new Ecmascript6ClassTranspiler();
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
            var src = await window.imports(filepath);
                src ? this.run(src,cb) : cfFailure(src,"no xhr"); 
        }

        async build(src, cb) {
            src = this.es6Transpiler.transpile(src);
            var reg = /^import\!?\s+[\'\"]{1}([^\'\"]*)[\'\"]{1}\;?/m;

            while (reg.test(src)) {
                var match = src.match(reg);
                var ns = match[1];
                src = src.replace(reg, this.es6Transpiler.transpile(
                    (window.imported_classes[ns] ? ";" : await this.imports(match))||""
                ))
            } cb(`(async ()=>{ ${src} })()`);
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
            paths.push(root+ns + "/index.js")
            paths.push(root+ns + "/index.min.js");
            return paths;
        }
    }
);


!function(a){function b(a){if(x=q(b),!(a<e+l)){for(d+=a-e,e=a,t(a,d),a>i+h&&(f=g*j*1e3/(a-i)+(1-g)*f,i=a,j=0),j++,k=0;d>=c;)if(u(c),d-=c,++k>=240){o=!0;break}v(d/c),w(f,o),o=!1}}var c=1e3/60,d=0,e=0,f=60,g=.9,h=1e3,i=0,j=0,k=0,l=0,m=!1,n=!1,o=!1,p="object"==typeof window?window:a,q=p.requestAnimationFrame||function(){var a=Date.now(),b,d;return function(e){return b=Date.now(),d=Math.max(0,c-(b-a)),a=b+d,setTimeout(function(){e(b+d)},d)}}(),r=p.cancelAnimationFrame||clearTimeout,s=function(){},t=s,u=s,v=s,w=s,x;a.MainLoop={getSimulationTimestep:function(){return c},setSimulationTimestep:function(a){return c=a,this},getFPS:function(){return f},getMaxAllowedFPS:function(){return 1e3/l},setMaxAllowedFPS:function(a){return"undefined"==typeof a&&(a=1/0),0===a?this.stop():l=1e3/a,this},resetFrameDelta:function(){var a=d;return d=0,a},setBegin:function(a){return t=a||t,this},setUpdate:function(a){return u=a||u,this},setDraw:function(a){return v=a||v,this},setEnd:function(a){return w=a||w,this},start:function(){return n||(n=!0,x=q(function(a){v(1),m=!0,e=a,i=a,j=0,x=q(b)})),this},stop:function(){return m=!1,n=!1,r(x),this},isRunning:function(){return m}},"function"==typeof define&&define.amd?define(a.MainLoop):"object"==typeof module&&null!==module&&"object"==typeof module.returns&&(module.exports=a.MainLoop)}(this);

document.addEventListener("DOMContentLoaded", e => {
  var link = function(func,scope){
    func.self=scope;
    return func;
  }
  async function bootup() {
    var ns = document.body.getAttribute("namespace");
        ns = ns||Config.NAMESPACE;
    if (Config.DYNAMICLOAD) {
      var filename_path = Config.SRC_PATH + (ns.replace(/\./g, "/"))  + "/" + Config.FILENAME;
      var path = Config.USE_COMPRESSED_BUILD ? 
        filename_path.replace("*", Config.DEBUG ? "src.":"min."):
        filename_path.replace("*","");
      var c = (Config.ENABLE_TRANSPILER) ?
        new core.http.ClassLoader :
        null;
        c.load(ns, Config.ROOTPATH + path, async function init(res) {
          Config.USE_COMPRESSED_BUILD=false;
          if(!NSRegistry[ns]) {
            await wait(1000/30);
            init();
            return;
          }
          var app = window.application = (
            window.application||new NSRegistry[ns](document.body)
          );
          (app instanceof core.ui.World) ? 
            MainLoop
              .setBegin(app.onUpdate)
              .setUpdate(app.onFixedUpdate)
              .setDraw(app.onDraw)
              .setEnd(app.onUpdateEnd)
              .setSimulationTimestep(app.getSimulationTimestep())
              .start() : null;
            // MainLoop
            //   .setBegin(link(app.onUpdate, app))
            //   .setUpdate(link(app.onFixedUpdate,app))
            //   .setDraw(link(app.onDraw,app))
            //   .setEnd(link(app.onUpdateEnd,app))
            //   .setSimulationTimestep( linkapp.getSimulationTimestep())
            //   .start() : null;
        });
    }
  };

  ("cordova" in window) ? 
    document.addEventListener('deviceready', ()=>{
      AndroidFullScreen && AndroidFullScreen.immersiveMode(e=>{}, e=>{});
      bootup()
    }, false) : bootup()
}, false); })()