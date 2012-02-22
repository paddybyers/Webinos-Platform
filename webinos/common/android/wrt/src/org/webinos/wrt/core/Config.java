package org.webinos.wrt.core;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import android.content.Context;
import android.util.Log;

public class Config extends Properties {
	private static final long serialVersionUID = -2472291382301419405L;
	private static Config theConfig;
	private static final String CONFIG_FILE = "config/wrt.properties";
	private static final String TAG = "org.webinos.wrt.core.Config";

	static void init(Context ctx) {
		theConfig = new Config(ctx);
	}

	public static Config getInstance() {
		return theConfig;
	}
	
	private Config(Context ctx) {
		InputStream is = null;
		try {
			Log.v(TAG, "Attempting to load config file from assets");
			load(is = ctx.getAssets().open(CONFIG_FILE));
		} catch(IOException e) {
			Log.v(TAG, "Attempting to load config file from filesystem");
			try {
				is.close();
				String resourcePath = "/data/data/" + this.getClass().getPackage().getName();
				load(is = new FileInputStream(resourcePath + '/' + CONFIG_FILE));
			} catch(IOException ioe) {
				Log.v(TAG, "Unable to load config file", e);
			}
		} finally {
			if(is != null)
				try { is.close(); } catch (IOException e) {}
		}
	}
}
