package org.webinos.api.deviceorientation;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;

public abstract class DeviceorientationManager extends Base {
	private static short classId = Env.getInterfaceId(DeviceorientationManager.class);
	protected DeviceorientationManager() { super(classId); }

	public abstract void watchOrientation(OrientationCB orientationCb);
	public abstract void watchMotion(MotionCB motionCb);
	public abstract void unwatchOrientation();
	public abstract void unwatchMotion();
}
