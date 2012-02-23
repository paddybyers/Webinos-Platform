package org.webinos.wrt.renderer;

import android.app.AlertDialog;
import android.util.Log;
import android.webkit.JsResult;
import android.webkit.WebView;

public class WebChromeClient extends android.webkit.WebChromeClient{

	private static final String TAG = "org.webinos.wrt.renderer.WebChromeClient";

	@Override
    public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
        Log.d(TAG, message);
        new AlertDialog.Builder(view.getContext()).setMessage(message).setCancelable(true).show();
        result.confirm();
        return true;
    }

}
