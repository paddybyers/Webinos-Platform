package org.webinos.api.mediacapture;

import org.meshpoint.anode.idl.ValueType;

public class CaptureError implements ValueType {
	public static final int CAPTURE_INTERNAL_ERR = 0;
	public static final int CAPTURE_APPLICATION_BUSY = 1;
	public static final int CAPTURE_INVALID_ARGUMENT = 2;
	public static final int CAPTURE_NO_MEDIA_FILES = 3;

	public int code;
}
