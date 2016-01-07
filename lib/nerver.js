module.exports = function Nerver(nira) {
    var NERVER = {};
    NERVER.fs = require('fs');
    NERVER.nira = nira;
    NERVER.NendOfFile = "\n@NOF@!!_!!*@@";
    NERVER.cmdDir = __dirname+"/cmds";
    NERVER.responseDir = __dirname+"/cmdresponse";
    NERVER.period = 200;
    NERVER.timeoutCount = (8 * 60 * 60000) / NERVER.period;

    NERVER.init = function(nit) {
        NERVER.nit = nit;
        NERVER.CMDS = [
            { name : "DESCRIBE", action : NERVER.nira.getDescription },
            { name : "COMMENTS", action : NERVER.nira.getComments },
            { name : "CREATE_COMMENT", action : NERVER.nira.createComment },
            { name : "STATUS", action : function(){nit.statusPrint(); nit.logOneLiners();}, isNerverAction: true },
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
        NERVER.printStart();
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
            //process.stdout.write(".");
            //if(NERVER.counter%30===0){
             //   process.stdout.clearLine();
             //   process.stdout.cursorTo(0);
            //}
        }, NERVER.period);
    };

    NERVER.printStart = function(){
        if(!NERVER.isLoggedIn){
            console.log("Not Logged in");
        }else {
            console.log("Logged in.");
        }
        console.log("Nerver is listening...\n----------------------------------------------\n\n\n");
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
            for(var i=0; i<NERVER.CMDS.length; i++) {
                if(cmdName === NERVER.CMDS[i].name){
                    var command = NERVER.CMDS[i];
                    if(command.isNerverAction){

                        if(command.name === "STATUS") {
                            setTimeout(function() { console.log('\033[2J');command.action(); }, 500);
                            setTimeout(function() { console.log('\033[2J');command.action(); }, 1500);
                            setTimeout(function() { console.log('\033[2J');command.action(); }, 3500);
                        } else {
                            command.action();
                            NERVER.fs.writeFile(responseFile, "{}"+NERVER.NendOfFile);
                        }
                    } else {
                        command.action(issueID, option, function(data){
                            data = data || "";
                            NERVER.fs.writeFile(responseFile, JSON.stringify(data)+NERVER.NendOfFile);
                        });
                    }
                }
            }
        } catch (e) {
             NERVER.fs.writeFile(responseFile, e.toString() + NERVER.NendOfFile)
        }
    };

    NERVER.mkdir = function(dir){
        try { NERVER.fs.mkdirSync(dir); }catch(e){}
    };
    return NERVER;
}