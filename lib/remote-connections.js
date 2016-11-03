'use strict';
var SubscribeSocket = require('./subscribe-socket');

class RemoteConnections{
	constructor(opts){
		this.options = opts;
		this.remotes = {};
		this.remoteKeys = {};
		this.subSockets = [];
		
	}
	getRemote(data){
		return this.remotes[data.port + data.remoteAddress]		
	}
	onRemoteAdded (data) {
	    console.log('remotes', this, data)
	    let remoteKey = data.port + data.remoteAddress;
	    if (!this.remotes[remoteKey]) {
	        console.log('subscribing to port', data.port + this.options.portRange);

	        let subSocket = new SubscribeSocket(data.port + this.options.portRange, data.remoteAddress);
	        this.subSockets.push(subSocket) 
	        subSocket.on('new-key', (key)=> {
	            console.log('new-key', key)
	            this.remoteKeys[key] = {
	                port : data.port + this.options.portRange*2,
	                address : data.remoteAddress,
	                ts : new Date().valueOf()
	            }
	            this.remotes[remoteKey].keys.push(key);
	        });
	        subSocket.on('delete-key', (key)=> {
	            if(this.remotes[remoteKey] && this.remotes[remoteKey].keys){
		            this.remoteKeys[key]
	
	                var keys = this.remotes[remoteKey].keys;
	                for (var i = keys.length - 1; i >= 0; i--) {
	                    delete this.remoteKeys[keys[i]];
	                };
	            }
	        });
	        subSocket.on('disconnect', ()=> {
	            console.log('disconnect')
	            if(this.remotes[remoteKey]){
	                var keys = this.remotes[remoteKey].keys;
	                for (var i = keys.length - 1; i >= 0; i--) {
	                    delete this.remoteKeys[keys[i]];
	                };
	            }

	            delete this.remotes[remoteKey];
	        });
	        this.remotes[remoteKey] = {
	            port : data.port+ this.options.portRange*2,
	            address : data.remoteAddress,
	            connectionTime : new Date().valueOf(),
	            socket : subSocket,
	            keys : []
	        };
	    }
	}
}

RemoteConnections.prototype.onRemoteRemoved = function(){
    throw new Error('not implemented');
}

module.exports = RemoteConnections;