module.exports = function NitClient(nerver) {
    if(!(this instanceof NitClient)) {
        return new NitClient(nerver);
    }
    this.fs = require('fs');
    this.printer = new require(__dirname+"/printer.js")();
    this.nitSettings = new require(__dirname + '/nit_settings.js')();
    this.nettings = this.nitSettings.load();;
    this.nerver = nerver;

    this.nitSettings.getGitUser(function(gitUser){
        this.gitUser = gitUser;
    });

    this.sendCmdToServer = function(cmd, data, currentBranch, issueKey, tool, fromUpdate, cb) {
        var start = new Date().getTime();
        while(!this.gitUser){
            if((new Date().getTime())-start > 1200){
                this.printer.E("Timed out looking for git config.");
                return;
            }
        }
        var projectKey = this.nettings.projectKey;
        var dataToSend = {};
        dataToSend.data = data;
        dataToSend.gitUser = this.gitUser;
        dataToSend.currentBranch = currentBranch;
        dataToSend.issueKey = issueKey;
        this.POST(this.getOptions(this.nettings.projectKey, cmd.toLowerCase(), issueKey, tool, fromUpdate), dataToSend, function(reply){
            cb && cb(reply);
            //Send to team
            var teamOptions = this.getTeamOptions(this.nettings.projectKey, cmd.toLowerCase(), issueKey, tool, fromUpdate);
            this.POST(teamOptions, dataToSend, function(reply){
            });
        });
    };

    this.GET = function(options, cb) {
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

    this.POST = function(options, postData, cb) {
        postData = JSON.stringify(postData);
        var data = "";
        var http = require('http');
        options.method = "POST";
        options.headers['Content-Length'] = Buffer.byteLength(postData);

        //console.log("posting", options.path, postData);

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


    this.getOptions = function(projectKey, whichData, issueKey, tool, fromUpdate){
         return {
                    host: "localhost",
                    port: this.nettings.nerver.port,
                    path : "/rest/1.0/input/projects/"+projectKey+"/"+issueKey+"/"+whichData+"/"+tool+"/"+fromUpdate,
                    headers: { "Content-Type": "application/json" }
                };
    };

    this.getTeamOptions = function(projectKey, whichData, issueKey, tool, fromUpdate){
         return {
                    host:  this.nettings.nerver.team.host,
                    port: this.nettings.nerver.team.port,
                    path : "/rest/1.0/input/projects/"+projectKey+"/"+issueKey+"/"+whichData+"/"+tool+"/"+fromUpdate,
                    headers: { "Content-Type": "application/json" }
                };
    };
};

