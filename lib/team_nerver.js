module.exports = function TeamNerver(nira){
    if(!(this instanceof TeamNerver)) {
        return new TeamNerver(nira);
    }
    this.nira = nira;
    this.period = 60000*10;//10 minutes
    this.hasInitialized = false;
    this.progressSize = Math.floor(15000/this.period);

    this.prompt = function(cb) {
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
            this.nira.login(result.username, result.password, function(isLoggedIn){
                cb && cb(isLoggedIn);
            });
        });

        function onErr(err) {
            this.consoleLog(err);
            return 1;
        }
    };


    this.start = function(arg) {

        if(arg === "x" || arg === "-x" || arg === "silent"){
            this.silent = true;
        }
        this.prompt(function(isLoggedIn) {
            this.listen(isLoggedIn);
        });
        return this;
    };

    this.listen = function(isLoggedIn){
        this.isLoggedIn = isLoggedIn;
        this.onStart();
        this.startTime = (new Date().getTime());
        require(__dirname+"/../team/server_team.js")(this);
        this.runInterval = setInterval(function() {

            if(this.shouldEnd()){
                clearInterval(this.runInterval);
                this.consoleLog("Team this session ended.");
                process.exit();
                return;
            }

            this.writeProgress();
        }, this.period);
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
        this.clearScreen();
         this.consoleLog("\n\n");
        if(!this.isLoggedIn){
            this.consoleLog("Not Logged in");
        }else {
            this.consoleLog("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            this.consoleLog("!!!!!!!!!!Logged in!!!!!!!!!!");
            this.consoleLog("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        }
        this.consoleLog("Team this is listening...\n\n\n");
        setTimeout(function(){this.hasInitialized = true; this.initWriteProgress(); }, 1550);
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
