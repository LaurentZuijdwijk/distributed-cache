"use strict"
var net = require('net');

var EventEmitter = require('events');
var util = require('util');

var Request = function (key, opts) {
    // console.log(opts)
    EventEmitter.call(this);
    var self = this;
console.log(opts, key)
    var client = net.connect({address: opts.address, port: opts.port},
	    function () { //'connect' listener
     console.log('connected to server!');
    client.write('key\n' + key + '\n\n');
	});
    client.on('data', function () {
        console.log('request on data ', arguments[0].toString());
    })
    return client;
}
util.inherits(Request, EventEmitter);

module.exports = Request;
