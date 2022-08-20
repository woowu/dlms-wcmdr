#!/usr/bin/node --harmony
'use strict';

const fs = require('fs')
const dump = require('buffer-hexdump');
const SocketIo = require('./socketio');
const PacketBuffer = require('./packet-buffer');

const MAGIC = 0xceaddeac;
const CMD_READMEM = 0x81;

const argv = require('yargs/yargs')(process.argv.slice(2))
    .usage('$0 [-h host] [-p port] <address> <length>')
    .version('0.0.1')
    .help()
    .option('host', {
        alias: 'h',
        describe: 'server ip',
        nargs: 1,
        type: 'number',
        default: '127.0.0.1',
    })
    .option('port', {
        alias: 'p',
        describe: 'port number',
        nargs: 1,
        type: 'number',
        default: 4059,
    })
    .option('inter-frame-timeout', {
        alias: 't',
        describe: 'inter-frame-timeout',
        nargs: 1,
        type: 'number',
        default: 500,
    })
    .argv;


if (argv._.length != 2) return console.error('insufficient arguments');
const addr = parseInt(argv._[0]);
const len = parseInt(argv._[1]);

if (isNaN(addr) || isNaN(len) || len <= 0)
    return console.log('bad argument');

const sio = new SocketIo({
    interFrameTimeout: argv.interFrameTimeout,
});

(async () => {
    await sio.open(argv.host, argv.port);

    const request = new PacketBuffer();
    request.writeUint16(1);
    request.writeUint32(MAGIC);
    const body = new PacketBuffer();
    body.writeByte(CMD_READMEM);
    body.writeUint32(addr);
    body.writeUint16(len);
    request.writeBuffer(body.buffer);

    sio.write(request.buffer);
    console.log(dump(request.buffer));
    const resp = await sio.read(5000);
    console.log(dump(resp));

    sio.close();
})();
