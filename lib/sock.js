var EventEmitter = require("events");
var util = require('util')

function Sock(){
    EventEmitter.call(this);

}
util.inherits(Sock, EventEmitter);

module.exports = Sock;