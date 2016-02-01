var express = require('express');
var app = express();
var port = '9000';
var fs = require('fs');


app.get('/test', function(req, res){
	res.send('it works');
});


app.get('/projects/:project_key/:which_data', function(req, res){
    try {
        var projectKey = req.params.project_key.toUpperCase();
        var whichData = req.params.which_data.toLowerCase();
        var file = __dirname+"/project_cache/project_"+projectKey+"/json/"+whichData+".json";
        var contents = fs.readFileSync(file, "utf8");
        contents = JSON.parse(contents);
        res.status(200).json(contents);
	}catch(e){
	    console.log(e);
	    res.status(503).send("503");
    }
});

app.use(express.static(__dirname + '/public'));
var server = require('http').createServer(app);
//


var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
    console.log('Someone connected to me, hooray!' + Math.random());

    // sending a message back to the client
    socket.emit('connected', { message: 'Thanks for connecting!' });

    // listening for messages from the client
    socket.on('message', function(message) {
         console.log(message);
    });



    socket.lastCheckSum = 0;
    setInterval(function(){
        var sum = 0;
        var dir = __dirname+"/project_cache";
        var files = fs.readdirSync(dir);
        walk(dir, function(err, results) {
            if (err)
                throw err;

            for(var i=0; i<results.length; i++){
                var stat = fs.statSync(results[i]);
                sum += 1*Date.parse(stat.mtime);
                sum += 1*stat.size;
            }
            if(sum != socket.lastCheckSum){
                //console.log('EMIT UPDATE!');
                socket.lastCheckSum = sum;
                socket.emit('update', { message: '' });
            }
        });

    },1000);
});


function walk(dir, cb) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return cb(err);
    var i = 0;
    (function next() {
      var file = list[i++];
      if (!file) return cb(null, results);
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
};
///
require('./lib/input.js')(app);
///
server.listen(port);
console.log('listening on ' + port);