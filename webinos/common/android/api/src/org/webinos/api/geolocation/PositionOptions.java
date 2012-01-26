package org.webinos.api.geolocation;

import org.meshpoint.anode.idl.Dictionary;

public class PositionOptions implements Dictionary {
	public Boolean enableHighAccuracy;
	public Long timeout;
	public Long maximumAge;
}
