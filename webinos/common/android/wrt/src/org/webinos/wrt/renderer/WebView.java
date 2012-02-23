package org.webinos.wrt.renderer;

import android.content.Context;
import android.util.AttributeSet;
import android.util.Log;

public class WebView extends android.webkit.WebView {

	public WebView(Context context, AttributeSet as) {
		super(context, as);
		getSettings().setJavaScriptEnabled(true);
	}

    public void injectScript(String script) {
    	try {
    		loadUrl("javascript:(function(){var s=document.createElement('script');s.text=" + script + ";var target = document.head || document; target.appendChild(s);})()");
    	} catch(Throwable t) {
    		Log.v("org.webinos.wrt.renderer.WebView", "Error in injecting script", t);
    	}
    }
    
    public void callScript(final String script) {
    	try {
    		getHandler().post(new Runnable() {public void run() {loadUrl("javascript:(function(){" + script + "})()");}});
    	} catch(Throwable t) {
    		Log.v("org.webinos.wrt.renderer.WebView", "Error in JavaScript callback", t);
    	}
    }
}
