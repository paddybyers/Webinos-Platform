(function() {
	webinos.session = {};
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
			webinos.message_send(msg, pzpId);
		
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

		} else if(data.payload.status === "crashLog") {
			var log  = ' <tr> <td> '+ data.payload.message.name + '</td>  <td>'+ data.payload.message.log + '</td> </tr>';
			$('#crashLogs').append(log);
		}
	}
}());
