module.exports = function Nerver(nira) {
    var NERVER = {};
    NERVER.fs = require('fs');
    NERVER.nira = nira;
    NERVER.NendOfFile = "\n@NOF@!!_!!*@@";
    NERVER.cmdDir = __dirname+"/cmds";
    NERVER.responseDir = __dirname+"/cmdresponse";
    NERVER.period = 200;
    NERVER.timeoutCount = (8 * 60 * 60000) / NERVER.period;

    NERVER.CMDS = [
        { name : "DESCRIBE", action : NERVER.nira.getDescription },
        { name : "COMMENTS", action : NERVER.nira.getComments },
        { name : "CREATE_COMMENT", action : NERVER.nira.createComment }
    ];


    NERVER.prompt = function(cb) {
        var self = NERVER;
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
            self.nira.login(result.username, result.password, function(){
                cb && cb();
            });
        });

        function onErr(err) {
            console.log(err);
            return 1;
        }
    };


    NERVER.start = function() {
        var self = NERVER;
        self.prompt(function() {
            self.counter = 0;
            self.mkdir(self.cmdDir);
            self.mkdir(self.responseDir)
            var files = self.fs.readdirSync(self.cmdDir);

            for(var i=0; i<files.length; i++) {
                var f = files[i];
                self.deleteFile(f);
            }
            self.runInterval = setInterval(function() {
                files = self.fs.readdirSync(self.cmdDir);

                if(self.counter > self.timeoutCount){
                    clearInterval(self.runInterval);
                    console.log("Nerver session ended.");
                    process.exit();
                    return;
                }
                self.counter++;
                console.log('\n>>>');
                self.mkdir(self.cmdDir);
                self.mkdir(self.responseDir)
                var files = self.fs.readdirSync(self.cmdDir);
                for(var i=0; i<files.length; i++) {
                    var f = files[i];
                    self.run(f);
                    self.deleteFile(f);
                }
                console.log("<<<");
            }, self.period);
        });

    };

    NERVER.deleteFile = function(file) {
        NERVER.fs.unlinkSync(NERVER.cmdDir + "/" + file);
    };

    NERVER.run = function(f) {
        var self = NERVER;
        var split = f.split(".");
        if(!f || split.length !== 4){
            return;
        }
        var cmd = split[0];
        var issueID = split[1];
        var option = split[2];
        var guid = split[3];
        var responseFile = self.responseDir + "/" + guid;
        try {
            for(var i=0; i<self.CMDS.length; i++) {
                if(cmd === self.CMDS[i].name){
                    self.CMDS[i].action(issueID, option, function(data){
                        data = data || "";
                        self.fs.writeFile(responseFile, JSON.stringify(data)+self.NendOfFile);
                    });
                }
            }
        } catch (e) {
             self.fs.writeFile(responseFile, e.toString() + self.NendOfFile)
        }
    };

    NERVER.mkdir = function(dir){
        try { NERVER.fs.mkdirSync(dir); }catch(e){}
    };
    return NERVER;
}