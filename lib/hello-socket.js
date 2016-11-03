'use strict';
var Sock = require('./sock');
var util = require('util');
var axon = require('axon');

var ip = require('ip');
var EventEmitter = require('events');

var defaultOptions = {

}

class HelloSocket extends EventEmitter {
    constructor(startPort, range){
        super();
        this.connections = [];
        this.portRange = range;
        this.startPort = startPort;
        this.initRepSocket(startPort, range);
    }
}

// var HelloSocket = function HelloSocket(startPort, range) {
//     EventEmitter.call(this);
//     this.connections = [];
//     this.portRange = range;
//     this.startPort = startPort;
//     this.initRepSocket(startPort, range);
// }
// util.inherits(HelloSocket, EventEmitter);

HelloSocket.prototype.initRepSocket = function (port, range) {
    var self = this;
    var maxPort = port + range;

    this.repSocket = axon.socket('rep');
    this.repSocket.bind(port, function () {
        // console.log('callback', arguments)
    });
    this.repSocket.server.on('error', function (e) {
        console.log('server onerror', e, port, maxPort, port + 1 < maxPort)
        if (e.code === 'EADDRINUSE' && port + 1 < maxPort) {
            self.repSocket = null;
            port = port + 1;
            self.initRepSocket(port, range - 1);
        }
    });
    var self = this;
    this.repSocket.on('disconnect', function () {
        // console.log('disconnect', self.repSocket)
    });
    this.repSocket.on('bind', function () {
        self.repSocketPort = port;
        self.emit('bind', port);

        self.announce(self.startPort, self.portRange);
    });
    this.repSocket.on('message', function (msg, reply) {
        var conn = {
            port : msg[1],
            remoteAddress : msg[2]
        };
        console.log('message received', msg)
        self.connections.push(conn);
        self.emit('remoteAdded', conn);

        reply(['ELLOH', port, ip.address()]);
    });
}


HelloSocket.prototype.close = function () {
    this.repSocket.removeAllListeners();
    this.repSocket.close();
    if(this.reqSockets){

        for (var i = 0; i < this.reqSockets.length; i++) {
            let sock = this.reqSockets[i];
            sock.removeAllListeners();
            sock.close();
        };
    }


}

HelloSocket.prototype.announce = function (port, range) {
    this.reqSockets = {};
    console.log('ANNOUNCE', port, range)
    var self = this;
    for (var i = port; i < port + range; i++) {
        if (i != self.repSocketPort) {
            (function (i) {
                self.reqSockets[i] = axon.socket('req');
                self.reqSockets[i].connect(i);
                self.reqSockets[i].on('connect', function (sock) {
                    clearTimeout(tid);
                    this.send(['HELLO', self.repSocketPort, ip.address()], function (msg) {
                        sock.counterPort = msg[1];
                        // we found the first other
                        var conn = {
                            port : msg[1],
                            remoteAddress : msg[2]
                        };
                        console.log('reply received', msg)
                        self.connections.push(conn);
                        self.emit('remoteAdded', conn);
                        // console.log('received reply:', msg, sock.remoteAddress)
                    });
                });
                var tid = setTimeout(function () {
                    self.reqSockets[i].close();
                    self.reqSockets[i] = null;
                }, 2000);
            }(i));
        }
    }
}

// util.inherits(Sock, HelloSocket);
module.exports = HelloSocket;
