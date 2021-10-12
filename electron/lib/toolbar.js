const { app, Menu, powerSaveBlocker } = require('electron');


async function toolbar(core, store) {
  const menu = [];

  if (store.defaultToolbarMenu === null) {
    const menuItems = Menu.getApplicationMenu().items;
  
    store.defaultToolbarMenu = menuItems.reduce((p, c) => {
      const key = c.role;
      const item = c;
  
      return { ...p, [key]: item };
    }, {})
  }


  if (process.platform === 'darwin') {
    menu.push({ label: 'ih-systems', submenu: [] });
  }

  menu.push({ 
    label: 'File', submenu: [
      { label: 'New Window', click: () => core.windowNewConnection() },
      { label: 'Close Window', click: () => core.closeActiveWindow() },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ]
  });

  menu.push(store.defaultToolbarMenu.editmenu);
  menu.push(store.defaultToolbarMenu.viewmenu);
  menu.push(store.defaultToolbarMenu.windowmenu);

  const menuui = [];
  const menuadmin = [];
  const menuports = []; 

  const settings = await core.getSettings();
  const servers = await core.getServers();

  const serversui = servers;
  const serversadmin = servers.filter(i => i.modeAdmin);
  const serversports = servers.filter(i => i.modePort);

  if (serversui.length) {
    serversui.forEach(i => menuui.push({ label: i.name, click: () => core.toolbarConnectToServer(i, false) }));
  }

  if (serversadmin.length) {
    serversadmin.forEach(i => menuadmin.push({ label: i.name, click: () => core.toolbarConnectToServer(i, true) }));
  }

  if (serversports.length) {
    serversports.forEach(i => menuports.push({ label: i.name, click: () => core.toolbarConnectToPortForwarding(i) }));
  }


  menu.push({ 
    label: 'Preferences', submenu: [
      { label: 'Servers List', click: () => core.windowServerSettings() },
      { label: 'Settings', click: () => core.windowSettings() },
    ],
  });

  menu.push({ 
    label: 'Servers', submenu: [
      ...menuui,
    ],
  });

  if (menuadmin.length) {
    menu.push({ 
      label: 'Developer', submenu: [
        ...menuadmin,
      ],
    });
  }

  if (menuports.length) {
    menu.push({ 
      label: 'Port Forwarding', submenu: [
        ...menuports,
      ],
    });
  }

  const dockMenu = Menu.buildFromTemplate([
    { label: 'New Window', click: () => core.windowNewConnection() },
  ])

  if (process.platform === 'darwin') {
    app.dock.setMenu(dockMenu)
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));

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


module.exports = toolbar;
