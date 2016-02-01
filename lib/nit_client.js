module.exports = function NitClient(nerver, nettings) {
    var NIT_CLIENT = {};
    NIT_CLIENT.fs = require('fs');
    NIT_CLIENT.nettings = nettings;
    NIT_CLIENT.nerver = nerver;

    NIT_CLIENT.sendCmdHTTP = function(cmd, data, issueKey, cb) {
        var projectKey = NIT_CLIENT.nettings.jira.projectKey;
        var sendData = {};
        sendData[cmd.toLowerCase()] = data;
        sendData["issueKey"] = issueKey;
        NIT_CLIENT.POST(NIT_CLIENT.getOptions(NIT_CLIENT.nettings.jira.projectKey, cmd.toLowerCase()), sendData, function(reply){
            console.log("post reply for cmd '",cmd,"': ", reply);
            cb && cb(reply);
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

