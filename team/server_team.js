module.exports = function(nerver){
    var express = require('express');
    var app = express();
    app.nerver = nerver;
    var fs = require('fs');
    var nettings = require(__dirname + '/../lib/nit_settings.js')().load();
    var inputReceiver = require(__dirname + '/lib/input_receiver.js')(nettings);
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
        console.log('Connection establish:', socket.id);
        var found = false;
        for(var i=0; i<sockets.length; i++) {
            if(sockets[i].id == socket.id){
                sockets[i] = socket;
                found = true;
                break;
            }
        }
        if(!found) {
            sockets.push(socket);
        }

        // sending a message back to the client
        socket.emit('connected', { serverType: 'team', message: 'connected', isLoggedIn: nerver.isLoggedIn, projectKey: nettings.projectKey});

        socket.lastCheckSum = 0;
    });

    app.inputListener = {
        onData : function(data, projectKey, fromUpdate, whichData){
            var eventKey = fromUpdate ? ("update_"+whichData) : 'update_pending';
            if(projectKey===nettings.projectKey){
                inputReceiver.handleEvent(eventKey, data);
                for(var i=0; i<sockets.length; i++){
                    try{
                        sockets[i].emit(eventKey, data);
                        sockets[i].emit("server_cache", inputReceiver.cache);
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
    inputReceiver.cacheSaver.loadCache();

    setInterval(function(){
        inputReceiver.cacheSaver.saveCache();
        for(var i=0; i<sockets.length; i++){
            try{
                sockets[i].emit("server_cache", inputReceiver.cache);
            } catch(e){
                console.log(e);
            }
        }
    }, 45000);
    var updatePeriodMin = 15;
    setInterval(function(){
        updateDevelop(updateGlimr);
    }, updatePeriodMin * 60 * 1000);

    updateDevelop(updateGlimr);
    function updateDevelop(cb){
        console.log("Updating current branch in team repo every", updatePeriodMin, " minutes.");
        var cmd = "nit pull";
        console.log("Updating team repo");
        console.log("Running: "+cmd);
        child_process = require('child_process');

        child_process.exec(cmd, function(err, out, code) {
            if (err instanceof Error)
                throw err;
            process.stdout.write(out);
            cb && cb();
        });
    }

    function updateGlimr(){
        var glimr = require(__dirname + '/node_modules/glimr/glimr.js')();
        var runner = new Runner();
        runner.run("git", ["log"], function(logs){
            var logsAnalysis = glimr.analyzeLogs(logs, nettings.projectKey, {startDate});
            inputReceiver.cacheSaver.saveLogCache(logsAnalysis);
            app.inputListener.onData(logsAnalysis, nettings.projectKey,
                true, "glimr");
        });

    }



    function Runner() {
        this.isWin = /^win/.test(process.platform);
        this.child_process = require('child_process');
        this.runInherit = function(cmd, cmdArgs, cb) {

            if(this.isWin){
                if(cmd === "open"){
                    cmd = "start";
                }
            }
            var msg = cmd;
            if(cmdArgs){
                for(var i=0; i<cmdArgs.length; i++) {
                    msg += " "+cmdArgs[i];
                }
            }
            var spawn = this.child_process.spawn;
            spawn(cmd, cmdArgs, {stdio : 'inherit'});

            cb && cb();
        };

        this.run = function(cmd, cmdArgs, cb) {
            if(this.isWin){
                if(cmd === "open"){
                    cmd = "start";
                }
            }
            var spawn = require('child_process').spawn,
            ls = spawn(cmd, cmdArgs);
            // console.log("RUNNING ", "[", cmd,  cmdArgs.join(" "), "]");
            var out = "";
            var error = false;
            ls.stdout.on('data', function (data) {
                out += "\n" + (data ? data.toString() : "");
            });
            ls.stderr.on('data', function (data) {
                error = true;
                out += "\n" + (data ? data.toString() : "");
            });

            ls.on('close', function (code) {
                cb && cb(out, error);
            });
        };


    }
}

