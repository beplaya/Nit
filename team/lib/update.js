module.exports = function(app, inputReceiver){
    U = {app:app, inputReceiver:inputReceiver};
    U.glimr = require(__dirname + '/../node_modules/glimr/glimr.js')();
    U.updatePeriodMin = 15;
    U.init = function() {
        U.inputReceiver.cacheSaver.loadCache();

        U.socketInterval = setInterval(U.broadcast, 15000);
        U.updateInterval = setInterval(function(){
            U.updateDevelop(U.updateGlimr);
            U.getCurrentSprint();
        }, U.updatePeriodMin * 60 * 1000);

        U.broadcast();
        U.updateDevelop();
        U.getCurrentSprint(U.broadcast);
    }

    U.broadcast = function() {
        U.inputReceiver.cacheSaver.saveCache();
        for(var i=0; i<U.app.sockets.length; i++) {
            try{
                U.app.sockets[i].emit("server_cache", U.inputReceiver.cache);
            } catch(e){
                console.log(e);
            }
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
    }

    U.updateGlimr = function(){
        new Runner().run("git", ["log"], function(logs){
            var endDate = new Date();
            var startDate = new Date(endDate.getTime()-(7*24*60*60*1000));//7 days trailing
            if(U.inputReceiver.cache.currentSprint){
                startDate = new Date(U.inputReceiver.cache.currentSprint.startDate);
                endDate = new Date(U.inputReceiver.cache.currentSprint.endDate);
            }
            var logsAnalysis =
            U.inputReceiver.cache.currentSprint.logsAnalysis = U.glimr.analyzeLogs(logs,
                U.app.nettings.projectKey, { startDate : startDate, endDate : endDate});
            for(var i=0; i<U.inputReceiver.cache.allSprints.length; i++) {
                U.inputReceiver.cache.allSprints[i].logsAnalysis = U.analyzeSprint(logs,
                        U.inputReceiver.cache.allSprints[i]);
            }
            U.inputReceiver.cacheSaver.saveCache();
        });
    }

    U.analyzeSprint = function(logs, sprint) {
        var startDate = new Date(sprint.startDate);
        var endDate = new Date(sprint.endDate);
        return U.glimr.analyzeLogs(logs, U.app.nettings.projectKey,
            { startDate : startDate, endDate : endDate});
    };

    U.getCurrentSprint = function(cb){
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