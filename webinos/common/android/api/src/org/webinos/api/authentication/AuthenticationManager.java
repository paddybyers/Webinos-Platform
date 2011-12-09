package org.webinos.api.authentication;

import org.meshpoint.anode.bridge.Env;
import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.java.Base;

public abstract class AuthenticationManager extends Base {
	private static IDLInterface iface = Env.getCurrent().getInterfaceManager().getByClass(AuthenticationManager.class);
	protected AuthenticationManager() { super(iface); }

	public abstract void authenticate(AuthSuccessCB successCB, AuthErrorCB errorCB);
	public abstract boolean isAuthenticated() throws AuthError;
	public abstract AuthStatus getAuthenticationStatus() throws AuthError;
}
