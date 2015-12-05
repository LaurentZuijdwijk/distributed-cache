'use strict';

var LocalCache = require('streaming-cache');
var axon = require('axon');
var HelloSocket = require('./lib/hello-socket');
var SubscribeSocket = require('./lib/subscribe-socket');
var ReplySocket = require('./lib/file-transfer/reply');
var RequestSocket = require('./lib/file-transfer/request');

var remotes = {};
var remoteKeys = {};

var DistributedCache = function (options) {

    this.options = options;
    this.localCache = new LocalCache(options);
    this.ports = options.ports;

    this.listen(8564);

    //find other hosts
    // listen to updates from other servers
};

DistributedCache.prototype.initPubSocket = function (port) {
    var self = this;
    this.pubSocket = axon.socket('pub');
    this.pubSocket.bind(port, function () {console.log('callback', arguments);});
    // this.pubSocket.server.on('error', function (e) {
    //     // console.log('server', self.pubSocket.server, arguments)
    //     if (e.code === 'EADDRINUSE') {
    //         self.pubSocket = null;
    //         port = port + 1;
    //         self.initPubSocket(port);
    //     }
    // });
    this.pubSocket.on('bind', function () {
        console.log('bound pub socket');
    });
};
DistributedCache.prototype.initRepSocket = function (port) {
    var self = this;
    this.repSocket = new ReplySocket(port);

    this.repSocket.on('request', function (key, conn) {
        if (self.localCache.exists(key)) {
            return self.localCache.get(key).pipe(conn);
        }

        console.log('bound reply socket');
    });


    this.repSocket.on('bind', function () {
        console.log('bound reply socket');
    });
      
};



DistributedCache.prototype.listen = function (port) {
    var self = this;
    var helloSocket = new HelloSocket(9100);
    helloSocket.on('bind', function (port) {
        console.log('helloSocket bound on port', port);
        self.initPubSocket(port + 10);
        self.initRepSocket(port + 20);
    });
    helloSocket.on('remoteRemoved', onRemoteRemoved);
    helloSocket.on('remoteAdded', onRemoteAdded);
    // this.initPubSocket(9110);
};

function onRemoteAdded(data){
    if(!remotes[data.port+data.remoteAddress]){
        var subSocket = new SubscribeSocket(data.port + 10, data.remoteAddress);
        subSocket.on('new-key', function(key){
            console.log(this.remotePort, this.remoteAddress, arguments)
            remoteKeys[key] = {
                remotePort : this.remotePort,
                remoteAddress :this.remoteAddress,
                ts : new Date().valueOf()
            }
        });
        subSocket.on('delete-key', function(){
            
        });
        remotes[data.port+data.remoteAddress] = {
            port : data.port,
            address : data.remoteAddress,
            connectionTime : new Date().valueOf(),
            socket : subSocket
        };
    } 
}

function onRemoteRemoved(){
    throw new Error('not implemented');
}


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
    else if(remoteKeys[key]){
        return new RequestSocket(key, remoteKeys[key]);
    }
};

module.exports = DistributedCache;
 