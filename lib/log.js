module.exports = function() {
    var L = {}


    L.toJson = function(logOutput) {
        var entries = logOutput.split("\ncommit ");
        var
        for(var i=0; i<entries.length; i++){
            var entryLines = entries[i];
            if(entryLines.length===0){
                continue;
            }else {
                var entryObj = L.createEntry(entryLines);

            }
        }
    };

    L.createEntry = function(entryLines) {
        var entry = {};
        var lines = entryLines.split("\n");
        for(var i=0; i<lines.length; i++){
            var l = lines[i];
            if(l.indexOf("commit ")) {
                entry.commit = l.replace("commit ", "");
            } else if(l.indexOf("Date: ")) {
                entry.date = new Date(l.replace("Date: ", ""));
            }
        }
    };

    return L;
};