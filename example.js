var Cache = require('./index.js');

var cache = new Cache();
var key = process.argv[2] || 'aaa' 
setInterval(function(){
	cache.setData(key, new Buffer(1000000))
}, 1000)
