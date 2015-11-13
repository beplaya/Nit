# Nit

## About

Nit enhances feature/KEY-### branch to develop branch type development.
Nit access this JIRA rest api to get description and comments (see ```nit describe``` and ````nit comments```)!




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

## Commands
  b  --->  DiscoverBranch
  cob  --->  CreateAndCheckoutBranch
  st  --->  Status
  fb  --->  CreateAndCheckoutFeatureBranch
  dev  --->  Checkout develop
  push  --->  Push
  fci  --->  Make a commit on feature
  qfci  --->  Quick stage and make a commit on feature
  derge  --->  Merge develop into current branch
  upderge  --->  Update develop and merge develop into current branch
  ci  --->  Commit
  help  --->  Help
  browse  --->  Browse jira
  stage  --->  Stage
  sts  --->  Status -s
  nerver  --->  Start nerver
  describe  --->  Get JIRA description
  comments  --->  Get JIRA comments
  qci  --->  Quick stage and commit with a generated message "['currentBranch'] quick commit."

##Nerver
Nerver is a background process that connects to JIRA enabling commands like ```nit describe``` and ````nit comments```.
Currently, it needs it's own terminal tab.  In the future, Nit will handle this for you.
For now, to start Nerver:
 - Open a separate terminal window
 - cd to your project directory
 - Ensure your .nitconfig jira.host is set to your JIRA host.
 - Eun ```nit nerver```
 - Enter your JIRA credentials
 - Leave the window running
##### Note:
 - The login is not verified yet.  So, if you're having trouble, try restarting Nerver.
 - Nerver does not write your JIRA credentials to disk.  However, they are stored in RAM.
 - Nerver is set to stop itself after 8 hours.

## Configuration
 - Create a .nitconfig file in repo root
 - Example .nitconfig:
```json
{
   "jira" : {
       "host" : "my.jira.location.net",
       "projectKey" : "NIT"
   },
   "featureBranchPrefix" : "feature/"
}
```

## Setup
 - npm install
 - add the repo folder to your path

## Dependencies
    Node JS
