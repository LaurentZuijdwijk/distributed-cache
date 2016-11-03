'use strict';
var Sock = require('./sock');
var util = require('util');
var axon = require('axon');
var ip = require('ip');
var EventEmitter = require('events');


// subscribes to remote pub sockets and listens for key updates.

var SubSocket = function SubSocket(port, ip) {
    EventEmitter.call(this);
    var self = this;
    self.key = '';
    self.keys = [];



    self.remotePort = port;
    self.remoteAddress = ip;

    self.sock = axon.socket('sub');
    self.sock.connect(port);
    self.sock.on('message', self.onMessage.bind(self));
    
    self.sock.on('connect', function (sock) {
        sock.on('close', function(){
            self.emit('disconnect');
        });
            console.log('connected sub socket')
        
        });
}
util.inherits(SubSocket, EventEmitter);

SubSocket.prototype.onMessage = function (type, val) {
    console.log(type, val)
    if (type === 'newKey') {
        this.emit('new-key', val);
    }
    if (type === 'delKey') {
        this.emit('delete-key', val);
    }
//event needed for evicted keys and maybe for usage updates.

}
 
// util.inherits(Sock, SubSocket);
module.exports = SubSocket;
