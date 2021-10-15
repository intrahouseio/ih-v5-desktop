const {  BrowserWindow } = require('electron');

const url = require ('url');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const crypto = require('crypto');

const winmodes = {
  1: { w: 800, h: 600 },
  2: { w: 1204, h: 768}
}

function createWindow(params, cb) {
  const wh = winmodes[params.mode] || winmodes[1];
  const window = new BrowserWindow({
    title: params.title,
    show: false,
    width: wh.w,
    height: 600,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
    }
  })

  const startUrl =  process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../../index.html'),
    protocol: 'file:',
    slashes: true
  });

  window.once('close', (e) => {
    cb(e.sender.id)
  });

  window.loadURL(`${startUrl}?window=${params.target}&uuid=${window.id}`);

  if (params.fullscreen) {
    window.maximize();
  }
  
  window.show();

  return window;
}

function getServerParams(params) {
  const server = {
    key: '',
    host: '127.0.0.1',
    port: 8088,
    protocol: 'http',
    type: 'url',
    username: params.username || '',
    password: params.password || '',
  }

  if (params.host.indexOf('.') !== -1 || params.host.indexOf(':') !== -1) {
    if (params.host.indexOf('http') !== -1) {
      if (params.host.indexOf('https://') !== -1) {
        server.protocol = 'https';
      }
    }

    if (params.host.indexOf('://') !== -1) {
      const temp = params.host.split('://');
      server.host = temp[1];
    } else {
      server.host = params.host;
    }

    if (server.host.indexOf(':') !== -1) {
      const temp = server.host.split(':');
      server.host = temp[0];
      server.port = temp[1];
    }
  } else {
    server.key = params.host.split(' ').join('');
    server.type = 'p2p';
  }

  return server;
}

function getServerUrl({ type, key, protocol, host, port, username, password }, isAdmin) {
  const mode = isAdmin ? 'admin' : '';
  if (type === 'p2p') {
    return `https://p2p.ih-systems.com/?key=${key}&username=${username}&password=${password}&mode=${mode}`;
  }
  return `${protocol}://${host}:${port}/${mode}?username=${username}&password=${password}`;
}


module.exports = {
  getServerParams,
  getServerUrl,
  createWindow,
}