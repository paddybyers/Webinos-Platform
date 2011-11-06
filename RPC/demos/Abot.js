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
    },
    Log: function(line){
       var store = Ext.getStore("LogsStore");
       store.add([[new Date(), line]])
    }
};

Abot.Contacts = {
      contactsService: null, //The service provider
      authenticated: false,
      bindservice: function() {//Discover service
	Abot.GUI.Log("Requested contact service discovery");
	webinos.ServiceDiscovery.findServices(new ServiceType('http://www.w3.org/ns/api-perms/contacts'),{
          onFound : function(service)  {   
	    Abot.Contacts.contactsService = service; 
	    Ext.getCmp("cmdEnableContactsModule").DoDisable(); 
	    Ext.getCmp("lblContactsServiceStatus").ChangeToWaitingAuth();
	    Abot.GUI.Log("Discovered contact service");
	  }
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
	  Abot.GUI.Log("Authenticated with gmail account");
	  Abot.Contacts.authenticated = true;
	  Ext.getCmp("cmdRefreshGoogleContacts") && Ext.getCmp("cmdRefreshGoogleContacts").enable();
	  Ext.getCmp("lblContactsServiceStatus").ChangeToAuthenticated();
	  Ext.getCmp("cmdAuthenticateToGoogle").ChangeToReauth();
	  Abot.GUI.ShowInfo("GMain success","You are authenticated to your GMail account!");
	}
	else
	  Abot.GUI.ShowError("Failed login","Check GMail username and password");
	  Abot.GUI.Log("FAILED to auth with gmail account");
      },
      AuthenticateContact: function(){
	 Abot.GUI.Log("Requested to auth with gmail account");
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
	    Abot.GUI.Log("Requested contacts refresh");
	    Abot.Contacts.contactsService.getAllContacts(parameters, Abot.Contacts.AddContactsToList);
	  });
	  }
      },
      AddContactsToList: function(list){
	 Abot.GUI.Log("Contacts retrieved");
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
	      var photo = "<img src=\"images/defaultContactImage.png\" width='96px' height='96px' alt=\"No contact image\"/>";
	      if ((list[i].photos instanceof Array) && list[i].photos.length > 0)
	      {
		for ( var j = 0; j < list[i].photos.length; j++)
		{
		  if(list[i].photos[j].type=="file") //is base64 string
		      photo ="<img src=\"data:image/png;base64,"+list[i].photos[j].value+"\" width='96px' height='96px' alt=\"Contact image\"><br>";
		  else if(list[i].photos[j].type=="url") //is an URL
		      photo ="<img src=\""+list[i].photos[j].value+"\" width='96px' height='96px' alt=\"Contact image\"><br>";
		}
	      }
	      store.add([[emails, photo, phones,name]]); 
	    }
	  }
	  Ext.getCmp('contactsGrid').body.unmask();
	  setTimeout("Ext.getCmp('win-contacts').doLayout()",500);
      }
};

Abot.TV = {
   tvService: null,
   isServiceDiscovered: function(serviceNotFoundMessage){
	if(Abot.TV.tvService==null && serviceNotFoundMessage){
	  Abot.GUI.ShowError("Error in TV",serviceNotFoundMessage);
	}
	return Abot.TV.tvService!=null;
    },
    bindservice: function(){
        Abot.GUI.Log('Request to connect the TV service');
	webinos.ServiceDiscovery.findServices(new ServiceType('http://webinos.org/api/tv'), {onFound: function (service) {
		if(!Abot.TV.isServiceDiscovered()){
		  Ext.getCmp("cmdEnableTVService").DoDisable();
		  Abot.TV.tvService = service;
		  Abot.GUI.ShowInfo("TV Service found",'SERVICE FOUND: TV');
		  Abot.GUI.Log('SERVICE FOUND: TV');
	    	}else{
		  Abot.GUI.Log('TV service already found.');
	    	}
	    }});
      },
      currentSourceName: '[Source]',
      currentChannelName: '[Channel]',
      currentStream: null,
      updateUI: function(tvSourceName, channelName,stream){
	  if(tvSourceName){
		Ext.getCmp('tvSourceLabel') && Ext.getCmp('tvSourceLabel').setText(tvSourceName);
		Abot.TV.currentSourceName = tvSourceName;
	  }
	  if(channelName){
		Ext.getCmp('channelNameLabel') && Ext.getCmp('channelNameLabel').setText(channelName);
		Abot.TV.currentChannelName = channelName;
	  }
	  if(stream){
		Ext.getCmp('video-player') && Ext.getCmp('video-player').setSrc(stream);
		Abot.TV.currentStream = stream;
		//Maybe doComponentLayout() after setting src?
	  }
      },
      channelChangeHandler: function(channel){
	  Abot.GUI.Log('EVENT: CHANNEL CHANGED: '+JSON.stringify(channel));
	  Abot.TV.updateUI(channel.tvsource.name,channel.name,channel.stream);
      },
      addEventListener: function(){
	 if (Abot.TV.isServiceDiscovered("Please enable tv service prior to adding event handler!")){
	  Abot.TV.tvService.display.addEventListener('channelchange', Abot.TV.channelChangeHandler, false);
	  Abot.GUI.Log("TV EVENTLISTENER registered.");
	 }
      },
      getTVSources: function(){
	if (Abot.TV.isServiceDiscovered("Please enable tv service prior to discovering the channels!")){
	  Abot.TV.tvService.tuner.getTVSources(/*TVSuccessCB*/ Abot.TV.updateAvailableChannels, /*optional TVErrorCB*/ Abot.TV.errorRetrivingChannels);
	}
      },
      availableChannels: [],
      updateAvailableChannels: function(sources){
	//clear channels
	Ext.getCmp("pnlAvailableChannels").items.clear();
	Abot.TV.availableChannels = [];
	Ext.each(sources, function(source, index) {
	    var fieldsetToAdd =  {
                    xtype: 'fieldset',
                    autoScroll: true,
                    layout: {
                        align: 'stretch',
                        type: 'vbox'
                    },
		    height: 200,
                    title: 'Source ' + source.name,
                    items: []
	    };
	    Abot.GUI.Log("TV source found: " + source.name);
	    Ext.each(source.channelList,function(channel,cindex){
	      Abot.GUI.Log("TV channel found: " + channel.name);
	      fieldsetToAdd.items.push({
                            xtype: 'button',
                            text: channel.name,
			    handler: function(){
			      Abot.TV.setChannel({tvsource:source,channel:channel});
			    }
                        });
	    });
	   Ext.getCmp("pnlAvailableChannels").items.add(new Ext.form.FieldSet(fieldsetToAdd));
	   Abot.TV.availableChannels.push(fieldsetToAdd);
	});
	Ext.getCmp("pnlAvailableChannels").doLayout();
      },
      errorRetrivingChannels: function(){
	Abot.GUI.Log("Error retrieving the channel list!");
	Abot.GUI.ShowError("Error in TV","Could not load the list of channels!");
      },
      openTV: function(){
	 var module = myDesktopApp.getModule("video");
	 var win = module && module.createWindow();
      },
      setChannel: function(clickedChannel){
	if (Abot.TV.isServiceDiscovered("Please enable tv service prior to changing the channels!")){
	  Abot.TV.tvService.display.setChannel(/*Channel*/ clickedChannel.channel, /*TVDisplaySuccessCB*/ Abot.TV.successTVChange, /*TVErrorCB*/ Abot.TV.failedTVChange);
	}
      },
      successTVChange: function(channel){
	Abot.GUI.Log('TV CHANNEL CHANGED: '+JSON.stringify(channel));
	Abot.TV.updateUI(channel.tvsource.name,channel.name,channel.stream)
      },
      failedTVChange: function(){
	Abot.GUI.Log("Error changing the channel!");
	Abot.GUI.ShowError("Error in TV","Could not change the tv channel!");
      }
};
Abot.Context = {
   contextService: null,
   isServiceDiscovered: function(serviceNotFoundMessage){
	if(Abot.Context.contextService==null && serviceNotFoundMessage){
	  Abot.GUI.ShowError("Error in Context",serviceNotFoundMessage);
	}
	return Abot.Context.contextService!=null;
    },
    bindservice: function(){
        Abot.GUI.Log('Request to connect the Context service');
	webinos.ServiceDiscovery.findServices(new ServiceType('http://webinos.org/api/context'), {onFound: function (service) {
		if(!Abot.Context.isServiceDiscovered()){
		  Ext.getCmp("cmdEnableContextService").DoDisable();
		  Abot.Context.contextService = service;
		  Abot.GUI.ShowInfo("Context Service found",'SERVICE FOUND: Context');
		  Abot.GUI.Log('SERVICE FOUND: Context');
	    	}else{
		  Abot.GUI.Log('Context service already found.');
	    	}
	    }});
      },
     getChannelsFrequency: function(){
       if (Abot.Context.isServiceDiscovered("The Context service is no discovered yet! Please discover it via the services window.")){
	 myDesktopApp.getModule('win-context').loadingResults();
	 Abot.GUI.Log('Request for context: Channel frequency');
	 var store = Ext.getStore("ContextStore");
	 store.loadData([],false);
	 Abot.Context.contextService.find({},function(results){
	   Abot.GUI.Log('Successfull context response: Channel frequency');
	   for (var channel in results) {  
	     store.add([[channel, results[channel]]]);  
	  }
	  myDesktopApp.getModule('win-context').loadingFinished();
	 },function(){
	   Abot.GUI.Log('Failed context response: Channel frequency');
	   myDesktopApp.getModule('win-context').loadingFinished();
	});
       }
     }
};