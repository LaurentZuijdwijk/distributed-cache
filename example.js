var Cache = require('./index.js');

var cache = new Cache({ports : [8123, 8124, 8125]});

setInterval(function(){
	cache.setData('aaa', 'hththdhdrhdrhdrhxghvmguylgyjrqwd§aczxfbfjdtjdrthdcdfgzed')
}, 1000)
