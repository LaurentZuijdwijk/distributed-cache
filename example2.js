var Cache = require('./index.js');

var cache = new Cache({ports : [8123, 8124, 8125]});

setInterval(function(){
	console.log('getting')
	cache.get('aaa').pipe(process.stdout)
	// cache.pubSocket.send('hello')
}, 5000)
