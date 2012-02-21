this.AccessRequest = (function() {
	var url = require('url');
	var util = require('util');

	/* public constructor */
	function AccessRequest(scheme, host, port) {
		Origin.call(this, scheme, host, port);
		this.subdomains = false;
	}
	util.inherits(AccessRequest, Origin);

	/* public static functions */
	AccessRequest.create = function(urlString) {
		var urlOb = url.parse(urlString);
		if(urlOb.path || urlOb.auth || urlOb.search || urlOb.query || urlOb.hash)
			return;
		if(!urlOb.host || !urlOb.protocol)
			return;
		var scheme = Origin.isSupported(urlOb.protocol);
		if(!scheme)
			return;
		return new AccessRequest(scheme, urlOb.host, parseInt(urlOb.port));
	};

	AccessRequest.createWildcard = function() {
		return new AccessRequest(undefined, '*');
	};

	AccessRequest.serialize = ManagerUtils.prototypicalClone(Origin.serialize, {subdomains: 'boolean'});

	return AccessRequest;
})();
