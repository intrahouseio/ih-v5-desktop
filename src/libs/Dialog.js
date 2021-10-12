import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';

import { blue } from '@material-ui/core/colors';

import TextField from '@material-ui/core/TextField';


const useStyles = makeStyles({
  avatar: {
    backgroundColor: blue[100],
    color: blue[600],
  },
});

function SimpleDialog(props) {
  const classes = useStyles();
  const { onClose, selectedValue, open } = props;

  const handleClose = () => {
    onClose(selectedValue);
  };

  const handleListItemClick = (value) => {
    onClose(value);
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Новый сервер</DialogTitle>
      <DialogContent>
        <TextField InputLabelProps={{ shrink: true }} style={{ marginBottom: 12 }} autoFocus id="name" label="Название" fullWidth/>
        <TextField InputLabelProps={{ shrink: true }} style={{ marginBottom: 12 }} id="host" label="Сервер" fullWidth/>
        <TextField InputLabelProps={{ shrink: true }} style={{ marginBottom: 12 }} id="username" label="Пользователь" fullWidth/>
        <TextField InputLabelProps={{ shrink: true }} style={{ marginBottom: 12 }} id="password" label="Пароль" fullWidth/>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Отмена
        </Button>
        <Button onClick={handleClose} color="primary">
          Создать
        </Button>
      </DialogActions>
    </Dialog>
  );
}

SimpleDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  selectedValue: PropTypes.string.isRequired,
};

export default function SimpleDialogDemo(props) {
  return (
    <div>
      <SimpleDialog open={props.open} onClose={props.onClose} />
    </div>
  );
}