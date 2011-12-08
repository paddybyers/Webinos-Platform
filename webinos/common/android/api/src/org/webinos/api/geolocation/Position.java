package org.webinos.api.geolocation;

import org.meshpoint.anode.idl.ValueType;

public class Position implements ValueType {
	public long timestamp;
	public Coordinates coords;
}
