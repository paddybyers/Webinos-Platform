package org.webinos.api.geolocation;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.java.Base;

public abstract class GeolocationManager extends Base {
	private static IDLInterface iface = Env.getCurrent().getInterfaceManager().getByName(GeolocationManager.class.getName());
	protected GeolocationManager() { super(iface); }

	public abstract void getCurrentPosition(PositionCallback successCallback, PositionErrorCallback errorCallback, PositionOptions options);
	public abstract long watchPosition(PositionCallback successCallback, PositionErrorCallback errorCallback, PositionOptions options);
	public abstract void clearWatch(long id);
}
