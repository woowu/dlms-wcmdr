#!/usr/bin/node --harmony
'use strict';

const fs = require('fs')
const dump = require('buffer-hexdump');
const MemoryMap = require('nrf-intel-hex');
const SocketIo = require('./socketio');
const PacketBuffer = require('./packet-buffer');

const MAGIC = 0xceaddeac;
const CMD_READMEM = 0x81;
const DEFAULT_RESPONSE_TIMEOUT = 2.5; /* secs */

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
        alias: 'T',
        describe: 'inter-frame-timeout',
        nargs: 1,
        type: 'number',
        default: 500,
    })
    .option('response-timeout', {
        alias: 't',
        describe: 'response',
        nargs: 1,
        type: 'number',
        default: DEFAULT_RESPONSE_TIMEOUT,
    })
    .option('hex-file', {
        alias: 'f',
        describe: 'save memory content to an intel-hex',
        nargs: 1,
        type: 'string',
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

function bufferToIntelHex(startAddr, buff, filename) {
    const blocks = new MemoryMap();
    blocks.set(startAddr, new Uint8Array(buff.buffer));
    const hex = blocks.asHexString();
    if (filename)
        fs.writeFile(filename, hex, () => {
            console.log(`saved to ${filename}`);
        });
    else
        console.log(hex);
}

(async () => {
    try {
        await sio.open(argv.host, argv.port);

        const request = new PacketBuffer();
        request.writeUint16(1);
        request.writeUint32(MAGIC);
        const body = new PacketBuffer();
        body.writeByte(CMD_READMEM);
        body.writeUint32(addr);
        body.writeUint32(len);
        request.writeUint16(body.length);
        request.writeBuffer(body.buffer);

        sio.write(request.buffer);
        console.log('send:\n' + dump(request.buffer));

        const resp = new PacketBuffer();
        var recv;
        while(true) {
            recv = await sio.read(argv.responseTimeout * 1000);
            if (! recv) break;
            console.log('recv:\n' + dump(recv));
            resp.writeBuffer(recv);
        }
        console.log(`receved ${resp.length} bytes`);
        if (resp.length != len) throw new Error('insufficient data');
        bufferToIntelHex(addr, resp.buffer, argv.hexFile);

        sio.close();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
