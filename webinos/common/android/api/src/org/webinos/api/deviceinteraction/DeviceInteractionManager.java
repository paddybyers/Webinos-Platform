package org.webinos.api.deviceinteraction;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.java.Base;
import org.webinos.api.DeviceAPIError;
import org.webinos.api.ErrorCallback;
import org.webinos.api.PendingOperation;
import org.webinos.api.SuccessCallback;

public abstract class DeviceInteractionManager extends Base {
	private static IDLInterface iface = Env.getCurrent().getInterfaceManager().getByClass(DeviceInteractionManager.class);
	protected DeviceInteractionManager() { super(iface); }

	public abstract PendingOperation startNotify(SuccessCallback successCallback, ErrorCallback errorCallback, int duration) throws DeviceAPIError;
	public abstract void stopNotify();
	public abstract PendingOperation startVibrate(SuccessCallback successCallback, ErrorCallback errorCallback, Integer duration) throws DeviceAPIError;
	public abstract void stopVibrate();
	public abstract PendingOperation lightOn(SuccessCallback successCallback, ErrorCallback errorCallback, int duration) throws DeviceAPIError;
	public abstract void lightOff();
	public abstract PendingOperation setWallpaper(SuccessCallback successCallback, ErrorCallback errorCallback, String fileName) throws DeviceAPIError;

}
