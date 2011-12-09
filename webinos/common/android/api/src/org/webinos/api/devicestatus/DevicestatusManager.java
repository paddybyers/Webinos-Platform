package org.webinos.api.devicestatus;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.java.Base;
import org.webinos.api.DeviceAPIError;
import org.webinos.api.ErrorCallback;
import org.webinos.api.PendingOperation;

public abstract class DevicestatusManager extends Base {
	private static IDLInterface iface = Env.getCurrent().getInterfaceManager().getByClass(DevicestatusManager.class);
	protected DevicestatusManager() { super(iface); }

	public abstract String[] getComponents(String aspect) throws DeviceAPIError;
	public abstract boolean isSupported(String aspect, String property) throws DeviceAPIError;
	public abstract PendingOperation getPropertyValue(PropertyValueSuccessCallback successCallback, ErrorCallback errorCallback, PropertyRef prop) throws DeviceAPIError;
	public abstract int watchPropertyChange(PropertyValueSuccessCallback successCallback, ErrorCallback errorCallback, PropertyRef prop, WatchOptions options) throws DeviceAPIError;
	public abstract void clearPropertyChange(int watchHandler) throws DeviceAPIError;
}
