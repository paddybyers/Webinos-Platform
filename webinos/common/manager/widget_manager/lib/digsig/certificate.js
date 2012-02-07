this.Certificate = (function() {

	/* public constructor */
	function Certificate(args) {}

	/* public static functions */
	Certificate.serialize = {
		subject     : 'string',
		fingerprint : 'string'
	};

	return Certificate;
})();
