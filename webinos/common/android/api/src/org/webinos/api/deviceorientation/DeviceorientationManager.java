package org.webinos.api.deviceorientation;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.java.Base;

public abstract class DeviceorientationManager extends Base {
	private static IDLInterface iface = Env.getCurrent().getInterfaceManager().getByName(DeviceorientationManager.class.getName());
	protected DeviceorientationManager() { super(iface); }

	public abstract void watchOrientation(OrientationCB orientationCb);
	public abstract void watchMotion(MotionCB motionCb);
	public abstract void unwatchOrientation();
	public abstract void unwatchMotion();
}
