module.exports = function(nerver){
    var INTERVAL_PERIOD = 30000;
    var express = require('express');
    var app = express();
    app.nerver = nerver;
    var fs = require('fs');
    var nettings = require(__dirname + '/../lib/nit_settings.js')().load();
    var port = nettings.nerver.port;
    app.use(express.static(__dirname + '/public'));


    app.get('/test', function(req, res){
        res.send('it works');
    });

    app.get('/projects/:project_key/:which_data', function(req, res){
        try {
            var projectKey = req.params.project_key.toUpperCase();
            var whichData = req.params.which_data.toLowerCase();
            var contents = {};
            contents = app.projectData[projectKey][whichData];
            if(contents){
                res.status(200).json(contents);
            } else {
                res.status(404).json({});
            }
        }catch(e){
            console.log("get '/projects/:project_key/:which_data'", e);
            res.status(503).send("503");
        }
    });

    var server = require('http').createServer(app);
    //


    var io = require('socket.io').listen(server);
    var sockets = [];
    io.sockets.on('connection', function (socket) {
        sockets.push(socket);
        console.log('Connection establish:', socket.id);

        // sending a message back to the client
        socket.emit('connected', { message: 'connected', isLoggedIn: nerver.isLoggedIn, projectKey: nettings.projectKey});

        socket.lastCheckSum = 0;
    });

    app.inputListener = {
        onData : function(data, projectKey, fromUpdate, whichData){

            for(var i=0; i<sockets.length; i++){
                try{
                    //console.log('emit update for project', projectKey);
                    sockets[i].emit(fromUpdate ? ("update_"+whichData) : 'update_pending', data);
                } catch(e){
                    console.log(e);
                }
            }
            if(!fromUpdate){
                setTimeout(function(){
                    app.nerver.nit.updateNerver();
                    setTimeout(function(){
                        app.nerver.nit.updateNerver();
                    }, 3000);
                }, 1000);
            }
        }
    };

    app.updateInterval = setInterval(function(){
        console.log("Server interval STARTED>>>");
        app.nerver.nit.updateNerver();
        console.log("Server interval STOPPED<<<");
    }, INTERVAL_PERIOD);

    require('./lib/input.js')(app);
    ///
    server.listen(port);
    console.log('listening on ' + port);
    setTimeout(function(){
        app.nerver.nit.updateNerver();
    },5000);
}