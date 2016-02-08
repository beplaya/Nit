module.exports = function(nerver){
    var express = require('express');
    var app = express();
    app.nerver = nerver;
    var fs = require('fs');
    var nettings = require(__dirname + '/../lib/nit_settings.js')().load();
    var port = nettings.nerver.team.port;
    app.use(express.static(__dirname + '/public'));

    app.get('/test', function(req, res){
        res.send('team works');
    });
    var server = require('http').createServer(app);
    //
    var io = require('socket.io').listen(server);
    var sockets = [];
    io.sockets.on('connection', function (socket) {
        sockets.push(socket);
        console.log('Connection establish:', socket.id);

        // sending a message back to the client
        socket.emit('connected', { serverType: 'team', message: 'connected', isLoggedIn: nerver.isLoggedIn, projectKey: nettings.projectKey});

        socket.lastCheckSum = 0;
    });

    app.inputListener = {
        onData : function(data, projectKey, fromUpdate, whichData){
            console.log("onData received!", whichData)
            for(var i=0; i<sockets.length; i++){
                try{
                    sockets[i].emit(fromUpdate ? ("update_"+whichData) : 'update_pending', data);
                } catch(e){
                    console.log(e);
                }
            }
        }
    };
    require('./lib/input_team.js')(app);
    ///
    server.listen(port);
    console.log('listening on ' + port);
}