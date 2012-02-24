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

	public static void init(Context ctx) {
		if(!initialised) {
			Config.init(ctx);
			AssetManager mgr = ctx.getAssets();
			try {
				String[] modules = mgr.list(MODULE_PATH);
				if (modules != null) {
					for(String module : modules) {
						Log.v(TAG, "Checking module: " + module);
						checkModule(ctx, module);
					}
				}
			} catch (IOException e) {
				Log.v(TAG, "Unable to get assets in " + MODULE_PATH);
			}
			initialised = true;
		}
	}
	
	private static void checkModule(Context ctx, String asset) {
		ModuleType modType = ModuleUtils.guessModuleType(asset);
		String module = ModuleUtils.guessModuleName(asset, modType);
		File installLocation = ModuleUtils.getModuleFile(module, modType);
		if(installLocation.exists()) {
			Log.v(TAG, "Module already installed, ignoring: " + module);
			return;
		}
		Log.v(TAG, "Module not installed, installing from package: " + module);
		ModuleUtils.install(ctx, module, AssetUtils.ASSET_URI + MODULE_PATH + '/' + asset);
	}
}
