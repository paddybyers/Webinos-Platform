this.CacheMap = (function() {

  /* public constructor */
  function CacheMap(args) {
  }

  /* public instance methods */
  CacheMap.prototype.put = function(key, value) {
    this[key] = value;
    value.__cachemap_put = (new Date()).getTime();
  };

  CacheMap.prototype.get = function(key) {
    var value = this[key];
    if(value)
      value.__cachemap_get = (new Date()).getTime();
  };

  CacheMap.prototype.remove = function(key) {
    delete this[key];
  };
  
  /* FIXME: implement some kind of LRU pruning */

  return CacheMap;
})();
