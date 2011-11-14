Ext.define('WebDemo.ContactsWindow', {
    extend: 'Ext.ux.desktop.Module',
    id: 'win-contacts',

    init: function () {
        this.launcher = {
            text: 'Google Contacts',
            iconCls: 'android-contacts-small',
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
                width: 740,
                height: 480,
                iconCls: this.launcher.iconCls,
                animCollapse: false,
                constrainHeader: true,
                layout: 'fit',
                dockedItems: [
                    {
                        xtype: 'toolbar',
                        dock: 'top',
                        items: [
                            {
                                xtype: 'button',
                                id: 'cmdRefreshGoogleContacts',
				disabled: !Abot.Contacts.authenticated,
                                text: 'Refresh contacts',
				handler: Abot.Contacts.RefreshContacts
                            },
			      {
				  xtype: 'tbfill',
				  height: 10
			      },
			      {
				  xtype: 'button',
				  text: 'Open Webinos services',
			          handler: function(){
				    myDesktopApp.getModule('win-services').createWindow();
				  }
			      }
                        ]
                    }
                ],
                items: [
                    {
                        xtype: 'gridpanel',
			id: 'contactsGrid',
                        height: 333,
                        width: 744,
                        store: 'ContactsStore',
                        columns: [
                            {
                                xtype: 'templatecolumn',
                                tpl: Ext.create('Ext.XTemplate',
                                    '{fldContactImage}'
                                ),
                                tplWriteMode: 'insertAfter',
                                dataIndex: 'fldContactImage',
                                text: 'Image',
				width:110
                            },
                            {
                                xtype: 'gridcolumn',
                                dataIndex: 'fldContactName',
                                text: 'Full name',
				width: 200
                            },
                            {
                                xtype: 'gridcolumn',
                                dataIndex: 'fldContactEmail',
                                text: 'Email',
				width: 200
                            },
                            {
                                xtype: 'gridcolumn',
                                dataIndex: 'fldContactPhones',
                                text: 'Phones',
				width: 200
                            }
                        ]
                    }
                ]
            });
        }
        win.show();
        return win;
    }
});
