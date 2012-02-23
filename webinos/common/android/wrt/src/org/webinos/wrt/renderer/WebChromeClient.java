package org.webinos.wrt.renderer;

import org.webinos.wrt.ui.RendererActivity;

import android.app.AlertDialog;
import android.util.Log;
import android.webkit.JsResult;
import android.webkit.WebView;

public class WebChromeClient extends android.webkit.WebChromeClient{

	private RendererActivity activity;

	private static final String TAG = "org.webinos.wrt.renderer.WebChromeClient";

	public WebChromeClient(RendererActivity activity) {
		this.activity = activity;
	}

	@Override
    public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
        Log.d(TAG, message);
        new AlertDialog.Builder(view.getContext()).setMessage(message).setCancelable(true).show();
        result.confirm();
        return true;
    }
	
	@Override
	public void onReceivedTitle(WebView webView, String title) {
		if(title != null && !title.isEmpty())
			activity.setTitle(title);
	}

}
