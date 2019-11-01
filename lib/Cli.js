const program = require('commander');
const _ = require('lodash');
const BairesTracker = require('./BairesTracker.class');
const csv = require('csv-parser');
const fs = require('fs');
const Throttler = require('throttler');


program
  .version(require('../package').version)
  .option('-c, --config <config_file>', 'set a different config file than default');

program
  .command('show')
  .description('Shows current month logged time.')
  .option('-f, --full', 'show the full table')
  .option('-s, --summary', 'summarize based on the day and assignment')
  .option('-o, --onlysummary', 'show only the summary based on the day and assignment')
  .action(function (opts) {
    let bairesTracker = new BairesTracker();

    if(program.config) bairesTracker.config = program.config;

    bairesTracker.show(_.pick(opts, ['full', 'summary', 'onlysummary']));
  });

program
  .command('push')
  .description('Push new time to be logged.')
  .option('--date <date>', 'date in Datejs formats. Default "today"')
  .option('-H, --hours <hours>', 'Hours worked in this task. Default "9"')
  .option('-d, --desc <text>', 'description of what was done. Default "Worked"')
  .action(function (opts) {
    let bairesTracker = new BairesTracker();

    if(program.config) bairesTracker.config = program.config;

    bairesTracker
      .pushTime(_.pick(opts, ['date', 'hours', 'desc']))
      .then(() => console.log('Success!'));
  });

program
  .command('pushCsv')
  .description("Push new time to be logged through a CSV. \n" +
    "The headers must be 'date', 'hours' and 'description' similar to the single push. e.g.\n" +
    "          ----------------------\n" +
    "header -> date,hours,desc\n" +
    "row 1  -> yesterday,3,Calling\n" +
    "row 2  -> today,1,Meeting\n" +
    "row 3  -> 17/09/2019,5,Research")
  .option('-f, --filename <csv_filenme>', 'CSV filename')
  .action(function (opts) {
    const throttler = new Throttler({maxActive: 5, wait: 0});

    throttler
      .on('job-completed', (stats) => console.log(stats.job.completedResults.join('\n')))
      .on('complete', () => console.log('All time added!'));

    fs.createReadStream(opts.filename)
      .pipe(csv())
      .on('data', (data) => {
        throttler.add((cb) => {
          let bairesTracker = new BairesTracker();

          if(program.config) bairesTracker.config = program.config;

          bairesTracker.pushTime(data).then(() => cb('Record pushed!')).catch((err) => cb(err.message))
        })
      })
      .on('end', () => console.log('All CSV file queued!'));

  });

program.parse(process.argv);
