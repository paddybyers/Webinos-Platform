package org.webinos.api.deviceorientation;

import org.meshpoint.anode.idl.ValueType;

public class MotionEvent implements ValueType {
	public Acceleration acceleration;
	public Acceleration accelerationIncludingGravity;
	public RotationRate rotationRate;
	public Double interval;
}
