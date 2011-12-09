package org.webinos.api.keystore;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.java.Base;
import org.webinos.api.ErrorCallback;
import org.webinos.api.SuccessCallback;

public abstract class KeyStoreManager extends Base {
	private static IDLInterface iface = Env.getCurrent().getInterfaceManager().getByClass(KeyStoreManager.class);
	protected KeyStoreManager() { super(iface); }

	public abstract void get(KeyStoreSuccessCallback successCallback, ErrorCallback errorCallback, String key);
	public abstract void delete(SuccessCallback successCallback, ErrorCallback errorCallback, String key);
	public abstract void put(SuccessCallback successCallback, ErrorCallback errorCallback, String key, String value);
}
