const program = require('commander');
const _ = require('lodash');
const BairesTracker = require('../lib/BairesTracker.class');
const csv = require('csv-parser');
const fs = require('fs');

program
  .version('0.1.0');

program
  .command('show')
  .description('Shows current month logged time.')
  .option('-f, --full', 'show the full table')
  .action(function (opts) {
    new BairesTracker().show(opts.full);
  });

program
  .command('push')
  .description('Push new time to be logged.')
  .option('-date <date>', 'date in Datejs formats', 'today')
  .option('-H, --hours <hours>', 'Hours worked in this task', '9')
  .option('-d, --description <text>', 'description of what was done', 'Worked')
  .action(function (opts) {
    new BairesTracker()
      .pushTime(_.pick(opts, ['date','hours', 'description']))
      .then(()=> console.log('Success!'));
  });

program
  .command('pushCsv')
  .description("Push new time to be logged through a CSV. \n" +
    "The headers must be 'date', 'hours' and 'description' similar to the single push. e.g.\n" +
    "          ----------------------\n" +
    "header -> date,hours,description\n" +
    "row 1  -> yesterday,3,Calling\n" +
    "row 2  -> today,1,Meeting\n" +
    "row 3  -> 17/09/2019,5,Research")
  .option('-f, --filename <csv_filenme>', 'CSV filename')
  .action(function (opts) {
    let bairesTracker = new BairesTracker();
    let promiseIterator = bairesTracker.homePromise;
    fs.createReadStream(opts.filename)
      .pipe(csv())
      .on('data', (data) => {
        promiseIterator = promiseIterator.then(()=> {
          return bairesTracker
            .pushTime(data)
            .then(()=>{ console.log('Record pushed!')})
        })
      })
      .on('end', () => promiseIterator.then(()=> console.log('Success!')));
  });

program.parse(process.argv);