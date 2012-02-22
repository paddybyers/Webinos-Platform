this.FeatureSupport = (function() {

  /* private static variables */
  var W3C_TEST_FEATURE = "feature:a9bb79c1";
  
  var knownFeatures = {
    'http://api.webinos.org/contacts': {
      'http://api.webinos.org/contacts.read': undefined,
      'http://api.webinos.org/contacts.write': undefined
    }
  };

  /* public constructor */
  function FeatureSupport() {}

  /* public static functions */
  FeatureSupport.isSupported = function(feature) {
    if(Config.get().w3cTestMode && feature == W3C_TEST_FEATURE)
      return {W3C_TEST_FEATURE: undefined};
    
    if(feature in knownFeatures)
      return knownFeatures[feature];

    /*
     * if the feature is http://<host>/path.with.dot.separator then
     * see if there is a match with "super features"
     */
    var url = require('url').parse(feature);
    var idx;
    var stem = url.protocol + '//' + url.host;
    if(url && (feature == (stem + url.pathname))) {
      var path = url.pathname;
      while((idx = path.lastIndexOf('.')) != -1) {
        path = path.substring(0, idx);
        var superFeature = stem + path;
        if((superFeature in knownFeatures) && (feature in knownFeatures[superFeature]))
          return {feature: undefined};
      } 
    }
    return {};
  };

  return FeatureSupport;
})();
