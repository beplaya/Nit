module.exports = function TeamNerver(nira){
    if(!(this instanceof TeamNerver)) {
        return new TeamNerver(nira);
    }
    this.nira = nira;
    this.period = 60000*10;//10 minutes
    this.hasInitialized = false;
    this.progressSize = Math.floor(15000/this.period);

    this.prompt = function(cb) {
        var self = this;
        var prompt = require('prompt');

        var properties = [
        {
            name: 'username'
        },
        {
            name: 'password',
            hidden: true
        }
        ];

        prompt.start();

        prompt.get(properties, function (err, result) {
            if (err) { return onErr(err); }
            self.nira.login(result.username, result.password, function(isLoggedIn){
                cb && cb(isLoggedIn);
            });
        });

        function onErr(err) {
            self.consoleLog(err);
            return 1;
        }
    };


    this.start = function(arg) {
        var self = this;
        if(arg === "x" || arg === "-x" || arg === "silent"){
            self.silent = true;
        }
        this.prompt(function(isLoggedIn) {
            self.listen(isLoggedIn);
        });
        return self;
    };

    this.listen = function(isLoggedIn){
        var self = this;
        self.isLoggedIn = isLoggedIn;
        self.onStart();
        self.startTime = (new Date().getTime());
        require(__dirname+"/../team/server_team.js")(self);
        self.runInterval = setInterval(function() {

            if(self.shouldEnd()){
                clearInterval(self.runInterval);
                self.consoleLog("Team this session ended.");
                process.exit();
                return;
            }

            self.writeProgress();
        }, self.period);
    };

    this.shouldEnd = function(){
        return false
    };

    this.writeProgress = function() {
        if(this.hasInitialized && !this.silent){
            if(this.counter % this.progressSize === 0){
                this.initWriteProgress();
            }
        }
    };

    this.initWriteProgress = function(){
        if(!this.silent) {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
        }
    };

    this.onStart = function(){
        var self = this;
        self.clearScreen();
        self.consoleLog("\n\n");
        if(!self.isLoggedIn){
            self.consoleLog("Not Logged in");
        }else {
            self.consoleLog("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            self.consoleLog("!!!!!!!!!!Logged in!!!!!!!!!!");
            self.consoleLog("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        }
        self.consoleLog("Team nerver is listening...\n\n\n");
        setTimeout(function(){self.hasInitialized = true; self.initWriteProgress(); }, 1550);
    };

    this.write = function(str) {
        if(!this.silent) {
            process.stdout.write(str);
        }
    };

    this.consoleLog = function(str) {
        if(!this.silent) {
            console.log(str);
        }
    }

    this.clearScreen = function(){
        var numLines = process.stdout.getWindowSize()[1];
        this.cursorUp(numLines, false);
    };

    this.cursorUp = function up (i, save) {
        i = i || 1;
        if (i > 0) {
            while(i--) {
                process.stdout.write(!save ? '\033[K\033[1A\r' : '\033[1A\r');
            }
        }
        process.stdout.cursorTo(0);
    };
};
