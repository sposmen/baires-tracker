const program = require('commander');
const BairesTracker = require('../lib/BairesTracker.class');

program
  .version('0.0.3');

program
  .command('show')
  .description('shows current month logged time')
  .option('-f, --full', 'show the full table')
  .action(function (opts) {
    new BairesTracker().show(opts.full);
  });

program
  .command('push')
  .description('push new time to be logged')
  .option('-date <date>', 'date in Datejs formats', 'today')
  .option('-H, --hours <hours>', 'Hours worked in this task', '9')
  .option('-d, --description <text>', 'description of what was done', 'Worked')
  .action(function (opts) {
    new BairesTracker().pushTime(opts.date, opts.hours, opts.description);
  });

program.parse(process.argv);