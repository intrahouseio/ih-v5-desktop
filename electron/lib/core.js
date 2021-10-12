const { app, BrowserWindow } = require('electron');

const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const crypto = require('crypto');

const init = require('./init');
const toolbar = require('./toolbar');
const P2P = require('./p2p')

const store = require('./store');

const { getServerParams, getServerUrl, createWindow } = require('./tools');

function toolbarConnectToServer(item, isAdmin) {
  item.mode = isAdmin ? 'admin': 'user';

  const serverWindow = getWindowByServerId(item.id, isAdmin)

  if (serverWindow) {
    serverWindow.show();
  } else {
    const freeWindow = getFreeWindow();

    if (freeWindow) {
      windowConnectToServer(freeWindow.id, item);
    } else {
      windowNewConnection(Object.keys(store.windows).length === 0);
      const freeWindow = getFreeWindow();
      windowConnectToServer(freeWindow.id, item);
    }
  }
}

function toolbarConnectToPortForwarding(item) {
  const portWindow = getWindowPortByServerId(item.id)

  if (portWindow) {
    portWindow.show();
  } else {
    const serverParams = getServerParams(item);
    const title = item.name ? item.name : (serverParams.type === 'p2p' ? serverParams.key : serverParams.host + ':' + serverParams.port);
    const window = createWindow({
      target: 'ports', 
      title: title + ' - Port Forwarding', 
      fullscreen: Object.keys(store.windows).length === 0,
      mode: 2,
    }, clearWindow);

    window.autoHideMenuBar = true;

    store.links[window.id] = { type: 'port', id: item.id };
    store.windows[window.id] = window;
  }
}


function windowConnectToServer(uuid, params) {
  const serverParams = getServerParams(params);
  const serverURL = getServerUrl(serverParams, params.mode === 'admin');

  if (store.windows[uuid] !== undefined) {
    delete store.links[uuid].init;
    if (params.id) {
      store.links[uuid].id = params.id;
    }

    if (params.mode === 'admin') {
      store.links[uuid].isAdmin = true;
    }

    const name = params.name ? params.name : (serverParams.type === 'p2p' ? serverParams.key : serverParams.host + ':' + serverParams.port);
    const title = params.mode === 'admin' ? name + ' - Developer' : name;
    const window = store.windows[uuid];

    window.title = title;
    window.on('page-title-updated', (evt) => {
      evt.preventDefault();
    });

    window.loadURL(serverURL).then(() => {
      window.title = title;
    });
    window.show();
  }
}


async function windowDefault() {
  const settings = await getSettings();
  const servers = await getServers();

  const defserver =  servers.find(i => i.default);


  const window = createWindow({
    target: 'main', 
    title: 'New Connection', 
    fullscreen: true,
  }, clearWindow);
  store.links[window.id] = { type: 'server', init: true };
  store.windows[window.id] = window;

  if (settings.fullscreen) {
    window.setFullScreen(true);
  }

  if (defserver) {
    toolbarConnectToServer(defserver);
  }
}

function windowNewConnection(fullscreen) {
  const window = createWindow({
    target: 'main', 
    title: 'New Connection', 
    fullscreen: fullscreen,
  }, clearWindow);
  store.links[window.id] = { type: 'server', init: true };
  store.windows[window.id] = window;
}


function windowSettings() {
  const settingsWindow = getWindowByType('settings');

  if (settingsWindow === null) {
    const window = createWindow({
      target: 'settings', 
      title: 'Settings', 
      fullscreen: false,
      mode: 2,
    }, clearWindow);

    window.autoHideMenuBar = true;

    store.links[window.id] = { type: 'settings' };
    store.windows[window.id] = window;
  } else {
    settingsWindow.show();
  }
}

function windowServerSettings() {
  const settingsWindow = getWindowByType('server_settings');

  if (settingsWindow === null) {
    const window = createWindow({
      target: 'server_settings', 
      title: 'Servers List', 
      fullscreen: false,
      mode: 2,
    }, clearWindow);

    window.autoHideMenuBar = true;
    
    store.links[window.id] = { type: 'server_settings' };
    store.windows[window.id] = window;
  } else {
    settingsWindow.show();
  }
}

function clearWindow(id) {
  delete store.links[id]
  delete store.windows[id];
}

function closeActiveWindow() {
  const window = BrowserWindow.getFocusedWindow();

  if (window) {
    delete store.links[window.id]
    delete store.windows[window.id];
    window.close();
  }
}

function getWindowByType(name) {
  let found = null;
  Object
    .keys(store.links)
    .forEach(key => {
      if (store.links[key].type === name) {
        found = store.windows[key];
      }
    });
  return found;
}

function getWindowByServerId(id, admin) {
  let found = null;
  Object
    .keys(store.links)
    .forEach(key => {
      if (store.links[key].id === id && store.links[key].type === 'server') {
        if (admin) {
          if (store.links[key].isAdmin) {
            found = store.windows[key];
          }
        } else {
          if (!store.links[key].isAdmin) {
            found = store.windows[key];
          }
        }
      }
    });
  return found;
}

function getWindowPortByServerId(id) {
  let found = null;
  Object
    .keys(store.links)
    .forEach(key => {
      if (store.links[key].id === id && store.links[key].type === 'port') {
        found = store.windows[key];
      }
    });
  return found;
}

function getFreeWindow() {
  let found = null;
  Object
    .keys(store.links)
    .forEach(key => {
      if (store.links[key].type === 'server' && store.links[key].init) {
        found = store.windows[key];
      }
    });
  return found;
}

function getSettings() {
  return new Promise(resolve => {
    if (store.settings === null) {
      try {
        const serverspath = path.join(app.getPath('userData'), 'settings.json');
        const txt = fs.readFileSync(serverspath, 'utf8');
        const json = JSON.parse(txt)
  
        store.settings = json;
      } catch {
        store.settings = {
          developer: false,
          port: false,
          display: false, 
          sleep: true,
          fullscreen: false, 
        };
      }
    }
    resolve(store.settings);
  });
}

function setSettings(data) {
  try {
    store.settings = data;
    const serverspath = path.join(app.getPath('userData'), 'settings.json');
    fs.writeFile(serverspath, JSON.stringify(store.settings), 'utf8', () => {})
    toolbar(core, store)
  } catch (e) {
    console.log(e.message)
  }
}

function getServers() {
  return new Promise(resolve => {
    if (store.servers === null) {
      try {
        const serverspath = path.join(app.getPath('userData'), 'data.json');
        const txt = fs.readFileSync(serverspath, 'utf8');
        const json = JSON.parse(txt)
  
        store.servers = json;
      } catch {
        store.servers = [];
      }
    }
    resolve(store.servers);
  });
}

function setServers(data) {
  try {
    store.servers = data;
    const serverspath = path.join(app.getPath('userData'), 'data.json');
    fs.writeFile(serverspath, JSON.stringify(store.servers), 'utf8', () => {})
    toolbar(core, store)

    const titles = {}

    store.servers.forEach(i => {
      titles[i.id] = i.name;

      if (store.ports[i.id] && store.ports[i.id].status === 'close') {
        store.ports[i.id].rows = i.ports;
        store.ports[i.id].name = i.name;
      }
    });

    Object
      .keys(store.links)
      .forEach(key => {
          if (store.links[key].type === 'server' && store.windows[key]) {
            const sid = store.links[key].id;
            if (titles[sid]) {
              store.windows[key].title = store.links[key].isAdmin ? titles[sid] + ' - Developer' : titles[sid]
            }
          }

          if (store.links[key].type === 'port' && store.windows[key]) {
            const sid = store.links[key].id;
            if (titles[sid]) {
              store.windows[key].title = titles[sid] + ' - Port Forwarding';
            }
          }

          if (store.links[key].type === 'port' && store.windows[key]) {
            const sid = store.links[key].id;
            if (store.ports[sid].status === 'close') {
              sendToWindow(key, 'ports', { forward: store.ports[sid].status, rows: store.ports[sid].rows, name: store.ports[sid].name })
            }
          }
      });

  } catch (e) {
    console.log(e.message)
  }
}

function serverPortsStatus(id) {
  return new Promise(async resolve => {
    if (store.links[id]) {
      const sid = store.links[id].id;
      const slist = await getServers();
      const item = slist.find(i => i.id === sid);
      const serverParams = getServerParams(item);
      const title = item.name ? item.name : (serverParams.type === 'p2p' ? serverParams.key : serverParams.host + ':' + serverParams.port);

      if (item) {
        if (store.ports[sid] === undefined) {
          store.ports[sid] = {};
          store.ports[sid].status = 'close';
          store.ports[sid].rows = item.ports;
          store.ports[sid].name = title;
          store.ports[sid].title = '';
        } else {
          if (store.ports[sid].status === 'close') {
            store.ports[sid].rows = item.ports;
            store.ports[sid].name = title;
          }
        }
        resolve({ 
          forward: store.ports[sid].status, 
          rows: store.ports[sid].rows, 
          name: store.ports[sid].name, 
          title: store.ports[sid].title,
        }); 
      }
    }
    resolve({ forward: 'stop', rows: [], name: 'Error', title: '' });
  });
}

function serverPortsStart(id) {
  return new Promise(async resolve => {
    if (store.links[id]) {
      const sid = store.links[id].id;
      store.ports[sid].status = 'connecting';
      store.ports[sid].title = 'Connecting...'
      store.ports[sid].rows = store.ports[sid].rows.map(i => ({ ...i, count: 0 }))
      resolve({ 
        forward: store.ports[sid].status, 
        rows: store.ports[sid].rows, 
        name: store.ports[sid].name, 
        title: store.ports[sid].title,
      }); 
      startFP(sid, id);
    }
  });
}

function serverPortsStop(id) {
  if (store.links[id]) {
    const sid = store.links[id].id;
    if (store.ports[sid] && store.ports[sid].p2p) {
      store.ports[sid].p2p.close();
      delete store.ports[sid].p2p;
    }
  }
}


async function startFP(sid, windowid) {
  const slist = await getServers();
  const item = slist.find(i => i.id === sid);
  const { type, key, protocol, host,  port, username, password } = getServerParams(item);


  if (type === 'url') {
    fetch(encodeURI(`${protocol}://${host}:${port}/api/engine`), {
      method: 'POST',
      body: JSON.stringify({ 
        method: "auth2",
        password: crypto.createHash('sha256').update(`intrahouse${password ? password : Date.now()}`).digest('hex'),
        username: username,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => {
        return res.json()
      })
      .then(data => {
        if (data.response) {
          connectP2P(sid, windowid, data.p2pkey, username, password)
        } else {
          store.ports[sid].title = data.message;
          store.ports[sid].status = 'close';

          sendToWindow(windowid, 'ports', { forward: store.ports[sid].status, title: store.ports[sid].title })
        }
      })
      .catch((e) => {
        console.log(e);
        store.ports[sid].title = 'Check network connection!';
        store.ports[sid].status = 'close';

        sendToWindow(windowid, 'ports', { forward: store.ports[sid].status, title: store.ports[sid].title, rows: store.ports[sid].rows, name: store.ports[sid].name })
      })
  } else {
    connectP2P(sid, windowid, key, username, password)
  }
}


function connectP2P(sid, windowid, key, username, password) {
  store.ports[sid].p2p = new P2P();
  const clentP2P = store.ports[sid].p2p;

  clentP2P.info = (e) => {    

    if (e.type === 'connection') { // connection
      if (e.status === 'open') {
        store.ports[sid].rows = store.ports[sid].rows.map(i => {
          if (i.id === e.id) {
            return { ...i, count: i.count + 1}
          }
          return i;
        })

        sendToWindow(windowid, 'ports', { rows: store.ports[sid].rows })
      }

      if (e.status === 'close') {
        store.ports[sid].rows = store.ports[sid].rows.map(i => {
          if (i.id === e.id) {
            return { ...i, count: i.count - 1}
          }
          return i;
        })

        sendToWindow(windowid, 'ports', { rows: store.ports[sid].rows })
      }
    }

    if (e.type === 'net') { // net
      if (e.status === 'open') {
        store.ports[sid].title = 'Connection Established';
        store.ports[sid].status = 'open';

        sendToWindow(windowid, 'ports', { forward: store.ports[sid].status, title: store.ports[sid].title })

        store.ports[sid].rows.forEach(i => {
          clentP2P.addPortTCP(i.id, i.lport, i.rhost, i.rport)
        });
      }

      if (e.status === 'close') {
        if (store.ports[sid].status !== 'close') {
          store.ports[sid].title = 'Connection Closed';
          store.ports[sid].status = 'close';

          serverPortsStatus(windowid).then(res => sendToWindow(windowid, 'ports', res ));
        }
      }

      if (e.status === 'error') {
        if (store.ports[sid].status !== 'close') {
          store.ports[sid].title = e.message;
          store.ports[sid].status = 'close';

          serverPortsStatus(windowid).then(res => sendToWindow(windowid, 'ports', res ));
        }
      }
    }

    if (e.type === 'port') { // port
      if (e.status === 'open') {
        store.ports[sid].rows = store.ports[sid].rows.map(i => {
          if (i.id === e.id) {
            return { ...i, status: 'open'}
          }
          return i;
        })

        sendToWindow(windowid, 'ports', { rows: store.ports[sid].rows })
      }

      if (e.status === 'close') {
        store.ports[sid].rows = store.ports[sid].rows.map(i => {
          if (i.id === e.id) {
            return { ...i, status: 'close' }
          }
          return i;
        })

        sendToWindow(windowid, 'ports', { rows: store.ports[sid].rows })
      }

      if (e.status === 'error') {
        store.ports[sid].rows = store.ports[sid].rows.map(i => {
          if (i.id === e.id) {
            return { ...i, status: 'error', message: e.message }
          }
          return i;
        })

        sendToWindow(windowid, 'ports', { rows: store.ports[sid].rows })
      }
    }
  }
  
  clentP2P.connect(key, username, password);
}


function sendToWindow(wid, event, data) {
  if (store.windows[wid]) {
    store.windows[wid].send(event, data);
  }
}

function toolbarUpdate() {
  toolbar(core, store)
}



const core = {
  store,
  init,
  toolbarUpdate,
  toolbarConnectToServer,
  toolbarConnectToPortForwarding,
  windowDefault,
  windowConnectToServer,
  windowNewConnection,
  windowSettings,
  windowServerSettings,
  closeActiveWindow,
  getSettings,
  setSettings,
  getServers,
  setServers,
  serverPortsStatus,
  serverPortsStart,
  serverPortsStop,
};
  

module.exports = core;