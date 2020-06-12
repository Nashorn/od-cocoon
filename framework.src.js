var Session = Session||{State:{}};
var Config = window.Config||{
    SRC_PATH:"src/",
    ENVIRONMENT:"prod",
    ROOTPATH : "./",
    LOGGING:true,
    DYNAMICLOAD:true,
    FILENAME:"index.*js",
    ENABLE_TRANSPILER : true,
    NAMESPACE : null,
    DEBUG:true
};
//
//
if(!String.prototype.toDomElement){
    String.prototype.toDomElement = function(){
      var n = document.createRange().createContextualFragment(this.toString())
      return n.firstElementChild;
    }
};

//
;var wait = ms => new Promise((r, j)=>setTimeout(r, ms))

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
function transpile(target, level){}

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
    target.prototype["ns-tagname"]=name;
    try{window.customElements.define(name, target);}catch(e){}
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

namespace `core.ui.templating` (
    class CustomTemplateEngines {
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

window.customTemplateEngines = new core.ui.templating.CustomTemplateEngines;
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
            this.root = this.onEnableShadow() ? 
                this.attachShadow({ mode: 'open' }) : 
                (this.element||this);

            if(this.element){
                this.onTemplateLoaded();
            }
        }

        static define(proto,bool){
            var tag = proto.classname.replace(/([a-zA-Z])(?=[A-Z0-9])/g, (f,m)=> `${m}-`).toLowerCase();
            if(/\-/.test(tag)){
                if(window.customElements.get(tag)){return}
                proto["ns-tagname"] = tag;
                this.defineAncestors();
                this.defineAncestralClassList();
                try{window.customElements && window.customElements.define(tag, this);}
                catch(e){console.error(e)}
            }else {
                //TODO: Use error codes
                console.warn(`${proto.namespace}#define() - invalid tag name. Dashes required for`, tag)
            }       
        }

        setStylesheet () {    
            var css = this.cssStyle();
            !!css && !this.__proto._style_defined ? 
                (this.onAppendStyle(
                    `<style>\n${css}\n</style>`.toDomElement()),
                    this.__proto._style_defined=true
                ) : null;
        }

        querySelector(cssSel, e){
            if(e){
                return this.getParentNodeFromEvent(e,cssSel)
            } else {
            return (this.onEnableShadow()||this.element) ?
                this.root.querySelector(cssSel):
                super.querySelector(cssSel)
            }
        }

        querySelectorAll(cssSel, deep){
            return (this.onEnableShadow()||this.element) ?
                this.root.querySelectorAll(cssSel):
                super.querySelectorAll(cssSel)
        }

        onAppendStyle(stylesheet) {
            if(this.onEnableShadow()){
                try{
                    var style = new CSSStyleSheet();
                    style.replace(stylesheet.innerText);
                    this.root.adoptedStyleSheets = [stylesheet];
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
                this.root.addEventListener(evtName, e => {
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
                if(this.element){this.element.addEventListener(evtName, handler, bool);}
                else{this.element||super.addEventListener(evtName, handler, bool);}
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

        onTransformStyle(css) {return css}

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
                else if(tem && tem.nodeType==1){
                    this._template=tem.outerHTML;
                }
                resolve(this._template);
            })
        }

        getTemplateToLoad(){
            var engine = this.getTemplateEngine();
            return  this.querySelector("template")||    //node
                    this.src||                          //uri
                    this.template()||                   //string
                    "/src/./index" + (engine.ext||"") + ".html" //TODO: default but ignores <Config.TEMPLATE_NAMES_USE_ENGINE_EXTENSION>
        }


        async onConnected(data) { 
            await this.render(data);
        }
        
        async render(data={}) {
            if(this.element){return}
            var t = this._template;
            if (t) {
                var html = await this.evalTemplate(t, data);
                var temNode = html.toDomElement();
                    temNode = temNode.content;
                if (!this.onEnableShadow()) {
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
                this.root.innerHTML = "";
                this.root.appendChild(temNode);
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

        onEnableShadow() {
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
            if(this.onLoadInstanceStylesheet()){stylesheets.push(this.getNSStyleSheet(this.namespace))}
                stylesheets.push(...this.prototype["@stylesheets"]||[]);
            if(!this['@cascade']){return}
            var ancestor = this.__proto.ancestor

            while(ancestor) {
                if( ancestor != w3c.ui.WebComponent && 
                    ancestor != w3c.ui.Application){
                    
                    stylesheets.unshift(...ancestor.prototype["@stylesheets"]||[]);
                    stylesheets.unshift(this.getNSStyleSheet(ancestor.prototype.namespace));
                    ancestor = ancestor.prototype.ancestor;
                } else { break }
            }
        }

        getNSStyleSheet(ns){
            return relativeToAbsoluteFilePath("/src/./index.css",ns);
        }

        setClassList() {
            this.root.className = this.root.className + (this["@cascade"]? 
                " " + (this.__proto.classes.join(" ")).trim():
                " " + this.classname);
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
            return new Promise(async (resolve,reject) => {
                if(this.__proto._css_loaded){
                    resolve(true);
                    return
                }
                this.__proto._css_loaded=true;
                urls=urls.reverse();
                var stylesheets = window.loaded_stylesheets = window.loaded_stylesheets|| {};
                for(let path of urls){
                    path = this.onLoadStyle(path);
                    if(path && !stylesheets[path]){
                        var tagName = /^http/.test(path) ? "link" : "style";
                        var tag = document.createElement(tagName);
                        this.onAppendStyle(tag);
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
            this.root.setAttribute("namespace", this.namespace);
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
;

namespace `w3c.ui` (
	class Application extends w3c.ui.WebComponent {
	    constructor(el) {
	        super(el);
	        window.application = this;
	    }
	}
);
window.Application = window.Application||w3c.ui.Application;

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

namespace `w3c.ui` (
	class RoutableApplication extends w3c.ui.Application {

        async onConnected(data){
            await this.render(data);
            this.router = new core.http.Router(this,window);// <- onConnected, best place
        }

        onEnterActivity(c) {
            console.log("onEnterActivity", c);
            var slot = this.querySelector('#activitySlot');
            slot.appendChild(c);
            this.currentActivity = c;
            // this.onEnterActivityRestoreScroll(scrollToElement) //TODO: need to uncomment and support scroll
            this.dispatchEvent("onactivityshown", c);
        }

        onExitCurrentActivity(c) {
            // this.onExitActivitySaveScroll()
            console.log("onExitCurrentActivity", c);
            var slot = this.querySelector('#activitySlot');
            slot.innerHTML = "";
        }

        onResumeActivity(c) {
            console.log("onResumeActivity", c);
            this.dispatchEvent("topichanged", {});
        }

        onLoadingActivity(c) {
            // application.dispatchEvent("showsplash")
            console.log("onLoadingActivity", c);
            this.dispatchEvent("topichanged", {});
        }
	}
);

;

namespace `core.ui` (
    class World extends w3c.ui.Application {
        constructor(el) {
            super(el);
            window.sprites = [];
        }

        onUpdate(time){
            window.sprites.forEach(sprite => sprite.onUpdate(time))
        }

        onDraw(interpolation){
            if(this.context){
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            window.sprites.forEach(sprite => sprite.onDraw(interpolation,this.context))
        }

        onEnd(fps, panic){
            if (panic) {
                var discardedTime = Math.round(MainLoop.resetFrameDelta());
                console.warn('Main loop panicked, probably because the browser tab was put in the background. Discarding ' + discardedTime + 'ms');
            }
        }
    }
);

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
    src = src.replace("export", "return");
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
            } cb(`(()=>{ ${src} })()`);
        }

        async imports(match){
            var paths = this.pathsToTry(match);
            for(let path of paths){
                return await window.imports(path);
            }
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
!function(a){function b(a){if(x=q(b),!(a<e+l)){for(d+=a-e,e=a,t(a,d),a>i+h&&(f=g*j*1e3/(a-i)+(1-g)*f,i=a,j=0),j++,k=0;d>=c;)if(u(c),d-=c,++k>=240){o=!0;break}v(d/c),w(f,o),o=!1}}var c=1e3/60,d=0,e=0,f=60,g=.9,h=1e3,i=0,j=0,k=0,l=0,m=!1,n=!1,o=!1,p="object"==typeof window?window:a,q=p.requestAnimationFrame||function(){var a=Date.now(),b,d;return function(e){return b=Date.now(),d=Math.max(0,c-(b-a)),a=b+d,setTimeout(function(){e(b+d)},d)}}(),r=p.cancelAnimationFrame||clearTimeout,s=function(){},t=s,u=s,v=s,w=s,x;a.MainLoop={getSimulationTimestep:function(){return c},setSimulationTimestep:function(a){return c=a,this},getFPS:function(){return f},getMaxAllowedFPS:function(){return 1e3/l},setMaxAllowedFPS:function(a){return"undefined"==typeof a&&(a=1/0),0===a?this.stop():l=1e3/a,this},resetFrameDelta:function(){var a=d;return d=0,a},setBegin:function(a){return t=a||t,this},setUpdate:function(a){return u=a||u,this},setDraw:function(a){return v=a||v,this},setEnd:function(a){return w=a||w,this},start:function(){return n||(n=!0,x=q(function(a){v(1),m=!0,e=a,i=a,j=0,x=q(b)})),this},stop:function(){return m=!1,n=!1,r(x),this},isRunning:function(){return m}},"function"==typeof define&&define.amd?define(a.MainLoop):"object"==typeof module&&null!==module&&"object"==typeof module.exports&&(module.exports=a.MainLoop)}(this);

document.addEventListener("DOMContentLoaded", e => {
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
              .setUpdate(app.onUpdate.bind(app))
              .setDraw(app.onDraw.bind(app))
              .setEnd(app.onEnd.bind(app))
              .start() : null;
        });
    }
  };

  ("cordova" in window) ? 
    document.addEventListener('deviceready', ()=>{
      AndroidFullScreen && AndroidFullScreen.immersiveMode(e=>{}, e=>{});
      bootup()
    }, false) : bootup()
}, false);
