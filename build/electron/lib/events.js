const { ipcMain } = require('electron');
const core = require('./core');


ipcMain.on('new_connection', (e, params) => {
  core.windowConnectToServer(params.windowid, params);
});


ipcMain.on('get_settings', (e, params) => {
  core.getSettings().then(settings => e.sender.send('set_settings', settings))
});


ipcMain.on('save_settings', (e, arg) => {
  core.setSettings(arg)
})


ipcMain.on('get_servers_settings', (e, params) => {
  core.getServers().then(servers => e.sender.send('set_servers_settings', servers))
});


ipcMain.on('save_servers_settings', (e, arg) => {
  core.setServers(arg)
})

ipcMain.on('get_ports', (e, arg) => {
  core.serverPortsStatus(e.sender.id).then(res => e.sender.send('ports', res))
});

ipcMain.on('start_ports', (e, arg) => {
  core.serverPortsStart(e.sender.id).then(res => e.sender.send('ports', res))
});

ipcMain.on('stop_ports', (e, arg) => {
  core.serverPortsStop(e.sender.id);
});


module.exports = {};