module.exports = function NitClient(nerver, nettings) {
    var NIT_CLIENT = {};
    NIT_CLIENT.fs = require('fs');
    NIT_CLIENT.nettings = nettings;
    NIT_CLIENT.dataFiles = require(__dirname + '/data_files.js')();
    NIT_CLIENT.nerver = nerver;

    NIT_CLIENT.sendCmd = function(cmd, cmdContent, issueID, option, cb) {
        var self = NIT_CLIENT;
        var guid = self.generateUUID();
        NIT_CLIENT.dataFiles.mkDir(NIT_CLIENT.nerver.cmdDir);
        NIT_CLIENT.dataFiles.mkDir(NIT_CLIENT.nerver.responseDir);
        var cmdFile = self.nerver.cmdDir
            + "/" + NIT_CLIENT.nettings.jira.projectKey
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
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //

    NIT_CLIENT.sendCmdHTTP = function(cmd, data, cb) {
        var projectKey = NIT_CLIENT.nettings.jira.projectKey;
        if(cmd === "STATUS") {
            var sendData = {};
            sendData[cmd.toLowerCase()] = data;
            NIT_CLIENT.POST(NIT_CLIENT.getOptions(NIT_CLIENT.nettings.jira.projectKey, cmd.toLowerCase()), sendData, cb);
        } else {
            cb && cb();
        }
    };
    NIT_CLIENT.GET = function(options, cb) {
        var data = "";
        var http = require('http');

        options.method = "GET";
        var req = http.request(options, function(res) {

            res.on('data', function(d) {
                data +=d;
            });
            res.on('end', function(){
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    data = {error:e};
                }
                cb && cb(data, res.statusCode);
            });
        });

        req.end();

        req.on('error', function(e) {
          cb && cb({error:e}, 404);
        });
    };

    NIT_CLIENT.POST = function(options, postData, cb) {
        postData = JSON.stringify(postData);
        var data = "";
        var http = require('http');
        options.method = "POST";
        options.headers['Content-Length'] = Buffer.byteLength(postData);
        var req = http.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(d) {
                data +=d;
            });
            res.on('end', function(){
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    data = {error:e};
                }
                cb && cb(data);
            });
        });
        req.write(postData);
        req.end();

        req.on('error', function(e) {
          cb && cb({error:e});
        });
    };


    NIT_CLIENT.getOptions = function(projectKey, whichData){
         return {
                    host: "localhost",
                    port: 9000,
                    path : "/rest/1.0/input/projects/"+projectKey+"/"+whichData,
                    headers: { "Content-Type": "application/json" }
                };
    };

    return NIT_CLIENT;
};

