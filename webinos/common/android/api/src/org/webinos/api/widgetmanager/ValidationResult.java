package org.webinos.api.widgetmanager;

import org.meshpoint.anode.idl.Dictionary;

public class ValidationResult implements Dictionary {
	public int status;
	public Signature authorSignature;
	public Signature[] distributorSignatures;
}
