module.exports = function NitClient(nerver) {
    if(!(this instanceof NitClient)){
        return new NitClient();
    }

    this.nerver = nerver;
    this.fs = require('fs');

    this.sendCmd = function(cmd, issueID, option, cb) {
        var self = this;
        var guid = self.generateUUID();
        var cmdFile = self.nerver.cmdDir + "/" + cmd +"." + issueID + "." + option + "." + guid;
        self.fs.writeFileSync(cmdFile, "");

        self.readInterval = setInterval(function(){
            var responseFile = self.nerver.responseDir + "/" + guid;
            var content = "";
            self.readInterval.attempts++
            self.readInterval.maxAttempts = 5000;
            content = self.readSync(responseFile) || "";
            if(content.indexOf(self.nerver.NendOfFile) != -1 || self.readInterval.attempts >= self.readInterval.maxAttempts) {
                var finalData = content.replace(self.nerver.NendOfFile, "");
                cb && cb(finalData);
                clearInterval(self.readInterval);
                self.deleteFile(responseFile);
            }
        }, 500);
    };

    this.deleteFile = function(f) {
        try{
            this.fs.unlink(f);
        } catch (e) {
        }
    };

    this.readSync = function(f) {
        var c = "";
        try {
           c = this.fs.readFileSync(f).toString();
        } catch(e){
            c = e;
        }
        return c.toString();
    };

    this.generateUUID = function(){
        return Date.now();
    };
    return this;
};

