import React, { Component } from 'react';

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import FormLabel from '@material-ui/core/FormLabel';
import Button from '@material-ui/core/Button';


const electron = window.require('electron');
const ipcRenderer  = electron.ipcRenderer;


const styles = {
  button: {
    position: 'absolute',
    top: 6,
    right: 12,
    zIndex: 10000,
  },
  flabel: {
    marginTop: 12,
    marginBottom: 12,
  },
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  container1: {
    display: 'flex',
    flexDirection: 'column',
    width: '45ch',
    padding: 12,
  },
  container2: {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: 12,
    width: '45ch',
    padding: 12,
  },
  container3: {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: 12,
    width: '45ch',
    padding: 12,
  },
}


class Settings extends Component {
  state = {  
    data: { 
      developer: false,
      port: false,
      display: false, 
      sleep: true,
      fullscreen: false, 
    }  
  }

  componentDidMount() {
    this.sub = ipcRenderer.on('set_settings', this.handleData)
    ipcRenderer.send('get_settings');
  }

  componentWillUnmount() {
    this.sub.removeListener('set_settings', this.handleData)
  }

  handleData = (e, data) => {
    this.setState({ enabled: true, data })
  }

  onChangeValue = (key, value) => {
    this.setState({ 
      data: { ...this.state.data, [key]: value }
    });
  }

  handleSave = () => {
    ipcRenderer.send('save_settings', this.state.data);
  }

  render() {
    return (
      <div style={styles.root}>
        <div style={styles.container2}>
          <FormLabel style={styles.flabel} component="legend">Power Save Blocker</FormLabel>
          <FormControlLabel control={<Checkbox color="primary" onChange={(e) => this.onChangeValue('sleep', e.target.checked)} checked={this.state.data.sleep} />} label="App Suspension"/>
          <FormControlLabel control={<Checkbox color="primary" onChange={(e) => this.onChangeValue('display', e.target.checked)} checked={this.state.data.display} />} label="Display Sleep​"/>
        </div>
        <div style={styles.container3}>
          <FormLabel style={styles.flabel} component="legend">Launch</FormLabel>
          <FormControlLabel control={<Checkbox color="primary" onChange={(e) => this.onChangeValue('fullscreen', e.target.checked)} checked={this.state.data.fullscreen} />} label="Fullscreen"/>
        </div>
      </div>
    );
  }
}


export default Settings;