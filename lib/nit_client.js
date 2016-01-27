module.exports = function NitClient(nerver) {
    var NIT_CLIENT = {};
    NIT_CLIENT.fs = require('fs');
    NIT_CLIENT.dataFiles = require(__dirname + '/data_files.js')();
    NIT_CLIENT.nerver = nerver;

    NIT_CLIENT.sendCmd = function(cmd, cmdContent, issueID, option, cb) {
        var self = NIT_CLIENT;
        var guid = self.generateUUID();
        NIT_CLIENT.dataFiles.mkDir(NIT_CLIENT.nerver.cmdDir);
        NIT_CLIENT.dataFiles.mkDir(NIT_CLIENT.nerver.responseDir);
        var cmdFile = self.nerver.cmdDir
            + "/" + NIT_CLIENT.nerver.nira.nettings.jira.projectKey
            + "." + cmd
            + "." + issueID
            + "." + option
            + "." + guid;

        self.fs.writeFileSync(cmdFile, cmdContent);

        if(cmd === "STATUS") {
            cb && cb({});
        } else {
            self.readInterval = setInterval(function(){
                var responseFile = self.nerver.responseDir + "/" + guid;
                var content = "";
                self.readInterval.attempts++;
                self.readInterval.maxAttempts = 5000;
                content = self.readSync(responseFile) || "";
                if(content.indexOf(self.nerver.NendOfFile) != -1 || self.readInterval.attempts >= self.readInterval.maxAttempts) {
                    var finalData = content.replace(self.nerver.NendOfFile, "");
                    cb && cb(finalData);
                    clearInterval(self.readInterval);
                    self.deleteFile(responseFile);
                }
            }, 500);
        }
    };

    NIT_CLIENT.deleteFile = function(f) {
        try{
            this.fs.unlink(f);
        } catch (e) {
        }
    };

    NIT_CLIENT.readSync = function(f) {
        var c = "";
        try {
           c = NIT_CLIENT.fs.readFileSync(f).toString();
        } catch(e){
            c = e;
        }
        return c.toString();
    };

    NIT_CLIENT.generateUUID = function(){
        return Date.now();
    };
    return NIT_CLIENT;
};

