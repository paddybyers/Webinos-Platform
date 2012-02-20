this.ProcessingResult = (function() {
  
  /* public constructor */
  function ProcessingResult() {
    this.status = WidgetConfig.STATUS_OK;
    this.error = undefined;
    this.warnings = undefined;
    this.comparisonResult = undefined;
    this.validationResult = undefined;
    this.widgetConfig = undefined;
    this.localisedFileMapping = undefined;
  }

  /* public instance methods */
  ProcessingResult.prototype.getInstallId = function() { return this.widgetConfig.installId; };

  ProcessingResult.prototype.setStatus = function(status) {
  if(this.status == WidgetConfig.STATUS_OK)
    this.status = status;
  };

  ProcessingResult.prototype.setError = function(error) {
    Logger.logAction(Logger.LOG_ERROR, error.reason, error.getStatusText());
    this.error = error;
    this.status = error.status;
  };

  ProcessingResult.prototype.setInvalid = function(msg) {
    this.setError(new Artifact(WidgetConfig.STATUS_INVALID, Artifact.CODE_MALFORMED, msg, undefined));
  };
	  
  ProcessingResult.prototype.setWarning = function(warning) {
    if(!this.warnings) this.warnings = [];
    this.warnings.push(warning);
  };

  return ProcessingResult;
})();
