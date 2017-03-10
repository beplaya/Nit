module.exports = function IssueCacher(nira) {
    if(!(this instanceof IssueCacher)) {
        return new IssueCacher(nira);
    }
    this.cachedIssues = [];
    this.expirationPeriod = 30 * 60000;//30 minutes
    // cachedIssue: { id: "", timeCached : 0, issueData : {}}
    this.clearCache = function(issueID){
        if(!issueID)
            return;
        console.log("clearing cache for issue ", issueID);

        var newList = [];
        for(var i=0; i<this.cachedIssues.length; i++) {
            var cachedIssue = this.cachedIssues[i];
            if(issueID !== cachedIssue.id){
                newList.push(cachedIssue);
            }
        }
        this.cachedIssues = newList;
    };

    this.getCachedIssue = function(issueID) {
        var issueData = undefined;
        var now = (new Date().getTime());
        for(var i=0; i<this.cachedIssues.length; i++) {
            var cachedIssue = this.cachedIssues[i];
            if(issueID === cachedIssue.id){
                if(!this.isExpired(cachedIssue)){
                    issueData = JSON.parse(JSON.stringify(cachedIssue.issueData));
                    issueData.fields.cachedAge = Math.floor((now - cachedIssue.timeCached) / 1000);
                    issueData.fields.summary = issueData.fields.summary;
                }
                break;
            }
        }
        return issueData;
    };


    this.cacheIssue = function(issueID, issueData) {
        var found = false;
        var now = (new Date().getTime());
        for(var i = 0; i<this.cachedIssues.length; i++) {
            var CI = this.cachedIssues[i];
            if(issueID === CI.id){
                this.cachedIssues[i].id = issueID;
                this.cachedIssues[i].issueData = issueData;
                this.cachedIssues[i].timeCached = now;
                found = true;
                break;
            }
        }
        if(!found){
            this.cachedIssues.push({
                                           id : issueID,
                                           issueData : issueData,
                                           timeCached : now
                                       });
        }
    };

    this.isExpired = function(cachedIssue) {
        return ((new Date().getTime()) - cachedIssue.timeCached) > this.expirationPeriod;
    };
};