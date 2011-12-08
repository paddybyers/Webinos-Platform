package org.webinos.api.devicestatus;

import org.meshpoint.anode.idl.ValueType;

public class WatchOptions implements ValueType {
	public Integer minNotificationInterval;
	public Integer maxNotificationInterval;
	public Integer minChangePercent;
}
