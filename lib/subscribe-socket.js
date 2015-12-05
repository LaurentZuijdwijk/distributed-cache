'use strickt';
var Sock = require('./sock');
var util = require('util');
var axon = require('axon');
var ip = require('ip');
var EventEmitter = require('events');

var SubSocket = function SubSocket(port, ip) {
		EventEmitter.call(this);
		var self = this;
        self.remotePort = port;
        self.remoteAddress = ip;

        self.sock = axon.socket('sub');
        self.sock.connect(port);
        self.sock.on('message', self.onMessage.bind(self));

        self.sock.on('connect', function(sock){
            console.log('connected sub socket')
        });

}
util.inherits(SubSocket, EventEmitter);

SubSocket.prototype.onMessage = function(type, val){
	console.log(type, val)
	if(type === 'newKey'){
		this.emit('new-key', val);
	}
	if(type === 'delKey'){
		this.emit('delete', val);
	}


}


// util.inherits(Sock, SubSocket);
module.exports = SubSocket;
