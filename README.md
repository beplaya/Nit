# Nit

## About

Nit enhances feature/KEY-### branch to develop branch type development.  If you work with JIRA, you may work in the following manner:

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
        b  --->  discoverBranch
        cob  --->  createAndCheckoutBranch
        st  --->  status
        fb  --->  createAndCheckoutFeatureBranch
        dev  --->  checkout develop
        push  --->  push
        fci  --->  make a commit on feature
        derge  --->  merge develop into current branch
        upderge  --->  update develop and merge develop into current branch
        ci  --->  commit
        help  --->  help
        browse  --->  browse jira
        stage  --->  stage
        sts  --->  status -s
        qci  --->  stage and commit

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

## Repo Setup
 - npm install
 - add the repo folder to your path

## Dependencies
    Node JS
