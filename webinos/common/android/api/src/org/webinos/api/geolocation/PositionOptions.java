package org.webinos.api.geolocation;

import org.meshpoint.anode.idl.ValueType;

public class PositionOptions implements ValueType {
	public Boolean enableHighAccuracy;
	public Long timeout;
	public Long maximumAge;
}
