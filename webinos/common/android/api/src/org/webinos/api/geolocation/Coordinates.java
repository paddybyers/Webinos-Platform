package org.webinos.api.geolocation;

import org.meshpoint.anode.idl.ValueType;

public class Coordinates implements ValueType {
	public double latitude;
	public double longitude;
	public Double altitude;
	public Double accuracy;
	public Double altitudeAccuracy;
	public double heading;
	public Double speed;
}
