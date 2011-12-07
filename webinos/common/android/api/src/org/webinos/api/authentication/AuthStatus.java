package org.webinos.api.authentication;

import org.meshpoint.anode.idl.ValueType;

public class AuthStatus implements ValueType {
	public String lastAuthTime;
	public String authMethod;
	public String authMethodDetails;
}
