this.ValidationResult = (function() {

  /* public constructor */
  function ValidationResult(status, authorSignature, distributorSignatures, artifact) {
    this.status = status;
    if(authorSignature)
    	this.authorSignature = authorSignature;
    if(distributorSignatures)
    	this.distributorSignatures = distributorSignatures;
    if(artifact)
    	this.errorArtifact = artifact;
  }
  
  ValidationResult.serialize = {
	status     : 'number',
	authorSignature : Signature,
	distributorSignatures : [Signature]
  };

  return ValidationResult;
})();
