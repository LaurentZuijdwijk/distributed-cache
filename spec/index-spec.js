'use strict'

var test = require('tape');
var Cache = require('../index.js');

test('constructor', function (t) {
    t.plan(7);

    t.equal(typeof Cache, 'function');
    let cache = new Cache();

    t.equal(typeof cache.listen, 'function');
    t.equal(typeof cache.close, 'function');
    t.equal(typeof cache.setData, 'function');
    t.equal(typeof cache.set, 'function');
    t.equal(typeof cache.del, 'function');
    t.equal(typeof cache.get, 'function');

});

test('defaults', function (t) {
	t.end();
});

test('listen', function (t) {
    let cache = new Cache();
    cache.initPubSocket = function(port){
    	t.equal(port,10110)

    }
    cache.initRepSocket = function(port){
    	t.equal(port,10120)

    }

    cache.on('bind',(port)=>{
    	t.equal(port,10100)
    	cache.close();
    	t.end();

    });


    cache.listen();
});

