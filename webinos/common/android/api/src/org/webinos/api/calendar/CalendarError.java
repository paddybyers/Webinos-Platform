package org.webinos.api.calendar;

import org.meshpoint.anode.idl.Dictionary;

public class CalendarError implements Dictionary {
	public static final int UNKNOWN_ERROR = 0;
	public static final int INVALID_ARGUMENT_ERROR = 1;
	public static final int TIMEOUT_ERROR = 2;
	public static final int PENDING_OPERATION_ERROR = 3;
	public static final int IO_ERROR = 4;
	public static final int NOT_SUPPORTED_ERROR = 5;
	public static final int PERMISSION_DENIED_ERROR = 20;

    public int code;
}
