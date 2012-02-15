package org.webinos.wrt.ui;

import org.webinos.wrt.R;
import org.webinos.wrt.channel.ClientSocket;
import org.webinos.wrt.core.WidgetConfig;
import org.webinos.wrt.core.WrtManager;
import org.webinos.wrt.core.WrtReceiver;
import org.webinos.wrt.renderer.WebView;
import org.webinos.wrt.renderer.WebViewClient;

import android.app.Activity;
import android.os.Bundle;

public class RendererActivity extends Activity implements WrtManager.LaunchListener {
	
	private static int nextId = 0;

	private WebView webView;
	private String installId;
	public String instanceId;
	private ClientSocket socket;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.main);

		WrtManager wrtManager = WrtManager.getInstance(this, this);
		if(wrtManager != null)
			initRenderer();
	}

	public void onLaunch(WrtManager service) {
		initRenderer();
	}

	private void initRenderer() {
		String id = getIntent().getStringExtra(WrtReceiver.ID);
		if(id == null || id.isEmpty())
			throw new IllegalArgumentException("WrtActivity.onCreate(): missing installId");

		installId = id;
		WidgetConfig widgetConfig = WrtManager.getInstance().getWidgetConfig(installId);
		if(widgetConfig == null)
			throw new RuntimeException("WrtActivity.onCreate(): unable to get widget config");

		String inst = getIntent().getStringExtra(WrtReceiver.INST);
		if(inst == null || inst.isEmpty()) {
			synchronized(RendererActivity.class) {
				inst = String.valueOf(nextId++);
			}
		}
		instanceId = inst;

		webView = (WebView) findViewById(R.id.webview);
		webView.setWebViewClient(new WebViewClient(this));
        webView.addJavascriptInterface(socket = new ClientSocket(webView, widgetConfig, instanceId), "__webinos");
		webView.loadUrl(widgetConfig.getStartUrl());		

		WrtManager.getInstance().put(instanceId, this);
	}

	@Override
	public void onDestroy() {
		if(socket != null)
			socket.dispose();
		super.onDestroy();
	}

}