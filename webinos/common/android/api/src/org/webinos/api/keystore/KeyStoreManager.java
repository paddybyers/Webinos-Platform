package org.webinos.api.keystore;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.java.Base;
import org.webinos.api.ErrorCallback;
import org.webinos.api.SuccessCallback;

public abstract class KeyStoreManager extends Base {
	private static short classId = Env.getInterfaceId(KeyStoreManager.class);
	protected KeyStoreManager() { super(classId); }

	public abstract void get(KeyStoreSuccessCallback successCallback, ErrorCallback errorCallback, String key);
	public abstract void delete(SuccessCallback successCallback, ErrorCallback errorCallback, String key);
	public abstract void put(SuccessCallback successCallback, ErrorCallback errorCallback, String key, String value);
}
