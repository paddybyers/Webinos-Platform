(function() {
  var storage = new WidgetStorage(Config.get().wrtHome);
  return new WidgetManager(storage);
})();
