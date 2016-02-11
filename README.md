
<div>
<pre>
                  .:':'`:·          ,:´'`;' ‘         ',:'/¯/`:,            ,.-~·-.,__,.-::^·- .,'   ‘
                /:::::::/`·,      /::::/;‘         /:/_/::::/';'        /:::::::::::::::::::::::::/'; '
               /:·*'`·:/:::::' , /·´'`;/::';'       /:'     '`:/::;‘     /;:·–– :;:::::_ ;: – .,/::;i'‘
             ,'         `:;::::'`i    ';:::';       ;         ';:';‘    /´          ¯¯           ';::/  
             ;            '`;:::'i    'i::::i       |         'i::i   ,:                          ,:/    
             i               `;:';    'i:::i'       ';        ;'::i   ';_,..–-.,_     _    _,.·´‘     
             i      ,          \|     '|:::i°      'i        'i::i'            ,·´'    '`·;'i¯            
             |     ,'`,                i:;'' ‚       ;       'i::;'            i         'i:i'       ’     
             'i    'i:::i',             ';/'          ';       i:/'             ';        ';:i'     ’       
             'i     ;::/ \           ;/'             ';     ;/ °              i        i:/'             
              \    'i/    '`·,      ,''                ';   / °                 ;      i/    °          
               '`~´         '`·–·'´'                  `'´       °              \   '/'                 
                                ‘                     ‘                         ¯               °  
</pre>
</div>

## About
 - Nit combines multiple git commands into useful bundles.  e.g. ```nit qrci``` stages and commits only your README.md.
 - Nit enhances 'feature/KEY-###' with 'develop' branch development (see ```nit fb```, ```nit fci```, nit ```upderge```, and more)
 - Nit accesses JIRA's rest api (see ```nit nerver```, ```nit describe```, and ```nit comments```)
 - Nit has a team server (see ```nit team```)
 - Nit formats Git output where appropriate
 - Nit enables "" free commit message ```nit ci This is my message.  No quotation marks needed!!!```
 - Nit passes through to Git any unrecognized command
 - Nit avoids doing things that aliases can do

## Commands
```
        help            > Help
        updateNerver    > Update Nerver
        st              > Status
        sts             > Status -s
        b               > Discover branch
        l1              > 'git log --pretty=oneline' with extra Nit formatting
        push            > Push (assumes origin/<branch>)
        pull            > Pull (assumes origin/<branch>)
        cob             > Create and checkout branch
        fb              > Create and checkout feature branch
        dev             > Checkout develop
        derge           > Merge develop into current branch
        upderge         > Update develop and merge develop into current branch
        stage           > Stage
        ci              > Commit
        fci             > Make a commit on feature
        qrci            > Quick stage and commit only README.md with a generated message "['currentBranch'] README update."
        nerver          > Start nerver
        team            > Start team nerver
        browse          > Browse jira
        describe        > Get JIRA description
        comments        > Get JIRA comments

```

If you work with JIRA, you may work in the following manner:

### Traditional Git (11 lines. 282 chars.):
```
git checkout develop
git pull origin develop

git checkout -b feature/PROJECT-101

git add .
git commit -m "PROJECT-101 did some things!"
git push --set-upstream-to origin/feature/PROJECT-101

git checkout develop
git pull
git checkout feature/PROJECT-101
git merge develop

pit push origin feature/PROJECT-101
```
### Nit (8 lines. 82 chars.):
```
nit dev
nit pull

nit fb 101

nit stage
nit fci "did some things!"
nit push

nit upderge

nit push
```

## Nit passes through to git
If Nit does not recognize a command it will simply pass the command and args to Git, and give the same output as traditional Git.
Therefore, you do not need to switch from "nit" to "git" for any command.  You can always use "nit"!


##Nerver
Nerver is a background process that connects to JIRA enabling commands like  ```nit describe```, ```nit mkc ...```,  and ```nit comments```.
Currently, it needs it's own terminal tab.  In the future, Nit will handle this for you.
For now, to start Nerver:
 - Open a separate terminal window
 - cd to your project directory
 - Ensure your .nitconfig jira.host is set to your JIRA host.
 - Run ```nit nerver```
 - Enter your JIRA credentials
 - Leave the window running
 - Open your favorite browser and go to http://localhost:yourNerverPortIn (set port in .nitconfig) to see live git status and Jira info as you nit along

##Team Nerver
Team Nerver is a central point where team commits are visualized: http://TeamNerverHost:yourTeamNerverPortIn  (set port in .nitconfig) 

##### Note:
 - Nerver does not write your JIRA credentials to disk.  However, they are stored in RAM.  It's recommended to use a functional user for Nerver.
 - Nerver is set to stop itself after 24 hours of running. 
 - Team Nerver is set to never stop


## Configuration
 - Create a .nitconfig file in repo root
 - Example .nitconfig:
```json
{
    "projectKey": "NIT",
    "jira": {
        "host": "???"
    },
    nerver : { port : 9000, 
        team : { 
            url: "localhost", port:9100
        }
    }
}
```


## Setup
 - Start at nit root directory
 - ```nit setup```
 - add the repo folder to your path
 


