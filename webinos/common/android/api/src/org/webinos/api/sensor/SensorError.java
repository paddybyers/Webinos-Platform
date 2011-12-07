package org.webinos.api.sensor;

import org.meshpoint.anode.idl.ValueType;

@SuppressWarnings("serial")
public class SensorError extends Exception implements ValueType {
	public static final int INVALID_INPUT_ARGUMENT = 0;
	public static final int UNKNOWN_ERROR = 0;
    public static final int TIMEOUT_ERROR = 1;
    public static final int ILLEGAL_SENSOR_TYPE_ERROR = 2;
    public static final int SENSOR_TYPE_NOT_SUPPORTED_ERROR = 3;
    public static final int ILLEGAL_SENSOR_ID_ERROR = 4;
    public static final int OTHER_ILLEGAL_INPUT_ARGUMENT_ERROR = 5;
    public static final int REQUESTED_RATE_NOT_SUPPORTED_ERROR = 6;
    public static final int REQUESTED_INTERRUPTMODE_NOT_SUPPORTED_ERROR = 7;
    public static final int PERMISSION_DENIED_ERROR = 50;
    public int code;
}
