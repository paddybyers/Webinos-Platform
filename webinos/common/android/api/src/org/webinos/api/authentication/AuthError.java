package org.webinos.api.authentication;

import org.meshpoint.anode.idl.ValueType;

@SuppressWarnings("serial")
public class AuthError extends Exception implements ValueType {
	public static final int UNKNOWN_ERROR           = 0;
	public static final int INVALID_ARGUMENT_ERROR  = 1;
	public static final int PERMISSION_DENIED_ERROR = 20;
	public static final int TIMEOUT_ERROR           = 2;
	public int code;
}
