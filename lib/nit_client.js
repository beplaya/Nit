module.exports = function NitClient(nerver, nettings) {
    var NIT_CLIENT = {};
    NIT_CLIENT.fs = require('fs');
    NIT_CLIENT.nettings = nettings;
    NIT_CLIENT.nerver = nerver;

    NIT_CLIENT.sendCmdToServer = function(cmd, data, currentBranch, issueKey, tool, fromUpdate, cb) {
        var projectKey = NIT_CLIENT.nettings.projectKey;
        var dataToSend = {};
        dataToSend.data = data;
        dataToSend.currentBranch = currentBranch;
        dataToSend.issueKey = issueKey;
        NIT_CLIENT.POST(NIT_CLIENT.getOptions(NIT_CLIENT.nettings.projectKey, cmd.toLowerCase(), issueKey, tool, fromUpdate), dataToSend, function(reply){
            cb && cb(reply);
            //Send to team
            var teamOptions = NIT_CLIENT.getTeamOptions(NIT_CLIENT.nettings.projectKey, cmd.toLowerCase(), issueKey, tool, fromUpdate);
            NIT_CLIENT.POST(teamOptions, dataToSend, function(reply){
            });
        });
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


    NIT_CLIENT.getOptions = function(projectKey, whichData, issueKey, tool, fromUpdate){
         return {
                    host: "localhost",
                    port: NIT_CLIENT.nettings.nerver.port,
                    path : "/rest/1.0/input/projects/"+projectKey+"/"+issueKey+"/"+whichData+"/"+tool+"/"+fromUpdate,
                    headers: { "Content-Type": "application/json" }
                };
    };

    NIT_CLIENT.getTeamOptions = function(projectKey, whichData, issueKey, tool, fromUpdate){
         return {
                    host:  NIT_CLIENT.nettings.nerver.team.host,
                    port: NIT_CLIENT.nettings.nerver.team.port,
                    path : "/rest/1.0/input/projects/"+projectKey+"/"+issueKey+"/"+whichData+"/"+tool+"/"+fromUpdate,
                    headers: { "Content-Type": "application/json" }
                };
    };

    return NIT_CLIENT;
};

