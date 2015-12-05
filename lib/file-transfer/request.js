var net = require('net');

var EventEmitter = require('events');
var util = require('util');

var Request = function(key, opts){
	console.log(opts)
	EventEmitter.call(this);
	var self = this;
	
	var client = net.connect({address:opts.remoteAddress, port: opts.remotePort+10},
	    function() { //'connect' listener
			console.log('connected to server!');
			client.write("key\n"+key+"\n\n");
	});
	client.on('data', function(){
		console.log('request on data ', arguments[0].toString());

	})
	return client;
}
util.inherits(Request, EventEmitter);

module.exports = Request;
