this.ZipWidgetResource = (function() {
  var zipfile = require('zipfile');

  /* public constructor */
  function ZipWidgetResource(path) {

    /* public instance variables */
    this.resource = path;
    this.zipfile = new zipfile.ZipFile(path);
    this.contents = {};
    for(var i in this.zipfile.names) this.contents[this.zipfile.names[i]] = undefined;
  }

  /* public instance methods */
  ZipWidgetResource.prototype.contains = function(name) {
    return (name in this.contents);
  };

  ZipWidgetResource.prototype.list = function() {
    return this.contents;
  };

  ZipWidgetResource.prototype.readFileSync = function(name) {
    var result;
    if(name in this.contents)
      result = this.zipfile.readFileSync(name);
    return result;
  };

  ZipWidgetResource.prototype.readFile = function(name, callback) {
    var result;
    if(name in this.contents)
      result = this.zipfile.readFile(name, callback);
    return result;
  };

  ZipWidgetResource.prototype.getResource = function() {
    return this.resource;
  };

  ZipWidgetResource.prototype.dispose = function() {
    this.zipfile.destroy();
  };

  return ZipWidgetResource;
})();
