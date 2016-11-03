'use strict';
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

var http = require('http');

// if (cluster.isMaster) {
//   // Fork workers.
//   for (var i = 0; i < 4; i++) {
//     cluster.fork();
//   }
//   cluster.on('exit', (worker, code, signal) => {
//     // console.log(`worker ${worker.process.pid} died`);
//   });
// } else {
    const PORT = process.argv[2];
  
    // var fs = require('fs');
    var Cache = require('../index.js');
    var cache = new Cache();
    //Create a server
    var server = http.createServer(handleRequest);

    //Lets start our server
    server.listen(PORT, function () {
    });

    function handleRequest(request, response) {
        let key = request.url.split('/')[1];
        let method = request.url.split('/')[2];
        console.log(request.url, key , method)
        if(method === 'delete'){
            cache.del(key);
            response.write('deleted'+key);
            response.end();
            return;
        }

        var cacheStream = cache.get(key);
        if(cacheStream){
            cacheStream.pipe(response);
        }
        else{
            let data = `You navigated to ${key}`;
            let c = cache.set(key);
            c.pipe(response);
            response.write('Data not from cache. \r');
            c.write(data);
            c.end();
        }
    }
