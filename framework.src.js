$framework = {
	stable : "2.0.1",
	nightly : "2.1.0",
	current: "2.1.0",
	
	description: "2.1.0 framework update - bundled with latest ADP Tracker improvements and more."
}
;

//----------EXTENSIONS----------------

;
//USED BY TRACKER

// toQueryString = function(obj, prefix) {
//   var str = [];
//   for(var p in obj) {
//     if (obj.hasOwnProperty(p)) {
//       var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
//       str.push(typeof v == "object" ?
//         toQueryString(v, k) :
//         encodeURIComponent(k) + "=" + encodeURIComponent(v));
//     }
//   }
//   return str.join("&");
// }
;

if(!String.prototype.toDomElement){
  String.prototype.toHtmlElement = String.prototype.toDomElement = function () {
        var wrapper = document.createElement('div');
        wrapper.innerHTML = this.toString();
        var df= document.createDocumentFragment();
            df.appendChild(wrapper);
        return df.firstElementChild.firstElementChild;
    }
};


String.prototype.toLocaleString = function(langCode){
  langCode = langCode||Session.State.currentLanguage.CODE;
  var key = this.toString();
  if(Localization){
    if(Localization[langCode]){
      return Localization[langCode][key]||
             Localization[langCode][key.toLowerCase()]||key;
    } else {
      return key;
    }
  }
  else {
    return key;
  }
};

;

;

;

if(!Array.prototype.where){
    Array.prototype.where = function(exp){
        var exp = new Function("$", "return " + exp);
        var arr=[];
        for(var i=0; i<=this.length-1; i++){
            if(exp(this[i])){
                arr.push(this[i])
            }
        }
        return arr;
    };
}
;
if("logging" in Config && Config.LOGGING != true) {
  for(var k in console){
      console[k]=function(){};
  }
};


window.getParameterByName = function(name, url) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(url||window.location.href);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
};



window.imported_classes = window.imported_classes||{};
window.imports = async function (x,opts, isError) { 
  debugger;
  opts = opts||{cache: Config.IMPORTS_CACHE_POLICY||"no-store"};
  return new Promise((resolve,reject) => {
    // var path = /^https?:/.test(x)? x : Config.ROOTPATH + x;
    var path = x;
    path = path.replace(/^\/+/,Config.ROOTPATH);
    var error = "Unable to load: " + path;
    
    if(window.imported_classes[x]){
      console.error("redundant imports to : " + x + " detected");
      resolve(window.imported_classes[x]);
      return;
    }

    fetch(path,opts)
      .then(async (response) => {
          if(response.ok) {
              var src = await response.text();
              window.imported_classes[x]=src;
              resolve(src)
          }
          else {//then()-else{} when ran from server. catch() block never runs 
            var src = await response.text();
            console.error(error,src);
            resolve(null)
          }
       })
      .catch((e) => {//catch() block fired when ran from file:// disk
        console.error(error, e);
        resolve(null)
      })
  })
};

;


//--------ES7-STYLE DECORATORS--------
function transpile(target, level){
	// target.prototype.__isTranspiled = true;
	// target.prototype.__transpileLevel = level;
}

function stylesheets (target, paths){
	target.prototype['@stylesheets'] = paths
}

function css (target, paths){
	target.prototype['@stylesheets'] = paths
}

function html (target, path){
	target.prototype['@template-uri'] = path
}

function traits(target, __traits){
	var inheritTraits = function(klass, properties){
        properties = properties.reverse();
        properties.forEach(trait => {
            if (typeof trait == "object") {
                defineProps(klass, trait)
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
    }
    
	inheritTraits(target.prototype, __traits);
}

function cascade(target,shouldCascade){
	target.prototype['@cascade'] = shouldCascade;
}

function prop(target,key,val){
	target.prototype[key] = val;
}

function loggable(target, params){
	
}

function tag(target, name){
    window.customElements.define(name, target);
    // if(name.indexOf("app") >= 0){
    //     window.customElements.define(name, target);
    // }
    // else {
    //     var app_tag = Config.DEFAULT_APP_NAME;
    //     customElements.whenDefined(app_tag).then(()=>{
    //         window.customElements.define(name, target)
    //     });
    // }
}

function field(target, type, key, val){
    target = (type=="static") ? 
        target:
        target.prototype;
    target[key] = val;
}
;


//TODO: Remove WebAction,WebIterator, XmlHttpRequest from build.
//--------------LIBS------------------

var Observer = function() {
    this.observations = [];
    this.subscribers  = {};
};
 
var Observation = function(name, func) {
    this.name = name;
    this.func = func;
};
 
Observer.prototype = {
    addEventListener : function(eventName, callback, capture){
        if (!this.subscribers[eventName]) {
            this.subscribers[eventName] = [];}
        this.subscribers[eventName].push(new Observation(eventName, callback));
    },
    
    dispatchEvent : function(eventName, data, scope) {
        scope = (scope||this||window);
        var funcs = this.subscribers[eventName]||[];
   	        funcs.forEach(function notify_observer(observer) { 
                observer.func.call(scope, data); 
            });  
    },
    
    removeEventListener : function(eventName, callback){
        var subscribers = this.subscribers[eventName]||[];
            subscribers.remove(function(i) {
                return i.name === eventName && i.func === callback;
            });
    }
};
;

/** @desc ECMASCRIPT 6 CLASS TRANSPILER.
  Able to transpile ES6-style class syntax into
  native ES5 function-contructor syntax.
  Run the code below in Firebug for an example.
*/


function Ecmascript6ClassTranspiler(){};
Ecmascript6ClassTranspiler.prototype.imports = window.imports;


Ecmascript6ClassTranspiler.prototype.transpile = function(src, doc){
  var doTranspile = Config.ENABLE_TRANSPILER;
  // var transpileLevel = src.match(transpileSettings);
  if(doTranspile) {
    src = this.transpileToLevel(src);
    return src;
  }
  else {return src;}
};


Ecmascript6ClassTranspiler.prototype.transpileToLevel = function(src){
    // if(level == "es7") {
      var nsReg = /(?:@{1}[^\s]*\({1}[^\;]*\){1};{1})?\n?namespace\([\'\"]{1}([^\'\"]*)/
      var nsMatch = src.match(nsReg);
      nsMatch = nsMatch?nsMatch[1]:"";
      src = this.transipleDecoratorFields(nsMatch,src);
      src = this.transipleClassFields(nsMatch,src);
      src = this.transipleImportsDestructuring(nsMatch,src);
      return src
    // }
    // else {
    //   return src
    // }
};

Ecmascript6ClassTranspiler.prototype.transipleDecoratorFields = function(ns,src){
  var regex = /@([^\s]*)\({1}([^\;]*)\){1};{1}/gm;
  var props = [];
  if(ns){
    src = src.replace(regex, (full, method, args)=> {
      props.push(`${method}(${ns}, ${args});`);
      return "";
    });
    var fullsrc = src + "\n" + props.join("\n");
  } else {
    src = src.replace(regex, (full, method, args)=> {
      return "";
    });
    fullsrc = src;
  }
  return fullsrc;
}

Ecmascript6ClassTranspiler.prototype.transipleImportsDestructuring = function(ns,src){
    var regex = /import\s\{([^\}]*)\}\sfrom\s([^;]*)/gm;
    src = src.replace(regex, (full, destructured_var, src_path)=> {
      destructured_var = destructured_var.replace(/\s+as\s+/gm,":");
      return `const {${destructured_var}} = (()=> {\nimport ${src_path};\n})();`
    });
    src = src.replace("export ", "return ");
  return src;
}

Ecmascript6ClassTranspiler.prototype.transipleClassFields = function(ns,src){
  var regex = /(@static|@public|@private)(?:[^\s]*)\s([^\s]*)[\s\=]*([^\;]*)\;{1}\n{1}/gm;
  var props = [];

  if(ns){
    src = src.replace(regex, (full, type, name, val)=> {
      type = type.replace("@","");
      props.push(`field(${ns}, "${type}", "${name}", ${val});`);
      return "";
    });
    var fullsrc = src + "\n" + props.join("\n");
  } else {
    src = src.replace(regex, (full, type, name, val)=> {
      return "";
    });
    fullsrc=src;
  }
  return fullsrc;
}

// Ecmascript6ClassTranspiler.prototype.transpile = function(src, doc){
//     var transpileSettings = /@transpile\([\'\"]*([a-zA-Z0-9]*)[\'\"]*\)/;
//     var transpileLevel = src.match(transpileSettings);
//     if(transpileLevel && transpileLevel[1]) {
//       src = this.transpileToLevel(transpileLevel[1],src);
//       return src;
//     }
//     else {return src;}
// };



Ecmascript6ClassTranspiler.prototype.Build = async function(_code, cb){
  _code = this.transpile(_code);
   var self=this;
    var finished = false;
    var reg = /^(?:\/\/\=\s*require|import\W|\#+include\W)\s*[\'\"]{1}([^\'\"]*)[\'\"]{1}\;/im;
    
    //This one works but matches import statements in middle of src
    // var reg = /(?:\/\/\=\s*require|import\W|\#+include\W)\s*[\'\"]?([0-9A-Za-z\-\_\.\/\\]*)[\'\"]?/im;
    
    while(reg.test(_code)){
        var s="";
        var ns_or_path = _code.match(reg)[1];
        

        if(/\.js|\.mjs$/.test(ns_or_path)){
          if(window.imported_classes[ns_or_path]){
            s = /\.mjs$/.test(ns_or_path)?
              window.imported_classes[ns_or_path] : ";"
          }
          else {s = await this.imports(ns_or_path);}
        }
        else {
          var paths_to_try = this.pathsToTry(ns_or_path);
          if(window.imported_classes[paths_to_try[0]] || window.imported_classes[paths_to_try[1]]){s=";"}
          else {
            s = await this.imports(paths_to_try[0],false)||
                await this.imports(paths_to_try[1],false);
          }
          if(!s){
            console.error("Attempted to import a namespace or file by trying 2 locations and failed. Verify your imports. Locations tried: ", paths_to_try)
          }
        }
        s = s? this.transpile(s):"";
        _code = _code.replace(reg, s)
    }
    cb(_code);
};


Ecmascript6ClassTranspiler.prototype.pathsToTry = function (_namespace) {
  var paths = [];
  if(/\.js$/.test(_namespace)){
    paths.push(_namespace);
  } else{
    var classname_path = ("src/" + _namespace.replace(/\./g,"/") + ".js");
    var filename_path  = ("src/" + _namespace.replace(/\./g,"/") + "/index.js");
    paths.push(filename_path);
    paths.push(classname_path);
  }
  return paths;
};
;

; (function(env) {
    var importedFiles={};
    var Class;
    env.NSRegistry = env.NSRegistry||{};
    // env.Class = Class = function(){};
    //     Class.prototype = {
    //         preInitialize: function(){
    //             var res = this.initialize.apply(this, arguments);
    //             this.initializeTraits(arguments);
    //             return res;
    //         },
            
    //         initialize       : function() {return this;},
            
            
    //         hasOwnMember : function(key){
    //             try{return this.constructor.prototype.hasOwnProperty(key)}
    //             catch(e){return this.hasOwnProperty(key);}
    //         },
            
    //         initializeTraits : function(){
    //             var traits = this["@traits"]||[];
    //             for(var i=0; i<=traits.length-1; i++){
    //                 var trait = traits[i];
    //                 if(typeof trait == "function"){
    //                     new trait(this,arguments);
    //                 }
    //                 else if(trait && trait.initialize) {}
    //             }
    //         }
    //     };
    
    
    env.namespace = function(ns, def){
        def=def||{};
        var k = (def && typeof def == "object") ?
            def : def.prototype;
            k.namespace = ns;
            k.classname = /([a-zA-Z]*)$/.test(ns) ? 
                RegExp.$1 :
                "Anonymous";

        // if(def && typeof def == "object"){
        //     def.namespace = ns;
        //     def.classname = /([a-zA-Z]*)$/.test(ns) ? RegExp.$1:"Anonymous";
        // } else {
        //     if(def && typeof def == "function") {
        //         def.prototype.namespace = ns;
        //         def.prototype.classname = /([a-zA-Z]*)$/.test(ns) ? RegExp.$1:"Anonymous";
        //     }   
        // }
        var n = createNS(ns);
        env.NSRegistry[ns] = n[0][n[1]] = def ?
            createClass(def,ns) : {};
    };
    
    
    var createNS = function(aNamespace){
        var scope       = env;
        var parts       = aNamespace.split(/\./g); 
        var classname   = parts.pop();
            
        for (var i = 0; i <= parts.length - 1; i++) {
            scope = scope[parts[i]]||(scope[parts[i]] = {});
        };
        return [scope,classname];
    };
    
    
    var createClass = function(properties, ns){
        if(typeof properties == "function"){
            properties.prototype.ancestor = properties.prototype.__proto__.constructor;
            return properties
        }
        /*if(properties["@imports"] && properties["@imports"].length > 0){
            console.warn("Depracated : " + ns + " > The @imports decorator-rule in Simul8 classes will be phased out eventually.\nUse the ES6-style:\n import 'src/file/path.js' instead.")
            loadImports(properties, ns);
        }
        delete properties["@imports"];
        delete properties["@import"];
        var obj = properties["@inherits"];
        
       if(!("@inherits" in properties)) {
           obj = properties["@inherits"] = Class;
       }
       else if(typeof obj == "string") {
           var inheritedNS = obj;
           obj = properties["@inherits"] = (NSRegistry[obj]);
           if(!obj){
               throw new TypeError(ns + " inherits from a class, " +inheritedNS + " - that is not defined")
           }
       }
       else {
           obj = properties["@inherits"] = (properties["@inherits"]);
           if(!obj){
               throw new TypeError(ns + " inherits from a class that is not defined.")
           }
       }
        
        var traits = (properties["@traits"]||{});
        if (typeof(obj) === "function") {
            var F = function(){}; //optimization
                F.prototype = obj.prototype;
                
            var klass = function() {
                return this.preInitialize? this.preInitialize.apply(this, arguments):
                        this.initialize.apply(this, arguments);
            };
            klass.prototype = new F();
            inheritTraits(klass.prototype, traits);
            inheritProperties(klass.prototype, properties);
            klass.prototype.constructor = klass;
            klass.prototype.ancestor = obj;
            inheritStaticMembers(klass, obj, properties);
            //TODO: Get getter/setter decorators to work
            // defineGettersSetters(klass, obj, properties);
        }
        return klass;*/
    };

    // var defineGettersSetters = function(klass, ancestor, properties){
    //     for(var key in properties) {
    //         var match = key.match(/\@([^\s]+)/);
    //         if(match && properties.hasOwnProperty(key)) {
    //             var obj = properties[key];
    //             var propName = match[1];
    //             Object.defineProperty(klass.prototype, propName, {
    //                 get: obj.get,
    //                 set : obj.set
    //             });
    //         }
    //     }
    // };

    // var inheritStaticMembers = function(klass, ancestor, properties){
    //     for(var key in ancestor) {
    //         if(ancestor.hasOwnProperty(key)) {
    //             klass[key] = ancestor[key];
    //         }
    //     }
    //     for(var key in properties) {
    //         if(key.indexOf('@static ')>=0 && properties.hasOwnProperty(key)) {
    //             var propName = key.split(/\s+/)[1];
    //             klass[propName] = properties[key];
    //         }
    //     }
    // };
    
    // var loadImports = function(properties, ns){
    //     var amdSupported = true;
    //     var forceImports = false;
    //     var self=this;
    //     if(Config && ("AMD" in Config) && Config.AMD==false){
    //         amdSupported=false;
    //     }
    //     if(!("@forceimports" in properties) || properties["@forceimports"]==false){
    //         forceImports=false;
    //     } else {
    //         forceImports=true;
    //     }
    //     if(!amdSupported && !forceImports) {return}

    //     var imports = properties["@imports"]||properties["@import"]||[];
    //     for(var i=0; i<=imports.length-1; i++){
    //        imports[i] = relativeToAbsoluteFilePath(imports[i], ns);
    //     }
    //     for(var i=0; i<=imports.length-1; i++) {
    //         var p = imports[i];
    //         var error = `404: Unable to load @imports(decorator) filepath: ${p} declared in: ${ns}, `;
    //         if(importedFiles[imports[i]]) {
    //            continue;
    //         } else {
    //              var  oXMLHttpRequest = new XMLHttpRequest;
    //              try {
    //                 oXMLHttpRequest.open("GET", imports[i], false);
    //                 oXMLHttpRequest.setRequestHeader("Content-type", "text/javascript");
    //                 if(oXMLHttpRequest.overrideMimeType){
    //                     oXMLHttpRequest.overrideMimeType("text/javascript")
    //                 }
    //              } catch(e){}
    //              oXMLHttpRequest.onreadystatechange  = function() {
    //                 if (this.readyState == XMLHttpRequest.DONE) {
    //                   if(this.status == 0 || this.status == 200){
    //                     var head   = document.getElementsByTagName("head").item(0);
    //                     var scripts = head.getElementsByTagName("script");
    //                     var script = document.createElement("script");
    //                         script.setAttribute("type", "text/javascript");
    //                         script.setAttribute("charset", (Config.CHARSET || "utf-8"));
    //                         var _src=this.responseText;
    //                         var ecmaTranspiler = new Ecmascript6ClassTranspiler;
    //                         _src = ecmaTranspiler.transpile(_src);
    //                         ecmaTranspiler.Build(_src, (output) => {
    //                             script.text = output;
    //                             head.appendChild(script);
    //                             importedFiles[imports[i]]=true;
    //                         });
    //                   }
    //                   else {
    //                     console.error(error)
    //                   }
    //                 }
    //              }
    //              try{
    //                 oXMLHttpRequest.send(null);
    //              } catch(e) {
    //                  console.error(error, e.message)
    //              }
    //         }
    //     }
    // };
    
    // var relativeToAbsoluteFilePath = function(path, ns){
    //     var apppath = Config.ROOTPATH? (Config.ROOTPATH + "/") : "";
    //     ns = ns||this.namespace;

    //     if(path.indexOf("~/") >= 0){
    //         path = path.replace("~/", apppath);
    //     } else if(path.indexOf("./") >= 0){
    //         path = path.replace("./", apppath + ns.replace(/\./gim,"/") + "/");
    //     } 
    //     else if(path.indexOf("http") == 0){
    //         return path;
    //     }
    //     else{
    //         if(path.indexOf(Config.ROOTPATH)<0){
    //             path = apppath + path
    //         }
    //     }
    //     path = /http:/.test(path)? path : path.replace("//","/");
    //     if(path.indexOf(".html")>=0 && engine != TemplateEnginePlugins.Kruntch){
    //         path = path.replace(/\.html/, engine.ext+".html");
    //     }
    //     return path;
    // };
    
    // var inheritTraits = function(klass, properties){
    //     var _traits = properties; 
    //     if (_traits) {
    //         var traits = [];
    //         if (_traits.reverse) {
    //             traits = traits.concat(_traits.reverse());}
    //         else {traits.push(_traits);}
    //         var trait;
    //         for (var i = 0; (trait = traits[i]); i++) {
    //             if (typeof trait == "object") {
    //                 inheritProperties(klass, trait)
    //             }
    //         }
    //     }
    //     return klass;
    // };
        
    // var inheritProperties = function(dest, src, fname){
    //     if (!src || !dest) {return;}
    //     if (arguments.length === 3) {
    //         var ancestor    = dest[fname], 
    //             descendent  = src[fname], 
    //             method      = descendent;
                
    //         descendent = function() {
    //             var ref     = this.parent;
    //             this.parent = ancestor;
    //             var result  = method.apply(this, arguments);
    //             if(ref) {
    //                 this.parent = ref;
    //             }
    //             else { delete this.parent }
    //             return result;
    //         };
    //         descendent.valueOf  = function() { return method;};
    //         descendent.toString = function() { return method.toString();};
    //         dest[fname] = descendent;
    //     }
    //     else {
    //         for (var prop in src) {
    //             if (dest[prop] && typeof(src[prop]) === 'function') { 
    //                 inheritProperties(dest, src, prop);
    //             }
    //             else { dest[prop] = src[prop]; }
    //         }
    //     }
    //     return dest;
    // };
})(this);
;
// require core/http/XmlHttpRequest
// require core/http/WebAction
// require core/http/WebIterator

namespace("core.http.ClassLoader", class {

    constructor (){
        this.observations = [];
        this.subscribers  = {};
        return this;
    }

    // loadMJS(filepath){
    //     var head  = document.getElementsByTagName("head").item(0);
    //     var script = document.createElement("script");
    //     script.setAttribute("type", "module");
    //     script.setAttribute("charset", (Config.CHARSET || "utf-8"));
    //     script.src = filepath;
    //     head.appendChild(script);
    //     var data = {};
    //     this.dispatchEvent("load", data, self)
    // }
    
    async load (_namespace,filepath) {
        var es6Transpiler = new Ecmascript6ClassTranspiler();
        var self = this;
        var src;
        //var nsPath = filepath?filepath:("src/" + _namespace.replace(/\./g,"/") + ".js");
        var cbSuccess = function(src){
            es6Transpiler.Build(src,(output) => {

                var head   = document.getElementsByTagName("head").item(0);
                var script = document.createElement("script");
                script.setAttribute("type", "text/javascript");
                script.setAttribute("charset", (Config.CHARSET || "utf-8"));
                script.text = output;
                head.appendChild(script);
                if(NSRegistry[_namespace]) {
                    var data = {Class: NSRegistry[_namespace], source: output, path: filepath};
                    self.dispatchEvent("load", data, self)
                } else {
                    console.error("Unable to load src: ", [_namespace,filepath])
                }
            });
        };

        var cfFailure = function(src, xhr){
            self.dispatchEvent("fail", xhr, self)
        }

        var src;
        
        if(filepath) {
            src = await es6Transpiler.imports(filepath)
        }
        else {
            var paths_to_try = es6Transpiler.pathsToTry(_namespace);
            src = await es6Transpiler.imports(paths_to_try[0],false)||
                  await es6Transpiler.imports(paths_to_try[1],false);
        }

        src?cbSuccess(src):cfFailure(src,"no xhr");   
    }
});
traits(core.http.ClassLoader,[new Observer]);

/*********************************************************************
 ::USAGE::
 
    var c = new core.http.ClassLoader;
    
    c.addEventListener("load", function(data){
        console.info(data)
    });
    c.addEventListener("fail", function(){
        alert("failed")
    });
    
    c.load("com.Employee")
 **********************************************************************/
;

namespace("core.http.ModuleLoader", class {

    constructor (){
        this.observations = [];
        this.subscribers  = {};
        return this;
    }
    
    load(ns,filepath){
        var head  = document.getElementsByTagName("head").item(0);
        var script = document.createElement("script");
        script.setAttribute("type", "module");
        script.setAttribute("charset", (Config.CHARSET || "utf-8"));
        script.src = filepath;
        head.appendChild(script);
        var data = {};
        this.dispatchEvent("load", data, self)
    }
});
traits(core.http.ModuleLoader,[new Observer]);

/*********************************************************************
 ::USAGE::
 
    var c = new core.http.ModuleLoader;
    
    c.addEventListener("load", function(data){
        console.info(data)
    });
    c.addEventListener("fail", function(){
        alert("failed")
    });
    
    c.load("com.Employee")
 **********************************************************************/
;
// require core/http/Router
// require core/data/EventBus
// require core/http/NetDetect
namespace("core.traits.ResourcePathTransformer");

core.traits.ResourcePathTransformer = {
    resourcepath : function(url, ns){
        url = url.replace(/\$\{ns\}/gm, ns.replace(/\./gim,"/"));
        return Config.ROOTPATH + url;
    },
    
    relativeToAbsoluteFilePath : function(path, ns, appendRoot){
        appendRoot = (typeof appendRoot=="boolean")?
            appendRoot : true;
        var apppath = (Config.ROOTPATH && appendRoot) ? 
            (Config.ROOTPATH + "/") : "";
        ns = ns||this.namespace;
        ns = ns.replace(/\./gim,"/");

        if(path.indexOf("~/") >= 0){
            path = path.replace("~/", apppath);
        } else if(path.indexOf("/./") >= 0){
            path = apppath + path.replace("./", ns+"/");
        } 
        else if(path.indexOf("http") == 0){
            return path;
        }
        else{
            if(path.indexOf(Config.ROOTPATH)<0){
                path = apppath + path
            }
        }
        path = /http:/.test(path)? path : path.replace("//","/");
        // var conf_ext = Config.TEMPLATE_NAMES_USE_ENGINE_EXTENSION;
        // var useEngineExtensions = (typeof conf_ext == "boolean")?conf_ext:false;
        // if(path.indexOf(".html")>=0 && engine && useEngineExtensions){
        //     path = path.replace(/\.html/, engine.ext+".html");
        // }
        return path;
    }
};
;
// require core/traits/InitializeApplicationData
// require core/data/StorageManager
// require core/data/CircularBuffer
// require libs/rison.js
// require libs/TemplateEnginePlugins.js
// require core/traits/Paginator.js


//TODO: Remove core.vo.Account from build
//-------------------MODELS--------------------
// require core/vo/Model
// require core/vo/Account


//TODO: Remove DataController and StorageController from build
//----------------CONTROLLERS------------------
// require core/controllers/DataController
// require core/controllers/StorageController

//---------------------UI----------------------
// require core/ui/WebComponent
// require core/ui/ModalScreen


// import 'w3c/ui/Binding.js';

namespace("core.ui.templating.CustomTemplateEngines", class {
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

    get default (){
        return this.engines[this.defaultMimetype];
    }

    set default (mimeType){
        this.defaultMimetype = mimeType;
    }
})

window.customTemplateEngines = new core.ui.templating.CustomTemplateEngines;


;
(() => {
    /**
     * An engine implements below required props/methods.
     * TemplateLiterals {} is a built in engine. 
     * 
     * This is an adapter design. In this case, eval()
     * takes a template & data and uses native Function
     * to handle template expansion.
     * 
     * install() should handle installation of 3rd
     * party libs to adapt template parsing if needed.
     * eval() will then delegate to api and return 
     * expanded template to the caller. 
     */
    TemplateLiterals = {
        name : "TemplateLiterals",
        ext : ".es6",
        eval : function(tempStr, data, self){
            var parse = (tempStr, templateVars) => {
                return new Function("return `"+tempStr +"`;").call(templateVars);
            }
            return parse(tempStr, data)
            // return eval('`'+tempStr+'`');
        },
        isAvailable : function(){
            return true
        },

        install : function(){
            console.log("TemplateLiterals template engine installed successfully.")
        }
    };

    window.customTemplateEngines.define("template/literals", TemplateLiterals);
})();

;

namespace("w3c.ui.WebComponent", class extends HTMLElement {

    constructor() {
        super();
    }

    appendStyleSheet (stylesheet){
		var headNode 		= application.head;
		var configscript 	= application.configscript;
		headNode.insertBefore(stylesheet, configscript);
    }

    adopts(orphan){
        orphan && orphan.parentNode.replaceChild(this,orphan)
        orphan && this.appendChild(orphan);
    }

    replaces(orphan){
        debugger;
        orphan && orphan.parentNode.replaceChild(this,orphan);
    }

    dispatchEvent (type, data, details={bubbles:true, cancelable:true, composed:true}, element=this){
    	var evt = document.createEvent("Event");
		evt.initEvent(type, details.bubbles, details.cancelable);
		evt.data = data;
		
		return super.dispatchEvent(evt);
    }

    bind (el, evtName, handler){
        var self=this;
        // el = (el instanceof core.ui.Binding)?
        //     el : this;

        if(typeof el == "string") {
            this.addEventListener(evtName, (e)=>{
                // console.warn(e.target)
                var t = this.getRealTargetFromEvent(e,el);
                if(t) {
                    handler({target:t, originalEvent:e});
                }
            }, true);
            // var _handler = function(e){
            //     debugger;
                // var t = self.getRealTargetFromEvent(e,el);
                // if(t) {
                //     handler({target:t, originalEvent:e});
                // }
            // };
            // this.addEventListener(evtName, _handler, false);
            // var b = new core.ui.Binding(this, evtName, _handler);
            // return b;
        } else {
            el.addEventListener(evtName, handler, false);
            // if(!(el instanceof core.ui.Binding)){
            //     var b = new core.ui.Binding(el, evtName, handler);
            //     return b;
            // }
        }
    }

    getParentBySelectorUntil  ( elem, terminator, selector ) {
        elem = elem || this;
        var parent_node = null;
        for ( ; elem && elem !== document; elem = elem.parentNode ) {
            if ( terminator ) {
                if ( elem.matches( terminator ) ) break;
            }
            if ( selector ) {
                if ( elem.matches( selector ) ) {
                    parent_node =  elem;
                    break;
                }
            }
        }
        return parent_node;
    }

    getRealTargetFromEvent  (e, selector, terminator){
        var el = e.composedPath()[0]
        if(el.matches(selector)){return el}
        // var el = e.composedPath()[0];//e.target;
        // debugger;
        // return this.getParentBySelectorUntil(el, terminator, selector);
    }

    onStylesheetLoaded (style){}

    cssTransform (css){
        var ns = this.namespace;
        css = css.replace(/resource\([\'\"]?([^\'\"]*)[\'\"]?\)/mg, 
            (full,m1) => "url(" + this.resourcepath(m1, ns) + ")"
        );
		return css;
    }
    
    setCssTextAttribute(_cssText, stylenode){
		if (stylenode && stylenode.styleSheet) {
            stylenode.styleSheet.cssText = _cssText;
        }
        else {
            stylenode.appendChild(document.createTextNode(_cssText));
        }
	}

    async setElement(el){
        var self=this;
        if(el){
            this.innerHTML = el.innerHTML;
            el.parentNode.replaceChild(this,el);
            //set this.element to null ?
            return;
        }
        var tpath = this.getAttribute("template");
        // if external template= attrb, use it
        if(tpath){
            var ns = this.namespace;
                ns = ns.replace(/\./gim,"/");
            var opts = {cache: "force-cache"};
            tpath = tpath.replace("/./", "/"+ns+"/");
            this._template = await imports(tpath,opts);
            return;
        }
        else {
            // else if inline html uses a slot, 
            // then use internal template
            var slot = this.querySelector("[slot]");
            this._template = slot ? 
                this.template():
                null;
            return
        }
    }
    
    onConnected(){}

    render(data){
        var t = this._template;
        if(t){
            // this.root = this.root || 
            //     this.attachShadow({mode: 'open'});
            this.root = this;
            var html = data ? 
                this.evalTemplate(t, data) : t;

            var temNode = html.toDomElement();
            this.root.innerHTML="";
            this.root.appendChild(temNode.content);
            this.onTemplateRendered();
        }
    }

    onTemplateRendered(){}

    async connectedCallback(){
        await this.setElement(this.element);
        this.setClassList();
        // this.initializeChildComponents();
        this.setPrototypeInstance();
        this.setStyleDocuments();
        this.onConnected();
    }

    setStyleDocuments (){
        // this.createStyleDocument();
        // this.setClassList();
        this.loadcss(this.getStyleSheets());
    }

    getStyleSheets (){
        // debugger;
        var ancestor    = this.ancestor;
        var classes     = [];
        var ancestors   = [];
        var stylesheets = [];
        
        //debugger;
        if(this["@cascade"]) {
            while(ancestor){
                var p = ancestor.prototype;
                var styles = p["@stylesheets"]||[];
                    ancestors.unshift(ancestor);
                    for(var i=0; i<=styles.length-1; i++){ 
                        stylesheets.push(this.relativeToAbsoluteFilePath(styles[i], p.namespace, false));     
                    }
                    
                // if(p["@cascade"]) {
                //     ancestor = p.ancestor;
                // }
                // else { ancestor=null; break; }

                ancestor = p["@cascade"]?
                    p.ancestor : null;
            };

            // var this_styles = this["@stylesheets"]||[];
            // for(var i=0; i<=this_styles.length-1; i++){ 
            //     stylesheets.unshift(this.relativeToAbsoluteFilePath(this_styles[i],this.namespace, false));     
            // }
        }
        else {
            // var this_styles = ([].concat(this["@stylesheets"]||[]));
            // for(var i=0; i<=this_styles.length-1; i++){ 
            //     stylesheets.unshift(this.relativeToAbsoluteFilePath(this_styles[i],this.namespace, false));     
            // }
        }
        var this_styles = this["@stylesheets"]||[];
        for(var i=0; i<=this_styles.length-1; i++){ 
            stylesheets.unshift(this.relativeToAbsoluteFilePath(this_styles[i],this.namespace, false));     
        }
        return stylesheets;
    }


    


    async loadcss(url){
        var self=this;
        var stylesheets = window.loaded_stylesheets = window.loaded_stylesheets||{};
        // if (!stylesheets) {
        //     window.loaded_stylesheets = {};
        //     stylesheets = window.loaded_stylesheets;}
        if(stylesheets[url]){
            self.onStylesheetLoaded(stylesheets[url]); 
            return;
        }   
        var styles = (url||this["@stylesheets"]);

        if(styles) {
            if(styles instanceof Array) {
                styles = styles.reverse();
                // for(var i=0; i<=styles.length-1; i++) {
                //     var path = styles[i];
                //     this.loadcss(path);
                // }
                styles.forEach(path => this.loadcss(path))
            }
            else if(typeof styles === "string" && styles.indexOf("http") != 0) {
                //var path = this.resourcepath(styles);
                var path = styles;
                if(stylesheets[path]){return}
                    
                var stylenode= document.createElement('style');
                    stylenode.setAttribute("type", 'text/css');
                    stylenode.setAttribute("rel", 'stylesheet');
                    // stylenode.setAttribute("href", path);
                    stylenode.setAttribute("media", 'all');
                    stylenode.setAttribute("component", this.namespace||"");
                    //head.appendChild(stylenode);
                    this.appendStyleSheet(stylenode);
                    stylesheets[path] = stylenode;
                    var _cssText = await window.imports(path);
                        _cssText = self.cssTransform(_cssText);
                        self.setCssTextAttribute(_cssText, stylenode); 
                        self.onStylesheetLoaded(stylenode);
                    /*var oXMLHttpRequest;
                        oXMLHttpRequest = new XMLHttpRequest;
                        oXMLHttpRequest.open("GET", path, true);
                        oXMLHttpRequest.setRequestHeader("Content-type", "text/css");
                        if(oXMLHttpRequest.overrideMimeType){
                            oXMLHttpRequest.overrideMimeType("text/css")
                        }

                        oXMLHttpRequest.onreadystatechange  = function() {
                            if (this.readyState == XMLHttpRequest.DONE) {
                                //if (this.status == 200) {
                                    var _cssText = self.cssTransform(this.responseText);
                                    self.setCssTextAttribute(_cssText, stylenode); 
                                    self.onStylesheetLoaded(stylenode);           
                                //}
                            }
                        }
                        oXMLHttpRequest.send(null);*/
            }
            else if(styles && styles.indexOf("http") == 0){
                var cssNode = document.createElement('link');
                cssNode.type = 'text/css';
                cssNode.setAttribute("component", this.namespace||"");
                cssNode.rel = 'stylesheet';
                cssNode.href = styles;
                this.appendStyleSheet(cssNode);
                stylesheets[styles] = cssNode;
                self.onStylesheetLoaded(cssNode);
            }
            else{
                try{console.warn("Unable to resolve path to stylesheet. Invalid uri: '" + styles + "'")} catch(e){}
            }
        }
        else {}
        
    }


    

    //TODO: new proposal for simpler use and DIP
    evalTemplate(template, data){
        var eng = this.getTemplateEngine();
        return eng.eval(template, data, this);
    }

    getTemplateEngine(){
        return window.customTemplateEngines.default;
    }

    setPrototypeInstance (){
        this.setAttribute("namespace",this.namespace);
		this.prototype = this;
    }
    
    setClassList (){
        var classes=[];
        if(this['@cascade'] == true){
            var ancestor = this.ancestor;
            while(ancestor && ancestor.prototype['@cascade'] ==true){
                var proto = ancestor.prototype;
                classes.unshift(proto.classname)
                ancestor = proto.ancestor;
                if(!ancestor||ancestor == HTMLElement) {
                    break;
                }
            }
        }
        classes.push(this.classname);
        //TODO:leaves a leading space in front, trim it.
        this.className += (" " + classes.join(" "));
    }



    // async fetch(path,bool){
    //     var self=this;
    //     return new Promise( async (resolve, reject) => {  
    //         if(bool){
    //             var res = await fetch(path,{cache: "force-cache"});
    //             var html = await res.text();
                
    //             resolve( html);
    //         } else {
    //             var xhttp = new XMLHttpRequest();
    //                 xhttp.onreadystatechange = function() {
    //                     if (this.readyState == 4 && this.status == 200) {
    //                         self.constructor.prototype.loaded_html = this.responseText;
    //                         resolve(this.responseText);
    //                     }
    //                 };
    //                 xhttp.open("GET", path, false);
    //                 xhttp.send();
    //         }
    //     })
    // }


    

    // initializeChildComponents (el){
	//     el = el||this;
	// 	var self=this;
    //     var nodes = this.querySelectorAll("*[namespace]");
    //         nodes = [].slice.call(nodes);
    //         nodes.forEach(n => {
    //             if(n && n.nodeType == 1) { 
    //                 var ns = n.getAttribute("namespace");
    //                 var c = NSRegistry[ns];
    //                 c && new c(n);
    //             }
    //         })
    // }
    
    
});


transpile(w3c.ui.WebComponent,'es7');
traits(w3c.ui.WebComponent,[
    core.traits.ResourcePathTransformer
]);

transpile(w3c.ui.WebComponent,"es7");
cascade(w3c.ui.WebComponent,true);
;

;


namespace("w3c.ui.Application", class extends w3c.ui.WebComponent {
    constructor(element) {
        super(element);
        window.application = this;
        this.head           = document.getElementsByTagName("head")[0];
        this.configscript   = document.querySelector("script[id='config']")||
                              document.querySelector("script");
    }

    template(){return ""}

});

;

//TODO: Remove ModalScreen from build. Let apps import as needed.


//TODO: Remove processes/activities from build. Not used by framework. let apps import as needed
//--------------------- ACTIVITIES + PROCESSES ----------------------
// require core/processes/Activity
// require core/processes/ActivityProcessMonitor
// require core/processes/URIActivityMonitor
// require core/ui/Activity



//-----------------BOOTLOADER------------------
;
;

document.addEventListener("DOMContentLoaded", function(){ 
	function bootup(){
    
    var ns = Config.NAMESPACE;
    if(Config.DYNAMICLOAD) {
          var filename_path  = ("src/" + ns.replace(/\./g,"/") + "/index");
          var path;

          if(Config.USE_COMPRESSED_BUILD){
            path = filename_path + ".min.js";
            console.log("compressed: " + path);
          }
          else {
            path = filename_path + ".js";
            console.log("non-compressed: " + path);
          }
          var c = (Config.ENABLE_TRANSPILER)?
            new core.http.ClassLoader:
            new core.http.ModuleLoader;
            c.addEventListener("load", data => init(ns), false);
            c.load(ns,Config.ROOTPATH+path);

          // if(Config.ENABLE_TRANSPILER) {
          //   var c = new core.http.ClassLoader;
          //       c.addEventListener("load", data => init(ns), false);
          //       c.load(ns,Config.ROOTPATH+path);
          // } else {
          //   var c = new core.http.ModuleLoader;
          //       c.addEventListener("load", data => init(ns), false);
          //       c.load(ns,Config.ROOTPATH+path);
          // }

    } 
    else {
      init(ns);
    }
  };	
  
	function init(ns){
    var timerId;
    var App = NSRegistry[ns];
    if(App) {
      timerId && clearTimeout(timerId);
      if(App.prototype.classname == "ApplicationContainer"){
          window.application = new App(document);
      }
    }
    else { 
      timerId = setTimeout(() => init(ns),100);
    }
  };

	bootup();
}, false);
;


/*
namespace("core.Application", {
    '@inherits' : core.ui.WebComponent,
    '@cascade'  : true,
    '@traits'   : [],
    '@stylesheets' : [],
    

    preInitialize : function(model, element) {
        window.application  = this;
        this.head           = document.getElementsByTagName("head")[0];
        this.configscript   = document.querySelector("script[id='config']")||
                              document.querySelector("script");
        core.data.StorageManager.initialize(Config.StorageManager.STORE_KEY);
        Session.StorageManager = core.data.StorageManager;

        this.session = new core.controllers.StorageController;//TODO: deprecate and remove StorageController
        this.parent(model, element.body||element);
        return this;
    },


    initialize : function () {
        var self = this;
        this.parent(arguments);
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    isUserSessionValid : function(){
        if(!this.account) {
            this.account = new core.vo.Account(this.db.user);//TODO: force sub-class apps to implement this? It is a unique domain check
        };
        return this.account.isValid();
    },

    onRender : function(e){
        var self=this;
        setTimeout(function(){self.element.style.opacity=1;},Config.FOUCDELAY);
    },

    getLocationHash : function(){
        var hash = location.hash.replace("#","");
        var params = rison.decode(hash);
        return params;
    },

    setLocationHash : function(params){
        location.hash = "#" + rison.encode(params);
    },

    globalzindex : 600000,
    
    absoluteZindex : function(nodeReference){
        this.globalzindex = this.globalzindex + 1;
        return this.globalzindex;
    },

    onDeviceReady : function(){
        if(navigator.splashscreen){
            navigator.splashscreen.hide();
        }
    },

    redirect : function(appPath){
        window.postMessage({
            type:"redirect",
            url: appPath
        }, "*");
    }
});

*/