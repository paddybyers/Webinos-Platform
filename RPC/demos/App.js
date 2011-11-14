Ext.define('WebDemo.App', {
    extend: 'Ext.ux.desktop.App',

    init: function() {
        // custom logic before getXYZ methods get called...

        this.callParent();

        // now ready...
    },

    getModules : function(){
        return [
	    new WebDemo.ServicesWindow(),
            new WebDemo.LogsStore(),
            new WebDemo.LogsWindow(),
	    new WebDemo.ContextStore(),
            new WebDemo.ContextWindow(),
	    new WebDemo.ContactsStore(),
	    new WebDemo.ContactsWindow(),
	    new WebDemo.TVWindow(),
	    new WebDemo.TVRemote()
        ];
    },

    getDesktopConfig: function () {
        var me = this, ret = me.callParent();

        return Ext.apply(ret, {
            //cls: 'ux-desktop-black',

            contextMenuItems: [
                { text: 'Change Background', handler: me.onSettings, scope: me }
            ],

            shortcuts: Ext.create('Ext.data.Store', {
                model: 'Ext.ux.desktop.ShortcutModel',
                data: [
		   { name: 'Webinos Services', iconCls: 'webinos-services', module: 'win-services' },
		   { name: 'GUI Logs', iconCls: 'logs-big', module: 'win-logs' },
		   { name: 'Google Contacts', iconCls: 'android-contacts', module: 'win-contacts' },
		   { name: 'TV Remote', iconCls: 'remote-control', module: 'win-tv-remote' },
		   { name: 'Context', iconCls: 'context-big', module: 'win-context' }
                ]
            }),

            wallpaper: 'wallpapers/webinos.jpg',
            wallpaperStretch: true
        });
    },

    // config for the start menu
    getStartConfig : function() {
        var me = this, ret = me.callParent();

        return Ext.apply(ret, {
            title: 'Webinos Demos',
            iconCls: 'user',
            height: 300,
            toolConfig: {
                width: 100,
                items: ret.sidemenu
            }
        });
    },

    getTaskbarConfig: function () {
        var ret = this.callParent();

        return Ext.apply(ret, {
            quickStart: [
               //{ name: 'Accordion Window', iconCls: 'accordion', module: 'acc-win' },
               // { name: 'Grid Window', iconCls: 'icon-grid', module: 'grid-win' }
            ],
            trayItems: [
                { xtype: 'trayclock', flex: 1 }
            ]
        });
    },

    onSettings: function () {
        var dlg = new MyDesktop.WallpaperWindow({
            desktop: this.desktop
        });
        dlg.show();
    }
});

