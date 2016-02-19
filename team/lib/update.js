module.exports = function(app, inputReceiver){
    U = {app:app, inputReceiver:inputReceiver};
    U.glimr = require(__dirname + '/../node_modules/glimr/glimr.js')();
    U.updatePeriodMin = 15;
    U.init = function() {
        U.inputReceiver.cacheSaver.loadCache();

        U.socketInterval = setInterval(function(){U.broadcastCardsAndUsers();}, 60000);
        setInterval(function(){
            U.inputReceiver.cacheSaver.saveCache();
            U.getSprintData(function(){
                U.broadcastCardsAndUsers();
                U.updateDevelop(function(){
                    U.updateGlimr(function(){
                        U.broadcastGlimr();
                        U.inputReceiver.cacheSaver.saveCache();
                    });
                });
            });
        }, U.updatePeriodMin * 60 * 1000);

        U.broadcastCardsAndUsers();
        U.updateDevelop();
        U.getSprintData(function(){
            U.inputReceiver.cacheSaver.saveCache();
            U.broadcastCardsAndUsers();
            U.updateDevelop(function(){
                U.updateGlimr(function(){
                    U.inputReceiver.cacheSaver.saveCache();
                    U.broadcastGlimr();
                });
            });
        });
    }

    U.onConnectedSocket = function(socket) {
        U.emit(socket, "server_cache_cards_and_users", U.getCardsAndUsersData());
        U.emit(socket, "server_cache_glimr", U.getGlimrData());
    };

    U.getCardsAndUsersData = function() {
        var dataToSend = {};
        try {
            dataToSend.cards = U.inputReceiver.cache.cards;
            dataToSend.users = U.inputReceiver.cache.users;
        } catch(e){ dataToSend = {}; }
        return dataToSend;
    };

    U.getGlimrData = function() {
        var dataToSend = {};
        try {
            dataToSend.logsAnalysis = U.inputReceiver.cache.logsAnalysis;
            dataToSend.currentSprint = U.inputReceiver.cache.currentSprint;
            dataToSend.allSprints = U.inputReceiver.cache.allSprints;
        } catch(e){ dataToSend = {}; }
        return dataToSend;
    };

    U.broadcastCardsAndUsers = function() {
        for(var i=0; i<U.app.sockets.length; i++) {
            U.emit(U.app.sockets[i], "server_cache_cards_and_users", U.getCardsAndUsersData());
        }
    };

    U.broadcastGlimr = function() {
        for(var i=0; i<U.app.sockets.length; i++) {
            U.emit(U.app.sockets[i], "server_cache_glimr", U.getGlimrData());
        }
    };

    U.emit = function(socket, eventName, data) {
        try{
            socket.emit(eventName, data);
        } catch(e){
            console.log(e);
        }
    };

    U.updateDevelop = function(cb){
        console.log("Updating current branch in team repo every", U.updatePeriodMin, " minutes.");
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
    };

    U.updateGlimr = function(cb){
        new Runner().run("git", ["log"], function(logs){
            var endDate = new Date();
            var startDate = new Date(endDate.getTime()-(7*24*60*60*1000));//7 days trailing
            if(U.inputReceiver.cache.currentSprint){
                startDate = new Date(U.inputReceiver.cache.currentSprint.startDate);
                endDate = new Date(U.inputReceiver.cache.currentSprint.endDate);
            }
            U.inputReceiver.cache.currentSprint.logsAnalysis = U.glimr.analyzeLogs(logs,
                U.app.nettings.projectKey, { startDate : startDate, endDate : endDate});
            for(var i=0; i<U.inputReceiver.cache.allSprints.length; i++) {
                U.inputReceiver.cache.allSprints[i].logsAnalysis = U.analyzeSprint(logs,
                        U.inputReceiver.cache.allSprints[i]);
            }
            cb && cb();
            U.inputReceiver.cacheSaver.saveCache();
        });
    }

    U.analyzeSprint = function(logs, sprint) {
        var startDate = new Date(sprint.startDate);
        var endDate = new Date(sprint.endDate);
        return U.glimr.analyzeLogs(logs, U.app.nettings.projectKey,
            { startDate : startDate, endDate : endDate});
    };

    U.getSprintData = function(cb){
        if(U.app.nerver.isLoggedIn) {
            console.log("Getting current sprint (can take a couple miunutes) ...");
            U.app.nerver.nira.getCurrentSprintForCurrentProject(function(allSprints, currentSprint){
                console.log((currentSprint ? "Found current Sprint!" : "No current sprint found!"));
                U.inputReceiver.cache.currentSprint = currentSprint;
                U.inputReceiver.cache.allSprints = allSprints;
                U.inputReceiver.clearOldCardsAndUsers();
                U.updateGlimr();
                U.inputReceiver.cacheSaver.saveCache();
                cb && cb();

            });
        }
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

    return U;
};