package org.webinos.impl;

import org.meshpoint.anode.AndroidContext;
import org.meshpoint.anode.module.IModule;
import org.meshpoint.anode.module.IModuleContext;
import org.webinos.api.authentication.AuthError;
import org.webinos.api.authentication.AuthErrorCB;
import org.webinos.api.authentication.AuthStatus;
import org.webinos.api.authentication.AuthSuccessCB;
import org.webinos.api.authentication.AuthenticationManager;

import android.content.Context;

public class AuthenticationImpl extends AuthenticationManager implements IModule {
	
	private Context androidContext;
	
	/*****************************
	 * AuthenticationManager methods
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
	public Object startModule(IModuleContext ctx) {
		androidContext = ((AndroidContext)ctx).getAndroidContext();
		/*
		 * perform any module initialisation here ...
		 */
		return this;
	}

	@Override
	public void stopModule() {
		/*
		 * perform any module shutdown here ...
		 */
	}
}
