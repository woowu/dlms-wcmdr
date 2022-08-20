'use strict';
var assert = require('assert');

const DEFAULT_OPTS = {
    size: 1024,
    growthFactor: 8
};

function PacketBuffer(options) {
    options = Object.assign({}, options, DEFAULT_OPTS);

    this._buf = Buffer.alloc(options.size || DEFAULT_BUF_SZ);
    this._size = this._buf.length;
    this._offset = 0;
}

Object.defineProperty(PacketBuffer.prototype, 'buffer', {
    get: function () {
        return this._buf.slice(0, this._offset);
    }
});

Object.defineProperty(PacketBuffer.prototype, 'length', {
    enumerable: true,
    get: function () { return this._offset; }
});

PacketBuffer.prototype.writeByte = function(b) {
    if (typeof b !== 'number')
        throw new TypeError('argument must be a Number');

    this._ensure(1);
    this._buf[this._offset++] = b;
};

PacketBuffer.prototype.writeBuffer = function(buf) {
    this._ensure(this._offset + buf.length);
    buf.copy(this._buf, this._offset, 0, buf.length);
    this._offset += buf.length;
};

PacketBuffer.prototype.writeUint32 = function(n) {
    if (typeof n !== 'number')
        throw new TypeError('argument must be a Number');
    const a = new ArrayBuffer(4);
    const v = new DataView(a);
    v.setUint32(0, n);
    this.writeBuffer(Buffer.from(a));
};

PacketBuffer.prototype.writeInt32 = function(n) {
    if (typeof n !== 'number')
        throw new TypeError('argument must be a Number');
    const a = new ArrayBuffer(4);
    const v = new DataView(a);
    v.setInt32(0, n);
    this.writeBuffer(Buffer.from(a));
};

PacketBuffer.prototype.writeUint16 = function(n) {
    if (typeof n !== 'number')
        throw new TypeError('argument must be a Number');
    const a = new ArrayBuffer(2);
    const v = new DataView(a);
    v.setUint16(0, n);
    this.writeBuffer(Buffer.from(a));
};

PacketBuffer.prototype.writeInt16 = function(n) {
    if (typeof n !== 'number')
        throw new TypeError('argument must be a Number');
    const a = new ArrayBuffer(2);
    const v = new DataView(a);
    v.setInt16(0, n);
    this.writeBuffer(Buffer.from(a));
};

PacketBuffer.prototype.writeUint8 = function(n) {
    if (typeof n !== 'number')
        throw new TypeError('argument must be a Number');
    const a = new ArrayBuffer(1);
    const v = new DataView(a);
    v.setUint8(0, n);
    this.writeBuffer(Buffer.from(a));
};

PacketBuffer.prototype.writeInt8 = function(n) {
    if (typeof n !== 'number')
        throw new TypeError('argument must be a Number');
    const a = new ArrayBuffer(1);
    const v = new DataView(a);
    v.setInt8(0, n);
    this.writeBuffer(Buffer.from(a));
};

PacketBuffer.prototype._ensure = function (len) {
    assert.ok(len);

    if (this._size - this._offset >= len) return;
    var sz = this._size * this._options.growthFactor;
    if (sz - this._offset < len) sz += len;

    const buf = Buffer.alloc(sz);

    this._buf.copy(buf, 0, 0, this._offset);
    this._buf = buf;
    this._size = sz;
};


module.exports = PacketBuffer;
