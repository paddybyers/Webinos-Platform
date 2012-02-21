this.Origin = (function() {

  /* public constructor */
  function Origin(scheme, host, port) {
    this.scheme = scheme;
    this.host = host;
    if(!port) port = (scheme == 'http') ? 80 : 443;
    this.port = port;
  }

  /* public static methods */
  Origin.isSupported = function(scheme) {
	var result;
    if(scheme.charAt(scheme.length-1) == ':')
      scheme = scheme.substring(0, scheme.length - 2);
    if(scheme == 'HTTP' || scheme == 'http')
      result = 'http';
    else if(scheme == 'HTTPS' || scheme == 'https')
      result = 'https';
    return result;
  };

  /* public instance methods */
  Origin.prototype.toUriString = function() {
    if(scheme === undefined)
	  return 'unknown:';
	var result = scheme  + '://' + host;
	if("*" != host)
	  result += ':' + port;
	return result;
  };
  
  Origin.serialize = {
	scheme: 'string',
	host: 'string',
	port: 'number'
  };

  return Origin;
})();
