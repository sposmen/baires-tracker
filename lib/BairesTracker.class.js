const _ = require('lodash');
const rp = require('request-promise-native').defaults({jar: true});
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
require('datejs');
const cTable = require('console.table');

class BairesTracker {

  BASE_URL = 'https://timetracker.bairesdev.com';

  FULL_TABLE_HEADERS = ['Date', 'Hours', 'Project', 'Assignment Type', 'Description'];
  TABLE_HEADERS = ['Date', 'Hours', null, null, 'Description'];
  SUMMARY_HEADERS = ['Date', 'Assignment Type'];

  VALIDATORS = [
    '__EVENTTARGET',
    '__EVENTARGUMENT',
    '__LASTFOCUS',
    '__VIEWSTATE',
    '__VIEWSTATEGENERATOR',
    '__EVENTVALIDATION'
  ];

  constructor() {
    this.getSummary = false;
    this.homePromise = this.visitLogin().then(this.login)//.catch(this.catchedError);
    this.configSet = false;
    this.configFile = `${require('os').homedir()}/.bairestracker/config`;

    process.on('unhandledRejection', error => console.log('unhandledRejection', error));
    process.on('uncaughtException', error => console.log('unhandledRejection', error));
  }

  get config() {
    this._config = (this.configSet && this._config) || require(this.configFile);
    this.configSet = true;
    return this._config
  }

  set config(newFile) {
    let filePath = path.resolve(newFile);
    if(fs.existsSync(filePath)) this._config = _.merge({}, this.config, require(filePath));
  }

  opts = (ops = {}) => {
    return _.merge(
      {url: this.BASE_URL},
      ops,
      {
        followAllRedirects: true,
        transform: (body) => cheerio.load(body),
        headers: {
          'Host': 'timetracker.bairesdev.com',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
          'Origin': 'http://timetracker.bairesdev.com',
          'Referer': 'http://timetracker.bairesdev.com/'
        }
      }
    )
  };

  visitLogin = () => {
    return rp(this.opts())
  };

  login = ($) => {
    let postParams = {
      'ctl00$ContentPlaceHolder$UserNameTextBox': this.config.username,
      'ctl00$ContentPlaceHolder$PasswordTextBox': this.config.password,
      'ctl00$ContentPlaceHolder$LoginButton': 'Login',
    };
    this.setValidators($, postParams);
    return rp.post(this.opts({form: postParams}))
  };

  setValidators = ($, obj) => {
    this.VALIDATORS.forEach((validator) => {
      let elm = $(`#${validator}`);
      obj[validator] = elm.length ? elm[0].attribs.value : ''
    });
  };

  currentTableData = ($) => {
    let data = [];
    let trs = $('.tbl-respuestas tr');
    this.headers = this.headers || this.TABLE_HEADERS;
    // Data
    trs.each((idx, elm) => {
      if (idx === 0 || idx >= trs.length) return;

      let row = {};
      let cols = $(elm).children('td');
      cols.each((idx, elm) => {
        if (this.headers[idx]) {
          row[this.headers[idx]] = $(elm).text()
        }
      });
      data.push(row)
    });

    return data
  };

  show = ({full = false, summary = false, onlysummary = false} = {}) => {
    this.getSummary = summary || onlysummary;
    if (full || this.getSummary) this.headers = this.FULL_TABLE_HEADERS;
    this.onlysummary = onlysummary;
    return this.homePromise
      .then(this.currentTableData)
      //.catch(this.catchedError)
      .then(this.printData)
      //.catch(this.catchedError)
      .then(this.printSummary)
      //.catch(this.catchedError)
  };

  printData = (data) => {
    if (!this.onlysummary) console.table(data);
    return data
  };

  printSummary = (data) => {
    if (!this.getSummary) return data;

    let reducedInit = {};
    this.SUMMARY_HEADERS.forEach((header) => reducedInit[header] = {});

    let summaryData = data
      .slice(0, -1)
      .reduce(this.summaryReducer, reducedInit);

    Object.keys(summaryData).forEach((header) => {
      console.table(header, summaryData[header]);
      summaryData[header] = cTable.getTable()
    });

    return data
  };

  summaryReducer = (reducedData, record) => {
    this.SUMMARY_HEADERS
      .forEach((header) => {
        if (!reducedData[header][record[header]]) reducedData[header][record[header]] = 0;
        reducedData[header][record[header]] += parseFloat(record['Hours']);
      });
    return reducedData;
  };

  pushTime = ({date, hours, desc} = {}) => {
    date = new Date.parse((date || 'today').trim()).format('d/m/Y');
    hours = hours || this.config.time || 9;
    desc = desc || this.config.desc || 'Worked';

    this.addTimeData = {
      // Date
      'ctl00$ContentPlaceHolder$txtFrom': date,
      // Hours
      'ctl00$ContentPlaceHolder$TiempoTextBox': hours,
      // Description
      'ctl00$ContentPlaceHolder$DescripcionTextBox': desc,
      // Accept btn
      'ctl00$ContentPlaceHolder$btnAceptar': 'Accept'
    };

    return this.homePromise
      .then(this.visitAddTimePage)
      //.catch(this.catchedError)
      .then(this.loadProjectData)
      //.catch(this.catchedError)
      .then(this.addTime)
      //.catch(this.catchedError)
  };

  visitAddTimePage = ({post = false, ops = {}} = {}) => {
    let params = this.opts(_.merge({url: `${this.BASE_URL}/CargaTimeTracker.aspx`}, ops));
    if (post) params.method = 'POST';
    return rp(params)
  };

  catchedError = (err) => {
    console.log(err);
    return err
  };

  loadProjectData = ($) => {
    // Validators
    this.setValidators($, this.addTimeData);
    // Project
    $('#ctl00_ContentPlaceHolder_idProyectoDropDownList option').each((i, elm) => {
      if ($(elm).text() === this.config.projectName) {
        this.addTimeData.ctl00$ContentPlaceHolder$idProyectoDropDownList = $(elm)[0].attribs.value
      }
    });
    // Load project data
    return this.visitAddTimePage({
      post: true,
      ops: {
        form: _.merge({}, this.addTimeData, {
          'ctl00$ContentPlaceHolder$ScriptManager': 'ctl00$ContentPlaceHolder$UpdatePanel1|ctl00$ContentPlaceHolder$idProyectoDropDownList'
        })
      }
    })
  };

  addTime = ($) => {
    this.setValidators($, this.addTimeData);
    delete this.addTimeData.ctl00$ContentPlaceHolder$ScriptManager;
    // Assignation Type
    $('#ctl00_ContentPlaceHolder_idTipoAsignacionDropDownList option').each((i, elm) => {
      if ($(elm).text() === this.config.assignation) {
        this.addTimeData.ctl00$ContentPlaceHolder$idTipoAsignacionDropDownList = $(elm)[0].attribs.value
      }
    });
    if(!this.addTimeData.ctl00$ContentPlaceHolder$idTipoAsignacionDropDownList){
      throw Error('No assignation found');
    }
    // Focal Point
    $('#ctl00_ContentPlaceHolder_idFocalPointClientDropDownList option').each((i, elm) => {
      if ($(elm).text() === this.config.focalPoint) {
        this.addTimeData.ctl00$ContentPlaceHolder$idFocalPointClientDropDownList = $(elm)[0].attribs.value
      }
    });
    if(!this.addTimeData.ctl00$ContentPlaceHolder$idFocalPointClientDropDownList){
      throw Error('No focal point found');
    }
    return this.visitAddTimePage({
      post: true,
      ops: {
        form: this.addTimeData
      }
    });
  };
}

module.exports = BairesTracker;
