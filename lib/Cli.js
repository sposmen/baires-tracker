const program = require('commander');
const _ = require('lodash');
const BairesTracker = require('./BairesTracker.class');
const csv = require('csv-parser');
const fs = require('fs');
const Throttler = require('throttler');


program
  .version(require('../package').version);

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
      .pushTime(_.pick(opts, ['date', 'hours', 'description']))
      .then(() => console.log('Success!'));
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
    const throttler = new Throttler({'maxActive': 5, 'wait': 1});

    throttler
      .on('job-completed', () => console.log('Record pushed!'))
      .on('complete', () => console.log('All time added!'));

    fs.createReadStream(opts.filename)
      .pipe(csv())
      .on('data', (data) => {
        throttler.add((cb) => {
          new BairesTracker().pushTime(data).then(cb);
        })
      })
      .on('end', () => console.log('All CSV file queued!'));

  });

program.parse(process.argv);