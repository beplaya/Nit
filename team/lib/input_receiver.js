module.exports = function(nettings){
    var INREC = {};
    INREC.cache = {};
    //INREC.cache.logsAnalysis = [];
    INREC.cache.users = [];
    INREC.cache.cards = [];
    INREC.receiver = {eventMap:{}};
    INREC.receiver.on = function(eventKey, action){
        INREC.receiver.eventMap[eventKey] = action;
    };

    // +++++++++++
    // +++++++++++
    // +++++++++++
    INREC.cacheSaver = { fs : require('fs') };
    INREC.cacheSaver.cacheDir = __dirname + "/../cache/" + nettings.projectKey;
    INREC.cacheSaver.cacheFilePath = INREC.cacheSaver.cacheDir + "/cache.json";

    INREC.cacheSaver.mkDir = function(dir){
        try {
            INREC.cacheSaver.fs.mkdirSync(dir);
        } catch(e){
            if(e.code !== "EEXIST"){
                console.log(e);
            }
        }
    };

    INREC.cacheSaver.saveCache = function(){
        console.log("_______Saving cache");
        INREC.cacheSaver.mkDir(INREC.cacheSaver.cacheDir);
        INREC.cacheSaver.fs.writeFileSync(INREC.cacheSaver.cacheFilePath, JSON.stringify(INREC.cache, 0, 4));
    };
    // +++++++++++
    // +++++++++++
    // +++++++++++

    INREC.cacheSaver.loadCache = function(){
        console.log("_______Loading cache");
        try{
            var filePath = INREC.cacheSaver.cacheFilePath;
            if(!INREC.cacheSaver.fs.existsSync(filePath)) {
                 INREC.cacheSaver.saveCache();
            }
            var contents = INREC.cacheSaver.fs.readFileSync(filePath).toString();
            INREC.cache = JSON.parse(contents);
        } catch(e) {
            console.log(e);
        }
    };

    INREC.pad = function(num, size) {
        var s = num+"";
        while (s.length < size) s = "0" + s;
        return s;
    }

    INREC.formatDate = function(date){
        var df = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear()
         + "  "+INREC.pad(date.getHours(), 2) + ":" + INREC.pad(date.getMinutes(), 2);
        return df;
    };

    INREC.handleEvent = function(eventKey, response) {
        var action = INREC.receiver.eventMap[eventKey];
        action && action(response);
    };

    INREC.findUserIndex = function(gitUser) {
        for(var i=0; i<INREC.cache.users.length; i++){
            if(INREC.cache.users[i].email==gitUser.email){
                return i;
            }
        }
        return -1;
    };

    INREC.findCardIndex = function(issueKey) {
        for(var i=0; i<INREC.cache.cards.length; i++){
            if(INREC.cache.cards[i].key==issueKey){
                return i;
            }
        }
        return -1;
    };

    INREC.receiver.on('update_feature_commit', function (response) {
        var issueKey = response.issueKey;
        var commitTime = (new Date().getTime());
        var userIndex = INREC.findUserIndex(response.gitUser);
        if(userIndex == -1) {
            INREC.cache.users.push({
                name : response.gitUser.name,
                email : response.gitUser.email,
                allIssues : []});
            userIndex = INREC.cache.users.length-1;
        }
        //
        var cardIndex = INREC.findCardIndex(issueKey);
        if(cardIndex == -1){
            INREC.cache.cards.push({
                nerver : { createTime : new Date().getTime()}
            });
            cardIndex = INREC.cache.cards.length-1;
        }
        //
        if(!INREC.cache.users[userIndex].commits){
            INREC.cache.users[userIndex].commits = [];
        }
        INREC.cache.users[userIndex].commits.push({time:commitTime, issueKey : issueKey});
        //
        if(!INREC.cache.cards[cardIndex].commits){
            INREC.cache.cards[cardIndex].commits = [];
        }
        INREC.cache.cards[cardIndex].commits.push({
            time : commitTime,
            issueKey : issueKey,
            user : {name : response.gitUser.name, email : response.gitUser.email}
        });

        for(var i=0; i< INREC.cache.cards[cardIndex].authors.length; i++){
            if(INREC.cache.cards[cardIndex].authors[i].email == response.gitUser.email){
                if(!INREC.cache.cards[cardIndex].authors[i].commits){
                    INREC.cache.cards[cardIndex].authors[i].commits = [];
                }
                INREC.cache.cards[cardIndex].authors[i].commits.push({time:commitTime, issueKey : issueKey});
            }
        }

        INREC.cacheSaver.saveCache();
    });

    INREC.receiver.on('update_status', function (response) {
        var userIndex = INREC.findUserIndex(response.gitUser);
        if(userIndex == -1) {
            INREC.cache.users.push({
                name : response.gitUser.name,
                email : response.gitUser.email,
                allIssues : []});
            userIndex = INREC.cache.users.length-1;
        }
        INREC.cache.users[userIndex].status = {
            currentBranch : response.currentBranch,
            currentIssueKey : response.issueKey,
            status : response.data
        };
    });

    INREC.receiver.on('update_issue', function (response) {
        var userIndex = INREC.findUserIndex(response.gitUser);
        if(userIndex == -1) {
            INREC.cache.users.push({
                nerver : { createTime : new Date().getTime()},
                name : response.gitUser.name,
                email : response.gitUser.email,
                allIssues : []});
            userIndex = INREC.cache.users.length-1;
        }
        //
        var cardIndex = INREC.findCardIndex(response.key);
        if(cardIndex == -1){
            INREC.cache.cards.push({
                nerver : { createTime : new Date().getTime()}
            });
            cardIndex = INREC.cache.cards.length-1;
        }
        //
        INREC.cache.users[userIndex].issue = { active : true};
        //~
        var key = response.key;
        INREC.cache.users[userIndex].issue.key = response.key;
        INREC.cache.users[userIndex].issue.url = response.url;
        var fields = response.fields;
        if(fields){
            INREC.cache.users[userIndex].issue.cachedAge = fields.cachedAge || 0;
            INREC.cache.users[userIndex].issue.issuetype = fields.issuetype ? fields.issuetype.name || "" : "typeless";
            INREC.cache.users[userIndex].issue.status = fields.status ? fields.status.name || "" : "without any status";
            INREC.cache.users[userIndex].issue.assignee = fields.assignee ? fields.assignee.displayName || "" : "no one";
            INREC.cache.users[userIndex].issue.summary = fields.summary || "";
            INREC.cache.users[userIndex].issue.description = fields.description || "";
            INREC.cache.users[userIndex].issue.description =  INREC.cache.users[userIndex].issue.description.replace(/(?:\r\n|\r|\n)/g, '<br>');

            INREC.cache.users[userIndex].issue.issueTitle = "A '"+INREC.cache.users[userIndex].issue.issuetype+"'"
            + " issue that is '"+INREC.cache.users[userIndex].issue.status+"'"
            + " assigned to '"+INREC.cache.users[userIndex].issue.assignee+"'";
            //
            var comments = fields.comment.comments;
            INREC.cache.users[userIndex].issue.comments = [];
            for(var i=0; i<comments.length; i++) {
                var c = comments[i];
                var com = {
                    author : c.author.displayName,
                    date : {
                        createdFormatted : INREC.formatDate(new Date(c.created)),
                        updatedFormatted : INREC.formatDate(new Date(c.updated)),
                        created : c.created,
                        updated : c.updated,
                    },
                    concise : "    # author: "
                        + c.author.name  + " created: "
                        + c.created  + " updated: "+c.updated,
                    body : c.body
                };
                INREC.cache.users[userIndex].issue.comments.push(com);
            }
        }

        if(key) {
            var issueIndex = -1;
            for(var i=0; i<INREC.cache.users[userIndex].allIssues.length; i++) {
                if(INREC.cache.users[userIndex].allIssues[i].key == key){
                    issueIndex = i;
                } else{
                    INREC.cache.users[userIndex].allIssues[i].active = false;
                }
            }
            if(issueIndex==-1){
                 INREC.cache.users[userIndex].allIssues.push({});
                 issueIndex =  INREC.cache.users[userIndex].allIssues.length-1;
            }
            INREC.cache.users[userIndex].allIssues[issueIndex] = INREC.createPartialIssue(INREC.cache.users[userIndex].issue);
            INREC.cache.cards[cardIndex] = INREC.createPartialIssue(INREC.cache.users[userIndex].issue, INREC.cache.cards[cardIndex].authors);
            INREC.addAuthorToCard(cardIndex, response.gitUser);
        }

        //~
    });

    INREC.clearOldCardsAndUsers = function(){
        var endTime = new Date().getTime() + (7*24*60*60*1000);
        var startTime = endTime - (14*24*60*60*1000);
        if(INREC.cache.currentSprint){
            startTime = new Date(INREC.cache.currentSprint.startDate).getTime();
            endTime = new Date(INREC.cache.currentSprint.endDate).getTime();
        }

        var newUserList = [];
        for(var i=0; i<INREC.cache.users.length; i++) {
            var user = INREC.cache.users[i];
            var nerverCreateTime = (user.nerver && user.nerver.createTime) ? user.nerver.createTime : 0;
            if(nerverCreateTime >=startTime && nerverCreateTime<=endTime) {
                var newAllIssuesList = [];
                for(var j=0; j<user.allIssues.length; j++) {
                    var issue = user.allIssues[j];
                    var nerverCreateTime = (issue.nerver && issue.nerver.createTime) ? issue.nerver.createTime : 0;
                    if(nerverCreateTime >=startTime && nerverCreateTime<=endTime) {
                        newAllIssuesList.push(issue);
                    }
                }
                user.allIssues = newAllIssuesList;
                newUserList.push(user);
            }
        }
        INREC.cache.users = newUserList;

        var newCardsList = [];
        for(var i=0; i<INREC.cache.cards.length; i++) {
            var card = INREC.cache.cards[i];
            var nerverCreateTime = (card.nerver && card.nerver.createTime) ? card.nerver.createTime : 0;
            if(nerverCreateTime >=startTime && nerverCreateTime<=endTime) {
                newCardsList.push(card);
            }
        }
        INREC.cache.cards = newCardsList;
    };

    INREC.createPartialIssue = function(fullIssue, authors) {
        var partialIssue = {};
        partialIssue.nerver = { createTime : new Date().getTime()};
        partialIssue.summary = fullIssue.summary;
        partialIssue.assignee = fullIssue.assignee;
        partialIssue.description = fullIssue.description;
        partialIssue.issuetype = fullIssue.issuetype;
        partialIssue.status = fullIssue.status;
        partialIssue.issueTitle = fullIssue.issueTitle;
        partialIssue.key = fullIssue.key;
        partialIssue.comments = fullIssue.comments;
        partialIssue.authors = authors;
        return partialIssue;
    };

    INREC.addAuthorToCard = function(cardIndex, gitUser) {
        if(!INREC.cache.cards[cardIndex].authors) {
            INREC.cache.cards[cardIndex].authors = [];
        }

        var authors = INREC.cache.cards[cardIndex].authors;
        for(var i=0; i<authors.length; i++) {
            if(authors[i].email == gitUser.email){
                return;
            }
        }
        INREC.cache.cards[cardIndex].authors.push(gitUser);
    };
    return INREC;
}