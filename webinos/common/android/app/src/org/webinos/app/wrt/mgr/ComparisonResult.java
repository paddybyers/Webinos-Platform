package org.webinos.app.wrt.mgr;

import org.meshpoint.anode.idl.Dictionary;

public class ComparisonResult implements Dictionary {
	public WidgetConfig existingConfig;
	public ValidationResult existingValidationResult;
	public boolean existingHasUserdata;
	public ProcessingResult replacement;
}
