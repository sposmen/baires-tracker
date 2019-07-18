# Baires Tracker

This is an intentional work to add time work on Baires based on their platform.

## Requirements

NodeJS `v12` or greater (to have multiple versions of NodeJS you can use [NVM](https://github.com/nvm-sh/nvm))

## Installation

`npm install @sposmen/baires-tracker -g`

In the `$HOME/.bairestracker` create a `config.json file with the followed structure

```js
{
  "username": "Homer.Simpson", // Required
  "password": "do.it.for.her", // Required
  "projectName": "Springfield Nuclear Power Plant", // Required
  "assignation": "Nuclear Safety Inspection", // Required
  "focalPoint": "Mr. Burns", // Required
  "time": 6, // Optional Default: 9
  "description": "Clicks" // Optional Default: Worked
}
```

(Remember to not leave the comments)

## Usage

```
Usage: bairestracker [options] [command]

Options:
  -V, --version   output the version number
  -h, --help      output usage information

Commands:
  show [options]  shows current month logged time
  push [options]  push a new logged time
```

#### Show
```
Usage: show [options]

shows current month logged time

Options:
  -f, --full  show the full table
  -h, --help  output usage information
```

#### Push
``` 
Usage: push [options]

push new time to be logged

Options:
  -date <date>              date in Datejs formats (default: "today")
  -H, --hours <hours>       Hours worked in this task
  -d, --description <text>  description of what was done (default: "Worked")
  -h, --help                output usage information
```