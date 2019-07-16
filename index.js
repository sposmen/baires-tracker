const _ = require('lodash');
const rp = require('request-promise-native').defaults({jar: true});
const cheerio = require('cheerio');
// const moment = require('moment');
require('console.table');

const config = require('./config');

const BASE_URL = 'https://timetracker.bairesdev.com';

function opts(ops = {}) {
  return _.merge({}, {
    url: BASE_URL,
    followAllRedirects: true,
    transform: (body) => cheerio.load(body),
    headers: {
      'Host': 'timetracker.bairesdev.com',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36',
      'Origin': 'http://timetracker.bairesdev.com',
      'Referer': 'http://timetracker.bairesdev.com/'
    }
  }, ops)
}

const tableHeaders = ['Date', 'Hours', 'Project', 'Assignment Type', 'Description'];

const validators = [
  '__EVENTTARGET',
  '__EVENTARGUMENT',
  '__LASTFOCUS',
  '__VIEWSTATE',
  '__VIEWSTATEGENERATOR',
  '__EVENTVALIDATION'
];

function setValidators($, obj) {
  validators.forEach((validator) => {
    let elm = $(`#${validator}`);
    obj[validator] = elm.length ? elm[0].attribs.value : ''
  });
}

function login() {
  return rp(opts())
    .then(($) => {
      let postParams = {
        'ctl00$ContentPlaceHolder$UserNameTextBox': config.username,
        'ctl00$ContentPlaceHolder$PasswordTextBox': config.password,
        'ctl00$ContentPlaceHolder$LoginButton': 'Login',
      };
      setValidators($, postParams);
      return rp.post(opts({form: postParams}))
    })
}

function currentTableData($) {
  let data = [];
  let trs = $('.tbl-respuestas tr');
  // Data
  trs.each((idx, elm) => {
    if (idx === 0 || idx >= trs.length) return;

    let row = {};
    let cols = $(elm).children('td');
    cols.each((idx, elm) => {
      if (tableHeaders[idx]) row[tableHeaders[idx]] = $(elm).text()
    });
    data.push(row)
  });

  return data
}

function show() {
  return login().then(currentTableData)
}

// show().then((table) => console.table(table));

function loadTimeForm() {
  let loadPostData = {
    // Date
    'ctl00$ContentPlaceHolder$txtFrom': config.date,
    // Hours
    'ctl00$ContentPlaceHolder$TiempoTextBox': config.time,
    // Description
    'ctl00$ContentPlaceHolder$DescripcionTextBox': config.description,
    // Accept btn
    'ctl00$ContentPlaceHolder$btnAceptar': 'Accept'
  };

  const loadProject = ($)=>{
    // Validators
    setValidators($, loadPostData);
    // Project
    $('#ctl00_ContentPlaceHolder_idProyectoDropDownList option').each((i, elm) => {
      if ($(elm).text() === config.projectName) {
        loadPostData.ctl00$ContentPlaceHolder$idProyectoDropDownList = $(elm)[0].attribs.value
      }
    });
    // Load project data
    return rp.post(opts(
      {
        url: `${BASE_URL}/CargaTimeTracker.aspx`,
        form: _.merge({}, loadPostData, {
          'ctl00$ContentPlaceHolder$ScriptManager': 'ctl00$ContentPlaceHolder$UpdatePanel1|ctl00$ContentPlaceHolder$idProyectoDropDownList',
        })
      }
    ))
  };

  const uploadTime = ($)=>{
    setValidators($, loadPostData);
    // Assignation Type
    $('#ctl00_ContentPlaceHolder_idTipoAsignacionDropDownList option').each((i, elm) => {
      if ($(elm).text() === config.assignation) {
        loadPostData.ctl00$ContentPlaceHolder$idTipoAsignacionDropDownList = $(elm)[0].attribs.value
      }
    });
    // Focal Point
    $('#ctl00_ContentPlaceHolder_idFocalPointClientDropDownList option').each((i, elm) => {
      if ($(elm).text() === config.focalPoint) {
        loadPostData.ctl00$ContentPlaceHolder$idFocalPointClientDropDownList = $(elm)[0].attribs.value
      }
    });
    return rp.post(opts(
      {
        url: `${BASE_URL}/CargaTimeTracker.aspx`,
        form: loadPostData
      }
    ))
  };

  return login()
    .then(() => {
      return rp(opts(
        {
          url: `${BASE_URL}/CargaTimeTracker.aspx`,
        }
      ))
    })
    .then(loadProject)
    .then(uploadTime)
}

loadTimeForm().then(currentTableData).then((table) => console.table(table));