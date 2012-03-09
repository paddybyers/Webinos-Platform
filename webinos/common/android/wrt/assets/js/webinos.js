/*******************************************************************************
*  Code contributed to the webinos project
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* Copyright 2011-2012 Paddy Byers
*
******************************************************************************/

(function() {
  if(typeof webinos === "undefined") {
    webinos = {}
  }
  if(typeof module === "undefined") {
    var exports = {}
  }else {
    var exports = module.exports = {}
  }
  if(typeof module !== "undefined") {
    var utils = require("./webinos.utils.js")
  }else {
    var utils = webinos.utils || (webinos.utils = {})
  }
  var sessionId;
  function logObj(obj, name) {
    for(var myKey in obj) {
      console.log(name + "[" + myKey + "] = " + obj[myKey]);
      if(typeof obj[myKey] == "object") {
        logObj(obj[myKey], name + "." + myKey)
      }
    }
  }
  _RPCHandler = function(parent) {
    this.parent = parent;
    this.objRefCachTable = {};
    this.awaitingResponse = {};
    this.objects = {};
    this.remoteServiceObjects = [];
    this.remoteServicesFoundCallbacks = {};
    if(typeof this.parent !== "undefined") {
      var that = this;
      this.parent.addRemoteServiceListener(function(payload) {
        var callback = that.remoteServicesFoundCallbacks[payload.id];
        if(!callback) {
          console.log("ServiceDiscovery: no findServices callback found for id: " + payload.id);
          return
        }
        delete that.remoteServicesFoundCallbacks[payload.id];
        callback(payload.message)
      })
    }
    this.requesterMapping = [];
    this.messageHandler = null
  };
  _RPCHandler.prototype.setMessageHandler = function(messageHandler) {
    this.messageHandler = messageHandler
  };
  _RPCHandler.prototype.handleMessage = function(message, from, msgid) {
    console.log("New packet from messaging");
    console.log("Response to " + from);
    var myObject = message;
    logObj(myObject, "rpc");
    if(typeof myObject.method !== "undefined" && myObject.method != null) {
      var idx = myObject.method.lastIndexOf(".");
      var service = myObject.method.substring(0, idx);
      var method = myObject.method.substring(idx + 1);
      var serviceId = undefined;
      idx = service.indexOf("@");
      if(idx !== -1) {
        var serviceIdRest = service.substring(idx + 1);
        service = service.substring(0, idx);
        var idx2 = serviceIdRest.indexOf(".");
        if(idx2 !== -1) {
          serviceId = serviceIdRest.substring(0, idx2)
        }else {
          serviceId = serviceIdRest
        }
      }
      if(typeof service !== "undefined") {
        console.log("Got message to invoke " + method + " on " + service + (serviceId ? "@" + serviceId : "") + " with params: " + myObject.params);
        var receiverObjs = this.objects[service];
        if(!receiverObjs) {
          receiverObjs = []
        }
        var filteredRO = receiverObjs.filter(function(el, idx, array) {
          return el.id === serviceId
        });
        var includingObject = filteredRO[0];
        if(typeof includingObject === "undefined") {
          includingObject = receiverObjs[0]
        }
        if(typeof includingObject === "undefined") {
          console.log("No service found with id/type " + service);
          return
        }
        idx = myObject.method.lastIndexOf(".");
        var methodPathParts = myObject.method.substring(0, idx);
        methodPathParts = methodPathParts.split(".");
        for(var pIx = 0;pIx < methodPathParts.length;pIx++) {
          if(methodPathParts[pIx] && methodPathParts[pIx].indexOf("@") >= 0) {
            continue
          }
          if(methodPathParts[pIx] && includingObject[methodPathParts[pIx]]) {
            includingObject = includingObject[methodPathParts[pIx]]
          }
        }
        if(typeof includingObject === "object") {
          var id = myObject.id;
          if(typeof myObject.fromObjectRef !== "undefined" && myObject.fromObjectRef != null) {
            this.requesterMapping[myObject.fromObjectRef] = from;
            this.objRefCachTable[myObject.fromObjectRef] = {"from":from, msgId:msgid};
            var that = this;
            includingObject[method](myObject.params, function(result) {
              if(typeof id === "undefined") {
                return
              }
              var res = {};
              res.jsonrpc = "2.0";
              if(typeof result !== "undefined") {
                res.result = result
              }else {
                res.result = {}
              }
              res.id = id;
              that.executeRPC(res, undefined, undefined, from, msgid)
            }, function(error) {
              if(typeof id === "undefined") {
                return
              }
              var res = {};
              res.jsonrpc = "2.0";
              res.error = {};
              res.error.data = error;
              res.error.code = 32E3;
              res.error.message = "Method Invocation returned with error";
              res.id = id;
              that.executeRPC(res, undefined, undefined, from, msgid)
            }, myObject.fromObjectRef)
          }else {
            var that = this;
            includingObject[method](myObject.params, function(result) {
              if(typeof id === "undefined") {
                return
              }
              var res = {};
              res.jsonrpc = "2.0";
              if(typeof result !== "undefined") {
                res.result = result
              }else {
                res.result = {}
              }
              res.id = id;
              that.executeRPC(res, undefined, undefined, from, msgid)
            }, function(error) {
              if(typeof id === "undefined") {
                return
              }
              var res = {};
              res.jsonrpc = "2.0";
              res.error = {};
              res.error.data = error;
              res.error.code = 32E3;
              res.error.message = "Method Invocation returned with error";
              res.id = id;
              that.executeRPC(res, undefined, undefined, from, msgid)
            })
          }
        }
      }
    }else {
      if(typeof myObject.id === "undefined" || myObject.id == null) {
        return
      }
      console.log("Received a response that is registered for " + myObject.id);
      if(typeof this.awaitingResponse[myObject.id] !== "undefined") {
        if(this.awaitingResponse[myObject.id] != null) {
          if(typeof this.awaitingResponse[myObject.id].onResult !== "undefined" && typeof myObject.result !== "undefined") {
            this.awaitingResponse[myObject.id].onResult(myObject.result);
            console.log("called SCB")
          }
          if(typeof this.awaitingResponse[myObject.id].onError !== "undefined" && typeof myObject.error !== "undefined") {
            if(typeof myObject.error.data !== "undefined") {
              console.log("Propagating error to application");
              this.awaitingResponse[myObject.id].onError(myObject.error.data)
            }else {
              this.awaitingResponse[myObject.id].onError()
            }
          }
        //  delete this.awaitingResponse[myObject.id]
        }
      }
    }
  };
  _RPCHandler.prototype.executeRPC = function(rpc, callback, errorCB, from, msgid) {
    if(typeof rpc.serviceAddress !== "undefined") {
      webinos.session.message_send(rpc, rpc.serviceAddress);
      if(typeof callback === "function") {
        var cb = {};
        cb.onResult = callback;
        if(typeof errorCB === "function") {
          cb.onError = errorCB
        }
        if(typeof rpc.id !== "undefined") {
          this.awaitingResponse[rpc.id] = cb
        }
      }
      return
    }
    if(typeof callback === "function") {
      var cb = {};
      cb.onResult = callback;
      if(typeof errorCB === "function") {
        cb.onError = errorCB
      }
      if(typeof rpc.id !== "undefined") {
        this.awaitingResponse[rpc.id] = cb
      }
      if(rpc.method && rpc.method.indexOf("@") === -1) {
        var objectRef = rpc.method.split(".")[0];
        if(typeof this.objRefCachTable[objectRef] !== "undefined") {
          from = this.objRefCachTable[objectRef].from
        }
        console.log("RPC MESSAGE" + " to " + from + " for callback " + objectRef)
      }
    }else {
      if(rpc.method && rpc.method.indexOf("@") === -1) {
        var objectRef = rpc.method.split(".")[0];
        if(typeof this.objRefCachTable[objectRef] !== "undefined") {
          from = this.objRefCachTable[objectRef].from
        }
        console.log("RPC MESSAGE" + " to " + from + " for callback " + objectRef)
      }
    }
    this.messageHandler.write(rpc, from, msgid)
  };
  _RPCHandler.prototype.createRPC = function(service, method, params) {
    if(typeof service === "undefined") {
      throw"Service is undefined";
    }
    if(typeof method === "undefined") {
      throw"Method is undefined";
    }
    var rpc = {};
    rpc.jsonrpc = "2.0";
    rpc.id = Math.floor(Math.random() * 101);
    if(typeof service === "object") {
      rpc.method = service.api + "@" + service.id + "." + method;
      if(typeof service.serviceAddress !== "undefined") {
        rpc.serviceAddress = service.serviceAddress
      }
    }else {
      rpc.method = service + "." + method
    }
    if(typeof params === "undefined") {
      rpc.params = []
    }else {
      rpc.params = params
    }
    return rpc
  };
  _RPCHandler.prototype.request = function(service, method, objectRef, successCallback, errorCallback) {
    var self = this;
    return function() {
      var params = Array.prototype.slice.call(arguments);
      var message = self.createRPC(service, method, params);
      if(objectRef) {
        message.fromObjectRef = objectRef
      }
      self.executeRPC(message, utils.callback(successCallback, this), utils.callback(errorCallback, this))
    }
  };
  _RPCHandler.prototype.notify = function(service, method, objectRef) {
    var self = this;
    return function() {
      var params = Array.prototype.slice.call(arguments);
      var message = self.createRPC(service, method, params);
      if(objectRef) {
        message.fromObjectRef = objectRef
      }
      self.executeRPC(message)
    }
  };
  _RPCHandler.prototype.registerObject = function(callback) {
    if(typeof callback !== "undefined") {
      console.log("Adding handler: " + callback.api);
      var receiverObjs = this.objects[callback.api];
      if(!receiverObjs) {
        receiverObjs = []
      }
      callback.id = md5.hexhash(callback.api + callback.displayName + callback.description);
      var filteredRO = receiverObjs.filter(function(el, idx, array) {
        return el.id === callback.id
      });
      if(filteredRO.length > 0) {
        throw new Error("cannot register, already got object with same id. try changing your service desc.");
      }
      receiverObjs.push(callback);
      this.objects[callback.api] = receiverObjs
    }
  };
  _RPCHandler.prototype.registerCallbackObject = function(callback) {
    if(typeof callback !== "undefined") {
      console.log("Adding handler: " + callback.api);
      var receiverObjs = this.objects[callback.api];
      if(!receiverObjs) {
        receiverObjs = []
      }
      receiverObjs.push(callback);
      this.objects[callback.api] = receiverObjs
    }
  };
  _RPCHandler.prototype.unregisterObject = function(callback) {
    if(typeof callback !== "undefined" && callback != null) {
      console.log("Removing handler: " + callback.api);
      var receiverObjs = this.objects[callback.api];
      if(!receiverObjs) {
        receiverObjs = []
      }
      var filteredRO = receiverObjs.filter(function(el, idx, array) {
        return el.id !== callback.id
      });
      this.objects[callback.api] = filteredRO
    }
  };
  _RPCHandler.prototype.findServices = function(serviceType, callback) {
    console.log("findService: searching for ServiceType: " + serviceType.api);
    var results = [];
    var cstar = serviceType.api.indexOf("*");
    if(cstar !== -1) {
      if(serviceType.api.lastIndexOf("*") !== 0) {
        var len = serviceType.api.length - 1;
        var midString = serviceType.api.substring(1, len);
        for(var i in this.objects) {
          if(i.indexOf(midString) != -1) {
            for(var j = 0;j < this.objects[i].length;j++) {
              results.push(this.objects[i][j])
            }
          }
        }
      }else {
        if(serviceType.api.length == 1) {
          for(var i in this.objects) {
            for(var j = 0;j < this.objects[i].length;j++) {
              results.push(this.objects[i][j])
            }
          }
        }else {
          var restString = serviceType.api.substr(1);
          for(var i in this.objects) {
            if(i.indexOf(restString, i.length - restString.length) !== -1) {
              for(var j = 0;j < this.objects[i].length;j++) {
                results.push(this.objects[i][j])
              }
            }
          }
        }
      }
      callback(results)
    }else {
      for(var i in this.objects) {
        if(i === serviceType.api) {
          console.log("findService: found matching service(s) for ServiceType: " + serviceType.api);
          results = this.objects[i]
        }
      }
      for(var i = 0;i < results.length;i++) {
        results[i].serviceAddress = sessionId
      }
      if(!this.parent.pzhId) {
        callback(results);
        return
      }
      var callbackId = Math.floor(Math.random() * 101);
      this.remoteServicesFoundCallbacks[callbackId] = function(res) {
        return function(remoteServices) {
          function isServiceType(el) {
            return el.api === serviceType.api ? true : false
          }
          res = res.concat(remoteServices.filter(isServiceType));
          callback(res)
        }
      }(results);
      this.parent.prepMsg(this.parent.sessionId, this.parent.pzhId, "findServices", {id:callbackId})
    }
  };
  _RPCHandler.prototype.addRemoteServiceObjects = function(services) {
    console.log("addRemoteServiceObjects: found " + (services && services.length) || 0 + " services.");
    this.remoteServiceObjects = this.remoteServiceObjects.concat(services)
  };
  _RPCHandler.prototype.removeRemoteServiceObjects = function(address) {
    var oldCount = this.remoteServiceObjects.length;
    function isNotServiceFromAddress(element) {
      return address !== element.serviceAddress
    }
    this.remoteServiceObjects = this.remoteServiceObjects.filter(isNotServiceFromAddress);
    var removedCount = oldCount - this.remoteServiceObjects.length;
    console.log("removeRemoteServiceObjects: removed " + removedCount + " services from: " + address)
  };
  _RPCHandler.prototype.getAllServices = function(exceptAddress) {
    var results = [];
    function isNotExceptAddress(el) {
      return el.serviceAddress !== exceptAddress ? true : false
    }
    results = this.remoteServiceObjects.filter(isNotExceptAddress);
    results = results.concat(this.getRegisteredServices());
    return results
  };
  _RPCHandler.prototype.getRegisteredServices = function() {
    var results = [];
    for(var service in this.objects) {
      results = results.concat(this.objects[service])
    }
    function getServiceInfo(el) {
      el = el.getInformation();
      el.serviceAddress = sessionId;
      return el
    }
    return results.map(getServiceInfo)
  };
  this.RPCWebinosService = function(obj) {
    if(!obj) {
      this.id = "";
      this.api = "";
      this.displayName = "";
      this.description = "";
      this.serviceAddress = ""
    }else {
      this.id = obj.id || "";
      this.api = obj.api || "";
      this.displayName = obj.displayName || "";
      this.description = obj.description || "";
      this.serviceAddress = obj.serviceAddress || ""
    }
  };
  this.RPCWebinosService.prototype.getInformation = function() {
    return{id:this.id, api:this.api, displayName:this.displayName, description:this.description, serviceAddress:this.serviceAddress}
  };
  this.ServiceType = function(api) {
    if(!api) {
      throw new Error("ServiceType: missing argument: api");
    }
    this.api = api
  };
  _RPCHandler.prototype.loadModules = function(modules) {
    if(typeof module === "undefined") {
      return
    }
    var path = require("path");
    var moduleRoot = require(path.resolve(__dirname, "../dependencies.json"));
    var dependencies = require(path.resolve(__dirname, "../" + moduleRoot.root.location + "/dependencies.json"));
    var webinosRoot = path.resolve(__dirname, "../" + moduleRoot.root.location) + "/";
    require(webinosRoot + dependencies.manager.context_manager.location);
    if(typeof modules === "undefined") {
      modules = []
    }
    modules.unshift({name:"service_discovery", param:{}});
    for(var i = 0;i < modules.length;i++) {
      try {
        var Service = require(webinosRoot + dependencies.api[modules[i].name].location).Service;
        this.registerObject(new Service(this, modules[i].params))
      }catch(error) {
        console.log(error);
        console.log("Could not load module " + modules[i].name + " with message: " + error)
      }
    }
  };
  function setSessionId(id) {
    sessionId = id
  }
  if(typeof module !== "undefined") {
    exports.RPCHandler = _RPCHandler;
    exports.RPCWebinosService = RPCWebinosService;
    exports.ServiceType = ServiceType;
    exports.setSessionId = setSessionId;
    var md5 = require("../contrib/md5.js")
  }else {
    this.RPCHandler = _RPCHandler
  }
})();
(function() {
  function logObj(obj, name) {
    for(var myKey in obj) {
      console.log(name + "[" + myKey + "] = " + obj[myKey]);
      if(typeof obj[myKey] === "object") {
        logObj(obj[myKey], name + "." + myKey)
      }
    }
  }
  var MessageHandler = function(rpcHandler) {
    this.sendMsg = null;
    this.objectRef = null;
    this.ownId = null;
    this.separator = null;
    this.rpcHandler = rpcHandler;
    this.rpcHandler.setMessageHandler(this);
    this.clients = {};
    this.message = {};
    this.messageCallbacks = {}
  };
  MessageHandler.prototype.setSendMessage = function(sendMessageFunction) {
    this.sendMsg = sendMessageFunction
  };
  MessageHandler.prototype.sendMessage = function(message, sessionid, objectRef) {
    this.sendMsg(message, sessionid, objectRef)
  };
  MessageHandler.prototype.setObjectRef = function(objref) {
    this.objectRef = objref
  };
  MessageHandler.prototype.setGetOwnId = function(OwnIdGetter) {
    this.ownId = OwnIdGetter
  };
  MessageHandler.prototype.getOwnId = function() {
    return this.ownId
  };
  MessageHandler.prototype.setSeparator = function(sep) {
    this.separator = sep
  };
  MessageHandler.prototype.createMessage = function(options) {
    var message = {};
    for(var i in options) {
      message[i] = options[i]
    }
    return message
  };
  MessageHandler.prototype.createMessageId = function(message, successHandler, errorHandler) {
    message.id = 1 + Math.floor(Math.random() * 1024);
    if(errorHandler || successHandler) {
      this.messageCallbacks[message.id] = {onError:errorHandler, onSuccess:successHandler}
    }
  };
  MessageHandler.prototype.registerSender = function(from, to) {
    var options = {};
    options.register = true;
    options.to = to;
    options.from = from;
    options.type = "JSONRPC";
    options.payload = null;
    var message = this.createMessage(options);
    return message
  };
  MessageHandler.prototype.removeRoute = function(sender, receiver) {
    var session = [sender, receiver];
    session.join("->");
    if(this.clients[session]) {
      this.clients[session] = null
    }
  };
  MessageHandler.prototype.write = function(rpc, respto, msgid) {
    var options = {};
    options.to = respto;
    options.resp_to = respto;
    options.from = this.ownId;
    if(typeof msgid !== undefined && msgid != null) {
      options.id = msgid
    }else {
      msgid = 1 + Math.floor(Math.random() * 1024)
    }
    if(typeof rpc.jsonrpc !== "undefined") {
      options.type = "JSONRPC"
    }
    options.payload = rpc;
    var message = this.createMessage(options);
    if(message.to !== undefined) {
      var to = message.to;
      var session1 = [to, this.self];
      session1.join("->");
      var session2 = [this.self, to];
      session2.join("->");
      if(!this.clients[session1] && !this.clients[session2]) {
        console.log("MSGHANDLER:  session not set up");
        var occurences = message.to.split(this.separator).length - 1;
        var data = message.to.split(this.separator);
        var id = data[0];
        var forwardto = data[0];
        for(var i = 1;i < occurences;i++) {
          id = id + this.separator + data[i];
          var new_session1 = [id, this.self];
          new_session1.join("->");
          var new_session2 = [this.self, id];
          new_session2.join("->");
          if(this.clients[new_session1] || this.clients[new_session2]) {
            forwardto = id;
            console.log("MSGHANDLER:  forwardto", forwardto)
          }
        }
        this.sendMsg(message, forwardto, this.objectRef)
      }else {
        if(this.clients[session2]) {
          console.log("MSGHANDLER:  clients[session2]:" + this.clients[session2]);
          this.sendMsg(message, this.clients[session2], this.objectRef)
        }else {
          if(this.clients[session1]) {
            console.log("MSGHANDLER:  clients[session1]:" + this.clients[session1]);
            this.sendMsg(message, this.clients[session1], this.objectRef)
          }
        }
      }
    }
  };
  MessageHandler.prototype.onMessageReceived = function(message, sessionid) {
    if(typeof message === "string") {
      message = JSON.parse(message)
    }
    if(message.hasOwnProperty("register") && message.register) {
      var from = message.from;
      var to = message.to;
      if(to !== undefined) {
        var regid = [from, to];
        regid.join("->");
        if(message.from) {
          this.clients[regid] = message.from
        }else {
          if(sessionid) {
            this.clients[regid] = sessionid
          }
        }
        logObj(message, "register Message")
      }
      return
    }else {
      if(message.hasOwnProperty("to") && message.to) {
        this.self = this.ownId;
        if(message.to !== this.self) {
          logObj(message, "forward Message");
          var to = message.to;
          var session1 = [to, this.self];
          session1.join("->");
          var session2 = [this.self, to];
          session2.join("->");
          if(!this.clients[session1] && !this.clients[session2]) {
            logObj(message, "Sender, receiver not registered either way");
            var occurences = message.to.split(this.separator).length - 1;
            var data = message.to.split(this.separator);
            var id = data[0];
            var forwardto = data[0];
            for(var i = 1;i < occurences;i++) {
              id = id + this.separator + data[i];
              var new_session1 = [id, this.self];
              new_session1.join("->");
              var new_session2 = [this.self, id];
              new_session2.join("->");
              if(this.clients[new_session1] || this.clients[new_session2]) {
                forwardto = id
              }
            }
            this.sendMsg(message, forwardto, this.objectRef)
          }else {
            if(this.clients[session2]) {
              this.sendMsg(message, this.clients[session2], this.objectRef)
            }else {
              if(this.clients[session1]) {
                this.sendMsg(message, this.clients[session1], this.objectRef)
              }
            }
          }
          return
        }else {
          if(message.payload) {
            if(message.to != message.resp_to) {
              console.log(message.payload);
              var from = message.from;
              var msgid = message.id;
              this.rpcHandler.handleMessage(message.payload, from, msgid)
            }else {
              if(typeof message.payload.method !== "undefined") {
                logObj(message, "Message forwarded to RPC to handle callback");
                var from = message.from;
                var msgid = message.id;
                this.rpcHandler.handleMessage(message.payload, from, msgid)
              }else {
                if(typeof message.payload.result !== "undefined" || typeof message.payload.error !== "undefined") {
                  this.rpcHandler.handleMessage(message.payload)
                }
              }
              if(this.messageCallbacks[message.id]) {
                this.messageCallbacks[message.id].onSuccess(message.payload.result)
              }
            }
          }else {
          }
          return
        }
        return
      }
    }
  };
  if(typeof exports !== "undefined") {
    exports.MessageHandler = MessageHandler
  }else {
    this.MessageHandler = MessageHandler
  }
})();
(function() {
  webinos.session = {};
  var sessionid = null;
  var pzpId, pzhId;
  var serviceLocation;
  var listenerMap = {};
  var channel;
  webinos.session.setChannel = function(channel1) {
    channel = channel1
  };
  webinos.session.message_send_messaging = function(msg, to) {
    msg.resp_to = webinos.session.getSessionId();
    channel.send(JSON.stringify(msg))
  };
  webinos.session.message_send = function(rpc, to) {
    var type, id = Math.floor(Math.random() * 101);
    if(rpc.type !== undefined && rpc.type === "prop") {
      type = "prop";
      rpc = rpc.payload
    }else {
      type = "JSONRPC"
    }
    if(typeof rpc.method !== undefined && rpc.method === "ServiceDiscovery.findServices") {
      id = rpc.params[2]
    }
    var message = {"type":type, "id":id, "from":webinos.session.getSessionId(), "to":to, "resp_to":webinos.session.getSessionId(), "payload":rpc};
    if(rpc.register !== "undefined" && rpc.register === true) {
      console.log(rpc);
      channel.send(JSON.stringify(rpc))
    }else {
      console.log("creating callback");
      console.log("WebSocket Client: Message Sent");
      console.log(message);
      channel.send(JSON.stringify(message))
    }
  };
  webinos.session.setServiceLocation = function(loc) {
    serviceLocation = loc
  };
  webinos.session.getServiceLocation = function() {
    if(typeof serviceLocation !== "undefined") {
      return serviceLocation
    }else {
      return pzpId
    }
  };
  webinos.session.getSessionId = function() {
    return sessionid
  };
  webinos.session.getPZPId = function() {
    return pzpId
  };
  webinos.session.getPZHId = function() {
    return pzhId
  };
  webinos.session.getOtherPZP = function() {
    return otherpzp
  };
  webinos.session.addListener = function(statusType, listener) {
    var listeners = listenerMap[statusType] || [];
    listeners.push(listener);
    listenerMap[statusType] = listeners;
    return listeners.length
  };
  webinos.session.removeListener = function(statusType, id) {
    var listeners = listenerMap[statusType] || [];
    try {
      listeners[id - 1] = undefined
    }catch(e) {
    }
  };
  function callListenerForMsg(data) {
    var listeners = listenerMap[data.payload.status] || [];
    for(var i = 0;i < listeners.length;i++) {
      listeners[i](data)
    }
  }
  webinos.session.handleMsg = function(data) {
    switch(data.payload.status) {
      case "registeredBrowser":
        sessionid = data.to;
        pzpId = data.from;
        if(typeof data.payload.message !== "undefined" && data.from !== "virgin_pzp") {
          pzhId = data.payload.message.pzhId
        }
        callListenerForMsg(data);
        webinos.messageHandler.setGetOwnId(sessionid);
        var msg = webinos.messageHandler.registerSender(sessionid, pzpId);
        webinos.session.message_send(msg, pzpId);
        break;
      case "update":
        if(data.type === "prop") {
          callListenerForMsg(data)
        }
        break;
      case "info":
      ;
      case "listPzh":
      ;
      case "listAllPzps":
      ;
      case "crashLog":
      ;
      case "addPzpQR":
        callListenerForMsg(data);
        break
    }
  }
})();
(function() {
  if(typeof webinos === "undefined") {
    webinos = {}
  }
  var channel = null;
  function createCommChannel(successCB) {
    try {
      channel = new WebinosSocket
    }catch(e1) {
      try {
        var port = parseInt(location.port) + 1;
        if(isNaN(port)) {
          port = 81
        }
        var host = window.location.hostname;
        if(!host) {
          host = "localhost";
          port = 8081
        }
        channel = new WebSocket("ws://" + host + ":" + port)
      }catch(e2) {
        channel = new MozWebSocket("ws://" + window.location.hostname + ":" + port)
      }
    }
    webinos.session.setChannel(channel);
    channel.onmessage = function(ev) {
      console.log("WebSocket Client: Message Received : " + JSON.stringify(ev.data));
      var data = JSON.parse(ev.data);
      if(data.type === "prop") {
        webinos.session.handleMsg(data)
      }else {
        webinos.messageHandler.setGetOwnId(webinos.session.getSessionId());
        webinos.messageHandler.setObjectRef(this);
        webinos.messageHandler.setSendMessage(webinos.session.message_send_messaging);
        webinos.messageHandler.onMessageReceived(data, data.to)
      }
    }
  }
  createCommChannel();
  if(typeof webinos === "undefined") {
    webinos = {}
  }
  webinos.rpcHandler = new RPCHandler;
  webinos.messageHandler = new MessageHandler(webinos.rpcHandler);
  function logObj(obj, name) {
    for(var myKey in obj) {
      console.log(name + "[" + myKey + "] = " + obj[myKey]);
      if(typeof obj[myKey] == "object") {
        logObj(obj[myKey], name + "." + myKey)
      }
    }
  }
  webinos.ServiceDiscovery = {};
  webinos.ServiceDiscovery.registeredServices = 0;
  webinos.ServiceDiscovery.findServices = function(serviceType, callback) {
    if(serviceType == "BlobBuilder") {
      var tmp = new BlobBuilder;
      webinos.ServiceDiscovery.registeredServices++;
      callback.onFound(tmp);
      return
    }
    function success(params) {
      var baseServiceObj = params;
      console.log("servicedisco: service found.");
      $("#message").append("<li> Found Service: " + baseServiceObj.api + "</li>");
      var typeMap = {};
      if(typeof webinos.file !== "undefined" && typeof webinos.file.LocalFileSystem !== "undefined") {
        typeMap["http://webinos.org/api/file"] = webinos.file.LocalFileSystem
      }
      if(typeof TestModule !== "undefined") {
        typeMap["http://webinos.org/api/test"] = TestModule
      }
      if(typeof oAuthModule !== "undefined") {
        typeMap["http://webinos.org/mwc/oauth"] = oAuthModule
      }
      if(typeof WebinosGeolocation !== "undefined") {
        typeMap["http://www.w3.org/ns/api-perms/geolocation"] = WebinosGeolocation
      }
      if(typeof WebinosDeviceOrientation !== "undefined") {
        typeMap["http://webinos.org/api/deviceorientation"] = WebinosDeviceOrientation
      }
      if(typeof Vehicle !== "undefined") {
        typeMap["http://webinos.org/api/vehicle"] = Vehicle
      }
      if(typeof EventsModule !== "undefined") {
        typeMap["http://webinos.org/api/events"] = EventsModule
      }
      if(typeof AppLauncherModule !== "undefined") {
        typeMap["http://webinos.org/api/applauncher"] = AppLauncherModule
      }
      if(typeof Sensor !== "undefined") {
        typeMap["http://webinos.org/api/sensors"] = Sensor;
        typeMap["http://webinos.org/api/sensors.temperature"] = Sensor
      }
      if(typeof PaymentManager !== "undefined") {
        typeMap["http://webinos.org/api/payment"] = PaymentManager
      }
      if(typeof UserProfileIntModule !== "undefined") {
        typeMap["UserProfileInt"] = UserProfileIntModule
      }
      if(typeof TVManager !== "undefined") {
        typeMap["http://webinos.org/api/tv"] = TVManager
      }
      if(typeof DeviceStatusManager !== "undefined") {
        typeMap["http://wacapps.net/api/devicestatus"] = DeviceStatusManager
      }
      if(typeof Contacts !== "undefined") {
        typeMap["http://www.w3.org/ns/api-perms/contacts"] = Contacts
      }
      if(typeof Context !== "undefined") {
        typeMap["http://webinos.org/api/context"] = Context
      }
      if(typeof BluetoothManager !== "undefined") {
        typeMap["http://webinos.org/api/discovery"] = BluetoothManager
      }
      if(typeof AuthenticationModule !== "undefined") {
        typeMap["http://webinos.org/api/authentication"] = AuthenticationModule
      }
      console.log(typeMap);
      console.log(baseServiceObj);
      var serviceConstructor = typeMap[baseServiceObj.api];
      if(typeof serviceConstructor !== "undefined") {
        var service = new serviceConstructor(baseServiceObj);
        webinos.ServiceDiscovery.registeredServices++;
        callback.onFound(service)
      }else {
        var serviceErrorMsg = "Cannot instantiate service in the browser.";
        console.log(serviceErrorMsg);
        if(typeof callback.onError === "function") {
          callback.onError(new DiscoveryError(102, serviceErrorMsg))
        }
      }
    }
    var id = Math.floor(Math.random() * 1001);
    var rpc = webinos.rpcHandler.createRPC("ServiceDiscovery", "findServices", [serviceType, webinos.session.getSessionId(), id]);
    rpc.fromObjectRef = Math.floor(Math.random() * 101);
    var callback2 = new RPCWebinosService({api:rpc.fromObjectRef});
    callback2.onservicefound = function(params, successCallback, errorCallback, objectRef) {
      success(params)
    };
    webinos.rpcHandler.registerCallbackObject(callback2);
    rpc.serviceAddress = webinos.session.getServiceLocation();
    webinos.rpcHandler.executeRPC(rpc);
    return
  };
  var DiscoveryError = function(code, message) {
    this.code = code;
    this.message = message
  };
  DiscoveryError.prototype.FIND_SERVICE_CANCELED = 101;
  DiscoveryError.prototype.FIND_SERVICE_TIMEOUT = 102;
  DiscoveryError.prototype.PERMISSION_DENIED_ERROR = 103;
  WebinosService = function(obj) {
    this.base = RPCWebinosService;
    this.base(obj)
  };
  WebinosService.prototype = new RPCWebinosService;
  WebinosService.prototype.state = "";
  WebinosService.prototype.icon = "";
  WebinosService.prototype.bindService = function(bindCB) {
    if(typeof bindCB === "undefined") {
      return
    }
    if(typeof bindCB.onBind === "function") {
      bindCB.onBind(this)
    }
  };
  WebinosService.prototype.unbind = function() {
    webinos.ServiceDiscovery.registeredServices--;
    if(channel != null && webinos.ServiceDiscovery.registeredServices > 0) {
      channel.close();
      channel = null
    }
  }
})();
if(typeof module === "undefined") {
  if(typeof webinos === "undefined") {
    webinos = {}
  }
  if(typeof webinos.utils === "undefined") {
    webinos.utils = {}
  }
}
(function(exports) {
  if(!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
      if(typeof this !== "function") {
        throw new TypeError("Function.prototype.bind - what is trying to be fBound is not callable");
      }
      var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, fNOP = function() {
      }, fBound = function() {
        return fToBind.apply(this instanceof fNOP ? this : oThis || window, aArgs.concat(Array.prototype.slice.call(arguments)))
      };
      fNOP.prototype = this.prototype;
      fBound.prototype = new fNOP;
      return fBound
    }
  }
  exports.bind = function(fun, thisArg) {
    return fun.bind(thisArg)
  };
  exports.callback = function(fun, thisArg) {
    if(typeof fun !== "function") {
      return function() {
      }
    }
    return exports.bind(fun, thisArg)
  };
  exports.inherits = function(constructor, superConstructor) {
    constructor.prototype = Object.create(superConstructor.prototype, {constructor:{value:constructor, enumerable:false, writable:true, configurable:true}})
  };
  exports.DoublyLinkedList = function(compare) {
    this.compare = compare
  };
  exports.DoublyLinkedList.prototype.head = null;
  exports.DoublyLinkedList.prototype.tail = null;
  exports.DoublyLinkedList.prototype.append = function(data) {
    var node = new exports.DoublyLinkedNode(data, this.tail, null);
    if(this.head === null) {
      this.head = node
    }
    if(this.tail !== null) {
      this.tail.next = node
    }
    this.tail = node;
    return node
  };
  exports.DoublyLinkedList.prototype.insert = function(data) {
    var current = this.head;
    while(current !== null && this.compare(data, current.data) > 0) {
      current = current.next
    }
    if(current === null) {
      return this.append(data)
    }
    var node = new exports.DoublyLinkedNode(data, current.prev, current);
    if(current.prev === null) {
      this.head = node
    }else {
      current.prev.next = node
    }
    current.prev = node;
    return node
  };
  exports.DoublyLinkedList.prototype.find = function(data) {
    var current = this.head;
    while(current !== null && this.compare(data, current.data) != 0) {
      current = current.next
    }
    return current
  };
  exports.DoublyLinkedList.prototype.remove = function(node) {
    if(node.prev === null) {
      this.head = node.next
    }else {
      node.prev.next = node.next
    }
    if(node.next === null) {
      this.tail = node.prev
    }else {
      node.next.prev = node.prev
    }
  };
  exports.DoublyLinkedList.prototype.empty = function() {
    this.head = null;
    this.tail = null
  };
  exports.DoublyLinkedNode = function(data, prev, next) {
    this.data = data;
    this.prev = prev;
    this.next = next
  }
})(typeof module === "undefined" ? webinos.utils : module.exports);
var MD5_T = new Array(0, 3614090360, 3905402710, 606105819, 3250441966, 4118548399, 1200080426, 2821735955, 4249261313, 1770035416, 2336552879, 4294925233, 2304563134, 1804603682, 4254626195, 2792965006, 1236535329, 4129170786, 3225465664, 643717713, 3921069994, 3593408605, 38016083, 3634488961, 3889429448, 568446438, 3275163606, 4107603335, 1163531501, 2850285829, 4243563512, 1735328473, 2368359562, 4294588738, 2272392833, 1839030562, 4259657740, 2763975236, 1272893353, 4139469664, 3200236656, 681279174, 
3936430074, 3572445317, 76029189, 3654602809, 3873151461, 530742520, 3299628645, 4096336452, 1126891415, 2878612391, 4237533241, 1700485571, 2399980690, 4293915773, 2240044497, 1873313359, 4264355552, 2734768916, 1309151649, 4149444226, 3174756917, 718787259, 3951481745);
var MD5_round1 = new Array(new Array(0, 7, 1), new Array(1, 12, 2), new Array(2, 17, 3), new Array(3, 22, 4), new Array(4, 7, 5), new Array(5, 12, 6), new Array(6, 17, 7), new Array(7, 22, 8), new Array(8, 7, 9), new Array(9, 12, 10), new Array(10, 17, 11), new Array(11, 22, 12), new Array(12, 7, 13), new Array(13, 12, 14), new Array(14, 17, 15), new Array(15, 22, 16));
var MD5_round2 = new Array(new Array(1, 5, 17), new Array(6, 9, 18), new Array(11, 14, 19), new Array(0, 20, 20), new Array(5, 5, 21), new Array(10, 9, 22), new Array(15, 14, 23), new Array(4, 20, 24), new Array(9, 5, 25), new Array(14, 9, 26), new Array(3, 14, 27), new Array(8, 20, 28), new Array(13, 5, 29), new Array(2, 9, 30), new Array(7, 14, 31), new Array(12, 20, 32));
var MD5_round3 = new Array(new Array(5, 4, 33), new Array(8, 11, 34), new Array(11, 16, 35), new Array(14, 23, 36), new Array(1, 4, 37), new Array(4, 11, 38), new Array(7, 16, 39), new Array(10, 23, 40), new Array(13, 4, 41), new Array(0, 11, 42), new Array(3, 16, 43), new Array(6, 23, 44), new Array(9, 4, 45), new Array(12, 11, 46), new Array(15, 16, 47), new Array(2, 23, 48));
var MD5_round4 = new Array(new Array(0, 6, 49), new Array(7, 10, 50), new Array(14, 15, 51), new Array(5, 21, 52), new Array(12, 6, 53), new Array(3, 10, 54), new Array(10, 15, 55), new Array(1, 21, 56), new Array(8, 6, 57), new Array(15, 10, 58), new Array(6, 15, 59), new Array(13, 21, 60), new Array(4, 6, 61), new Array(11, 10, 62), new Array(2, 15, 63), new Array(9, 21, 64));
function MD5_F(x, y, z) {
  return x & y | ~x & z
}
function MD5_G(x, y, z) {
  return x & z | y & ~z
}
function MD5_H(x, y, z) {
  return x ^ y ^ z
}
function MD5_I(x, y, z) {
  return y ^ (x | ~z)
}
var MD5_round = new Array(new Array(MD5_F, MD5_round1), new Array(MD5_G, MD5_round2), new Array(MD5_H, MD5_round3), new Array(MD5_I, MD5_round4));
function MD5_pack(n32) {
  return String.fromCharCode(n32 & 255) + String.fromCharCode(n32 >>> 8 & 255) + String.fromCharCode(n32 >>> 16 & 255) + String.fromCharCode(n32 >>> 24 & 255)
}
function MD5_unpack(s4) {
  return s4.charCodeAt(0) | s4.charCodeAt(1) << 8 | s4.charCodeAt(2) << 16 | s4.charCodeAt(3) << 24
}
function MD5_number(n) {
  while(n < 0) {
    n += 4294967296
  }
  while(n > 4294967295) {
    n -= 4294967296
  }
  return n
}
function MD5_apply_round(x, s, f, abcd, r) {
  var a, b, c, d;
  var kk, ss, ii;
  var t, u;
  a = abcd[0];
  b = abcd[1];
  c = abcd[2];
  d = abcd[3];
  kk = r[0];
  ss = r[1];
  ii = r[2];
  u = f(s[b], s[c], s[d]);
  t = s[a] + u + x[kk] + MD5_T[ii];
  t = MD5_number(t);
  t = t << ss | t >>> 32 - ss;
  t += s[b];
  s[a] = MD5_number(t)
}
function MD5_hash(data) {
  var abcd, x, state, s;
  var len, index, padLen, f, r;
  var i, j, k;
  var tmp;
  state = new Array(1732584193, 4023233417, 2562383102, 271733878);
  len = data.length;
  index = len & 63;
  padLen = index < 56 ? 56 - index : 120 - index;
  if(padLen > 0) {
    data += "\u0080";
    for(i = 0;i < padLen - 1;i++) {
      data += "\0"
    }
  }
  data += MD5_pack(len * 8);
  data += MD5_pack(0);
  len += padLen + 8;
  abcd = new Array(0, 1, 2, 3);
  x = new Array(16);
  s = new Array(4);
  for(k = 0;k < len;k += 64) {
    for(i = 0, j = k;i < 16;i++, j += 4) {
      x[i] = data.charCodeAt(j) | data.charCodeAt(j + 1) << 8 | data.charCodeAt(j + 2) << 16 | data.charCodeAt(j + 3) << 24
    }
    for(i = 0;i < 4;i++) {
      s[i] = state[i]
    }
    for(i = 0;i < 4;i++) {
      f = MD5_round[i][0];
      r = MD5_round[i][1];
      for(j = 0;j < 16;j++) {
        MD5_apply_round(x, s, f, abcd, r[j]);
        tmp = abcd[0];
        abcd[0] = abcd[3];
        abcd[3] = abcd[2];
        abcd[2] = abcd[1];
        abcd[1] = tmp
      }
    }
    for(i = 0;i < 4;i++) {
      state[i] += s[i];
      state[i] = MD5_number(state[i])
    }
  }
  return MD5_pack(state[0]) + MD5_pack(state[1]) + MD5_pack(state[2]) + MD5_pack(state[3])
}
function MD5_hexhash(data) {
  var i, out, c;
  var bit128;
  bit128 = MD5_hash(data);
  out = "";
  for(i = 0;i < 16;i++) {
    c = bit128.charCodeAt(i);
    out += "0123456789abcdef".charAt(c >> 4 & 15);
    out += "0123456789abcdef".charAt(c & 15)
  }
  return out
}
if(typeof exports !== "undefined") {
  exports.hash = MD5_hash;
  exports.hexhash = MD5_hexhash
}
;if(typeof module === "undefined") {
  if(typeof webinos === "undefined") {
    webinos = {}
  }
  if(typeof webinos.path === "undefined") {
    webinos.path = {}
  }
}
(function(exports) {
  var mUtils = {};
  mUtils.split = function(path) {
    var result = /^(\/?)([\s\S]+\/(?!$)|\/)?((?:[\s\S]+?)?(\.[^.]*)?)$/.exec(path);
    return[result[1] || "", result[2] || "", result[3] || "", result[4] || ""]
  };
  mUtils.normalizeArray = function(parts, allowAboveRoot) {
    var up = 0;
    for(var i = parts.length - 1;i >= 0;i--) {
      var last = parts[i];
      if(last == ".") {
        parts.splice(i, 1)
      }else {
        if(last == "..") {
          parts.splice(i, 1);
          up++
        }else {
          if(up) {
            parts.splice(i, 1);
            up--
          }
        }
      }
    }
    if(allowAboveRoot) {
      for(;up--;) {
        parts.unshift("..")
      }
    }
    return parts
  };
  exports.dirname = function(path) {
    var result = mUtils.split(path), root = result[0], dir = result[1];
    if(!root && !dir) {
      return"."
    }
    if(dir) {
      dir = dir.substring(0, dir.length - 1)
    }
    return root + dir
  };
  exports.basename = function(path, ext) {
    var base = mUtils.split(path)[2];
    if(ext && base.substr(-1 * ext.length) === ext) {
      base = base.substr(0, base.length - ext.length)
    }
    return base
  };
  exports.extname = function(path) {
    return mUtils.split(path)[3]
  };
  exports.normalize = function(path, preserveTrailingSlash) {
    var isAbsolute = path.charAt(0) == "/", trailingSlash = path.charAt(path.length - 1) == "/";
    path = mUtils.normalizeArray(path.split("/").filter(function(p) {
      return!!p
    }), !isAbsolute).join("/");
    if(!path && !isAbsolute) {
      path = "."
    }
    if(path && trailingSlash && preserveTrailingSlash) {
      path += "/"
    }
    return(isAbsolute ? "/" : "") + path
  };
  exports.equals = function(path1, path2) {
    return exports.normalize(path1, false) == exports.normalize(path2, false)
  };
  exports.join = function() {
    var paths = Array.prototype.slice.call(arguments, 0);
    return exports.normalize(paths.filter(function(p) {
      return typeof p === "string" && p
    }, false).join("/"))
  };
  exports.isAbsolute = function(path) {
    return path.charAt(0) == "/"
  };
  exports.isPrefixOf = function(path1, path2) {
    var path1Parts = exports.normalize(path1).split("/"), path2Parts = exports.normalize(path2).split("/");
    if(path2Parts.length < path1Parts.length) {
      return false
    }
    for(var i = 0;i < path1Parts.length;i++) {
      if(path1Parts[i] != path2Parts[i]) {
        return false
      }
    }
    return true
  };
  exports.resolve = function() {
    var resolvedPath = "", resolvedAbsolute = false;
    for(var i = arguments.length - 1;i >= 0 && !resolvedAbsolute;i--) {
      var path = arguments[i];
      if(typeof path !== "string" || !path) {
        continue
      }
      resolvedPath = path + "/" + resolvedPath;
      resolvedAbsolute = path.charAt(0) == "/"
    }
    resolvedPath = mUtils.normalizeArray(resolvedPath.split("/").filter(function(p) {
      return!!p
    }), !resolvedAbsolute).join("/");
    return(resolvedAbsolute ? "/" : "") + resolvedPath || "."
  };
  exports.relative = function(from, to) {
    var fromParts = exports.normalize(from).split("/"), toParts = exports.normalize(to).split("/");
    var length = Math.min(fromParts.length, toParts.length), samePartsLength = length;
    for(var i = 0;i < length;i++) {
      if(fromParts[i] != toParts[i]) {
        samePartsLength = i;
        break
      }
    }
    var outputParts = [];
    for(var i = samePartsLength;i < fromParts.length;i++) {
      outputParts.push("..")
    }
    outputParts = outputParts.concat(toParts.slice(samePartsLength));
    return outputParts.join("/")
  }
})(typeof module === "undefined" ? webinos.path : module.exports);
if(typeof webinos === "undefined") {
  webinos = {}
}
if(typeof webinos.file === "undefined") {
  webinos.file = {}
}
(function(exports) {
  var dom = {};
  dom.ProgressEvent = {};
  dom.ProgressEvent.deserialize = function(object, target) {
    object.target = target;
    object.currentTarget = target;
    return object
  };
  exports.Blob = function() {
  };
  exports.Blob.serialize = function(blob) {
    var object = {type:blob.type};
    if(blob instanceof exports.Buffer) {
      object._type = "buffer"
    }else {
      if(blob instanceof exports.File) {
        object._type = "file";
        object.name = blob.name;
        object.lastModifiedDate = blob.lastModifiedDate;
        object._entry = exports.Entry.serialize(blob._entry);
        object._size = blob._size;
        object._start = blob._start;
        object._end = blob._end
      }
    }
    return object
  };
  exports.Blob.deserialize = function(service, object) {
    switch(object._type) {
      case "buffer":
        return null;
      case "file":
        var blob = new exports.File(exports.Entry.deserialize(service, object._entry), object._size, object._start, object._end, object.type);
        blob.lastModifiedDate = object.lastModifiedDate;
        return blob
    }
  };
  exports.Blob.prototype.size = 0;
  exports.Blob.prototype.type = "";
  exports.Buffer = function(buffer, contentType) {
    exports.Blob.call(this)
  };
  webinos.utils.inherits(exports.Buffer, exports.Blob);
  exports.Buffer.prototype.slice = function(start, end, contentType) {
  };
  exports.File = function(entry, size, start, end, contentType) {
    exports.Blob.call(this);
    var relativeStart = 0, relativeEnd = size, relativeContentType = "";
    if(typeof start === "number") {
      if(start < 0) {
        relativeStart = Math.max(size + start, 0)
      }else {
        relativeStart = Math.min(start, size)
      }
    }
    if(typeof end === "number") {
      if(end < 0) {
        relativeEnd = Math.max(size + end, 0)
      }else {
        relativeEnd = Math.min(end, size)
      }
    }
    if(typeof contentType === "string") {
      relativeContentType = contentType
    }
    var span = Math.max(relativeEnd - relativeStart, 0);
    this.name = entry.name;
    this.size = span;
    this.type = relativeContentType;
    this.lastModifiedDate = 0;
    this._entry = entry;
    this._size = size;
    this._start = relativeStart;
    this._end = relativeEnd
  };
  webinos.utils.inherits(exports.File, exports.Blob);
  exports.File.prototype.slice = function(start, end, contentType) {
    var relativeStart = 0, relativeEnd = this.size;
    if(typeof start === "number") {
      if(start < 0) {
        relativeStart = Math.max(this.size + start, 0)
      }else {
        relativeStart = Math.min(start, this.size)
      }
    }
    if(typeof end === "number") {
      if(end < 0) {
        relativeEnd = Math.max(this.size + end, 0)
      }else {
        relativeEnd = Math.min(end, this.size)
      }
    }
    return new exports.File(this._entry, this._size, this._start + relativeStart, this._start + relativeEnd, contentType)
  };
  exports.FileReader = function(filesystem) {
    this._filesystem = filesystem
  };
  exports.FileReader.EMPTY = 0;
  exports.FileReader.LOADING = 1;
  exports.FileReader.DONE = 2;
  exports.FileReader.prototype.readyState = exports.FileReader.EMPTY;
  exports.FileReader.prototype.result = null;
  exports.FileReader.prototype.error = undefined;
  exports.FileReader.prototype.readAsArrayBuffer = function(blob) {
  };
  exports.FileReader.prototype.readAsText = function(blob, encoding) {
    var eventListener = new RPCWebinosService({api:Math.floor(Math.random() * 100)});
    var eventCallback = function(attributeFun) {
      return function(params, successCallback, errorCallback) {
        this.readyState = params[0].readyState;
        this.result = params[0].result;
        this.error = params[0].error;
        attributeFun.call(this)(dom.ProgressEvent.deserialize(params[1], this))
      }
    };
    eventListener.onloadstart = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onloadstart, this)
    }), this);
    eventListener.onprogress = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onprogress, this)
    }), this);
    eventListener.onerror = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onerror, this)
    }), this);
    eventListener.onabort = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onabort, this)
    }), this);
    eventListener.onload = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onload, this)
    }), this);
    eventListener.onloadend = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onloadend, this)
    }), this);
    webinos.rpcHandler.registerCallbackObject(eventListener);
    webinos.rpcHandler.notify(this._filesystem._service, "readAsText", eventListener.api)(exports.Blob.serialize(blob), encoding)
  };
  exports.FileReader.prototype.readAsDataURL = function(blob) {
  };
  exports.FileReader.prototype.abort = function() {
    throw new DOMException("NotSupportedError", "aborting is not supported");
  };
  exports.BlobBuilder = function() {
  };
  exports.BlobBuilder.prototype._contents = [];
  exports.BlobBuilder.prototype._contentsLength = 0;
  exports.BlobBuilder.prototype.append = function(data, endings) {
  };
  exports.BlobBuilder.prototype.getBlob = function(contentType) {
  };
  exports.FileWriter = function(entry) {
    this.length = 0;
    this._entry = entry
  };
  exports.FileWriter.INIT = 0;
  exports.FileWriter.WRITING = 1;
  exports.FileWriter.DONE = 2;
  exports.FileWriter.serialize = function(writer) {
    return{readyState:writer.readyState, error:writer.error ? exports.FileError.serialize(writer.error) : null, position:writer.position, length:writer.length, _entry:exports.Entry.serialize(writer._entry)}
  };
  exports.FileWriter.deserialize = function(service, object) {
    var writer = new exports.FileWriter(exports.Entry.deserialize(service, object._entry));
    writer.readyState = object.readyState;
    writer.error = object.error;
    writer.position = object.position;
    writer.length = object.length;
    return writer
  };
  exports.FileWriter.prototype.readyState = exports.FileWriter.INIT;
  exports.FileWriter.prototype.error = undefined;
  exports.FileWriter.prototype.position = 0;
  exports.FileWriter.prototype.length = 0;
  exports.FileWriter.prototype.write = function(data) {
    var eventListener = new RPCWebinosService({api:Math.floor(Math.random() * 100)});
    var eventCallback = function(attributeFun) {
      return function(params, successCallback, errorCallback) {
        this.readyState = params[0].readyState;
        this.error = params[0].error ? exports.FileError.deserialize(params[0].error) : null;
        this.position = params[0].position;
        this.length = params[0].length;
        attributeFun.call(this)(dom.ProgressEvent.deserialize(params[1], this))
      }
    };
    eventListener.onwritestart = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onwritestart, this)
    }), this);
    eventListener.onprogress = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onprogress, this)
    }), this);
    eventListener.onerror = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onerror, this)
    }), this);
    eventListener.onabort = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onabort, this)
    }), this);
    eventListener.onwrite = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onwrite, this)
    }), this);
    eventListener.onwriteend = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onwriteend, this)
    }), this);
    webinos.rpcHandler.registerCallbackObject(eventListener);
    webinos.rpcHandler.notify(this._entry.filesystem._service, "write", eventListener.api)(exports.FileWriter.serialize(this), exports.Blob.serialize(data))
  };
  exports.FileWriter.prototype.seek = function(offset) {
    if(this.readyState == exports.FileWriter.WRITING) {
      throw new exports.FileException(exports.FileException.INVALID_STATE_ERR);
    }
    if(offset >= 0) {
      this.position = Math.min(offset, this.length)
    }else {
      this.position = Math.max(this.length + offset, 0)
    }
  };
  exports.FileWriter.prototype.truncate = function(size) {
    var eventListener = new RPCWebinosService({api:Math.floor(Math.random() * 100)});
    var eventCallback = function(attributeFun) {
      return function(params, successCallback, errorCallback) {
        this.readyState = params[0].readyState;
        this.error = params[0].error ? exports.FileError.deserialize(params[0].error) : null;
        this.position = params[0].position;
        this.length = params[0].length;
        attributeFun.call(this)(dom.ProgressEvent.deserialize(params[1], this))
      }
    };
    eventListener.onwritestart = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onwritestart, this)
    }), this);
    eventListener.onprogress = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onprogress, this)
    }), this);
    eventListener.onerror = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onerror, this)
    }), this);
    eventListener.onabort = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onabort, this)
    }), this);
    eventListener.onwrite = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onwrite, this)
    }), this);
    eventListener.onwriteend = webinos.utils.bind(eventCallback(function() {
      return webinos.utils.callback(this.onwriteend, this)
    }), this);
    webinos.rpcHandler.registerCallbackObject(eventListener);
    webinos.rpcHandler.notify(this._entry.filesystem._service, "truncate", eventListener.api)(exports.FileWriter.serialize(this), size)
  };
  exports.FileWriter.prototype.abort = function() {
    throw new exports.FileException(exports.FileException.SECURITY_ERR);
  };
  exports.LocalFileSystem = function(object) {
    WebinosService.call(this, object)
  };
  exports.LocalFileSystem.TEMPORARY = 0;
  exports.LocalFileSystem.PERSISTENT = 1;
  webinos.utils.inherits(exports.LocalFileSystem, WebinosService);
  exports.LocalFileSystem.prototype.requestFileSystem = function(type, size, successCallback, errorCallback) {
    webinos.utils.bind(webinos.rpcHandler.request(this, "requestFileSystem", null, function(result) {
      webinos.utils.callback(successCallback, this)(exports.FileSystem.deserialize(this, result))
    }, function(error) {
      webinos.utils.callback(errorCallback, this)(exports.FileError.deserialize(error))
    }), this)(type, size)
  };
  exports.LocalFileSystem.prototype.resolveLocalFileSystemURL = function(url, successCallback, errorCallback) {
    webinos.utils.bind(webinos.rpcHandler.request(this, "resolveLocalFileSystemURL", null, function(result) {
      webinos.utils.callback(successCallback, this)(exports.Entry.deserialize(this, result))
    }, function(error) {
      webinos.utils.callback(errorCallback, this)(exports.FileError.deserialize(error))
    }), this)(url)
  };
  exports.FileSystem = function(service, name, realPath) {
    this.name = name;
    this.root = new exports.DirectoryEntry(this, "/");
    this._service = service;
    this._realPath = realPath
  };
  exports.FileSystem.serialize = function(filesystem) {
    return{name:filesystem.name, _realPath:filesystem._realPath}
  };
  exports.FileSystem.deserialize = function(service, object) {
    return new exports.FileSystem(service, object.name, object._realPath)
  };
  exports.Entry = function(filesystem, fullPath) {
    this.filesystem = filesystem;
    this.name = webinos.path.basename(fullPath);
    this.fullPath = fullPath
  };
  exports.Entry.serialize = function(entry) {
    return{filesystem:exports.FileSystem.serialize(entry.filesystem), isFile:entry.isFile, isDirectory:entry.isDirectory, fullPath:entry.fullPath}
  };
  exports.Entry.deserialize = function(service, object) {
    var entry;
    if(object.isDirectory) {
      entry = new exports.DirectoryEntry(exports.FileSystem.deserialize(service, object.filesystem), object.fullPath)
    }else {
      if(object.isFile) {
        entry = new exports.FileEntry(exports.FileSystem.deserialize(service, object.filesystem), object.fullPath)
      }
    }
    entry._url = object._url;
    return entry
  };
  exports.Entry.prototype.isFile = false;
  exports.Entry.prototype.isDirectory = false;
  exports.Entry.prototype.resolve = function() {
    var argsArray = Array.prototype.slice.call(arguments);
    argsArray.unshift(this.fullPath);
    return webinos.path.resolve.apply(path, argsArray)
  };
  exports.Entry.prototype.relative = function(to) {
    return webinos.path.relative(this.fullPath, this.resolve(to))
  };
  exports.Entry.prototype.copyTo = function(parent, newName, successCallback, errorCallback) {
    webinos.utils.bind(webinos.rpcHandler.request(this.filesystem._service, "copyTo", null, function(result) {
      webinos.utils.callback(successCallback, this)(exports.Entry.deserialize(this.filesystem._service, result))
    }, function(error) {
      webinos.utils.callback(errorCallback, this)(exports.FileError.deserialize(error))
    }), this)(exports.Entry.serialize(this), exports.Entry.serialize(parent), newName)
  };
  exports.Entry.prototype.getMetadata = function(successCallback, errorCallback) {
    webinos.utils.bind(webinos.rpcHandler.request(this.filesystem._service, "getMetadata", null, function(result) {
      webinos.utils.callback(successCallback, this)(result)
    }, function(error) {
      webinos.utils.callback(errorCallback, this)(exports.FileError.deserialize(error))
    }), this)(exports.Entry.serialize(this))
  };
  exports.Entry.prototype.getParent = function(successCallback, errorCallback) {
    webinos.utils.bind(webinos.rpcHandler.request(this.filesystem._service, "getParent", null, function(result) {
      webinos.utils.callback(successCallback, this)(exports.Entry.deserialize(this.filesystem._service, result))
    }, function(error) {
      webinos.utils.callback(errorCallback, this)(exports.FileError.deserialize(error))
    }), this)(exports.Entry.serialize(this))
  };
  exports.Entry.prototype.moveTo = function(parent, newName, successCallback, errorCallback) {
    webinos.utils.bind(webinos.rpcHandler.request(this.filesystem._service, "moveTo", null, function(result) {
      webinos.utils.callback(successCallback, this)(exports.Entry.deserialize(this.filesystem._service, result))
    }, function(error) {
      webinos.utils.callback(errorCallback, this)(exports.FileError.deserialize(error))
    }), this)(exports.Entry.serialize(this), exports.Entry.serialize(parent), newName)
  };
  exports.Entry.prototype.remove = function(successCallback, errorCallback) {
    webinos.utils.bind(webinos.rpcHandler.request(this.filesystem._service, "remove", null, function(result) {
      webinos.utils.callback(successCallback, this)()
    }, function(error) {
      webinos.utils.callback(errorCallback, this)(exports.FileError.deserialize(error))
    }), this)(exports.Entry.serialize(this))
  };
  exports.Entry.prototype.toURL = function() {
    return this._url
  };
  exports.DirectoryEntry = function(filesystem, fullPath) {
    exports.Entry.call(this, filesystem, fullPath)
  };
  webinos.utils.inherits(exports.DirectoryEntry, exports.Entry);
  exports.DirectoryEntry.prototype.isDirectory = true;
  exports.DirectoryEntry.prototype.createReader = function() {
    return new exports.DirectoryReader(this)
  };
  exports.DirectoryEntry.prototype.isPrefixOf = function(fullPath) {
    return webinos.path.isPrefixOf(this.fullPath, fullPath)
  };
  exports.DirectoryEntry.prototype.getDirectory = function(path, options, successCallback, errorCallback) {
    webinos.utils.bind(webinos.rpcHandler.request(this.filesystem._service, "getDirectory", null, function(result) {
      webinos.utils.callback(successCallback, this)(exports.Entry.deserialize(this.filesystem._service, result))
    }, function(error) {
      webinos.utils.callback(errorCallback, this)(exports.FileError.deserialize(error))
    }), this)(exports.Entry.serialize(this), path, options)
  };
  exports.DirectoryEntry.prototype.getFile = function(path, options, successCallback, errorCallback) {
    webinos.utils.bind(webinos.rpcHandler.request(this.filesystem._service, "getFile", null, function(result) {
      webinos.utils.callback(successCallback, this)(exports.Entry.deserialize(this.filesystem._service, result))
    }, function(error) {
      webinos.utils.callback(errorCallback, this)(exports.FileError.deserialize(error))
    }), this)(exports.Entry.serialize(this), path, options)
  };
  exports.DirectoryEntry.prototype.removeRecursively = function(successCallback, errorCallback) {
    webinos.utils.bind(webinos.rpcHandler.request(this.filesystem._service, "removeRecursively", null, function(result) {
      webinos.utils.callback(successCallback, this)()
    }, function(error) {
      webinos.utils.callback(errorCallback, this)(exports.FileError.deserialize(error))
    }), this)(exports.Entry.serialize(this))
  };
  exports.DirectoryReader = function(entry) {
    this._entry = entry
  };
  exports.DirectoryReader.prototype._start = 0;
  exports.DirectoryReader.prototype.readEntries = function(successCallback, errorCallback) {
    webinos.utils.bind(webinos.rpcHandler.request(this._entry.filesystem._service, "readEntries", null, function(result) {
      this._start = result._start;
      webinos.utils.callback(successCallback, this)(result.entries.map(function(object) {
        return exports.Entry.deserialize(this._entry.filesystem._service, object)
      }, this))
    }, function(error) {
      webinos.utils.callback(errorCallback, this)(exports.FileError.deserialize(error))
    }), this)(exports.Entry.serialize(this._entry), this._start)
  };
  exports.FileEntry = function(filesystem, fullPath) {
    exports.Entry.call(this, filesystem, fullPath)
  };
  webinos.utils.inherits(exports.FileEntry, exports.Entry);
  exports.FileEntry.prototype.isFile = true;
  exports.FileEntry.prototype.createWriter = function(successCallback, errorCallback) {
    webinos.utils.bind(webinos.rpcHandler.request(this.filesystem._service, "createWriter", null, function(result) {
      webinos.utils.callback(successCallback, this)(exports.FileWriter.deserialize(this.filesystem._service, result))
    }, function(error) {
      webinos.utils.callback(errorCallback, this)(exports.FileError.deserialize(error))
    }), this)(exports.Entry.serialize(this))
  };
  exports.FileEntry.prototype.file = function(successCallback, errorCallback) {
    webinos.utils.bind(webinos.rpcHandler.request(this.filesystem._service, "file", null, function(result) {
      webinos.utils.callback(successCallback, this)(exports.Blob.deserialize(this.filesystem._service, result))
    }, function(error) {
      webinos.utils.callback(errorCallback, this)(exports.FileError.deserialize(error))
    }), this)(exports.Entry.serialize(this))
  };
  exports.FileError = function(code) {
    this.code = code
  };
  exports.FileError.deserialize = function(object) {
    return new exports.FileError(object.code)
  };
  exports.FileError.NOT_FOUND_ERR = 1;
  exports.FileError.SECURITY_ERR = 2;
  exports.FileError.ABORT_ERR = 3;
  exports.FileError.NOT_READABLE_ERR = 4;
  exports.FileError.ENCODING_ERR = 5;
  exports.FileError.NO_MODIFICATION_ALLOWED_ERR = 6;
  exports.FileError.INVALID_STATE_ERR = 7;
  exports.FileError.SYNTAX_ERR = 8;
  exports.FileError.INVALID_MODIFICATION_ERR = 9;
  exports.FileError.QUOTA_EXCEEDED_ERR = 10;
  exports.FileError.TYPE_MISMATCH_ERR = 11;
  exports.FileError.PATH_EXISTS_ERR = 12
})(webinos.file);
(function() {
  var TVDisplayManager, TVDisplaySuccessCB, TVTunerManager, TVSuccessCB, TVErrorCB, TVError, TVSource, Channel, ChannelChangeEvent;
  var that = this;
  TVDisplayManager = function() {
  };
  TVDisplayManager.prototype.setChannel = function(channel, successCallback, errorCallback) {
    var rpc = webinos.rpcHandler.createRPC(that, "display.setChannel", arguments);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      successCallback(params)
    }, function(error) {
      if(errorCallback) {
        errorCallback()
      }
    });
    return
  };
  TVDisplayManager.prototype.getEPGPIC = function(channel, successCallback, errorCallback) {
    var rpc = webinos.rpcHandler.createRPC(that, "display.getEPGPIC", arguments);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      successCallback(params)
    }, function(error) {
      if(errorCallback) {
        errorCallback()
      }
    });
    return
  };
  TVDisplaySuccessCB = function() {
  };
  TVDisplaySuccessCB.prototype.onSuccess = function(channel) {
    return
  };
  TVDisplayManager.prototype.addEventListener = function(eventname, channelchangeeventhandler, useCapture) {
    var rpc = webinos.rpcHandler.createRPC(that, "display.addEventListener", arguments);
    rpc.fromObjectRef = Math.floor(Math.random() + (new Date).getTime());
    var callback = new RPCWebinosService({api:rpc.fromObjectRef});
    callback.onchannelchangeeventhandler = function(params, successCallback, errorCallback) {
      channelchangeeventhandler(params)
    };
    webinos.rpcHandler.registerCallbackObject(callback);
    webinos.rpcHandler.executeRPC(rpc);
    return
  };
  TVTunerManager = function() {
  };
  TVTunerManager.prototype.getTVSources = function(successCallback, errorCallback) {
    var rpc = webinos.rpcHandler.createRPC(that, "tuner.getTVSources", arguments);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      successCallback(params)
    }, function(error) {
    });
    return
  };
  TVSuccessCB = function() {
  };
  TVSuccessCB.prototype.onSuccess = function(sources) {
    return
  };
  TVErrorCB = function() {
  };
  TVErrorCB.prototype.onError = function(error) {
    return
  };
  TVError = function() {
    this.code = Number
  };
  TVError.prototype.UNKNOWN_ERROR = 0;
  TVError.prototype.ILLEGAL_CHANNEL_ERROR = 1;
  TVError.prototype.code = Number;
  TVSource = function() {
    this.name = String;
    this.channelList = Number
  };
  TVSource.prototype.name = String;
  TVSource.prototype.channelList = Number;
  Channel = function() {
    this.channelType = Number;
    this.name = String;
    this.longName = String;
    this.stream = "new Stream()";
    this.tvsource = new TVSource
  };
  Channel.prototype.TYPE_TV = 0;
  Channel.prototype.TYPE_RADIO = 1;
  Channel.prototype.channelType = Number;
  Channel.prototype.name = String;
  Channel.prototype.longName = String;
  Channel.prototype.stream = null;
  Channel.prototype.tvsource = null;
  ChannelChangeEvent = function() {
    this.channel = new Channel
  };
  ChannelChangeEvent.prototype.channel = null;
  ChannelChangeEvent.prototype.initChannelChangeEvent = function(type, bubbles, cancelable, channel) {
    return
  };
  TVManager = function(obj) {
    this.base = WebinosService;
    this.base(obj);
    that = this;
    this.display = new TVDisplayManager(obj);
    this.tuner = new TVTunerManager(obj)
  };
  TVManager.prototype = new WebinosService
})();
(function() {
  TestModule = function(obj) {
    this.base = WebinosService;
    this.base(obj);
    this._testAttr = "HelloWorld";
    this.__defineGetter__("testAttr", function() {
      return this._testAttr + " Success"
    })
  };
  TestModule.prototype = new WebinosService;
  TestModule.prototype.bindService = function(bindCB, serviceId) {
    this.get42 = get42;
    this.listenAttr = {};
    this.listenerFor42 = listenerFor42.bind(this);
    if(typeof bindCB.onBind === "function") {
      bindCB.onBind(this)
    }
  };
  function get42(attr, successCB, errorCB) {
    console.log(this.id);
    var rpc = webinos.rpcHandler.createRPC(this, "get42", [attr]);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      successCB(params)
    }, function(error) {
      errorCB(error)
    })
  }
  function listenerFor42(listener, options) {
    var rpc = webinos.rpcHandler.createRPC(this, "listenAttr.listenFor42", [options]);
    rpc.fromObjectRef = Math.floor(Math.random() * 101);
    var callback = new RPCWebinosService({api:rpc.fromObjectRef});
    callback.onEvent = function(obj) {
      listener(obj)
    };
    webinos.rpcHandler.registerCallbackObject(callback);
    webinos.rpcHandler.executeRPC(rpc)
  }
})();
(function() {
  WebinosGeolocation = function(obj) {
    this.base = WebinosService;
    this.base(obj)
  };
  WebinosGeolocation.prototype = new WebinosService;
  WebinosGeolocation.prototype.bindService = function(bindCB, serviceId) {
    this.getCurrentPosition = getCurrentPosition;
    this.watchPosition = watchPosition;
    this.clearWatch = clearWatch;
    if(typeof bindCB.onBind === "function") {
      bindCB.onBind(this)
    }
  };
  function getCurrentPosition(PositionCB, PositionErrorCB, PositionOptions) {
    var rpc = webinos.rpcHandler.createRPC(this, "getCurrentPosition", PositionOptions);
    webinos.rpcHandler.executeRPC(rpc, function(position) {
      PositionCB(position)
    }, function(error) {
      PositionErrorCB(error)
    })
  }
  function watchPosition(PositionCB, PositionErrorCB, PositionOptions) {
    var watchIdKey = Math.floor(Math.random() * 101);
    var rpc = webinos.rpcHandler.createRPC(this, "watchPosition", [PositionOptions, watchIdKey]);
    rpc.fromObjectRef = Math.floor(Math.random() * 101);
    var callback = new RPCWebinosService({api:rpc.fromObjectRef});
    callback.onEvent = function(position) {
      PositionCB(position)
    };
    webinos.rpcHandler.registerCallbackObject(callback);
    webinos.rpcHandler.executeRPC(rpc);
    return watchIdKey
  }
  function clearWatch(watchId) {
    var rpc = webinos.rpcHandler.createRPC(this, "clearWatch", [watchId]);
    webinos.rpcHandler.executeRPC(rpc, function() {
    }, function() {
    })
  }
})();
(function() {
  Sensor = function(obj) {
    this.base = WebinosService;
    this.base(obj)
  };
  Sensor.prototype = new WebinosService;
  Sensor.prototype.bindService = function(success) {
    var self = this;
    var rpc = webinos.rpcHandler.createRPC(this, "getStaticData", []);
    webinos.rpcHandler.executeRPC(rpc, function(result) {
      var _referenceMapping = new Array;
      self.maximumRange = result.maximumRange;
      self.minDelay = result.minDelay;
      self.power = result.power;
      self.resolution = result.resolution;
      self.vendor = result.vendor;
      self.version = result.version;
      self.configureSensor = function(options, successCB, errorCB) {
        var rpc = webinos.rpcHandler.createRPC(this, "configureSensor", arguments[0]);
        webinos.rpcHandler.executeRPC(rpc, function() {
          successCB()
        }, function(error) {
          errorCB()
        })
      };
      self.addEventListener = function(eventType, eventHandler, capture) {
        var rpc = webinos.rpcHandler.createRPC(this, "addEventListener", eventType);
        rpc.fromObjectRef = Math.floor(Math.random() * 101);
        _referenceMapping.push([rpc.fromObjectRef, eventHandler]);
        console.log("# of references" + _referenceMapping.length);
        var callback = new RPCWebinosService({api:rpc.fromObjectRef});
        callback.onEvent = function(vehicleEvent) {
          eventHandler(vehicleEvent)
        };
        webinos.rpcHandler.registerCallbackObject(callback);
        webinos.rpcHandler.executeRPC(rpc)
      };
      success()
    }, function(error) {
    })
  }
})();
(function() {
  var registeredListeners = {};
  var registeredDispatchListeners = {};
  var eventService = null;
  EventsModule = function(obj) {
    this.base = WebinosService;
    this.base(obj);
    eventService = this;
    this.temporaryRandomAppID = webinos.messageHandler.getOwnId()
  };
  EventsModule.prototype = new WebinosService;
  EventsModule.prototype.bind = function(success) {
    success()
  };
  EventsModule.prototype.createWebinosEvent = function(type, addressing, payload, inResponseTo, withTimeStamp, expiryTimeStamp, addressingSensitive) {
    var anEvent = new WebinosEvent;
    anEvent.type = type;
    anEvent.addressing = addressing;
    anEvent.payload = payload;
    anEvent.inResponseTo = inResponseTo;
    anEvent.timeStamp = (new Date).getTime();
    anEvent.expiryTimeStamp = expiryTimeStamp;
    anEvent.addressingSensitive = addressingSensitive;
    return anEvent
  };
  EventsModule.prototype.addWebinosEventListener = function(listener, type, source, destination) {
    var req = {};
    req.type = type;
    req.source = source;
    req.source = this.temporaryRandomAppID;
    req.destination = destination;
    var rpc = webinos.rpcHandler.createRPC(this, "addWebinosEventListener", req);
    rpc.fromObjectRef = Math.floor(Math.random() * 1001);
    var callback = new RPCWebinosService({api:rpc.fromObjectRef});
    callback.handleEvent = function(params, scb, ecb) {
      console.log("Received a new WebinosEvent");
      listener(params.webinosevent);
      scb()
    };
    webinos.rpcHandler.registerCallbackObject(callback);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      console.log("New WebinosEvent listener registered")
    }, function(error) {
      console.log("Error while registering new WebinosEvent listener")
    });
    return"listenerID"
  };
  EventsModule.prototype.removeWebinosEventListener = function(listenerId) {
    var rpc = webinos.rpcHandler.createRPC(this, "removeWebinosEventListener", arguments);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      successCB(params)
    }, function(error) {
    })
  };
  WebinosEvent = function() {
    this.id = Math.floor(Math.random() * 1001);
    this.type = null;
    this.addressing = {};
    this.addressing.source = eventService.temporaryRandomAppID;
    this.inResponseTo = null;
    this.timeStamp = null;
    this.expiryTimeStamp = null;
    this.addressingSensitive = null;
    this.forwarding = null;
    this.forwardingTimeStamp = null;
    this.payload = null
  };
  WebinosEvent.prototype.dispatchWebinosEvent = function(callbacks, referenceTimeout, sync) {
    var params = {};
    params.webinosevent = {};
    params.webinosevent.id = this.id;
    params.webinosevent.type = this.type;
    params.webinosevent.addressing = this.addressing;
    if(params.webinosevent.addressing === "undefined" || params.webinosevent.addressing == null) {
      params.webinosevent.addressing = {};
      params.webinosevent.addressing.source = eventService.temporaryRandomAppID
    }
    params.webinosevent.inResponseTo = this.inResponseTo;
    params.webinosevent.timeStamp = this.timeStamp;
    params.webinosevent.expiryTimeStamp = this.expiryTimeStamp;
    params.webinosevent.addressingSensitive = this.addressingSensitive;
    params.webinosevent.forwarding = this.forwarding;
    params.webinosevent.forwardingTimeStamp = this.forwardingTimeStamp;
    params.webinosevent.payload = this.payload;
    params.referenceTimeout = referenceTimeout;
    params.sync = sync;
    registeredDispatchListeners[this.id] = callbacks;
    var rpc = webinos.rpcHandler.createRPC(eventService, "WebinosEvent.dispatchWebinosEvent", params);
    if(typeof callbacks !== "undefined") {
      console.log("Registering delivery callback");
      rpc.fromObjectRef = Math.floor(Math.random() * 1001);
      var callback = new RPCWebinosService({api:rpc.fromObjectRef});
      callback.onSending = function(params) {
        if(typeof callbacks.onSending !== "undefined") {
          callbacks.onSending(params.event, params.recipient)
        }
      };
      callback.onCaching = function(params) {
        if(typeof callbacks.onCaching !== "undefined") {
          callbacks.onCaching(params.event)
        }
      };
      callback.onDelivery = function(params) {
        if(typeof callbacks.onDelivery !== "undefined") {
          callbacks.onDelivery(params.event, params.recipient)
        }
      };
      callback.onTimeout = function(params) {
        if(typeof callbacks.onTimeout !== "undefined") {
          callbacks.onTimeout(params.event, params.recipient)
        }
      };
      callback.onError = function(params) {
        if(typeof callbacks.onError !== "undefined") {
          callbacks.onError(params.event, params.recipient, params.error)
        }
      };
      webinos.rpcHandler.registerCallbackObject(callback)
    }
    webinos.rpcHandler.executeRPC(rpc)
  };
  WebinosEvent.prototype.forwardWebinosEvent = function(forwarding, withTimeStamp, callbacks, referenceTimeout, sync) {
  }
})();
(function() {
  AppLauncherModule = function(obj) {
    this.base = WebinosService;
    this.base(obj)
  };
  AppLauncherModule.prototype = new WebinosService;
  AppLauncherModule.prototype.bind = function(success) {
    success()
  };
  AppLauncherModule.prototype.launchApplication = function(successCallback, errorCallback, applicationID, params) {
    var reqParams = {};
    reqParams.applicationID = applicationID;
    reqParams.params = params;
    var rpc = webinos.rpcHandler.createRPC(this, "launchApplication", reqParams);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      successCallback(params)
    }, function(error) {
      errorCallback(error)
    })
  };
  AppLauncherModule.prototype.appInstalled = function(applicationID) {
  }
})();
(function() {
  Vehicle = function(obj) {
    this.base = WebinosService;
    this.base(obj)
  };
  Vehicle.prototype = new WebinosService;
  Vehicle.prototype.bindService = function(bindCB, serviceId) {
    this.get = get;
    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;
    this.requestGuidance = requestGuidance;
    this.findDestination = findDestination;
    this.POI = POI;
    this.Address = Address;
    this.LatLng = LatLng;
    if(typeof bindCB.onBind === "function") {
      bindCB.onBind(this)
    }
  };
  var _referenceMapping = new Array;
  var _vehicleDataIds = new Array("climate-all", "climate-driver", "climate-passenger-front", "climate-passenger-rear-left", "passenger-rear-right", "lights-fog-front", "lights-fog-rear", "lights-signal-right", "lights-signal-left", "lights-signal-warn", "lights-hibeam", "lights-parking", "lights-head", "lights-head", "wiper-front-wash", "wiper-rear-wash", "wiper-automatic", "wiper-front-once", "wiper-rear-once", "wiper-front-level1", "wiper-front-level2", "destination-reached", "destination-changed", 
  "destination-cancelled", "parksensors-front", "parksensors-rear", "shift", "tripcomputer", "wipers", "oillevel");
  function get(vehicleDataId, callOnSuccess, callOnError) {
    arguments[0] = vehicleDataId;
    var rpc = webinos.rpcHandler.createRPC(this, "get", arguments);
    webinos.rpcHandler.executeRPC(rpc, function(result) {
      callOnSuccess(result)
    }, function(error) {
      callOnError(error)
    })
  }
  function addEventListener(vehicleDataId, eventHandler, capture) {
    if(_vehicleDataIds.indexOf(vehicleDataId) != -1) {
      var rpc = webinos.rpcHandler.createRPC(this, "addEventListener", vehicleDataId);
      rpc.fromObjectRef = Math.floor(Math.random() * 101);
      _referenceMapping.push([rpc.fromObjectRef, eventHandler]);
      console.log("# of references" + _referenceMapping.length);
      var callback = new RPCWebinosService({api:rpc.fromObjectRef});
      callback.onEvent = function(vehicleEvent) {
        eventHandler(vehicleEvent)
      };
      webinos.rpcHandler.registerCallbackObject(callback);
      webinos.rpcHandler.executeRPC(rpc)
    }else {
      console.log(vehicleDataId + " not found")
    }
  }
  function removeEventListener(vehicleDataId, eventHandler, capture) {
    var refToBeDeleted = null;
    for(var i = 0;i < _referenceMapping.length;i++) {
      console.log("Reference" + i + ": " + _referenceMapping[i][0]);
      console.log("Handler" + i + ": " + _referenceMapping[i][1]);
      if(_referenceMapping[i][1] == eventHandler) {
        var arguments = new Array;
        arguments[0] = _referenceMapping[i][0];
        arguments[1] = vehicleDataId;
        console.log("ListenerObject to be removed ref#" + refToBeDeleted);
        var rpc = webinos.rpcHandler.createRPC(this, "removeEventListener", arguments);
        webinos.rpcHandler.executeRPC(rpc, function(result) {
          callOnSuccess(result)
        }, function(error) {
          callOnError(error)
        });
        break
      }
    }
  }
  function POI(name, position, address) {
    this.name = name;
    this.position = position;
    this.address = address
  }
  function Address(country, region, county, city, street, streetNumber, premises, additionalInformation, postalCode) {
    this.county = county;
    this.regions = region;
    this.county = city;
    this.street = streetNumber;
    this.premises = premises;
    this.addtionalInformation = additionalInformation;
    this.postalCode = postalCode
  }
  function LatLng(lat, lng) {
    this.latitude = lat;
    this.longitude = lng
  }
  function requestGuidance(callOnSuccess, callOnError, destinations) {
    arguments = destinations;
    var successCb = callOnSuccess;
    var errorCb = callOnError;
    var rpc = webinos.rpcHandler.createRPC(this, "requestGuidance", arguments);
    webinos.rpcHandler.executeRPC(rpc, function() {
      callOnSuccess()
    }, function(error) {
      callOnError(error)
    })
  }
  function findDestination(callOnSuccess, callOnError, search) {
    arguments = search;
    var rpc = webinos.rpcHandler.createRPC(this, "findDestination", arguments);
    webinos.rpcHandler.executeRPC(rpc, function(results) {
      callOnSuccess(results)
    }, function(error) {
      callOnError(error)
    })
  }
})();
(function() {
  WebinosDeviceOrientation = function(obj) {
    this.base = WebinosService;
    this.base(obj)
  };
  var _referenceMappingDo = new Array;
  var _eventIdsDo = new Array("deviceorientation", "compassneedscalibration", "devicemotion");
  WebinosDeviceOrientation.prototype = new WebinosService;
  WebinosDeviceOrientation.prototype.bindService = function(bindCB, serviceId) {
    this.addEventListener = addEventListener;
    this.removeEventListener = removeEventListener;
    this.dispatchEvent = dispatchEvent;
    this.DeviceOrientationEvent = DeviceOrientationEvent;
    this.DeviceMotionEvent = DeviceMotionEvent;
    this.Acceleration = Acceleration;
    this.RotationRate = RotationRate;
    if(typeof bindCB.onBind === "function") {
      bindCB.onBind(this)
    }
  };
  function addEventListener(type, listener, useCapture) {
    if(_eventIdsDo.indexOf(type) != -1) {
      console.log("LISTENER" + listener);
      var rpc = webinos.rpcHandler.createRPC(this, "addEventListener", [type, listener, useCapture]);
      rpc.fromObjectRef = Math.floor(Math.random() * 101);
      _referenceMappingDo.push([rpc.fromObjectRef, listener]);
      console.log("# of references" + _referenceMappingDo.length);
      var callback = new RPCWebinosService({api:rpc.fromObjectRef});
      callback.onEvent = function(orientationEvent) {
        listener(orientationEvent)
      };
      webinos.rpcHandler.registerCallbackObject(callback);
      webinos.rpcHandler.executeRPC(rpc)
    }else {
      console.log(type + " not found")
    }
  }
  WDomEvent = function(type, target, currentTarget, eventPhase, bubbles, cancelable, timestamp) {
    this.initEvent(type, target, currentTarget, eventPhase, bubbles, cancelable, timestamp)
  };
  WDomEvent.prototype.speed = 0;
  WDomEvent.prototype.initEvent = function(type, target, currentTarget, eventPhase, bubbles, cancelable, timestamp) {
    this.type = type;
    this.target = target;
    this.currentTarget = currentTarget;
    this.eventPhase = eventPhase;
    this.bubbles = bubbles;
    this.cancelable = cancelable;
    this.timestamp = timestamp
  };
  DeviceOrientationEvent = function(alpha, beta, gamma) {
    this.initDeviceOrientationEvent(alpha, beta, gamma)
  };
  DeviceOrientationEvent.prototype = new WDomEvent;
  DeviceOrientationEvent.prototype.constructor = DeviceOrientationEvent;
  DeviceOrientationEvent.parent = WDomEvent.prototype;
  DeviceOrientationEvent.prototype.initDeviceOrientationEvent = function(alpha, beta, gamma) {
    this.alpha = alpha;
    this.beta = beta;
    this.gamma = gamma;
    var d = new Date;
    var stamp = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
    var stamp = stamp + d.getUTCMilliseconds();
    DeviceOrientationEvent.parent.initEvent.call(this, "deviceorientation", null, null, null, false, false, stamp)
  };
  Acceleration = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z
  };
  RotationRate = function(alpha, beta, gamma) {
    this.alpha = alpha;
    this.beta = beta;
    this.gamma = gamma
  };
  DeviceMotionEvent = function(acceleration, accelerationIncludingGravity, rotationRate, interval) {
    this.initDeviceMotionEvent(acceleration, accelerationIncludingGravity, rotationRate, interval)
  };
  DeviceMotionEvent.prototype = new WDomEvent;
  DeviceMotionEvent.prototype.constructor = DeviceOrientationEvent;
  DeviceMotionEvent.parent = WDomEvent.prototype;
  DeviceMotionEvent.prototype.initDeviceMotionEvent = function(acceleration, accelerationIncludingGravity, rotationRate, interval) {
    this.acceleration = acceleration;
    this.accelerationIncludingGravity = accelerationIncludingGravity;
    this.rotationRate = rotationRate;
    this.interval = interval;
    var d = new Date;
    var stamp = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
    var stamp = stamp + d.getUTCMilliseconds();
    DeviceOrientationEvent.parent.initEvent.call(this, "devicemotion", null, null, null, false, false, stamp)
  };
  function removeEventListener(type, listener, useCapture) {
    console.log("LISTENER" + listener);
    var refToBeDeleted = null;
    for(var i = 0;i < _referenceMappingDo.length;i++) {
      console.log("Reference" + i + ": " + _referenceMappingDo[i][0]);
      console.log("Handler" + i + ": " + _referenceMappingDo[i][1]);
      if(_referenceMappingDo[i][1] == listener) {
        var arguments = new Array;
        arguments[0] = _referenceMappingDo[i][0];
        arguments[1] = type;
        console.log("ListenerObject to be removed ref#" + _referenceMappingDo[i][0]);
        var rpc = webinos.rpcHandler.createRPC(this, "removeEventListener", arguments);
        webinos.rpcHandler.executeRPC(rpc, function(result) {
          callOnSuccess(result)
        }, function(error) {
          callOnError(error)
        });
        break
      }
    }
  }
  function dispatchEvent(event) {
  }
})();
(function() {
  Context = function(obj) {
    this.base = WebinosService;
    this.base(obj)
  };
  Context.prototype = new WebinosService;
  Context.prototype.bindService = function(bindCB, serviceId) {
    this.find = find;
    this.executeQuery = executeQuery;
    if(typeof bindCB.onBind === "function") {
      bindCB.onBind(this)
    }
  };
  function find(params, successCB, errorCB) {
    var rpc = webinos.rpcHandler.createRPC(this, "find", params);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      successCB(params)
    }, function(error) {
      errorCB(error)
    })
  }
  function registerAppContextObject(APPName, ContextObjectName, ContextFields, callback) {
    var rpc = webinos.rpcHandler.createRPC(this, "registerAppContextObject", query);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      callback(params)
    }, function(error) {
      callback(error)
    })
  }
  function executeQuery(query, successCB, errorCB) {
    var rpc = webinos.rpcHandler.createRPC(this, "executeQuery", query);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      successCB(params)
    }, function(error) {
      errorCB(error)
    })
  }
})();
(function() {
  AuthenticationModule = function(obj) {
    this.base = WebinosService;
    this.base(obj)
  };
  AuthenticationModule.prototype = new WebinosService;
  function authenticate(username, successCB, errorCB) {
    var rpc = webinos.rpcHandler.createRPC(this, "authenticate", [username]);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      console.log("authenticate successCB: ", params);
      successCB(params)
    }, function(error) {
      console.log("authenticate errorCB: ", error);
      errorCB(error)
    })
  }
  function isAuthenticated(username, successCB, errorCB) {
    var rpc = webinos.rpcHandler.createRPC(this, "isAuthenticated", [username]);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      console.log("isAuthenticated successCB: ", params);
      successCB(params)
    }, function(error) {
      console.log("isAuthenticated errorCB: ", error);
      errorCB(error)
    })
  }
  function getAuthenticationStatus(username, successCB, errorCB) {
    var rpc = webinos.rpcHandler.createRPC(this, "getAuthenticationStatus", [username]);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      console.log("getAuthenticatationStatus successCB: ", params);
      successCB(params)
    }, function(error) {
      console.log("getAuthenticationStatus errorCB: ", error);
      errorCB(error)
    })
  }
  AuthenticationModule.prototype.bindService = function(bindCB, serviceId) {
    this.authenticate = authenticate;
    this.isAuthenticated = isAuthenticated;
    this.getAuthenticationStatus = getAuthenticationStatus;
    if(typeof bindCB.onBind === "function") {
      bindCB.onBind(this)
    }
  }
})();
(function() {
  Contacts = function(obj) {
    this.base = WebinosService;
    this.base(obj);
    this.authenticate = authenticate;
    this.isAlreadyAuthenticated = isAlreadyAuthenticated;
    this.getAllContacts = getAllContacts;
    this.find = find
  };
  Contacts.prototype = new WebinosService;
  Contacts.prototype.bindService = function(bindCB, serviceId) {
    this.authenticate = authenticate;
    this.isAlreadyAuthenticated = isAlreadyAuthenticated;
    this.getAllContacts = getAllContacts;
    this.find = find;
    if(typeof bindCB.onBind === "function") {
      bindCB.onBind(this)
    }
  };
  function authenticate(attr, successCB, errorCB) {
    var rpc = webinos.rpcHandler.createRPC(this, "authenticate", [attr]);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      successCB(params)
    }, function(error) {
      errorCB(error)
    })
  }
  function isAlreadyAuthenticated(attr, successCB, errorCB) {
    var rpc = webinos.rpcHandler.createRPC(this, "isAlreadyAuthenticated", [attr]);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      successCB(params)
    }, function(error) {
      errorCB(error)
    })
  }
  function getAllContacts(attr, successCB, errorCB) {
    var rpc = webinos.rpcHandler.createRPC(this, "getAllContacts", [attr]);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      successCB(params)
    }, function(error) {
      errorCB(error)
    })
  }
  function find(attr, successCB, errorCB) {
    var rpc = webinos.rpcHandler.createRPC(this, "find", [attr]);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      successCB(params)
    }, function(error) {
      errorCB(error)
    })
  }
})();
(function() {
  var PropertyValueSuccessCallback, ErrorCallback, DeviceAPIError, PropertyRef;
  DeviceStatusManager = function(obj) {
    this.base = WebinosService;
    this.base(obj)
  };
  DeviceStatusManager.prototype = new WebinosService;
  DeviceStatusManager.prototype.bindService = function(bindCB, serviceId) {
    this.getComponents = getComponents;
    this.isSupported = isSupported;
    this.getPropertyValue = getPropertyValue;
    if(typeof bindCB.onBind === "function") {
      bindCB.onBind(this)
    }
  };
  function getComponents(aspect, successCallback, errorCallback) {
    var rpc = webinos.rpcHandler.createRPC(this, "devicestatus.getComponents", [aspect]);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      successCallback(params)
    });
    return
  }
  function isSupported(aspect, property, successCallback) {
    var rpc = webinos.rpcHandler.createRPC(this, "devicestatus.isSupported", [aspect, property]);
    webinos.rpcHandler.executeRPC(rpc, function(res) {
      successCallback(res)
    });
    return
  }
  function getPropertyValue(successCallback, errorCallback, prop) {
    var rpc = webinos.rpcHandler.createRPC(this, "devicestatus.getPropertyValue", [prop]);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      successCallback(params)
    }, function(err) {
      errorCallback(err)
    });
    return
  }
  PropertyValueSuccessCallback = function() {
  };
  PropertyValueSuccessCallback.prototype.onSuccess = function(prop) {
    return
  };
  ErrorCallback = function() {
  };
  ErrorCallback.prototype.onError = function(error) {
    return
  };
  DeviceAPIError = function() {
    this.message = String;
    this.code = Number
  };
  DeviceAPIError.prototype.UNKNOWN_ERR = 0;
  DeviceAPIError.prototype.INDEX_SIZE_ERR = 1;
  DeviceAPIError.prototype.DOMSTRING_SIZE_ERR = 2;
  DeviceAPIError.prototype.HIERARCHY_REQUEST_ERR = 3;
  DeviceAPIError.prototype.WRONG_DOCUMENT_ERR = 4;
  DeviceAPIError.prototype.INVALID_CHARACTER_ERR = 5;
  DeviceAPIError.prototype.NO_DATA_ALLOWED_ERR = 6;
  DeviceAPIError.prototype.NO_MODIFICATION_ALLOWED_ERR = 7;
  DeviceAPIError.prototype.NOT_FOUND_ERR = 8;
  DeviceAPIError.prototype.NOT_SUPPORTED_ERR = 9;
  DeviceAPIError.prototype.INUSE_ATTRIBUTE_ERR = 10;
  DeviceAPIError.prototype.INVALID_STATE_ERR = 11;
  DeviceAPIError.prototype.SYNTAX_ERR = 12;
  DeviceAPIError.prototype.INVALID_MODIFICATION_ERR = 13;
  DeviceAPIError.prototype.NAMESPACE_ERR = 14;
  DeviceAPIError.prototype.INVALID_ACCESS_ERR = 15;
  DeviceAPIError.prototype.VALIDATION_ERR = 16;
  DeviceAPIError.prototype.TYPE_MISMATCH_ERR = 17;
  DeviceAPIError.prototype.SECURITY_ERR = 18;
  DeviceAPIError.prototype.NETWORK_ERR = 19;
  DeviceAPIError.prototype.ABORT_ERR = 20;
  DeviceAPIError.prototype.TIMEOUT_ERR = 21;
  DeviceAPIError.prototype.INVALID_VALUES_ERR = 22;
  DeviceAPIError.prototype.NOT_AVAILABLE_ERR = 101;
  DeviceAPIError.prototype.code = Number;
  DeviceAPIError.prototype.message = Number;
  PropertyRef = function() {
    this.component = String;
    this.aspect = String;
    this.property = String
  };
  PropertyRef.prototype.component = String;
  PropertyRef.prototype.aspect = String;
  PropertyRef.prototype.property = String
})();
(function() {
  BluetoothManager = function(obj) {
    this.base = WebinosService;
    this.base(obj)
  };
  BluetoothManager.prototype = new WebinosService;
  BluetoothManager.prototype.bindService = function(bindCB, serviceId) {
    this.findHRM = findHRM;
    this.listenAttr = {};
    this.listenerForHRM = listenerForHRM.bind(this);
    if(typeof bindCB.onBind === "function") {
      bindCB.onBind(this)
    }
  };
  BluetoothManager.prototype.listenerForHRM = function(listener, options) {
    var rpc = webinos.rpcHandler.createRPC(this, "listenAttr.listenForHRM", [options]);
    rpc.fromObjectRef = Math.floor(Math.random() * 101);
    var callback = new RPCWebinosService({api:rpc.fromObjectRef});
    callback.onEvent = function(obj) {
      listener(obj)
    };
    webinos.rpcHandler.registerCallbackObject(callback);
    webinos.rpcHandler.executeRPC(rpc)
  };
  BluetoothManager.prototype.findHRM = function(data, success) {
    console.log("HRM find HRM");
    var rpc = webinos.rpcHandler.createRPC(this, "findHRM", arguments);
    webinos.rpcHandler.executeRPC(rpc, function(params) {
      success(params)
    })
  }
})();
