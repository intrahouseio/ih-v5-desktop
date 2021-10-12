const { app } = require('electron');
const fetch = require('node-fetch');

const gethwid = require('./hwid')

function init() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
  process
    .on('unhandledRejection', (reason, p) => {
      console.error(reason, 'Unhandled Rejection at Promise', p);
    })
    .on('uncaughtException', err => {
      console.error(err, 'Uncaught Exception thrown');
    });

  app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

  try {
    gethwid()
      .then(hwid => {
        fetch(`https://update.ih-systems.com/restapi/desktop?hwid=${hwid}&sec=799hDIlfgP0kGBXULjVRLswnhuHybRIZ`)
          .then(res => res.json())
          .then(json => console.log(json))
          .catch(() => {})
      });
  } catch {

  }
}


module.exports = init;