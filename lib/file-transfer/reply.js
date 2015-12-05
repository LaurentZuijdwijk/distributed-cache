var net = require('net');
var EventEmitter = require('events');
var util = require('util');

var Reply = function(port){
	EventEmitter.call(this);
	var self = this;
	this.server = net.createServer(function(c) { //'connection' listener
	  	console.log('client connected');

	  	c.on('end', function() {
	    	console.log('client disconnected');
	  	});
		c.on('data', function(msg){
			console.log('request data',msg.toString());
			var msgs = msg.toString().split('\n');
			self.emit('request', msgs[1], c);

		});
	});
	this.server.listen(port, function() { //'listening' listener
		self.emit('bind');
	});
}
util.inherits(Reply, EventEmitter);


module.exports = Reply;