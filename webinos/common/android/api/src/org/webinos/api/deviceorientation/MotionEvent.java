package org.webinos.api.deviceorientation;

import org.meshpoint.anode.idl.Dictionary;

public class MotionEvent implements Dictionary {
	public Acceleration acceleration;
	public Acceleration accelerationIncludingGravity;
	public RotationRate rotationRate;
	public Double interval;
}
