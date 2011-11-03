Ext.define('WebDemo.ServicesWindow', {
    extend: 'Ext.ux.desktop.Module',
    id: 'win-services',

    init: function () {
        
    },

    createWindow: function () {
        var desktop = this.app.getDesktop();
        var win = desktop.getWindow(this.id);
        if (!win) { 
	  win = desktop.createWindow({
	    xtype: 'window',
	    height: 483,
	    width: 500,
	    layout: {
		align: 'stretch',
		type: 'vbox'
	    },
	    id: this.id,
            title: 'Webinos Services',
	    items: [
		{
		  xtype: 'form',
		  height: 204,
		  width: 553,
		  bodyPadding: 10,
		  title: 'Contact module options',
		  items: [
		      {
			  xtype: 'radiogroup',
			  fieldLabel: 'Source',
			  items: [
			      {
				  xtype: 'radiofield',
				  boxLabel: 'GMail',
				  checked: true
			      },
			      {
				  xtype: 'radiofield',
				  disabled: true,
				  boxLabel: 'Local contacts'
			      }
			  ]
		      },
		      {
			  xtype: 'fieldset',
			  title: 'GMail Account info',
			  items: [
			      {
				  xtype: 'textfield',
				  id: 'fldGmailUsername',
				  fieldLabel: 'Username',
				  disabled: true,
				  anchor: '100%'
			      },
			      {
				  xtype: 'textfield',
				  id: 'fldGmailPassword',
				  inputType: 'password',
				  fieldLabel: 'Password',
				  disabled: true,
			          anchor: '100%'
			      }
			  ]
		      },
		      {
			  xtype: 'label',
			  id: 'lblContactsServiceStatus',
			  text: 'Service status: disabled',
			  anchor: '100%',
			  ChangeToWaitingAuth: function(){
			    this.setText("Service status: Service started.Waiting authentication.");
			    Ext.getCmp("fldGmailUsername").enable();
			    Ext.getCmp("fldGmailPassword").enable();
			    Ext.getCmp("cmdAuthenticateToGoogle").enable();
			  },
			  ChangeToAuthenticated: function(){
			    this.setText("Service status: Service started and authenticated to GMail.");
			  }
		      }
		  ],
		  dockedItems: [
		      {
			  xtype: 'toolbar',
			  height: 32,
			  anchor: '100%',
			  dock: 'bottom',
			  items: [
			      {
				  xtype: 'button',
				  text: 'Enable Service',
				  id: 'cmdEnableContactsModule',
				  handler: Abot.Contacts.bindservice,
				  DoDisable: function(){
				    this.disable();
				    this.setText("Contacts module is enabled");
				  }
			      },
			      {
				  xtype: 'tbfill',
				  height: 10
			      },
			      {
				  xtype: 'button',
				  text: 'Authenticate',
				  id: 'cmdAuthenticateToGoogle',
				  disabled: true,
			          handler: Abot.Contacts.AuthenticateContact,
			          ChangeToReauth: function(){
				    this.setText("Re authenticate")
				  }
			      }
			  ]
		      }
		  ]
	      },
		{
		    xtype: 'button',
		    height: 47,
		    text: 'MyButton'
		}
	    ]
	});
	  if (Abot.Contacts.contactsService!=null)
	    win.items.items[0].DoDisable();
        }
        win.show();
        return win;
    }
   
});