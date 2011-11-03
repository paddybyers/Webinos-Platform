Ext.define('WebDemo.TVRemote', {
    extend: 'Ext.ux.desktop.Module',
    id: 'win-tv-remote',

    init: function () {
        this.launcher = {
            text: 'TV Remote',
            iconCls: 'tv-remote-small',
            handler: this.createWindow,
            scope: this
        };
    },

    createWindow: function () {
        var desktop = this.app.getDesktop();
        var win = desktop.getWindow(this.id);
        if (!win) {
            win = desktop.createWindow({
                id: this.id,
                title: this.launcher.text,
                iconCls: this.launcher.iconCls,
                xtype: 'window',
		height: 536,
		width: 220,
		layout: {
		    type: 'fit'
		},
		dockedItems: [
		    {
			xtype: 'toolbar',
			dock: 'top',
			items: [
			    {
				xtype: 'button',
				text: 'Open TV',
				handler: Abot.TV.openTV
			    },
			    {
				xtype: 'tbfill'
			    },
			    {
				xtype: 'button',
				text: 'Discover Channels',
				handler: Abot.TV.getTVSources
			    }
			]
		    },
		     {
			xtype: 'toolbar',
			dock: 'bottom',
			items: [
			    {
				xtype: 'button',
				text: 'Register channel change event',
				handler: Abot.TV.addEventListener
			    }
			]
		    }
		],
		items: [
		    {
			xtype: 'panel',
			id: 'pnlAvailableChannels',
			layout: {
			    type: 'hbox'
			},
			height: 300,
			autoScroll: true,
			title: 'Available Channels'
		    }
		]
            });
        }
        win.show();
        return win;
    }
});
