import React, { Component } from 'react';

import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

import FormLabel from '@material-ui/core/FormLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';

import Button from '@material-ui/core/Button';

import { withStyles } from '@material-ui/core/styles';
import { pink } from '@material-ui/core/colors';

const styles = {
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
    width: '45ch',
    padding: 12,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  text: {
    marginTop: 12,
    marginBottom: 12,
  },
  flabel: {
    marginTop: 12,
    marginBottom: 12,
  },
  separator: {
    height: 28,
  },
}

const ColorButton = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(pink[500]),
    backgroundColor: pink[500],
    '&:hover': {
      backgroundColor: pink[700],
    },
  },
}))(Button);

function Form(props) {
  return (
    <>
    <div style={styles.root}>
      <div style={styles.container1}>
      <FormLabel style={styles.flabel} component="legend">Main</FormLabel>
        <TextField onChange={(e) => props.onChangeValue('name', e.target.value)} value={props.data.name} variant="outlined" InputLabelProps={{ shrink: true }} style={styles.text} autoFocus id="name" label="Name" fullWidth/>
        <TextField onChange={(e) => props.onChangeValue('host', e.target.value)} value={props.data.host} variant="outlined" InputLabelProps={{ shrink: true }} style={styles.text} id="host" label="Host or P2P key" fullWidth/>
        <TextField onChange={(e) => props.onChangeValue('username', e.target.value)} value={props.data.username} variant="outlined" InputLabelProps={{ shrink: true }} style={styles.text} id="username" label="Username" fullWidth/>
        <TextField onChange={(e) => props.onChangeValue('password', e.target.value)} value={props.data.password} variant="outlined" InputLabelProps={{ shrink: true }} style={styles.text} id="password" label="Password" fullWidth/>
      </div>
      <div style={styles.container2}>
        <FormLabel style={styles.flabel} component="legend">Advanced</FormLabel>
        <FormControlLabel control={<Checkbox color="primary" onChange={(e) => props.onChangeValue('modeAdmin', e.target.checked)} checked={props.data.modeAdmin} />} label="Developer"/>
        <FormControlLabel control={<Checkbox color="primary" onChange={(e) => props.onChangeValue('modePort', e.target.checked)} checked={props.data.modePort} />} label="Port Forwarding"/>
      </div>
    </div>
    <div style={styles.container3}>
    </div>
    </>
  )
}

export default Form;