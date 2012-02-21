this.Signature = (function() {

	/* public constructor */
	function Signature(name, signatureId, certificatePath) {
		if(!arguments.length) {
			/* we were called with no arguments; probably because
			 * we're being instantiated by deserialising persistent
			 * data. So it's ok and the properties will be set for us */
			return;
		}

		this.name = name;
		this.signatureId = signatureId;
		this.certificatePath = certificatePath;
		this.key = certificatePath[0];
		this.root = certificatePath[certificatePath.length - 1];
	}

	Signature.serialize = {
		name            : 'string',
		signatureId     : 'string',
		certificatePath : [Certificate],
		key             : Certificate,
		root            : Certificate
	};

	return Signature;
})();
