(function() {
	webinos.session = {};
	var sessionid = null;
	var pzpId, pzhId, connectedPzp={}, connectedPzh={};
	var serviceLocation;
	var channel;	
	webinos.session.setChannel = function(channel1) {
		channel = channel1;
	}
	
	webinos.session.message_send_messaging = function(msg, to) {
		msg.resp_to = webinos.session.getSessionId();
		channel.send(JSON.stringify(msg));
	}
	
	webinos.session.message_send = function(rpc, to) {
		var type, id = 0;	
		if(rpc.type !== undefined && rpc.type === "prop") {
			type = "prop";
			rpc = rpc.payload;	
		} else {
			type = "JSONRPC";
		}
		
		if(typeof rpc.method !== undefined && rpc.method === 'ServiceDiscovery.findServices')
			id = rpc.params[2];
			
		var message = {"type": type, 
			"id": id, 
			"from": webinos.session.getSessionId(), 
			"to": to, 
			"resp_to": webinos.session.getSessionId(), 
			"payload": rpc
			};
		if(rpc.register !== "undefined" && rpc.register === true) {
			console.log(rpc);
			channel.send(JSON.stringify(rpc));
		} else {
            		console.log('creating callback');
			console.log('WebSocket Client: Message Sent');
			console.log(message)
			channel.send(JSON.stringify(message));
		}
	}
	
	webinos.session.setServiceLocation = function (loc) {
		serviceLocation = loc;
	}
	// If service location is not set, sets pzpId
	webinos.session.getServiceLocation = function() {
		if ( typeof serviceLocation !== "undefined" )
			return serviceLocation;
		else 
			return pzpId;
	}
	webinos.session.getSessionId = function() {
		return sessionid;
	}
	webinos.session.getPZPId = function() {
		return pzpId;
	}
	webinos.session.getPZHId = function() {
		return pzhId;
	}
	webinos.session.getOtherPZP = function() {
		return otherpzp;
	}
	
	webinos.session.handleMsg = function(data) {
		if(data.payload.status === 'registeredBrowser') {
			sessionid = data.to;
			pzpId = data.from;

			if(typeof data.payload.message !== "undefined") {
				pzhId = data.payload.message.pzhId;
				connectedPzp = data.payload.message.connectedPzp;
				connectedPzh = data.payload.message.connectedPzh;
			}
			if(document.getElementById('pzh_pzp_list'))
				document.getElementById('pzh_pzp_list').innerHTML="";
		
			$("<optgroup label = 'PZP' id ='pzp_list' >").appendTo("#pzh_pzp_list");
			var i;
			for(i =0; i < connectedPzp.length; i++) {
				$("<option value=" + connectedPzp[i] + " >" +connectedPzp[i] + "</option>").appendTo("#pzh_pzp_list");					
			}
			$("<option value="+pzpId+" >" + pzpId+ "</option>").appendTo("#pzh_pzp_list");						
			$("</optgroup>").appendTo("#pzh_pzp_list");
			$("<optgroup label = 'PZH' id ='pzh_list' >").appendTo("#pzh_pzp_list");
			for(i =0; i < connectedPzh.length; i++) {
				$("<option value=" + connectedPzh[i] + " >" +connectedPzh[i] + "</option>").appendTo("#pzh_pzp_list");					
			}
			$("</optgroup>").appendTo("#pzh_pzp_list");
			webinos.message.setGetOwnId(sessionid);
	
			var msg = webinos.message.registerSender(sessionid , pzpId);
			webinos.session.message_send(msg, pzpId);
		
		} else if(data.payload.status === "info") {
			$('#message').append('<li>'+data.payload.message+'</li>');
		} else if(data.type === "prop" && data.payload.status === "update") {
			if(typeof data.payload.message.pzp !== "undefined") {
				$("<option value=" + data.payload.message.pzp + " >" +data.payload.message.pzp + "</option>").appendTo("#pzp_list");
			} else {
				$("<option value=" + data.payload.message.pzh + " >" +data.payload.message.pzh + "</option>").appendTo("#pzh_list");
			}
		} else if(data.payload.status === "listPzh") {
			var i, list = '', pzh = '', pzp ='';
			document.getElementById('connectedList').innerHTML = '';
			list += '<tr> <td>' + data.payload.message.name +'</td>';						
			if(typeof data.payload.message.pzhId !== "undefined") {									
				for( i = 0 ; i < data.payload.message.pzhId.length; i += 1) {					
					pzh += '<td> ' + data.payload.message.pzhId[i] +'</td>';						
				}
				list += pzh;
			}
			if(typeof data.payload.message.pzpId !== "undefined") {
				for( i = 0 ; i < data.payload.message.pzpId.length; i += 1) {
					if(data.payload.message.pzpId[i] !== null) {
						pzp += '<td> ' + data.payload.message.pzpId[i] +'</td>';						
					}
				}
				list += pzp+ '</tr>';
			}
			$('#connectedList').append(list);
            
        } else if(data.payload.status === "listAllPzps") {
			 document.getElementById("pzpList").innerHTML = "";
                var list = "";
                var pzps = data.payload.message;
                if (pzps !== null) {
                     list += "<tr style=\"border-bottom: thin solid black;\" ><th>Device name</th><th>Actions</th></tr>\n"
                    var i=0;
                    for (i=0;i<pzps.length;i++) {
                        list += "\t<tr><td>" + pzps[i] + "</td><td><button id=\"revoke" + pzps[i] + "\" class=\"button\" style=\"width:100px\" onclick=\"revoke('" + pzps[i] + "')\" >revoke</a></td></tr>\n";
                    }                
                }
                $("#pzpList").append(list);



		} else if(data.payload.status === "crashLog") {
			var log  = ' <tr> <td> '+ data.payload.message.name + '</td>  <td>'+ data.payload.message.log + '</td> </tr>';
			$('#crashLogs').append(log);
		}
	}
}());
