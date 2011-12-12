package org.webinos.api.deviceorientation;

import org.meshpoint.anode.idl.Dictionary;

public class OrientationEvent implements Dictionary {
	public double alpha;
	public double beta;
	public double gamma;
	public boolean absolute;
}
