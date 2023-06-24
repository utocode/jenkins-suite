# Jenkins Suite

Jenkins Extension for Visual Studio Code

## Prerequisites

* Install Jenkins
* Install Jenkins Plugins [Recommend]
  * JobDSL: <https://plugins.jenkins.io/job-dsl/>
  * CategorizedView: <https://plugins.jenkins.io/categorized-view/>
  * WsTalk: Communicate build information from the server via websockets

## Features

- Connection [SwitchConnection (Alt+1)]
  - connect / disconnect

  ![SwitchConnection](images/guide/guide1.png)

- View [SwitchView (Alt+2)]
  - List
  - Create View

  ![SwitchView](images/guide/guide2.png)

- Job [SwitchBuild (Alt+3) RunJob (Alt+4) RunFolder (Alt+6)]

  - Job: List / Create / Build
  - Configuration: Get / Update
  - Open Job in Web Browser

  ![SwitchJob](images/guide/guide3.png)

- Build History [SwitchBuild (Alt+5)]
  - View Log
  - Open Log in Web Browser

  ![SwitchBuild](images/guide/guide4.png)

- Generate Job Code (Ctrl+Alt+Insert)

  ![Generate Job Code](images/guide/guide5.png)

* Generate Code From Snippet

  ![Generate Code](images/guide/guide6.png)


- Validate Jenkinsfiles (Ctrl+Alt+t)

  ![Validate](images/guide/guide7.png)


## Extension Settings

+ Add Jenkins Server

```json
  "jenkinssuite.servers": {
    "local": {
      "url": "http://localhost:8080/jenkins",
      "description": "Local Server",
      "username": "admin",
      "token": "__YOUR TOKEN__",
      "wstalk": {
        "enabled": false,
        "url": "ws://localhost:9090/jenkins",
        "description": "WsTalk for Local Server"
      }
    },
    "test": {
      "url": "http://localhost:8080/jenkins",
      "description": "Test Server",
      "username": "admin",
      "token": "__YOUR TOKEN__",
      "wstalk": {
        "enabled": false,
        "url": "ws://localhost:9090/jenkins",
        "description": "WsTalk for Test Server"
      }
    }
  }
```

See a demo below!


## Issues

Please let me know of any bugs via the issues page!

## Release Notes

