import React, { Component } from 'react';

import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

import { withStyles } from '@material-ui/core/styles';
import { pink, orange, green } from '@material-ui/core/colors';


const electron = window.require('electron');
const ipcRenderer  = electron.ipcRenderer;

const COLORS = {
  1: {
    a: green[500],
    b: green[700],
    c: 1
  },
  2: {
    a: pink[500],
    b: pink[700],
    c: 1,
  },
  3: {
    a: orange[500],
    b: orange[700],
    c: 0.3,
  }
}

const styles = {
  root: {
    width: '100%',
    padding: 24,
  },
  bar: {
    marginBottom: 18,
    display: 'flex',
    justifyContent: 'space-between',
  },
  paper: {
    width: '100%',
  },
}

const ColorButton = withStyles((theme) => ({
  root: (props) => {
    return {
      opacity: COLORS[props.color2].c,
      color: '#fafafa',
      backgroundColor: COLORS[props.color2].a,
      '&:hover': {
        backgroundColor: COLORS[props.color2].b,
      },
    }
  },
}))(Button);


class Ports extends Component {
  state = { forward: 'close', rows: [], title: '', h: 746 }

  componentDidMount() {
    this.resize();
    window.addEventListener('resize', this.resize, true);
    this.sub = ipcRenderer.on('ports', this.handleData)
    ipcRenderer.send('get_ports', this.props.windowid);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize, true);
    this.sub.removeListener('ports', this.handleData)
  }

  resize = () => {
    const w = document.documentElement.clientWidth;
    const h = document.documentElement.clientHeight;

    this.setState({ h });
  }

  handleData = (e, data) => {
    this.setState({ ...this.state, ...data });
  }

  handleConnect = () => {
    const status = this.getButtonStatus();

    if (!status) {
      if (this.state.forward === 'open') {
        this.setState({ forward: 'stop' })
        ipcRenderer.send('stop_ports', this.state.rows);
      } else {
        this.setState({ forward: 'connecting' })
        ipcRenderer.send('start_ports', this.state.rows);
      }
    }

  }

  getButtonStatus = () => {
    if (this.state.rows.length === 0) {
      return true;
    }

    if (this.state.forward === 'connecting') {
      return true;
    }

    if (this.state.forward === 'open') {
      return false;
    }

    if (this.state.forward === 'stop') {
      return true;
    }

    return false;
  }

  getTextButton = () => {
    if (this.state.forward === 'close') {
      return 'Start'
    }

    if (this.state.forward === 'connecting') {
      return 'Connecting'
    }

    if (this.state.forward === 'open') {
      return 'Stop'
    }

    if (this.state.forward === 'stop') {
      return 'Disconnecting'
    }
    

    return 'Stop'
  }

  getButtonColor = () => {
    if (this.state.forward === 'close') {
      return 1
    }

    if (this.state.forward === 'connecting') {
      return 3
    }

    if (this.state.forward === 'open') {
      return 2
    }

    if (this.state.forward === 'stop') {
      return 3
    }

    return 2
  }

  getTitle() {
    if (this.state.title) {
      return `${this.state.name} - Port Forwarding | ${this.state.title}`
    }
    return `${this.state.name} - Port Forwarding`
  }

  getStatus(row) {
    if (row.status === 'open') {
      return 'Open'
    }

    if (row.status === 'close') {
      return 'Close'
    }

    if (row.status === 'error') {
      return row.message;
    }
    return '';
  }

  render() {
    return (
      <div style={styles.root}>
        <div style={styles.bar}>
          <Typography variant="h5" gutterBottom>
            {this.getTitle()}
          </Typography>
          <ColorButton color2={this.getButtonColor()} variant="contained" color="primary" onClick={this.handleConnect}>
            {this.getTextButton()}
          </ColorButton>
        </div>
          <TableContainer style={{ overflow: 'auto', height: this.state.h - 48 - 41 - 12 }} component={Paper}>
            <Table >
              <TableHead>
                <TableRow>
                  <TableCell style={{ minWidth: 160, width: 160 }} >Name</TableCell>
                  <TableCell style={{ minWidth: 160, width: 160 }} align="right">Local port</TableCell>
                  <TableCell style={{ minWidth: 160, width: 160 }} align="right">Destination host</TableCell>
                  <TableCell style={{ minWidth: 160, width: 160 }} align="right">Destination port</TableCell>
                  <TableCell style={{ minWidth: 160, width: 160 }} align="right">Connections</TableCell>
                  <TableCell style={{ minWidth: '100%', width: '100%' }} align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {this.state.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell component="th" scope="row">
                      {row.name}
                    </TableCell>
                    <TableCell align="right">{row.lport}</TableCell>
                    <TableCell align="right">{row.rhost}</TableCell>
                    <TableCell align="right">{row.rport}</TableCell>
                    <TableCell align="right">{row.count}</TableCell>
                    <TableCell align="right">{this.getStatus(row)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
      </div>
    );
  }
}


export default Ports;