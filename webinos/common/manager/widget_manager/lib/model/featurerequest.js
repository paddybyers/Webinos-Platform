this.FeatureRequest = (function() {

  /* public constructor */
  function FeatureRequest(name, required) {
    /* public instance variables */
	required = required || false;
    this.name = name;
	this.required = required;
	this.params = [];
  }
  
  FeatureRequest.serialize = {
	name: 'string',
	required: 'boolean',
	params: [ Param ]
  };

  return FeatureRequest;
})();
