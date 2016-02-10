module.exports = function(){
    var INREC = {};
    INREC.cache = {};
    INREC.cache.users = [];
    INREC.cache.cards = [];
    INREC.receiver = {eventMap:{}};
    INREC.receiver.on = function(eventKey, action){
        INREC.receiver.eventMap[eventKey] = action;
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
                name : response.gitUser.name,
                email : response.gitUser.email,
                allIssues : []});
            userIndex = INREC.cache.users.length-1;
        }
        //
        var cardIndex = INREC.findCardIndex(response.key);
        if(cardIndex == -1){
            INREC.cache.cards.push({
            });
            cardIndex = INREC.cache.cards.length-1;
        }
        //
        INREC.cache.users[userIndex].issue = { active : true};
        //~
        var key = response.key;
        INREC.cache.users[userIndex].issue.key = response.key;
        INREC.cache.users[userIndex].issue.fields = response.fields;
        INREC.cache.users[userIndex].issue.url = response.url;
        var fields = INREC.cache.users[userIndex].issue.fields;
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
            INREC.cache.users[userIndex].allIssues[issueIndex] = INREC.cache.users[userIndex].issue;
            INREC.cache.cards[cardIndex] = INREC.cache.users[userIndex].allIssues[issueIndex];
            INREC.addAuthorToCard(cardIndex, response.gitUser);
        }

        //~
    });

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