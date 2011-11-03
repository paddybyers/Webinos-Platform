Ext.define('WebDemo.App', {
    extend: 'Ext.ux.desktop.App',

    init: function() {
        // custom logic before getXYZ methods get called...

        this.callParent();

        // now ready...
    },

    getModules : function(){
        return [
	    new WebDemo.ContactsStore(),
	    new WebDemo.ContactsWindow(),
	    new WebDemo.ServicesWindow(),
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
		   { name: 'Google Contacts', iconCls: 'android-contacts', module: 'win-contacts' }
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
                items: [
                    {
                        text:'Services',
                        iconCls:'settings',
                        handler: me.onWebinosSettings,
                        scope: me
                    }
                ]
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
    },
	
	onWebinosSettings: function(){
		var module = myDesktopApp.getModule("win-services");
		var win = module && module.createWindow();
		//var dlg = new MyApp.view.GoogleContacts();
		
		//dlg.show();
	}
});

