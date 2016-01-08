module.exports = function Nerver(nira) {
    var NERVER = {};
    NERVER.fs = require('fs');
    NERVER.nira = nira;
    NERVER.NendOfFile = "\n@NOF@!!_!!*@@";
    NERVER.cmdDir = __dirname+"/cmds";
    NERVER.responseDir = __dirname+"/cmdresponse";
    NERVER.period = 500;
    NERVER.timeoutCount = (8 * 60 * 60000) / NERVER.period;
    NERVER.hasInitialized = false;
    NERVER.progressSize = Math.floor(15000/NERVER.period);
    NERVER.progressChar = "[][]";
    NERVER.hrChar = "\\/\\/";

    NERVER.init = function(nit) {
        NERVER.nit = nit;
        NERVER.CMDS = [
            { name : "DESCRIBE", action : NERVER.nira.getDescription },
            { name : "COMMENTS", action : NERVER.nira.getComments },
            { name : "CREATE_COMMENT", action : NERVER.nira.createComment },
            { name : "STATUS", action : function(cb){nit.statusPrint(function(){  nit.logOneLiners(cb); })}, isNerverAction: true, runMultipleDelayed: true },
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
            console.log(err);
            return 1;
        }
    };


    NERVER.start = function(arg) {
        if(arg === "x" || arg === "-x"){
            //Skip login
            NERVER.listen(false);
        } else {
            NERVER.prompt(function(isLoggedIn) {
                NERVER.listen(isLoggedIn);
            });
        }
    };

    NERVER.listen = function(isLoggedIn){
        NERVER.isLoggedIn = isLoggedIn;
        NERVER.onStart();
        NERVER.counter = 0;
        NERVER.mkdir(NERVER.cmdDir);
        NERVER.mkdir(NERVER.responseDir)
        var files = NERVER.fs.readdirSync(NERVER.cmdDir);

        for(var i=0; i<files.length; i++) {
            var f = files[i];
            NERVER.deleteFile(f);
        }
        NERVER.runInterval = setInterval(function() {
            files = NERVER.fs.readdirSync(NERVER.cmdDir);

            if(NERVER.counter > NERVER.timeoutCount){
                clearInterval(NERVER.runInterval);
                console.log("Nerver session ended.");
                process.exit();
                return;
            }
            NERVER.counter++;
            NERVER.mkdir(NERVER.cmdDir);
            NERVER.mkdir(NERVER.responseDir)
            var files = NERVER.fs.readdirSync(NERVER.cmdDir);
            for(var i=0; i<files.length; i++) {
                var f = files[i];
                NERVER.run(f);
                NERVER.deleteFile(f);
            }
            NERVER.writeProgress();
        }, NERVER.period);
    };

    NERVER.writeProgress = function() {
        if(NERVER.hasInitialized){
            process.stdout.write(NERVER.progressChar);
            if(NERVER.counter % NERVER.progressSize === 0){
                NERVER.initWriteProgress();
                var cmd = NERVER.findCommand("STATUS", 0);
                cmd.runMultipleDelayed = false;
                NERVER.runDelayedAction(cmd);
            }
        }
    };

    NERVER.initWriteProgress = function(){
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
    };

    NERVER.onStart = function(){
        process.stdout.write('\033[2J');
        if(!NERVER.isLoggedIn){
            console.log("Not Logged in");
        }else {
            console.log("Logged in.");
        }
        console.log("Nerver is listening...\n----------------------------------------------\n\n\n");

        NERVER.runDelayedAction(NERVER.findCommand("STATUS"), 1500);
        setTimeout(function(){NERVER.hasInitialized = true; NERVER.initWriteProgress(); }, 1550);
    };

    NERVER.deleteFile = function(file) {
        NERVER.fs.unlinkSync(NERVER.cmdDir + "/" + file);
    };

    NERVER.run = function(f) {
        var split = f.split(".");
        if(!f || split.length !== 4){
            return;
        }
        var cmdName = split[0];

        var issueID = split[1];
        var option = split[2];
        var guid = split[3];
        var responseFile = NERVER.responseDir + "/" + guid;
        try {
            var command = NERVER.findCommand(cmdName);
            if(command) {
                if(command.isNerverAction){

                    if(command.runMultipleDelayed) {
                        NERVER.runDelayedAction(command, 100);
                        NERVER.runDelayedAction(command, 2.24233*NERVER.period);
                    } else {
                        command.action();
                    }
                    if(command.name !== "STATUS") {
                        NERVER.fs.writeFile(responseFile, "{}"+NERVER.NendOfFile);
                    }
                } else {
                    command.action(issueID, option, function(data){
                        data = data || "";
                        NERVER.fs.writeFile(responseFile, JSON.stringify(data)+NERVER.NendOfFile);
                    });
                }
            }
        } catch (e) {
             NERVER.fs.writeFile(responseFile, e.toString() + NERVER.NendOfFile)
        }
    };

    NERVER.findCommand = function(cmdName) {
        for(var i=0; i<NERVER.CMDS.length; i++) {
            if(cmdName === NERVER.CMDS[i].name){
                return NERVER.CMDS[i];
            }
        }
        return undefined;
    };

    NERVER.runDelayedAction = function(command, delay) {
        setTimeout(function() {
                process.stdout.write('\033[2J');
                NERVER.hr();
                    console.log("");
                command.action(function(){
                    NERVER.hr();
                    console.log("");
                });
            }, delay);
    };

    NERVER.hr = function(){
        process.stdout.write('\n');
        for(var i =0; i<NERVER.progressSize; i++) {
            process.stdout.write(NERVER.hrChar);
        }
        process.stdout.write('\n');
    }

    NERVER.mkdir = function(dir){
        try { NERVER.fs.mkdirSync(dir); }catch(e){}
    };

    return NERVER;
}