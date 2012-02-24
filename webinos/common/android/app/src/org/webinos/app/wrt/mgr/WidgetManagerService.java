package org.webinos.app.wrt.mgr;

import java.util.ArrayList;

import org.meshpoint.anode.bridge.Env;
import org.webinos.app.anode.AnodeReceiver;
import org.webinos.app.anode.AnodeService;
import org.webinos.app.platform.PlatformInit;
import org.webinos.util.AssetUtils;
import org.webinos.util.Constants;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class WidgetManagerService {
    private static ArrayList<LaunchListener> listeners = new ArrayList<LaunchListener>();
	private static WidgetManagerImpl theManager;

    private static final String TAG = "org.webinos.app.wrt.mgr.WidgetManagerService";
	
	public static WidgetManagerImpl getInstance() {
		return theManager;
	}
	
	private static void startInstance(Context ctx) {
		try {
			PlatformInit.init(ctx);
			String launchScript = Constants.RESOURCE_DIR + "/widgetmanager.js";
			AssetUtils.writeAssetToFile(ctx,"js/widgetmanager.js", launchScript);
			Intent intent = new Intent(ctx, AnodeService.class);
			Log.v(TAG, launchScript);
			intent.setAction(AnodeReceiver.ACTION_START);
			intent.putExtra(AnodeReceiver.CMD, launchScript);
			ctx.startService(intent);
		} catch(Throwable t) {
			Env.logger.e(TAG, "Unable to start widgetmanager", t);
		}
	}

	public static WidgetManagerImpl getInstance(Context ctx, LaunchListener listener) {
		WidgetManagerImpl result = null;
		synchronized(listeners) {
			if(theManager != null) {
				result = theManager;
			} else if(listener != null) {
				listeners.add(listener);
				startInstance(ctx);
			}
		}
		return result;
	}
	
	static void onStarted(WidgetManagerImpl mgr) {
		theManager = mgr;
        synchronized(listeners) {
        	for(LaunchListener listener : listeners) {
        		listener.onLaunch(mgr);
        		listeners.remove(listener);
        	}
        }
	}

	public interface LaunchListener {
		public void onLaunch(WidgetManagerImpl mgr);
	}

}
