var EntryList = require("./EntryList")
  , MimeApps = require("./MimeApps")
  , TypeList = require("./MimeType");

function Finder(type){
  type = type || "desktop";
  //Early instanciation because we can asynchronously fetch every desktop file we will need later.
  //Promises allow us to start querying immediately though.
  this.entries = new EntryList(type);
  if(type === "desktop"){
    this.apps = new MimeApps(type);
  }
  this.types = new TypeList();
}
/**
 * Open a file or an array of file. Don't forget to catch errors using promise syntax :
 * 		launcher.start("pat/to/file").catch(function(e){//catch errors});
 *
 * @param  {string|Array} file file to open or array of file to open
 * @return {child_process}         reference to the created child process
 */
Finder.prototype.find = function (file,callback) {
  var self = this;
  var promise = this.types.lookup(file)
  .then(function(res){
    if(self.apps){ //self.apps does not always exists.
      return self.apps.find(res);
    }else{
      throw "NOTFOUND:"+res;
    }
  }) //return an array of desktop entries
  .then(function(defaultApps){
    //TODO this is bad. getExecKey should be an independant function upon which both entries and apps depends.
    return Promise.all(defaultApps.map(function(en){return self.entries.getExecKey(en)})).then(function(keys){
      var result = null;
      keys.some(function(key){
        if(key){
          result = key;
          return true;
        }else{
          return false;
        }
      });
      return result;
    });
  }).catch(function(e){
    if(e.indexOf("NOTFOUND:") === 0){
      return self.entries.find(e.split(":")[1]); //here entries is in fact the mime type given to apps.find().
    }else{
      throw e;
    }
  });
  if(callback && typeof callback === "function"){
    promise.then(function(entry){
      process.nextTick(function(){callback(null,entry)});
    }).catch(callback);
  }
  return promise;

};

module.exports = Finder;
