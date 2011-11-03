Abot = {};

Abot.GUI = {
    ShowInfo: function (title, text) {
      Ext.Msg.alert(title,text);
      //another way is to show tooltips
      //var toolTip = new Ext.ToolTip({ title: text });
      //toolTip.showAt([myDesktopApp.desktop.getWidth() / 2, myDesktopApp.desktop.getHeight() / 2]);
    },
    ShowError: function(title,text){
	Abot.GUI.ShowInfo(title,text);//TODO: add an icon or something
    }
};

Abot.Contacts = {
      contactsService: null, //The service provider
      authenticated: false,
      bindservice: function() {//Discover service
	webinos.ServiceDiscovery.findServices(new ServiceType('http://www.w3.org/ns/api-perms/contacts'),{
          onFound : function(service)  {   Abot.Contacts.contactsService = service; Ext.getCmp("cmdEnableContactsModule").DoDisable(); Ext.getCmp("lblContactsServiceStatus").ChangeToWaitingAuth();}
        });
      },
      connectGoogle: function(username,password){
	Abot.Contacts.authenticated =false;
	if (Abot.Contacts.contactsService!=null){
	 var parameters = {};
	 parameters.usr = username;
	 parameters.pwd = password;
	 parameters.type = "remote";
	 Abot.Contacts.contactsService.authenticate(parameters, Abot.Contacts.handle_authentication_query)
	}else{
	  Abot.GUI.ShowError("No contact service", "Contacts service is not initialized!");
	}
      },
      handle_authentication_query:  function(status) {
	if (status)
	{
	  Abot.Contacts.authenticated = true;
	  Ext.getCmp("cmdRefreshGoogleContacts") && Ext.getCmp("cmdRefreshGoogleContacts").enable();
	  Ext.getCmp("lblContactsServiceStatus").ChangeToAuthenticated();
	  Ext.getCmp("cmdAuthenticateToGoogle").ChangeToReauth();
	  Abot.GUI.ShowInfo("GMain success","You are authenticated to your GMail account!");
	}
	else
	  Abot.GUI.ShowError("Failed login","Check GMail username and password");
      },
      AuthenticateContact: function(){
	 var uname = Ext.getCmp("fldGmailUsername").getValue();
	 var pass =  Ext.getCmp("fldGmailPassword").getValue();
	  Abot.Contacts.connectGoogle(uname,pass);
      },
      RefreshContacts: function(){
	if (Abot.Contacts.contactsService!=null){
	  Ext.getCmp('contactsGrid').body.mask();
	  var store = Ext.getStore("ContactsStore");
	  store.loadData([],false);
	  var parameters = {};
	  parameters.type = "remote";
	  Abot.Contacts.contactsService.isAlreadyAuthenticated(parameters, function(result)
	  {
	    Abot.Contacts.contactsService.getAllContacts(parameters, Abot.Contacts.AddContactsToList);
	  });
	  }
      },
      AddContactsToList: function(list){
	 var store = Ext.getStore("ContactsStore");
	 if (list.length > 0)
	  {
	    for ( var i = 0; i < list.length; i++)
	    {
	      var name = list[i].displayName == "" ? "Anonymous" : list[i].displayName;
	      if (list[i].nickname != undefined) name += " (" + list[i].nickname + ")";
	      var emails = "";
	      if ((list[i].emails instanceof Array) && list[i].emails.length > 0)
	      {
		for ( var j = 0; j < list[i].emails.length; j++)
		  emails += list[i].emails[j].value + ";"
	      }
	      var phones = "";
	      if ((list[i].phoneNumbers instanceof Array) && list[i].phoneNumbers.length > 0)
	      {
		for ( var j = 0; j < list[i].phoneNumbers.length; j++)
		  phones += list[i].phoneNumbers[j].value + ";";
	      }
	      var photo = "<img src=\"images/defaultContactImage.png\" alt=\"No contact image\"/>";
	      if ((list[i].photos instanceof Array) && list[i].photos.length > 0)
	      {
		for ( var j = 0; j < list[i].photos.length; j++)
		{
		  if(list[i].photos[j].type=="file") //is base64 string
		      photo ="<img src=\"data:image/png;base64,"+list[i].photos[j].value+"\" alt=\"Contact image\"><br>";
		  else if(list[i].photos[j].type=="url") //is an URL
		      photo ="<img src=\""+list[i].photos[j].value+"\" alt=\"Contact image\"><br>";
		}
	      }
	      store.add([[emails, photo, phones,name]]); 
	    }
	  }
	  Ext.getCmp('contactsGrid').body.unmask();
	  setTimeout("Ext.getCmp('win-contacts').doLayout()",500);
      }
};
