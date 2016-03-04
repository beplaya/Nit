module.exports = function(app, inputReceiver){
    U = {app:app, inputReceiver:inputReceiver};
    U.PSUEDO_SPRINT_LENGTH_DEFAULT = 2*7*24*60*60*1000;//2 weeks
    U.PSUEDO_HISTORY_LENGTH_DEFAULT = 6*4*7*24*60*60*1000;//~ 6 months
    U.glimr = require(__dirname + '/../node_modules/glimr/glimr.js')();
    U.updatePeriodMin = 45;
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
            dataToSend.jiraIntegrated = U.inputReceiver.cache.jiraIntegrated;
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
            U.inputReceiver.cache.jiraIntegrated = true;
            U.app.nerver.nira.getCurrentSprintForCurrentProject(function(allSprints, currentSprint){
                console.log((currentSprint ? "Found current Sprint!" : "No current sprint found!"));
                U.inputReceiver.cache.currentSprint = currentSprint;
                U.inputReceiver.cache.allSprints = allSprints;
                U.inputReceiver.clearOldCardsAndUsers();

                U.getSprintStoryPointVelocityForAllSprints(0, allSprints, function(allSprints){
                    U.inputReceiver.cache.allSprints = allSprints;
                    U.inputReceiver.cacheSaver.saveCache();
                    U.updateGlimr(function(){
                        U.inputReceiver.cacheSaver.saveCache();
                    });
                });

                U.app.nerver.nira.getSprintStoryPointVelocity(U.app.nettings.projectKey, currentSprint.name,
                    function(projectKey, sprintName, sprintStoryPointVelocity){
                        U.inputReceiver.cache.currentSprint.sprintStoryPointVelocity=sprintStoryPointVelocity;
                        U.updateGlimr(function(){
                            U.inputReceiver.cacheSaver.saveCache();
                            cb && cb();
                        });
                    }
                );
            });
        } else {
            //"id": 147,
            //"sequence": 147,
            //"name": "Alfred Device Sprint 1",
            //"state": "CLOSED",
            //"linkedPagesCount": 0,
            //"startDate": "26/May/15 5:13 PM",
            //"endDate": "01/Jun/15 5:13 PM",
            //"completeDate": "01/Jun/15 5:16 PM",
            //"canUpdateSprint": true,
            //"remoteLinks": [],
            //"daysRemaining": 0,
            //"isCurrent": false,
            //"sprintStoryPointVelocity" : 0
            U.inputReceiver.cache.jiraIntegrated = false;
            var allSprints = [];
            var currentSprint;
            var sprintLengthMs = U.PSUEDO_SPRINT_LENGTH_DEFAULT;
            var startDate = new Date(new Date().getTime()-U.PSUEDO_HISTORY_LENGTH_DEFAULT);//TODO use start of logs
            var endDate = new Date(new Date().getTime() + sprintLengthMs);
            var numberOfSprints = Math.floor((endDate.getTime()-startDate.getTime()) / sprintLengthMs);
            for(var sprintNumber=0; sprintNumber < numberOfSprints; sprintNumber++) {
                var startMs = startDate.getTime() + (sprintNumber * sprintLengthMs);
                var endMs = startMs + ((1 + sprintNumber) * sprintLengthMs);
                var isCurrent = (sprintNumber == (numberOfSprints-1));
                var sprint = {
                    id: sprintNumber,
                    name: ("Psuedo Sprint " + sprintNumber),
                    startDate: new Date(startMs),
                    endDate: new Date(endMs),
                    completeDate: new Date(endMs),
                    isCurrent: isCurrent,
                    sprintStoryPointVelocity : undefined
                };
                allSprints.push(sprint);
                if(isCurrent) {
                    currentSprint = sprint;
                }
            }

            U.inputReceiver.cache.currentSprint = currentSprint;
            U.inputReceiver.cache.allSprints = allSprints;
            U.inputReceiver.clearOldCardsAndUsers();
            U.inputReceiver.cacheSaver.saveCache();
            U.updateGlimr(function(){
                U.inputReceiver.cacheSaver.saveCache();
            });
        }
    };

    U.getSprintStoryPointVelocityForAllSprints = function(index, allSprints, cb){
        U.app.nerver.nira.getSprintStoryPointVelocity(U.app.nettings.projectKey, allSprints[index].name,
            function(projectKey, sprintName, sprintStoryPointVelocity){
                allSprints[index].sprintStoryPointVelocity = sprintStoryPointVelocity;
                index++;
                if(index < allSprints.length){
                    U.getSprintStoryPointVelocityForAllSprints(index, allSprints, cb);
                } else {
                    cb && cb(allSprints);
                }
            }
        );
    };

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