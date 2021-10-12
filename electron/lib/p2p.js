const Peer = require('simple-peer')
const wrtc = require('wrtc')
const net = require('net');
const shortid = require('@rh389/shortid');

const { debug, error, session, tunnel, transferData, encodeData } = require('./tools2');

const CLOSE = new Uint8Array([0, 255])

const REQ_START = 1
const REQ_START_P = 2
const REQ_MID = 3
const REQ_END = 4

const store = { buffer: {}, sessions: {}, opts: {}};

const config = { 
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'] },
    {
      urls: 'turn:turn.ih-systems.com:47000',
      username: 'ihv5',
      credential: '136d2723b0ac',
    },
  ]
}

class P2P {

  addPortTCP(id, lport, rhost, rport) {
    if (this.tcp === undefined) {
      this.tcp = {};
    }

    if (this.tcp[lport] === undefined) {
      const server = net.createServer((c) => {
        const uuid = shortid.generate();
        this.tcp[lport].clients[uuid] = { client: c, uuid, status: false, buffer: [] };
        this.info({ type: 'connection', status: 'open', id })
        debug(`Новое соедение: ${uuid} (${lport} --> ${rhost}:${rport})`)

        c.on('error', (e) => {});

        c.on('end', (code) => {
          this.info({ type: 'connection', status: 'close', id })
          debug(`Закрытие соедения: ${uuid} (${lport} --> ${rhost}:${rport})`)
          this.send({ type: 'transport', method: 'tcp_close', uuid, lport });
          if (this.tcp[lport] && this.tcp[lport].clients && this.tcp[lport].clients[uuid]) {
            c.destroy();
            delete this.tcp[lport].clients[uuid];
          }
        });

        c.on('data', (data) => {
          if (this.tcp[lport].clients[uuid].status) {
            this.send({ type: 'transport', method: 'tcp_data', uuid, lport }, data);
          } else {
            this.tcp[lport].clients[uuid].buffer.push(data);
          }
        });

        this.send({ type: 'transport', method: 'tcp_open', uuid, lport, rhost, rport, username: this.username, password: this.password });
      });
      server.on('error', (e) => {
        this.info({ type: 'port', status: 'error', id, message: e.message })
        debug(`Ошибка TCP, порт: ${lport} --> ${rhost}:${rport}`)
      });
      server.listen(lport, () => {
        this.info({ type: 'port', status: 'open', id })
        debug(`Добавлен TCP, порт: ${lport} --> ${rhost}:${rport}`)
      });

      this.tcp[lport] = { server, clients: {}, id, lport, rhost, rport }
    } else {
      this.info({ type: 'port', status: 'error', id, message: 'Порт занят!' })
      error(`TCP порт ${lport} уже занят!`)
    }
  }

  res_auth2(socket, sessionid, params, payload) {
    if (params.status) {
      this.info({ type: 'net', status: 'open' })
    } else {
      this.info({ type: 'net', status: 'error', message: params.message })
      this.close();
    }
  }

  res_tcp_open(socket, sessionid, params, payload) {
    if (this.tcp[params.lport].clients[params.uuid].status == false) {
      this.tcp[params.lport].clients[params.uuid].status = true;
      this.tcp[params.lport].clients[params.uuid].buffer.forEach(i => {
        this.send({ type: 'transport', method: 'tcp_data', uuid: params.uuid, lport: params.lport }, i);
      });
      this.tcp[params.lport].clients[params.uuid].buffer = [];
    }
  }

  res_tcp_data(socket, sessionid, params, payload) {
    if (this.tcp[params.lport] && this.tcp[params.lport].clients && this.tcp[params.lport].clients[params.uuid] && this.tcp[params.lport].clients[params.uuid].status) {
      this.tcp[params.lport].clients[params.uuid].client.write(payload)
    }
  }

  res_tcp_close(socket, sessionid, params, payload) {
    if (this.tcp[params.lport] && this.tcp[params.lport].clients && this.tcp[params.lport].clients[params.uuid] ) {
      this.tcp[params.lport].clients[params.uuid].client.destroy();
      delete this.tcp[params.lport].clients[params.uuid];
    }
  }

  proxyData(opts, socket, sessionid, params, payload) {
    switch(params.method) {
      case 'res_auth2':
        this.res_auth2(socket, sessionid, params);
        break;
      case 'res_tcp_open':
        this.res_tcp_open(socket, sessionid, params);
        break;
      case 'res_tcp_data':
        this.res_tcp_data(socket, sessionid, params, payload);
        break;
      case 'res_tcp_close':
        this.res_tcp_close(socket, sessionid, params);
        break;
      default:
        break;
    }
  }

  connect(key, username, password) {
    this.key = key.split(' ').join('');
    session(this.key)
      .then(text => {
        const res = JSON.parse(text);
        if (res.status) {
          this.username = username;
          this.password = password;
          this.sessionid = res.sessionid;
          this.methodA(res.sessionid);
          this.methodB(res.sessionid);   
        } else {
          this.info({ type: 'net', status: 'error', message: res.mes })
          error()
        }
      })
      .catch((e) => {
        this.info({ type: 'net', status: 'error', message: 'Проверьте подключение к сети!' })
        error('Проверьте подключение к сети!')
      })
  }

  open() {
    debug(`p2p start: method ${this.socketType} - ${this.sessionid}`)
    this.send({ type: 'access', method: 'auth2', username: this.username, password: this.password });
  }

  close(flag = true) {
    if (this.socket && this.socket.readable) {
      this.socket.destroy();
    }
    Object
      .keys(this.tcp || {})
      .forEach(k => {
        const lport = k;
        const rhost = this.tcp[k].rhost;
        const rport = this.tcp[k].rport;
        if (this.tcp[k].clients) {
          Object
            .keys(this.tcp[k].clients)
            .forEach(k2 => {
              const uuid = this.tcp[k].clients[k2].uuid;
              this.info({ type: 'connection', status: 'close', id: this.tcp[k].id })
              debug(`Закрытие соедения: ${uuid} (${lport} --> ${rhost}:${rport})`)
              this.tcp[k].clients[k2].client.destroy();
              delete this.tcp[k].clients[k2].client;
            });
            this.info({ type: 'port', status: 'close', id: this.tcp[k].id })
            debug(`Удален TCP, порт: ${lport} --> ${rhost}:${rport}`)
            this.tcp[k].server.close();
            delete this.tcp[k];
        }
      })

    this.info({ type: 'net', status: 'close' })
    debug(`p2p close: method ${this.socketType} - ${this.sessionid}`)
  }

  send(params, payload) {
    const size = 10000;
    const data = encodeData(size, this.sessionid, params, payload);
  
    data.forEach(i => {
      if (this.socket && this.socket.readable) {
        this.socket.write(i);
      }
    })
  }

  message(data) {
    if (data[0] === 0 && data[1] === 255) {
      socket.destroy();
    } else {
      const session = trimBuffer(data.slice(1, 15)).toString('utf8');
      const uuid = trimBuffer(data.slice(15, 29)).toString('utf8');
      if (data[0] === REQ_START) {
        const params = JSON.parse(data.slice(29).toString('utf8'));
        this.proxyData(store.opts, this.socket, session, params);
      } else if (data[0] === REQ_START_P) {
        const params = JSON.parse(data.slice(29).toString('utf8'));
        store.buffer[session + uuid] = { session, uuid, params, payload: [], lastActivity: Date.now() }
      } else if (data[0] === REQ_MID) {
        if (store.buffer[session + uuid].params.method === 'xhr' && store.buffer[session + uuid].params.req.method === 'POST') {
          if (store.buffer[session + uuid].params.loaded == undefined) {
            store.buffer[session + uuid].params.loaded = 0;
          }
          store.buffer[session + uuid].params.loaded = store.buffer[session + uuid].params.loaded + (data.length - 29);
          progress(this.socket, session, store.buffer[session + uuid].params)
        }
        store.buffer[session + uuid].lastActivity = Date.now();
        store.buffer[session + uuid].payload.push(data.slice(29));
      } else if (data[0] === REQ_END) {
        if (store.buffer[session + uuid]) {
          this.proxyData(store.opts, this.socket, session, store.buffer[session + uuid].params, Buffer.concat(store.buffer[session + uuid].payload));
          delete store.buffer[session + uuid];
        }
      }
    }
  }

  methodA(sessionid) {
    const type = 'clientA'; 
    const clientA = new Peer({ config, initiator: true, wrtc })
  
  
    clientA.on('signal', data => {
      transferData(sessionid, type, data);
    })
  
    clientA.on('connect', () => {
      if (this.socketType === undefined) {
        this.socket = clientA;
        this.socketType = type;
        this.socketMaxSize = 10000;

        this.open();
      } else {
        if (clientA.readable) {
          clientA.send(CLOSE);
        }
        clientA.destroy();
      }
    })
  
    clientA.on('data', data => {
      if (this.socketType === type) {
        this.message(data);
      }
    })
  
    clientA.on('error', e => {
      console.log(e)
    })
  
    clientA.on('close', e => {
      if (this.socketType === type) {
        this.close();
      }
      clientA.destroy();
    })

    tunnel(sessionid, type, (data) => {
      if (clientA.readable) {
        clientA.signal(data)
      }
    });
  }

  methodB(sessionid) {
    const type = 'clientB'; 
    const clientB = new Peer({ config, wrtc })
  
  
    clientB.on('signal', data => {
      transferData(sessionid, type, data);
    })
  
    clientB.on('connect', () => {
      if (this.socketType === undefined) {
        this.socket = clientB;
        this.socketType = type;
        this.socketMaxSize = 10000;

        this.open();
      } else {
        if (clientB.readable) {
          clientB.send(CLOSE);
        }
        clientB.destroy();
      }
    })
  
    clientB.on('data', data => {
      if (this.socketType === type) {
        this.message(data);
      }
    })
  
    clientB.on('error', e => {
      console.log(e)
    })
  
    clientB.on('close', e => {
      if (this.socketType === type) {
        this.close();
      }
      clientB.destroy();
    })

    tunnel(sessionid, type, (data) => {
      if (clientB.readable) {
        clientB.signal(data)
      }
    });
  }
}

function trimBuffer(data) {
  const index = data.indexOf(0x00);

  if (index !== -1) {
    return data.slice(0, index);
  }

  return data;
}


module.exports = P2P;
