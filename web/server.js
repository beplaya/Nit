module.exports = function(){
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
            var contents = {};
            //if(whichData==="status"){
            //    contents = app.projectData[projectKey][whichData];
            //} else {
                var file = __dirname+"/project_cache/project_"+projectKey+"/json/"+whichData+".json";
                contents = fs.readFileSync(file, "utf8");
                contents = JSON.parse(contents);
            //}
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
    var sockets = [];
    io.sockets.on('connection', function (socket) {
        sockets.push(socket);
        console.log('Someone connected to me, hooray!' + Math.random());

        // sending a message back to the client
        socket.emit('connected', { message: 'Thanks for connecting!' });

        // listening for messages from the client
        socket.on('message', function(message) {
             console.log(message);
        });



        socket.lastCheckSum = 0;
    });


    app.inputListener = {
        onData : function(data, projectKey){
            console.log('emit update!');
            for(var i=0; i<sockets.length; i++){
                try{ sockets[i].emit('update', { message: '', projectKey: projectKey }); } catch(e){}
            }
        }
    };
    require('./lib/input.js')(app);
    ///
    server.listen(port);
    console.log('listening on ' + port);

}