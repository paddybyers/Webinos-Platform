package org.webinos.api.discovery;

import org.meshpoint.anode.idl.Dictionary;

@SuppressWarnings("serial")
//public class DiscoveryError extends Exception implements Dictionary {
public class DiscoveryError extends RuntimeException implements Dictionary {
	public static final int INVALID_ARGUMENT_ERROR = 101;
    public static final int FIND_SERVICE_CANCELED = 101;
    public static final int FIND_SERVICE_TIMEOUT = 102;
    public static final int PERMISSION_DENIED_ERROR  = 103;
    public int code; 
    public String message;
}