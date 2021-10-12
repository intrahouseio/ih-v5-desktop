import React, { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';

import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';

import FilterDramaIcon from '@material-ui/icons/FilterDrama';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import StarsIcon from '@material-ui/icons/Stars';

import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';

import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import shortid from '@rh389/shortid';


import Form from './Form';
import Table from './Table';

const electron = window.require('electron');
const ipcRenderer  = electron.ipcRenderer;


const styles = {
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
  },
  left: {
    width: 320,
    height: '100%',
    background: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  right: {
    width: '100%',
    height: '100%',
    overflow: 'auto',
  },
  right2: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    fontSize: 16,
    width: '100%',
    height: '100%',
    padding: '12%',
  },
  container1: {
    height: '100%',
  },
  container2: {
    flexShrink: 0,
    height: 70,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  appbar: {
    position: 'absolute',
  },
  separator: {
    height: 48,
  },
  button: {
    position: 'absolute',
    top: 6,
    right: 12,
    zIndex: 10000,
    color: '#fafafa',
    border: '1px solid rgba(255,255,255, 0.75)'
  }
}


const classes = theme => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  extendedIcon: {
    marginRight: theme.spacing(1),
  },
  typography: {
    padding: theme.spacing(2),
  },
});


const serverParams = {
  name: 'Server 1', 
  host: '192.168.0.245',
  username: 'admin',
  password: '',
  ports: [],
  modeAdmin: false,
  modePort: false,
  modeFullScreen: false,
}

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

class Servers extends Component {

  componentDidMount() {
    this.sub = ipcRenderer.on('set_servers_settings', this.handleData)
    ipcRenderer.send('get_servers_settings');
  }

  componentWillUnmount() {
    this.sub.removeListener('set_servers_settings', this.handleData)
  }

  state = { 
    isDefault: false,
    open: false,
    anchorEl: null,
    enabled: false,
    tab: 0, 
    list: [], 
    select: null,
    ports: [] 
  }

  handleData = (e, list) => {
      this.setState({ enabled: true, list })
  }

  handleSave = () => {
    if (this.state.select) {
      const list = this.state.list.map(i => {
        if (i.id === this.state.select) {
          return { ...i, ...this.state.server, ports: this.state.ports, default: i.default }
        } 
        return i;
      });
      this.setState({ list });
      ipcRenderer.send('save_servers_settings', list);
    }
  }

  changeTab = (e, v) => {
    this.setState({ tab: v });
  }

  chnageValue = (key, value) => {
    this.setState({ server: { ...this.state.server, [key]: value, ports: [] } });
  }

  handleAdd = () => {
    const id = shortid.generate();
    const server = { ...serverParams, id, default: this.state.list.length === 0  };
    this.setState({ 
      list: this.state.list.concat(server), 
      select: id, 
      server,
      ports: server.ports,
    });
  }

  handleSelect = (id) => {
    const server = this.state.list.find(i => i.id === id);

    if (server) {
      this.setState({ 
        select: id, 
        server,
        ports: server.ports
      });
    }
  }

  deleteServer = (id) => {
    const list = this.state.list.filter(i => i.id !== id)
    this.setState({ 
      list: list, 
      select: null, 
      server: {},
      ports: [],
    });
    ipcRenderer.send('save_servers_settings', list);
  }

  handleAddPort = () => {
    const ports = this.state.ports.concat({ 
      id: shortid.generate(), 
      name: 'My Local Port 9999',
      lport: '9999',
      rhost: '192.168.0.245',
      rport: '80',
      comment: '',
    });
    this.setState({ ports });
  }

  handleDeletePort = (ports) => {
    this.setState({ ports });
  }

  handleChangeValuePort = (id, key, value) => {
    const ports = this.state.ports.map(i => {
      if (i.id === id) {
        return { ...i, [key]: value }
      }
      return i;
    });
    this.setState({ ports });
  }

  handleClickMenu = (e, i) => {
    this.setState({
      isDefault: i.default,
      id: i.id,
      open: true,
      anchorEl: e.currentTarget
    });
  }

  handleClose = () => {
    this.setState({
      id: null,
      open: false,
      anchorEl: null,
    });
  }

  handleDelete = () => {
    const id = this.state.id; 
    this.setState({
      id: null,
      open: false,
      anchorEl: null,
    });

    if (id) {
      this.deleteServer(id);
    }
  }

  handleDefault = () => {
    const list = this.state.list.map(i => {
      if (i.id === this.state.id) {
        return { ...i, default: !this.state.isDefault }
      }
      return { ...i, default: false };
    });
    
    this.setState({
      id: null,
      open: false,
      anchorEl: null,
      isDefault: !this.state.isDefault,
      list: list,
    });
    ipcRenderer.send('save_servers_settings', list);
  }
   
  render() {
    return (
      <div style={styles.root}>
        <Menu
          anchorEl={this.state.anchorEl}
          keepMounted
          open={this.state.open}
          onClose={this.handleClose}
        >
          <MenuItem onClick={this.handleDefault}>{this.state.isDefault ? 'Reset Launch' : 'Launch at start'}</MenuItem>
          <MenuItem onClick={this.handleDelete}>Delete</MenuItem>
        </Menu>
        <div style={styles.left}>
          <div style={styles.container1}>
            <List component="nav" >
              {this.state.list.map(i =>
                <ListItem key={i.id} button selected={i.id === this.state.select} onClick={() => this.handleSelect(i.id)} >
                  <ListItemIcon>
                    <FilterDramaIcon />
                  </ListItemIcon>
                  <ListItemText primary={i.name} />
                  <ListItemSecondaryAction>
                    {i.default ? <IconButton disabled edge="end">
                      <StarsIcon />
                    </IconButton> : null}
                    <IconButton edge="end" onClick={(e) => this.handleClickMenu(e, i)}>
                      <MoreVertIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              )}
            </List>
          </div>
          <div style={styles.container2}>
            <Fab color="primary"  variant="extended" onClick={this.handleAdd} >
              <AddIcon className={this.props.classes.extendedIcon} />
                Add Server
            </Fab>
          </div>
        </div>
        {this.state.select === null ? <div style={styles.right2}>Click the "Add Server" button to create a connection or select from the list to change the settings</div> : <div style={styles.right}>
          <Button  variant="outlined" style={styles.button} onClick={this.handleSave} >Save</Button>
          <AppBar style={styles.appbar} position="static">
            <Tabs TabIndicatorProps={{ style: { backgroundColor: "#fafafa" } }} value={this.state.tab} onChange={this.changeTab} >
              <Tab label="Server Settings"  />
              <Tab label="Port Forwarding" />
            </Tabs>
          </AppBar>
          <TabPanel value={this.state.tab} index={0}>
            <div style={styles.separator} />
            <Form key={this.state.select} data={this.state.server} onDelete={this.deleteServer} onChangeValue={this.chnageValue} />
          </TabPanel>
          <TabPanel value={this.state.tab} index={1}>
            <div style={styles.separator} />
              <Table 
                key={this.state.select} 
                data={this.state.ports}
                onAdd={this.handleAddPort}
                onDelete={this.handleDeletePort}
                onChangeValue={this.handleChangeValuePort}
              />
          </TabPanel>
        </div>}
      </div>
    );
  }
}


export default withStyles(classes)(Servers);
