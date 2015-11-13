module.exports = function Nerver(nira) {

    this.fs = require('fs');
    this.nira = nira;
    this.NendOfFile = "\n@NOF@!!_!!*@@";
    this.cmdDir = __dirname+"/cmds";
    this.responseDir = __dirname+"/cmdresponse";
    this.period = 200;
    this.timeoutCount = (8 * 60 * 60000) / this.period;

    this.CMDS = {
        DESCRIPTION : "DESCRIPTION",
        COMMENTS : "COMMENTS"
    };

    this.prompt = function(cb) {
        var self = this;
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


    this.start = function() {
        var self = this;
        self.prompt(function() {
            self.counter = 0;
            self.runInterval = setInterval(function() {
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

    this.deleteFile = function(file) {
        this.fs.unlinkSync(this.cmdDir + "/" + file);
    };

    this.run = function(f) {
        var self = this;
        var split = f.split(".");
        if(!f || split.length !== 3){
            return;
        }
        var cmd = split[0];
        var option = split[1];
        var guid = split[2];
        var responseFile = self.responseDir + "/" + guid;
        try {
            if(cmd === self.CMDS.DESCRIPTION){
                self.nira.describe(option, function(data){
                    data = data || "";
                    self.fs.writeFile(responseFile, JSON.stringify(data)+self.NendOfFile);
                });
            } else if(cmd === self.CMDS.COMMENTS){
                self.nira.comments(option, function(data){

                    data = data || "";
                    console.log(data);
                    self.fs.writeFile(responseFile, JSON.stringify(data)+self.NendOfFile);
                });
            }
        } catch (e) {
             self.fs.writeFile(responseFile, e.toString() + self.NendOfFile)
        }
    };

    this.mkdir = function(dir){
        try { this.fs.mkdirSync(dir); }catch(e){}
    };
    return this;
}