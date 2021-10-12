import React, { Component } from 'react';

import Login from './libs/Login';
import Settings from './libs/Settings';
import Servers from './libs/Servers';
import Ports from './libs/Ports';

import './App.css';


const params = (new URL(document.location)).searchParams;
const win = params.get('window');
const uuid = params.get('uuid');


const styles = {
  root: {
    width: '100%',
    height: '100%',
  },
  root2: {
    width: '100%',
    height: '100%',
    filter: 'blur(2px)',
  },
  fab: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
}


class App extends Component {
  state = {  }



  render() {
    if (win === 'settings') {
      return (
        <div style={styles.root}>
          <Settings windowid={uuid} />
        </div>
      );
    }

    if (win === 'server_settings') {
      return (
        <div style={styles.root}>
          <Servers windowid={uuid} />
        </div>
      );
    }

    if (win === 'ports') {
      return (
        <div style={styles.root}>
          <Ports windowid={uuid} />
        </div>
      );
    }

    return (
      <div style={styles.root}>
        <Login windowid={uuid} />       
      </div>
    );
  }
}


export default App;