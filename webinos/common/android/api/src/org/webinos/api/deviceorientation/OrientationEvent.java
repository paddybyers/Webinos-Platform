package org.webinos.api.deviceorientation;

import org.meshpoint.anode.idl.ValueType;

public class OrientationEvent implements ValueType {
	public Double alpha;
	public Double beta;
	public Double gamma;
	public boolean absolute;
}
