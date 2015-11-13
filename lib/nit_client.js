module.exports = function NitClient(nerver) {
    var NIT_CLIENT = {};
    NIT_CLIENT.nerver = nerver;
    NIT_CLIENT.fs = require('fs');

    NIT_CLIENT.sendCmd = function(cmd, option, cb) {
        var self = NIT_CLIENT;
        var guid = self.generateUUID();
        self.fs.writeFileSync(self.nerver.cmdDir + "/" + cmd +"." + option + "." + guid, "");

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
            }
        }, 500);
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

