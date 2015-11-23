module.exports = function(nit) {
    var L = { nit : nit };

    L.getLogs = function(){
        var self = this;
        self.nit.git(["log"], function(data){
            console.log(self.toEntryObjectsArray(data));
        });
    };

    L.toEntryObjectsArray = function(logOutput) {
        var entryTextBlocks = logOutput.split("\ncommit ");
        var entryObjects = [];
        var index = 0;
        for(var i=0; i<entryTextBlocks.length; i++){
            var entryLines = entryTextBlocks[i];
            if(entryLines.length===0){
                continue;
            }else {
                var entryObj = L.createEntry(entryLines);
                entryObjects[index] = entryObj;
                index++;
            }
        }
        return entryObjects;
    };

    L.createEntry = function(entryLines) {
        var entry = {};
        var lines = entryLines.split("\n");
        for(var i=0; i<lines.length; i++){
            var l = lines[i];
            if(l.length > 0 && !entry.commit) {
                entry.commit = l;
            } else if(l.indexOf("Author: ") != -1) {
                entry.author = {
                    name: l.split("<")[0].replace("Author: ", "").trim(),
                    email: l.split("<")[1].replace(">")
                };
            } else if(l.indexOf("Date: ") != -1) {
                entry.date = new Date(l.replace("Date: ", ""));
            }
        }
        entry.message = entryLines.split("Date: ")[1];
        entry.message = entry.message.substring(entry.message.indexOf("\n\n")+"\n\n".length, entry.message.length).trim();
        return entry;
    };

    return L;
};