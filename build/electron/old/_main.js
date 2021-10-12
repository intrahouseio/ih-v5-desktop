process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const { app, BrowserWindow, Menu, ipcMain, powerSaveBlocker } = require('electron')

const url = require ('url');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const crypto = require('crypto');

const P2P = require('./lib/p2p')
const gethwid = require('./lib/hwid')

const store = {
  settings: {
    display: true,
    sleep: true,
  },
  status: false, 
  title: '',
  servers: [], 
  mainWindow: null, 
  portsWindow: null,
  settingWindow: null,
  settingServerWindow: null,
  menus: null, 
  modePort: false, 
  modeFullScreen: false,
  targetid: null,
  target: '',
  type: '',
  forward: 'close',
  ports: null,
  ports_title: '',
  close: false,
};

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
  })
  .on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
  });


function setSettings() {
  if (store.settings.display) {
    powerSaveBlocker.start('prevent-display-sleep')
  } else {
    const id = powerSaveBlocker.start('prevent-display-sleep');
    powerSaveBlocker.stop(id);
  }

  if (store.settings.sleep) {
    powerSaveBlocker.start('prevent-app-suspension');
  } else {
    const id = powerSaveBlocker.start('prevent-app-suspension');
    powerSaveBlocker.stop(id);
  }
}

function setMainMenu() {
  let servers = [];

  if (store.servers.length) {
    servers = store.servers.map(i => ({ label: i.name, click: () => serverConnect(i) }));
    servers.push({ type: 'separator' })
  }

  if (store.menus === null) {
    store.menus = Menu.getApplicationMenu().items.reduce((p, c) => ({ ...p, [c.role]: c }), {})

    if (store.menus.editmenu) {
      store.menus.editmenu.label = "Правка"
    }
    if (store.menus.editmenu) {
      store.menus.viewmenu.label = "Посмотреть"
    }
    if (store.menus.editmenu) {
      store.menus.windowmenu.label = "Окно"
    }
  }

  const template = [
    { label: 'ih-systems', submenu: [
      { label: 'Настройки', click: createSettingsWindow },
      { type: 'separator' },
      { label: 'Завершить сеанс', click: serverClose, enabled: store.status },
      { label: 'Выход', click: app.quit }
     ] 
    },
    store.menus.editmenu,
    store.menus.viewmenu,
    store.menus.windowmenu,
    { label: 'Список серверов', submenu: [ 
      ...servers,
      { label: 'Настройка серверов', click: createServerSettingsWindow },  
    ] },
    { label: 'Проброс портов', submenu: [
      { label: 'Открыть', click: createServerPortsWindow, enabled: store.modePort },  
    ] }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

app.whenReady().then(() => {
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (store.close === false) {
    store.close = true;
    if (process.platform !== 'darwin') {
      app.quit()
    }
  }

})

function createMainWindow () {
  store.mainWindow = new BrowserWindow({
    title: '',
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
    }
  })

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../index.html'),
    protocol: 'file:',
    slashes: true
  });
  store.mainWindow.loadURL(`${startUrl}?window=main`);
  setMainMenu();
  store.mainWindow.maximize();
  store.mainWindow.show();
  // store.mainWindow§.webContents.openDevTools();
}

function createSettingsWindow () {
  if (store.settingWindow) {
    store.settingWindow.show();
  } else {
    const settingWindow = new BrowserWindow({
      title: 'Настройки',
      width: 1204,
      height: 768,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        contextIsolation: false,
      }
    })
  
    const startUrl = process.env.ELECTRON_START_URL || url.format({
      pathname: path.join(__dirname, '../index.html'),
      protocol: 'file:',
      slashes: true
    });
    settingWindow.loadURL(`${startUrl}?window=settings`);
    settingWindow.on('close', () => {
      store.settingWindow = null;
    })
    store.settingWindow = settingWindow;
  }
}

function createServerPortsWindow () {
  if (store.portsWindow) {
    store.portsWindow.show();
  } else {
    const portsWindow = new BrowserWindow({
      title: 'Проброс портов',
      width: 1204,
      height: 768,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        contextIsolation: false,
      }
    })

    store.portsWindow = portsWindow;
  
    const startUrl = process.env.ELECTRON_START_URL || url.format({
      pathname: path.join(__dirname, '../index.html'),
      protocol: 'file:',
      slashes: true
    });
    portsWindow.loadURL(`${startUrl}?window=ports`);
    portsWindow.on('close', () => {
      store.portsWindow = null;
    })
    
  }
}

function createServerSettingsWindow () {
  if (store.settingServerWindow) {
    store.settingServerWindow.show();
  } else {
    const settingServerWindow = new BrowserWindow({
      title: 'Настройка Серверов',
      width: 1204,
      height: 768,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        contextIsolation: false,
      }
    })
  
    const startUrl = process.env.ELECTRON_START_URL || url.format({
      pathname: path.join(__dirname, '../index.html'),
      protocol: 'file:',
      slashes: true
    });
    settingServerWindow.loadURL(`${startUrl}?window=server_settings`);
    settingServerWindow.on('close', () => {
      store.settingServerWindow = null;
    })
    store.settingServerWindow = settingServerWindow;
  }
}

ipcMain.on('exit', (event, arg) => {
  serverClose();
})

ipcMain.on('stop_ports', (event, arg) => {
  store.p2p.close();
  delete store.p2p;
});

ipcMain.on('start_ports', (event, arg) => {
  store.ports_title = 'Подключение...'
  store.forward = 'connecting';
  store.ports = arg.map(i => ({ ...i, count: 0 }))

  sendWindow('ports', { forward: store.forward, rows: store.ports, title: store.ports_title, name: store.title })

  const server = store.servers.find(i => i.id === store.targetid);

  if (store.type === 'host') {
    fetch(encodeURI(`${store.target}/api/engine`), {
      method: 'POST',
      body: JSON.stringify({ 
        method: "auth2",
        password: crypto.createHash('sha256').update(`intrahouse${server.password ? server.password : Date.now()}`).digest('hex'),
        username: server.username,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => {
        return res.json()
      })
      .then(data => {
        if (data.response) {
          connectP2P(event, arg, data.p2pkey, server.username, server.password)
        } else {
          store.ports_title = data.message;
          store.forward = 'close';
          sendWindow('ports', { forward: 'close', title: store.ports_title })
        }
      })
      .catch(() => {
        store.ports_title = 'Проверьте подключение к сети!'
          store.forward = 'close';
          sendWindow('ports', { forward: 'close', title: store.ports_title, name: store.title })
      })
  } else {
    connectP2P(event, arg, store.target, server.username, server.password)
  }
})

ipcMain.on('get_ports', (event, arg) => {
  if (store.status && store.modePort && store.targetid) {
    if (store.forward !== 'close') {
      sendWindow('ports', { forward: store.forward, rows: store.ports, name: store.title, title: store.ports_title  })
    } else {
      const server = store.servers.find(i => i.id === store.targetid);
      if (server) {
        sendWindow('ports', { forward: store.forward, rows: server.ports, name: store.title, title: store.ports_title })
      }
    }
  }
})

ipcMain.on('get_settings', (event, arg) => {
  if (store.settingWindow) {
    store.settingWindow.send('set_settings', store.settings)
  }
})

ipcMain.on('save_settings', (event, arg) => {
  store.settings = arg;

  try {
    const settingspath = path.join(app.getPath('userData'), 'settings.json');
    fs.writeFile(settingspath, JSON.stringify(store.settings), 'utf8', () => {})
  } catch (e) {
    console.log(e.message)
  }

  setSettings();
})

ipcMain.on('get_servers_settings', (event, arg) => {
  if (store.settingServerWindow) {
    store.settingServerWindow.send('set_servers_settings', store.servers)
  }
})

ipcMain.on('save_servers_settings', (event, arg) => {
  store.servers = arg;
  setMainMenu();

  try {
    const serverspath = path.join(app.getPath('userData'), 'data.json');
    fs.writeFile(serverspath, JSON.stringify(store.servers), 'utf8', () => {})
  } catch (e) {
    console.log(e.message)
  }
})

ipcMain.on('connect', (event, arg) => {
  serverConnect(arg);
})

function sendWindow(event, data) {
  if (store.portsWindow) {
    store.portsWindow.send(event, data)
  }
}

function connectP2P(event, arg, key, username, password) {
  const clentP2P = new P2P();

  clentP2P.info = (e) => {    

    if (e.type === 'connection') { // connection
      if (e.status === 'open') {
        store.ports = store.ports.map(i => {
          if (i.id === e.id) {
            return { ...i, count: i.count + 1}
          }
          return i;
        })

        sendWindow('ports', { rows: store.ports })
      }

      if (e.status === 'close') {
        store.ports = store.ports.map(i => {
          if (i.id === e.id) {
            return { ...i, count: i.count - 1}
          }
          return i;
        })

        sendWindow('ports', { rows: store.ports })
      }
    }

    if (e.type === 'net') { // net
      if (e.status === 'open') {
        store.ports_title = 'Cоединение установлено'
        store.forward = 'open';
        sendWindow('ports', { forward: 'open', title: store.ports_title, name: store.title })

        arg.forEach(i => {
          clentP2P.addPortTCP(i.id, i.lport, i.rhost, i.rport)
        });
      }

      if (e.status === 'close') {
        if (store.forward !== 'close') {
          store.ports_title = 'Cоединение завершено'
          store.forward = 'close';
          sendWindow('ports', { forward: 'close', title: store.ports_title, name: store.title })
        }
      }

      if (e.status === 'error') {
        if (store.forward !== 'close') {
          store.ports_title = e.message;
          store.forward = 'close';
          sendWindow('ports', { forward: 'close', title: store.ports_title, name: store.title })
        }
      }
    }

    if (e.type === 'port') { // port
      if (e.status === 'open') {
        store.ports = store.ports.map(i => {
          if (i.id === e.id) {
            return { ...i, status: 'open'}
          }
          return i;
        })

        sendWindow('ports', { forward: store.forward, rows: store.ports })
      }

      if (e.status === 'close') {
        store.ports = store.ports.map(i => {
          if (i.id === e.id) {
            return { ...i, status: 'close' }
          }
          return i;
        })

        sendWindow('ports', { forward: store.forward, rows: store.ports })
      }

      if (e.status === 'error') {
        store.ports = store.ports.map(i => {
          if (i.id === e.id) {
            return { ...i, status: 'error', message: e.message }
          }
          return i;
        })

        sendWindow('ports', { forward: store.forward, rows: store.ports })
      }
    }
  }
  
  clentP2P.connect(key, username, password);

  store.p2p = clentP2P;
}

function serverClose() {
  store.ports_title = ''
  store.forward = 'close';
  store.ports = null;
  store.status = false;

  if (store.portsWindow) {
    store.portsWindow.close();
    delete store.portsWindow;
  }

  if (store.p2p) {
    store.p2p.close();
    delete store.p2p;
  }

  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '../index.html'),
    protocol: 'file:',
    slashes: true
  });
  store.mainWindow.loadURL(`${startUrl}?window=main`);
  setMainMenu();
}

function serverConnect(arg) {
  if (store.portsWindow) {
    store.portsWindow.close();
    delete store.portsWindow;
  }

  if (store.p2p) {
    store.p2p.close();
    delete store.p2p;
  }

  store.ports_title = ''
  store.forward = 'close';
  store.ports = null;

  store.status = true;
  store.targetid = arg.id;

  if (arg.name) {
    store.title = arg.name;
  } else {
    store.title = '';
  }

  if (arg.modePort) {
    store.modePort = true;
  } else {
    store.modePort = false;
  }

  if (arg.modeFullScreen) {
    store.modeFullScreen = true;
  } else {
    store.modeFullScreen = false;
  }
 
  if (arg.host.indexOf('.') !== -1 || arg.host.indexOf(':') !== -1) {
    let url = '127.0.0.1'
    let port = 8088
    let protocol = 'http'
    let mode = '';

    if (arg.mode) {
      if (arg.mode === 'admin') {
        mode = 'admin';
      }
    }

    if (arg.host.indexOf('http') !== -1) {
      if (arg.host.indexOf('https://') !== -1) {
        protocol = 'https';
      }
    }

    if (arg.host.indexOf('://') !== -1) {
      const temp = arg.host.split('://');
      url = temp[1];
    } else {
      url = arg.host;
    }

    if (url.indexOf(':') !== -1) {
      const temp = url.split(':');
      url = temp[0];
      port = temp[1];
    }

    store.type = 'host';
    store.target = `${protocol}://${url}:${port}`;
    store.mainWindow.setFullScreen(store.modeFullScreen);
    store.mainWindow.loadURL(`${protocol}://${url}:${port}/${mode}?username=${arg.username}&password=${arg.password}`);
  } else {
    let mode = '';

    if (arg.mode) {
      if (arg.mode === 'admin') {
        mode = 'admin';
      }
    }

    const key = arg.host.split(' ').join('');

    store.type = 'p2p';
    store.target = key;
    store.mainWindow.setFullScreen(store.modeFullScreen);
    store.mainWindow.loadURL(`https://p2p.ih-systems.com/?key=${key}&username=${arg.username}&password=${arg.password}&mode=${mode}`);
  }
  setMainMenu();
}


function main() {

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

  try {
    const settingspath = path.join(app.getPath('userData'), 'settings.json');
    const serverspath = path.join(app.getPath('userData'), 'data.json');
    const txt = fs.readFileSync(serverspath, 'utf8');
    const json = JSON.parse(txt)

    if (Array.isArray(json)) {
      store.servers = json
    } else {
      store.servers = json.servers
    }

    if (fs.existsSync(settingspath)) {
      const txt = fs.readFileSync(settingspath, 'utf8');
      const settings = JSON.parse(txt)

      store.settings = settings
    }
  } catch (e) {
    console.log(e.message)
  }

  setSettings();
}

main();