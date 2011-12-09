package org.webinos.api.deviceorientation;

import org.meshpoint.anode.idl.ValueType;

public class OrientationEvent implements ValueType {
	public double alpha;
	public double beta;
	public double gamma;
	public boolean absolute;
}
