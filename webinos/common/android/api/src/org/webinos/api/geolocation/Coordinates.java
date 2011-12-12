package org.webinos.api.geolocation;

import org.meshpoint.anode.idl.Dictionary;

public class Coordinates implements Dictionary {
	public double latitude;
	public double longitude;
	public Double altitude;
	public Double accuracy;
	public Double altitudeAccuracy;
	public double heading;
	public Double speed;
}
