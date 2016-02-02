module.exports = function(nerver){
    var express = require('express');
    var app = express();
    app.nerver = nerver;
    var port = '9000';
    var fs = require('fs');
    var nettings = require(__dirname + '/../lib/nit_settings.js')().load();
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
        socket.emit('connected', { message: 'connected'});

        // listening for messages from the client
        socket.on('connection_init', function (data) {
            console.log("connection_init", data);
            var socketID = socket.id;
            var projectKey = data.projectKey;
            for(var i=0; i<sockets.length; i++){
                if(sockets[i].id===socketID){
                    sockets[i].projectKey = projectKey;
                    console.log("Mapped socket", socketID, "to project", projectKey);
                }
            }
        });

        socket.lastCheckSum = 0;
    });

    app.inputListener = {
        onData : function(data, projectKey, fromUpdate){
            for(var i=0; i<sockets.length; i++){
                if(sockets[i].projectKey === projectKey){
                    try{
                        console.log('emit update for project', projectKey);
                        sockets[i].emit('update', { message: '', projectKey: projectKey });
                    } catch(e){}
                }
            }
            if(!fromUpdate){
                setTimeout(function(){
                    app.nerver.nit.updateNerver();
                    setTimeout(function(){
                        app.nerver.nit.updateNerver();
                    },3000);
                },1000);
            }
        }
    };
    require('./lib/input.js')(app);
    ///
    server.listen(port);
    console.log('listening on ' + port);

}