module.exports = function Nira(nettings) {

    this.nettings = nettings;
    this.baseURL = "https://" + this.nettings.jira.host + "/browse/";


    this.login = function(username, password, cb) {
        var self = this;
        self.basicAuth = new Buffer(username + ":" + password).toString('base64');
        cb && cb();
    };

    this.getOptions = function(path){
         return {
                    host: this.nettings.jira.host,
                    port: 443,
                    method: 'GET',
                    path : "/rest/api/2/"+path,
                    headers: { "Content-Type": "application/json", "Authorization": "Basic "+this.basicAuth }
                };
    };

    this.getIssue = function(issueID, cb) {
        var self = this;
        var options = self.getOptions('issue/' + issueID);
        self.GET(options, cb);
    };

    this.GET = function(options, cb) {
        var data = "";
        var https = require('https');
        var req = https.request(options, function(res) {
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

        req.end();

        req.on('error', function(e) {
          cb && cb({error:e});
        });
    };

    this.describe = function(issueID, cb) {
        this.getIssue(issueID, function(data){
            try {
                var F = data.fields;
                cb && cb(F);
            } catch (e) {
                cb && cb("ERROR!" + e.toString());
            }
        });
    };

    this.comments = function(issueID, cb) {
        this.getIssue(issueID, function(data){
            try {
                cb && cb(data.fields.comment);
            } catch (e) {
                cb && cb("ERROR!" + e.toString());
            }
        });
    };
    this.ticketIDFromBranch = function(b){
        return b.replace(this.nettings.featurePrefix, this.nettings.jiraPrefix).trim();
    };
    return this;
}
