'use strickt';
var Sock = require('./sock');
var util = require('util');
var axon = require('axon');
var ip = require('ip');
var EventEmitter = require('events');

var HelloSocket = function HelloSocket(startPort, endPort) {
    EventEmitter.call(this);
    this.connections = [];
    this.initRepSocket(9100);
}
util.inherits(HelloSocket, EventEmitter);

HelloSocket.prototype.initRepSocket = function (port) {
    var self = this;
    this.repSocket = axon.socket('rep');
    this.repSocket.bind(port, function () {console.log('callback', arguments)});
    this.repSocket.server.on('error', function (e) {
        // console.log('server', self.repSocket.server, arguments)
        if (e.code === 'EADDRINUSE') {
            self.repSocket = null;
            port = port + 1;
            self.initRepSocket(port);
        }
    });
    var self = this;
    this.repSocket.on('disconnect', function () {
        // console.log('disconnect', self.repSocket)
    });
    this.repSocket.on('bind', function () {
        self.repSocketPort = port;
        self.emit('bind', port);

        self.announce();
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

HelloSocket.prototype.announce = function (ports) {
    this.reqSockets = {};
    var self = this;
    for (var i = 9100; i < 9110; i++) {
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
