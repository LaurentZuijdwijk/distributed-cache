'use strict';

var LocalCache = require('streaming-cache');
var axon = require('axon');
var HelloSocket = require('./lib/hello-socket');
var RemoteConnections = require('./lib/remote-connections');
var ReplySocket = require('./lib/file-transfer/reply');
var RequestSocket = require('./lib/file-transfer/request');
var EventEmitter = require('events');
var util = require('util');

//var remotes = {};
var remoteKeys = {};

var defaultOptions = {
    portRange : 10,
    basePort : 10100
}
var DistributedCache = function (options) {
    this.options = defaultOptions;
    this.localCache = new LocalCache(options);
    this.remoteConnections = new RemoteConnections(this.options);

    // this.ports = options.ports;

    this.listen(this.options);

    //find other hosts
    // listen to updates from other servers
};
util.inherits(DistributedCache, EventEmitter);





DistributedCache.prototype.listen = function () {
    let self = this;
    let options = self.options;
    self.helloSocket = new HelloSocket(options.basePort, options.portRange);
    self.helloSocket.on('bind', function (port) {
        self.initPubSocket(port + self.options.portRange);
        self.initRepSocket(port + self.options.portRange * 2);
        setImmediate(
            ()=>self.emit('bind', port)
        );
    });
    self.helloSocket.on('remoteRemoved', self.remoteConnections.onRemoteRemoved);
    self.helloSocket.on('remoteAdded', self.remoteConnections.onRemoteAdded.bind(self.remoteConnections));
};

DistributedCache.prototype.close = function () {
    this.helloSocket.removeListener('remoteRemoved', this.remoteConnections.onRemoteRemoved);
    this.helloSocket.removeListener('remoteAdded', this.remoteConnections.onRemoteAdded);
    this.helloSocket.removeAllListeners();
    this.helloSocket.close();
    if(this.pubSocket){

        this.pubSocket.close();
    }
    if(this.repSocket){
        this.repSocket.close();
    }

}

DistributedCache.prototype.initPubSocket = function (port) {
    this.pubSocket = axon.socket('pub');
    this.pubSocket.bind(port, function () {console.log('callback', arguments);});

    this.pubSocket.on('bind', function () {
        console.log('bound pub socket');
    });
};

DistributedCache.prototype.initRepSocket = function (port) {
console.log('initRepSocket', port)
    var self = this;
    this.repSocket = new ReplySocket(port);

    this.repSocket.on('request', function (key, conn) {
            console.log('self.localCache.exists(key)',self.localCache.exists(key))
        if (self.localCache.exists(key)) {
            return self.localCache.get(key).pipe(conn);
        }
        console.log('bound reply socket');
    });

    this.repSocket.on('bind', function () {
        console.log('bound reply socket');
    });
};


//This needs to be factored out
// var onRemoteAdded = (data)=> {
//     if (!remotes[data.port + data.remoteAddress]) {
//         console.log('subscribing to port', data.port + this.options.portRange);

//         var subSocket = new SubscribeSocket(data.port + this.options.portRange, data.remoteAddress);
//         subSocket.on('new-key', function (key) {
//             console.log(this.remotePort, this.remoteAddress, arguments)
//             remoteKeys[key] = {
//                 remotePort : this.remotePort,
//                 remoteAddress : this.remoteAddress,
//                 ts : new Date().valueOf()
//             }
//             remotes[data.port + data.remoteAddress].keys.push(key);
//         });
//         subSocket.on('delete-key', function () {
//             if(remotes[data.port + data.remoteAddress] && remotes[data.port + data.remoteAddress].keys){
//                 var keys = remotes[data.port + data.remoteAddress].keys;
//                 for (var i = keys.length - 1; i >= 0; i--) {
//                     delete remoteKeys[keys[i]];
//                 };
//             }
//         });
//         subSocket.on('disconnect', function () {
//             if(remotes[data.port + data.remoteAddress]){
//                 var keys = remotes[data.port + data.remoteAddress].keys;
//                 for (var i = keys.length - 1; i >= 0; i--) {
//                     delete remoteKeys[keys[i]];
//                 };
//             }

//             delete remotes[data.port + data.remoteAddress];
//         });
//         remotes[data.port + data.remoteAddress] = {
//             port : data.port,
//             address : data.remoteAddress,
//             connectionTime : new Date().valueOf(),
//             socket : subSocket,
//             keys : []
//         };
//     }
// }


DistributedCache.prototype.setData = function (key, data) {
    // We update the other nodes of this key
    this.localCache.setData(key, data);
    if (this.pubSocket && this.pubSocket.send) {
        this.pubSocket.send('newKey', key);
    }
};

DistributedCache.prototype.set = function (key) {
    // We update the other nodes of this key
    if (this.pubSocket && this.pubSocket.send) {
        this.pubSocket.send('newKey', key);
    }
    return this.localCache.set(key);
};

DistributedCache.prototype.del = function (key) {
    // We update the other nodes of this key
    if (this.pubSocket && this.pubSocket.send) {
        this.pubSocket.send('delKey', key);
    }
    return this.localCache.set(key);
};

DistributedCache.prototype.get = function (key) {
    if (this.localCache.exists(key)) {
        return this.localCache.get(key);
    }
    else if (this.remoteConnections.remoteKeys[key]) {
        console.log('get from remote', this.remoteConnections.remoteKeys[key])
        return new RequestSocket(key, this.remoteConnections.remoteKeys[key]).pipe(this.localCache.set(key));
    } 
};

module.exports = DistributedCache;
 