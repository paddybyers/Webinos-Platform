/*******************************************************************************
*  Code contributed to the webinos project
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* Copyright 2011-2012 Paddy Byers
*
******************************************************************************/

package org.webinos.app.platform;

import java.io.File;
import java.io.IOException;

import org.webinos.util.AssetUtils;
import org.webinos.util.ModuleUtils;
import org.webinos.util.ModuleUtils.ModuleType;

import android.content.Context;
import android.content.res.AssetManager;
import android.util.Log;

public class PlatformInit {
	private static final String TAG = "org.webinos.app.platform.PlatformInit";
	private static final String MODULE_PATH = "modules";
	private static boolean initialised;

	private static void initConfig(Context ctx) {
		if(!initialised) {
			Config.init(ctx);
			initialised = true;
		}
	}

	/**
	 * Install all module dependencies located in assets/modules
	 * @param ctx the service context
	 * @param force force update, even if module is already present
	 */
	public static void installModuleDependencies(Context ctx, boolean force) {
		boolean installNeeded = force || !initialised;
		initConfig(ctx);
		if(installNeeded) {
			AssetManager mgr = ctx.getAssets();
			try {
				String[] modules = mgr.list(MODULE_PATH);
				if (modules != null) {
					for(String module : modules) {
						Log.v(TAG, "Checking module: " + module);
						checkModule(ctx, module, force);
					}
				}
			} catch (IOException e) {
				Log.v(TAG, "Unable to get assets in " + MODULE_PATH);
			}
			initialised = true;
		}
	}
	
	private static void checkModule(Context ctx, String asset, boolean force) {
		ModuleType modType = ModuleUtils.guessModuleType(asset);
		String module = ModuleUtils.guessModuleName(asset, modType);
		File installLocation = ModuleUtils.getModuleFile(module, modType);
		if(installLocation.exists()) {
			if(force) {
				Log.v(TAG, "Module already installed, removing: " + module);
				ModuleUtils.uninstall(module);
			} else {
				Log.v(TAG, "Module already installed, ignoring: " + module);
				return;
			}
		}
		Log.v(TAG, "Installing module from package: " + module);
		ModuleUtils.install(ctx, module, AssetUtils.ASSET_URI + MODULE_PATH + '/' + asset);
	}
}
