this.DirectoryWidgetResource = (function() {
  var fs = require('fs');
  var path = require('path');

  /* public constructor */
  function DirectoryWidgetResource(dir) {
    var that = this;

    /* public instance variables */
    this.resource = dir;
    this.contents = {};
    
    function scanDir(name) {
      var children = fs.readdirSync(path.resolve(that.resource, name));
      for(var i in children) {
        var childName = path.resolve(name, children[i]);
        var stats = fs.statSync(path.resolve(that.resource, childName));
        if(stats.isDirectory())
          scanDir(childName);
        else
          that.contents[childName] = undefined;
      }
    }
    
    /* init contents */
    scanDir('');
  }

  /* public instance methods */
  DirectoryWidgetResource.prototype.contains = function(name) {
    return (name in contents);
  };

  DirectoryWidgetResource.prototype.list = function() {
    return contents;
  };

  DirectoryWidgetResource.prototype.readFileSync = function(name) {
    var result = undefined;
    if(name in contents)
      result = fs.readFileSync(path.resolve(resource, name));
    return result;
  };

  DirectoryWidgetResource.prototype.readFile = function(name, callback) {
    var result = undefined;
    if(name in contents)
      result = fs.readFile(path.resolve(resource, name), callback);
    return result;
  };

  DirectoryWidgetResource.prototype.dispose = function() {};

  return DirectoryWidgetResource;
})();
