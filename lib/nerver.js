module.exports = function Nerver(nira) {
    var NERVER = {};
    NERVER.fs = require('fs');
    NERVER.dataFiles = require(__dirname + '/data_files.js')();
    NERVER.nira = nira;
    NERVER.NendOfFile = "\n@NOF@!!_!!*@@";
    NERVER.cmdDir = __dirname+"/cmds";
    NERVER.responseDir = __dirname+"/cmdresponse";
    NERVER.period = 500;
    NERVER.timeoutSpan = (5 * 60 * 60000);//5 hours
    NERVER.hasInitialized = false;
    NERVER.progressSize = Math.floor(15000/NERVER.period);
    NERVER.printer = require(__dirname + '/printer.js')();
    NERVER.statusWatcher = require(__dirname + '/status_watcher.js')();

    NERVER.init = function(nit) {
        NERVER.nit = nit;
        NERVER.CMDS = [
            { name : "DESCRIBE", action : NERVER.nira.getDescription, requiresNira: true},
            { name : "COMMENTS", action : NERVER.nira.getComments, requiresNira: true },
            { name : "CREATE_COMMENT", action : NERVER.nira.createComment, requiresNira: true },
            { name : "STATUS", action : function(cb){nit.statusPrint(
                function(statusData, currentBranch, isDetached){
                    NERVER.dataFiles.writeStatusDataFile(statusData, currentBranch, isDetached);
                    nit.logOneLiners(function(oneLineLogData){
                        NERVER.dataFiles.writeOneLineLogFile(oneLineLogData);
                        cb && cb();
                    });
                })}, isNerverAction: true, runMultipleDelayed: true, requiresNira: false },
        ];
    };

    NERVER.prompt = function(cb) {
        var prompt = require('prompt');

        var properties = [
        {
            name: 'username'
        },
        {
            name: 'password',
            hidden: true
        }
        ];

        prompt.start();

        prompt.get(properties, function (err, result) {
            if (err) { return onErr(err); }
            NERVER.nira.login(result.username, result.password, function(isLoggedIn){
                cb && cb(isLoggedIn);
            });
        });

        function onErr(err) {
            NERVER.consoleLog(err);
            return 1;
        }
    };


    NERVER.start = function(arg) {

        if(arg === "x" || arg === "-x" || arg === "silent"){
            NERVER.silent = true;
        }
        NERVER.prompt(function(isLoggedIn) {
            NERVER.listen(isLoggedIn);
        });
    };

    NERVER.listen = function(isLoggedIn){
        NERVER.isLoggedIn = isLoggedIn;
        NERVER.onStart();
        NERVER.counter = 0;
        NERVER.dataFiles.mkDir(NERVER.cmdDir);
        NERVER.dataFiles.mkDir(NERVER.responseDir)
        var files = NERVER.fs.readdirSync(NERVER.cmdDir);

        for(var i=0; i<files.length; i++) {
            var f = files[i];
            NERVER.deleteFile(f);
        }
        NERVER.startTime = (new Date().getTime());
        NERVER.runInterval = setInterval(function() {
            files = NERVER.fs.readdirSync(NERVER.cmdDir);

            if(NERVER.shouldEnd()){
                clearInterval(NERVER.runInterval);
                NERVER.consoleLog("Nerver session ended.");
                process.exit();
                return;
            }
            NERVER.counter++;
            NERVER.dataFiles.mkDir(NERVER.cmdDir);
            NERVER.dataFiles.mkDir(NERVER.responseDir)
            var files = NERVER.fs.readdirSync(NERVER.cmdDir);
            for(var i=0; i<files.length; i++) {
                var f = files[i];
                if(NERVER.runCommandFile(f)) {
                    NERVER.deleteFile(f);
                }
            }

            NERVER.writeProgress();
        }, NERVER.period);
    };

    NERVER.readSync = function(f) {
        var c = "";
        try {
           c = NERVER.fs.readFileSync(f).toString();
        } catch(e){
            c = e;
        }
        return c.toString();
    };

    NERVER.shouldEnd = function(){
        return (new Date().getTime() - NERVER.startTime) > NERVER.timeoutSpan;
    };

    NERVER.writeProgress = function() {
        if(NERVER.hasInitialized && !NERVER.silent){
            if(NERVER.counter % NERVER.progressSize === 0){
                NERVER.initWriteProgress();
                var cmd = NERVER.findCommand("STATUS", 0);
                cmd.runMultipleDelayed = false;
                NERVER.runStatusAfterDelay(cmd, 1);
            }
        }
    };

    NERVER.initWriteProgress = function(){
        if(!NERVER.silent) {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
        }
    };

    NERVER.onStart = function(){
        NERVER.clearScreen();
        NERVER.printer.hr2();
         NERVER.consoleLog("\n\n");
        if(!NERVER.isLoggedIn){
            NERVER.consoleLog("Not Logged in");
        }else {
            NERVER.consoleLog("Logged in.");
        }
        NERVER.consoleLog("Nerver is listening...\n\n\n");
        NERVER.printer.hr2();
        NERVER.runStatusAfterDelay(NERVER.findCommand("STATUS"), 1500);
        setTimeout(function(){NERVER.hasInitialized = true; NERVER.initWriteProgress(); }, 1550);
    };

    NERVER.deleteFile = function(file) {
        NERVER.fs.unlinkSync(NERVER.cmdDir + "/" + file);
    };

    NERVER.runCommandFile = function(f) {
        var split = f.split(".");
        if(!f || split.length !== 5){
            return;
        }
        var projectKey = split[0];
        var cmdName = split[1];
        var issueID = split[2];
        var option = split[3];
        var guid = split[4];

        if(projectKey !== NERVER.nira.nettings.jira.projectKey) {
            return false;
        }

        var responseFile = NERVER.responseDir + "/" + guid;
        try {
            var commandContent = NERVER.readSync(NERVER.cmdDir + "/" + f) || "";
            var command = NERVER.findCommand(cmdName);
            command.content = commandContent;

            if(command) {
                if(command.isNerverAction){
                    if(command.runMultipleDelayed) {
                        NERVER.runStatusAfterDelay(command, NERVER.statusWatcher.statusDelay);
                        NERVER.runStatusAfterDelay(command, NERVER.statusWatcher.redoStatusTime);
                    } else {
                        if(command.name === "STATUS" && NERVER.statusWatcher.canPrintStatus()) {
                            NERVER.statusWatcher.reset();
                            command.action();
                        } else if(command.name !== "STATUS") {
                            if(!command.requiresNira || NERVER.isLoggedIn){
                                command.action();
                            }
                        }
                    }

                    if(command.name !== "STATUS") {
                        NERVER.fs.writeFile(responseFile, "{}" + NERVER.NendOfFile);
                    }
                } else {
                    if(command.name === "CREATE_COMMENT"){
                        NERVER.nira.clearCache(issueID);
                    }
                    if(!command.requiresNira || NERVER.isLoggedIn){
                        command.action(issueID, commandContent, function(data){
                            data = data || "";
                            NERVER.fs.writeFile(responseFile, JSON.stringify(data)+NERVER.NendOfFile);
                        });
                    }
                }
            }
        } catch (e) {
             NERVER.fs.writeFile(responseFile, e.toString() + NERVER.NendOfFile)
        }
        return true;
    };

    NERVER.findCommand = function(cmdName) {
        for(var i=0; i<NERVER.CMDS.length; i++) {
            if(cmdName === NERVER.CMDS[i].name){
                return NERVER.CMDS[i];
            }
        }
        return undefined;
    };

    NERVER.runStatusAfterDelay = function(command, delay) {
        if(NERVER.statusWatcher.canPrintStatus() && command.name === "STATUS" && !NERVER.silent) {
            NERVER.statusWatcher.reset();
            setTimeout(function() {
                    NERVER.clearScreen();
                    setTimeout(function() {
                        NERVER.printer.hr2();
                        if(NERVER.isLoggedIn) {
                            NERVER.nit.getBranchAndDescribe(function(){
                                NERVER.printer.hr();
                                NERVER.nit.getBranchComments(function(){
                                    NERVER.printer.hr();
                                    command.action(function(){
                                        NERVER.printer.hr2();
                                        NERVER.consoleLog("");
                                    });
                                });
                            });
                        } else {
                            NERVER.consoleLog("");
                            command.action(function(){
                                NERVER.printer.hr2();
                                NERVER.consoleLog("");
                            });
                        }
                    }, 30);
                }, delay);
        }
    };

    NERVER.write = function(str) {
        if(!NERVER.silent) {
            process.stdout.write(str);
        }
    };

    NERVER.consoleLog = function(str) {
        if(!NERVER.silent) {
            NERVER.printer.print(str);
        }
    }

    NERVER.clearScreen = function(){
        var numLines = process.stdout.getWindowSize()[1];
        NERVER.cursorUp(numLines, false);
    };

    NERVER.cursorUp = function up (i, save) {
        i = i || 1;
        if (i > 0) {
            while(i--) {
                process.stdout.write(!save ? '\033[K\033[1A\r' : '\033[1A\r');
            }
        }
        process.stdout.cursorTo(0);
    };
    return NERVER;
}