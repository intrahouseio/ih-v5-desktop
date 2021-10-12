import React from 'react';

import Drawer from '@material-ui/core/Drawer';

import { makeStyles } from '@material-ui/core/styles';
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

const styles = {
  root: {
    width: 250,
    height: '100%',
    background: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
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
}

const useStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  extendedIcon: {
    marginRight: theme.spacing(1),
  },
}));

const list = ['Server 1', 'Server 2', 'Server 3']

export default function TemporaryDrawer(props) {
  const classes = useStyles();

  return (
      <Drawer anchor="left" open={props.open} onClose={props.onClose}>
        <div style={styles.root}>
          <div style={styles.container1}>
            <List component="nav" >
              {list.map(i =>
                <ListItem button>
                  <ListItemIcon>
                    <FilterDramaIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={i}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end">
                      <MoreVertIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              )}
            </List>
          </div>
          <div style={styles.container2}>
            <Fab color="primary"  variant="extended" onClick={props.onAdd} >
              <AddIcon className={classes.extendedIcon} />
                Добавить сервер
            </Fab>
          </div>
        </div>
      </Drawer>
  );
}