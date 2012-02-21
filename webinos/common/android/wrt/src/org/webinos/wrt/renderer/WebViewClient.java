package org.webinos.wrt.renderer;

import org.webinos.wrt.ui.RendererActivity;

import android.graphics.Bitmap;
import android.webkit.WebView;

public class WebViewClient extends android.webkit.WebViewClient {
	
	private RendererActivity activity;
	
	public WebViewClient(RendererActivity activity) {
		this.activity = activity;
	}

	public void onPageStarted(WebView webview, String url, Bitmap favicon) {
	}

	public void onPageFinished(WebView webview, String url) {
		String title = webview.getTitle();
		if(title != null && !title.isEmpty())
			activity.setTitle(title);
	}
}
