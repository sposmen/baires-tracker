# Baires Tracker

This is an intentional work to add time work on Baires based on their platform. This is *NOT an OFFICIAL* command line 
app from Baires. So if you decide to use it, it's on your own responsibility.

## Requirements

NodeJS `v12` or greater (to have multiple versions of NodeJS you can use [NVM](https://github.com/nvm-sh/nvm))

## Installation

`npm install @sposmen/baires-tracker -g`

In the `$HOME/.bairestracker` create a `config.json` file with the followed structure

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

#### Command `Show`
```
Usage: show [options]

Shows current month logged time.

Options:
  -f, --full         show the full table
  -s, --summary      summarize based on the day and assignment
  -o, --onlysummary  show only the summary based on the day and assignment
  -h, --help         output usage information
```

#### Command `Push`
``` 
Usage: push [options]

Push new time to be logged.

Options:
  -date <date>              date in Datejs formats (default: "today")
  -H, --hours <hours>       Hours worked in this task (default: "9")
  -d, --description <text>  description of what was done (default: "Worked")
  -h, --help                output usage information
```

#### Command `PushCsv`
```
Usage: pushCsv [options]

Push new time to be logged through a CSV. 
The headers must be 'date', 'hours' and 'description' similar to the single push. e.g.
          ----------------------
header -> date,hours,description
row 1  -> yesterday,3,Calling
row 2  -> today,1,Meeting
row 3  -> 17/09/2019,5,Research

Options:
  -f, --filename <csv_filenme>  CSV filename
  -h, --help                    output usage information
```

### Thanks

Thanks to @eyscode for his work on https://github.com/eyscode/timetracker which was an inspiration to this one.