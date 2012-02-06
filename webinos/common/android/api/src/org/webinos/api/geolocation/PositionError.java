package org.webinos.api.geolocation;

import org.meshpoint.anode.idl.Dictionary;

public class PositionError implements Dictionary {
	public static final int UNKNOWN_ERROR = 0;
	public static final int PERMISSION_DENIED = 1;
	public static final int POSITION_UNAVAILABLE = 2;
	public static final int TIMEOUT = 3;

	public int code;
	public String message;
}
