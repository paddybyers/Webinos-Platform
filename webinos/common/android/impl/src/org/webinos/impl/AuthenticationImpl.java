package org.webinos.impl;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.idl.IDLInterface;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.meshpoint.anode.type.IValue;
import org.webinos.api.authentication.AuthError;
import org.webinos.api.authentication.AuthErrorCB;
import org.webinos.api.authentication.AuthStatus;
import org.webinos.api.authentication.AuthSuccessCB;
import org.webinos.api.authentication.AuthenticationManager;

import android.content.Context;

public class AuthenticationImpl extends AuthenticationManager implements IModule {
	
	private Context androidContext;
	
	AuthenticationImpl(IDLInterface iface) {
		super(iface);
	}

	/*****************************
	 * WebinosAuthentication methods
	 *****************************/
	@Override
	public void authenticate(AuthSuccessCB successCB, AuthErrorCB errorCB) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public boolean isAuthenticated() throws AuthError {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public AuthStatus getAuthenticationStatus() throws AuthError {
		// TODO Auto-generated method stub
		return null;
	}

	/*****************************
	 * IModule methods
	 *****************************/
	@Override
	public IValue startModule(IModuleContext ctx) {
		androidContext = ((AndroidContext)ctx).getAndroidContext();
		return null;
	}

	@Override
	public void stopModule() {
		// TODO Auto-generated method stub
		
	}
}
