'use strict';
const net = require('net');
const PacketBuffer = require('./packet-buffer');

const DEFAULT_OPTS = {
    interFrameTimeout: 500,
};

function SocketIo(options) {
    this._inBuf = new PacketBuffer();
    this._socket = new net.Socket();
    this._opened = false;
    this._frameTimer = null;
    this._readTimer = null;
    this._readWaiter = null;
    this._closeWaiter = null;
    Object.assign(this, DEFAULT_OPTS, options);

    this._socket.on('data', data => {
        if (this._readTimer) {
            clearTimeout(this._readTimer);
            this._readTimer = null;
        }

        if (this._frameTimer) clearTimeout(this._frameTimer);
        this._frameTimer = setTimeout((function() {
            if (this._readWaiter) this._readWaiter(this._inBuf.buffer);
            this._inBuf = new PacketBuffer();
        }).bind(this), this._interFrameTimeout);

        this._inBuf.writeBuffer(data);
    });
};

Object.defineProperty(PacketBuffer.prototype, 'opened', {
    get: function () {
        return this._opened;
    }
});

SocketIo.prototype.open = async function(host, port) {
    if (this._opened) throw new Error('socket has already opened');

    return new Promise(resolve => {
        this._socket.connect({ host, port }, () => {
            this._opened = true;
            resolve();
        });
        this._socket.once('error', err => {
            throw new Error(err);
        });
        this._socket.once('end', () => {
            this._opened = false;
            this._socket = null;
            if (this._closeWaiter) this._closeWaiter();
        });

        this._readWaiter = null;
        this._closeWaiter = null;
        this._inBuf = new PacketBuffer();
    });
};

SocketIo.prototype.close = async function() {
    if (! this._opened) throw new Error('socket is not opened');

    return new Promise(resolve => {
        this._socket.destroy();
        this._opened = false;
        this._closeWaiter = resolve.bind(this);
    });
};

SocketIo.prototype.write = async function(data) {
    if (! this._opened) throw new Error('socket has not opened');

    this._socket.write(data);
    return new Promise(resovle => {
        resovle();
    });
};

SocketIo.prototype.read = async function(timeout) {
    if (! this._opened) throw new Error('socket has not opened');

    return new Promise(resolve => {
        if (this._timer) clearTimeout(this._timer);
        this._readWaiter = resolve;
        this._readTimer = setTimeout((function() {
            if (! this._inBuf.length) resolve(this._inBuf.buffer);
        }).bind(this), timeout);
    });
};

SocketIo.prototype.flush = function() {
    this._inBuf = new PacketBuffer();
};

module.exports = SocketIo;
