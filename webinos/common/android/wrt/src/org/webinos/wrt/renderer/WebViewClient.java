package org.webinos.wrt.renderer;

import java.io.IOException;

import org.webinos.wrt.channel.ClientSocket;
import org.webinos.wrt.core.WrtManager;
import org.webinos.wrt.ui.RendererActivity;
import org.webinos.wrt.util.AssetUtils;

import android.graphics.Bitmap;
import android.util.Log;

public class WebViewClient extends android.webkit.WebViewClient {
	
	@SuppressWarnings("unused")
	private RendererActivity activity;

	private static final String TAG = "org.webinos.wrt.renderer.WebViewClient";
	
	public WebViewClient(RendererActivity activity) {
		this.activity = activity;
	}

	@Override
	public void onPageStarted(android.webkit.WebView webView, String url, Bitmap favicon) {
		WebView wgtView = (WebView)webView;
		try {
			wgtView.injectScript(AssetUtils.getAssetAsString(WrtManager.getInstance(), ClientSocket.SOCKETJS_ASSET));
			wgtView.injectScript(AssetUtils.getAssetAsString(WrtManager.getInstance(), ClientSocket.WEBINOSJS_ASSET));
		} catch(IOException ioe) {
			Log.v(TAG, "Unable to inject scripts; exception: ", ioe);
		}
	}

	@Override
	public void onPageFinished(android.webkit.WebView webView, String url) {
	}
}
