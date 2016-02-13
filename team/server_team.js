module.exports = function(nerver){
    var express = require('express');
    var app = express();
    app.nerver = nerver;
    var fs = require('fs');
    app.nettings = require(__dirname + '/../lib/nit_settings.js')().load();
    var inputReceiver = require(__dirname + '/lib/input_receiver.js')(app.nettings);
    var port = app.nettings.nerver.team.port;
    app.use(express.static(__dirname + '/public'));

    app.get('/test', function(req, res){
        res.send('team works');
    });
    var server = require('http').createServer(app);
    //
    var io = require('socket.io').listen(server);
    app.sockets = [];
    io.sockets.on('connection', function (socket) {
        console.log('Connection establish:', socket.id);
        var found = false;
        for(var i=0; i<app.sockets.length; i++) {
            if(app.sockets[i].id == socket.id){
                app.sockets[i] = socket;
                found = true;
                break;
            }
        }
        if(!found) {
            app.sockets.push(socket);
        }

        // sending a message back to the client
        socket.emit('connected', { serverType: 'team', message: 'connected', isLoggedIn: nerver.isLoggedIn, projectKey: app.nettings.projectKey});

        socket.lastCheckSum = 0;
    });

    app.inputListener = {
        onData : function(data, projectKey, fromUpdate, whichData){
            var eventKey = fromUpdate ? ("update_"+whichData) : 'update_pending';
            if(projectKey===app.nettings.projectKey){
                inputReceiver.handleEvent(eventKey, data);
                for(var i=0; i<app.sockets.length; i++){
                    try{
                        app.sockets[i].emit(eventKey, data);
                        app.sockets[i].emit("server_cache", inputReceiver.cache);
                    } catch(e){
                        console.log(e);
                    }
                }
            }
        }
    };
    require('./lib/input_team.js')(app);
    ///
    server.listen(port);
    console.log('listening on ' + port);
    require(__dirname + "/lib/update.js")(app, inputReceiver).init();
}

