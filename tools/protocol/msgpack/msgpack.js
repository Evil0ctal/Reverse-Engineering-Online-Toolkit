/**
 * MessagePack 编解码工具
 * @description MessagePack 二进制序列化格式编码与解码
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 当前状态
    let currentMode = 'decode';
    let currentView = 'tree';
    let currentResult = null;
    let currentEncoded = null;

    // ========== 工具函数 ==========

    function hexToBytes(hex) {
        hex = hex.replace(/[\s\n\r]/g, '');
        if (hex.length % 2 !== 0) {
            throw new Error('十六进制字符串长度必须为偶数');
        }
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return bytes;
    }

    function base64ToBytes(base64) {
        base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        const binary = atob(base64.replace(/[\s\n\r]/g, ''));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    function bytesToHex(bytes, separator = ' ') {
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join(separator);
    }

    function bytesToBase64(bytes) {
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function isHex(str) {
        return /^[0-9a-fA-F\s\n\r]+$/.test(str);
    }

    function isBase64(str) {
        return /^[A-Za-z0-9+/=\-_\s\n\r]+$/.test(str) && !isHex(str.replace(/[\s\n\r]/g, ''));
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    // ========== MessagePack 解码器 ==========

    class MessagePackDecoder {
        constructor(buffer) {
            this.buffer = buffer;
            this.view = new DataView(buffer.buffer);
            this.offset = 0;
        }

        decode() {
            return this.readValue();
        }

        readValue() {
            if (this.offset >= this.buffer.length) {
                throw new Error('意外的数据结束');
            }

            const byte = this.buffer[this.offset++];

            // Positive fixint (0x00 - 0x7f)
            if (byte <= 0x7f) {
                return { type: 'uint', value: byte };
            }

            // Fixmap (0x80 - 0x8f)
            if (byte >= 0x80 && byte <= 0x8f) {
                return this.readMap(byte & 0x0f);
            }

            // Fixarray (0x90 - 0x9f)
            if (byte >= 0x90 && byte <= 0x9f) {
                return this.readArray(byte & 0x0f);
            }

            // Fixstr (0xa0 - 0xbf)
            if (byte >= 0xa0 && byte <= 0xbf) {
                return this.readStr(byte & 0x1f);
            }

            // Negative fixint (0xe0 - 0xff)
            if (byte >= 0xe0) {
                return { type: 'int', value: byte - 256 };
            }

            switch (byte) {
                // nil
                case 0xc0:
                    return { type: 'nil', value: null };

                // (never used)
                case 0xc1:
                    throw new Error('遇到保留字节 0xc1');

                // false
                case 0xc2:
                    return { type: 'bool', value: false };

                // true
                case 0xc3:
                    return { type: 'bool', value: true };

                // bin 8
                case 0xc4:
                    return this.readBin(this.readUint8());

                // bin 16
                case 0xc5:
                    return this.readBin(this.readUint16());

                // bin 32
                case 0xc6:
                    return this.readBin(this.readUint32());

                // ext 8
                case 0xc7:
                    return this.readExt(this.readUint8());

                // ext 16
                case 0xc8:
                    return this.readExt(this.readUint16());

                // ext 32
                case 0xc9:
                    return this.readExt(this.readUint32());

                // float 32
                case 0xca:
                    return { type: 'float32', value: this.readFloat32() };

                // float 64
                case 0xcb:
                    return { type: 'float64', value: this.readFloat64() };

                // uint 8
                case 0xcc:
                    return { type: 'uint8', value: this.readUint8() };

                // uint 16
                case 0xcd:
                    return { type: 'uint16', value: this.readUint16() };

                // uint 32
                case 0xce:
                    return { type: 'uint32', value: this.readUint32() };

                // uint 64
                case 0xcf:
                    return { type: 'uint64', value: this.readUint64() };

                // int 8
                case 0xd0:
                    return { type: 'int8', value: this.readInt8() };

                // int 16
                case 0xd1:
                    return { type: 'int16', value: this.readInt16() };

                // int 32
                case 0xd2:
                    return { type: 'int32', value: this.readInt32() };

                // int 64
                case 0xd3:
                    return { type: 'int64', value: this.readInt64() };

                // fixext 1
                case 0xd4:
                    return this.readExt(1);

                // fixext 2
                case 0xd5:
                    return this.readExt(2);

                // fixext 4
                case 0xd6:
                    return this.readExt(4);

                // fixext 8
                case 0xd7:
                    return this.readExt(8);

                // fixext 16
                case 0xd8:
                    return this.readExt(16);

                // str 8
                case 0xd9:
                    return this.readStr(this.readUint8());

                // str 16
                case 0xda:
                    return this.readStr(this.readUint16());

                // str 32
                case 0xdb:
                    return this.readStr(this.readUint32());

                // array 16
                case 0xdc:
                    return this.readArray(this.readUint16());

                // array 32
                case 0xdd:
                    return this.readArray(this.readUint32());

                // map 16
                case 0xde:
                    return this.readMap(this.readUint16());

                // map 32
                case 0xdf:
                    return this.readMap(this.readUint32());

                default:
                    throw new Error(`未知的格式字节: 0x${byte.toString(16)}`);
            }
        }

        readUint8() {
            return this.buffer[this.offset++];
        }

        readInt8() {
            const val = this.view.getInt8(this.offset);
            this.offset += 1;
            return val;
        }

        readUint16() {
            const val = this.view.getUint16(this.offset, false);
            this.offset += 2;
            return val;
        }

        readInt16() {
            const val = this.view.getInt16(this.offset, false);
            this.offset += 2;
            return val;
        }

        readUint32() {
            const val = this.view.getUint32(this.offset, false);
            this.offset += 4;
            return val;
        }

        readInt32() {
            const val = this.view.getInt32(this.offset, false);
            this.offset += 4;
            return val;
        }

        readUint64() {
            const val = this.view.getBigUint64(this.offset, false);
            this.offset += 8;
            // 如果在安全整数范围内，转换为 Number
            if (val <= Number.MAX_SAFE_INTEGER) {
                return Number(val);
            }
            return val.toString();
        }

        readInt64() {
            const val = this.view.getBigInt64(this.offset, false);
            this.offset += 8;
            if (val >= Number.MIN_SAFE_INTEGER && val <= Number.MAX_SAFE_INTEGER) {
                return Number(val);
            }
            return val.toString();
        }

        readFloat32() {
            const val = this.view.getFloat32(this.offset, false);
            this.offset += 4;
            return val;
        }

        readFloat64() {
            const val = this.view.getFloat64(this.offset, false);
            this.offset += 8;
            return val;
        }

        readStr(length) {
            const bytes = this.buffer.slice(this.offset, this.offset + length);
            this.offset += length;
            try {
                const str = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
                return { type: 'str', value: str };
            } catch (e) {
                return { type: 'str', value: bytesToHex(bytes, ''), isHex: true };
            }
        }

        readBin(length) {
            const bytes = this.buffer.slice(this.offset, this.offset + length);
            this.offset += length;
            return { type: 'bin', value: bytesToHex(bytes, ' '), length };
        }

        readArray(length) {
            const items = [];
            for (let i = 0; i < length; i++) {
                items.push(this.readValue());
            }
            return { type: 'array', value: items, length };
        }

        readMap(length) {
            const entries = [];
            for (let i = 0; i < length; i++) {
                const key = this.readValue();
                const val = this.readValue();
                entries.push({ key, value: val });
            }
            return { type: 'map', value: entries, length };
        }

        readExt(length) {
            const extType = this.readInt8();
            const data = this.buffer.slice(this.offset, this.offset + length);
            this.offset += length;
            return { type: 'ext', extType, value: bytesToHex(data, ' '), length };
        }
    }

    // ========== MessagePack 编码器 ==========

    class MessagePackEncoder {
        constructor() {
            this.buffer = [];
        }

        encode(value) {
            this.buffer = [];
            this.writeValue(value);
            return new Uint8Array(this.buffer);
        }

        writeValue(value) {
            if (value === null || value === undefined) {
                this.buffer.push(0xc0);
                return;
            }

            const type = typeof value;

            if (type === 'boolean') {
                this.buffer.push(value ? 0xc3 : 0xc2);
                return;
            }

            if (type === 'number') {
                if (Number.isInteger(value)) {
                    this.writeInt(value);
                } else {
                    this.writeFloat64(value);
                }
                return;
            }

            if (type === 'string') {
                this.writeStr(value);
                return;
            }

            if (Array.isArray(value)) {
                this.writeArray(value);
                return;
            }

            if (type === 'object') {
                this.writeMap(value);
                return;
            }

            throw new Error(`不支持的类型: ${type}`);
        }

        writeInt(value) {
            if (value >= 0) {
                if (value <= 0x7f) {
                    this.buffer.push(value);
                } else if (value <= 0xff) {
                    this.buffer.push(0xcc, value);
                } else if (value <= 0xffff) {
                    this.buffer.push(0xcd);
                    this.writeUint16(value);
                } else if (value <= 0xffffffff) {
                    this.buffer.push(0xce);
                    this.writeUint32(value);
                } else {
                    this.buffer.push(0xcf);
                    this.writeUint64(BigInt(value));
                }
            } else {
                if (value >= -32) {
                    this.buffer.push(value + 256);
                } else if (value >= -128) {
                    this.buffer.push(0xd0, value + 256);
                } else if (value >= -32768) {
                    this.buffer.push(0xd1);
                    this.writeInt16(value);
                } else if (value >= -2147483648) {
                    this.buffer.push(0xd2);
                    this.writeInt32(value);
                } else {
                    this.buffer.push(0xd3);
                    this.writeInt64(BigInt(value));
                }
            }
        }

        writeUint16(value) {
            this.buffer.push((value >> 8) & 0xff, value & 0xff);
        }

        writeInt16(value) {
            const buf = new ArrayBuffer(2);
            new DataView(buf).setInt16(0, value, false);
            this.buffer.push(...new Uint8Array(buf));
        }

        writeUint32(value) {
            this.buffer.push(
                (value >> 24) & 0xff,
                (value >> 16) & 0xff,
                (value >> 8) & 0xff,
                value & 0xff
            );
        }

        writeInt32(value) {
            const buf = new ArrayBuffer(4);
            new DataView(buf).setInt32(0, value, false);
            this.buffer.push(...new Uint8Array(buf));
        }

        writeUint64(value) {
            const buf = new ArrayBuffer(8);
            new DataView(buf).setBigUint64(0, value, false);
            this.buffer.push(...new Uint8Array(buf));
        }

        writeInt64(value) {
            const buf = new ArrayBuffer(8);
            new DataView(buf).setBigInt64(0, value, false);
            this.buffer.push(...new Uint8Array(buf));
        }

        writeFloat64(value) {
            this.buffer.push(0xcb);
            const buf = new ArrayBuffer(8);
            new DataView(buf).setFloat64(0, value, false);
            this.buffer.push(...new Uint8Array(buf));
        }

        writeStr(str) {
            const bytes = new TextEncoder().encode(str);
            const len = bytes.length;

            if (len <= 31) {
                this.buffer.push(0xa0 | len);
            } else if (len <= 0xff) {
                this.buffer.push(0xd9, len);
            } else if (len <= 0xffff) {
                this.buffer.push(0xda);
                this.writeUint16(len);
            } else {
                this.buffer.push(0xdb);
                this.writeUint32(len);
            }

            this.buffer.push(...bytes);
        }

        writeArray(arr) {
            const len = arr.length;

            if (len <= 15) {
                this.buffer.push(0x90 | len);
            } else if (len <= 0xffff) {
                this.buffer.push(0xdc);
                this.writeUint16(len);
            } else {
                this.buffer.push(0xdd);
                this.writeUint32(len);
            }

            for (const item of arr) {
                this.writeValue(item);
            }
        }

        writeMap(obj) {
            const entries = Object.entries(obj);
            const len = entries.length;

            if (len <= 15) {
                this.buffer.push(0x80 | len);
            } else if (len <= 0xffff) {
                this.buffer.push(0xde);
                this.writeUint16(len);
            } else {
                this.buffer.push(0xdf);
                this.writeUint32(len);
            }

            for (const [key, value] of entries) {
                this.writeStr(key);
                this.writeValue(value);
            }
        }
    }

    // ========== 解析和转换 ==========

    function decodeMessagePack(input, format = 'auto') {
        let bytes;

        if (format === 'auto') {
            if (isHex(input.replace(/[\s\n\r]/g, ''))) {
                bytes = hexToBytes(input);
            } else if (isBase64(input)) {
                bytes = base64ToBytes(input);
            } else {
                throw new Error('无法识别输入格式，请选择正确的格式');
            }
        } else if (format === 'hex') {
            bytes = hexToBytes(input);
        } else if (format === 'base64') {
            bytes = base64ToBytes(input);
        }

        const decoder = new MessagePackDecoder(bytes);
        return decoder.decode();
    }

    function encodeMessagePack(json) {
        const data = JSON.parse(json);
        const encoder = new MessagePackEncoder();
        return encoder.encode(data);
    }

    // ========== 转换为原始 JSON ==========

    function toPlainValue(decoded) {
        if (decoded === null || decoded === undefined) {
            return null;
        }

        switch (decoded.type) {
            case 'nil':
                return null;
            case 'bool':
            case 'str':
            case 'uint':
            case 'uint8':
            case 'uint16':
            case 'uint32':
            case 'uint64':
            case 'int':
            case 'int8':
            case 'int16':
            case 'int32':
            case 'int64':
            case 'float32':
            case 'float64':
                return decoded.value;
            case 'bin':
                return `<bin:${decoded.length}>${decoded.value}`;
            case 'ext':
                return `<ext:${decoded.extType}>${decoded.value}`;
            case 'array':
                return decoded.value.map(toPlainValue);
            case 'map':
                const obj = {};
                for (const entry of decoded.value) {
                    const key = toPlainValue(entry.key);
                    const val = toPlainValue(entry.value);
                    obj[key] = val;
                }
                return obj;
            default:
                return decoded.value;
        }
    }

    // ========== 渲染函数 ==========

    function renderTreeView(decoded, indent = 0) {
        const pad = '  '.repeat(indent);

        if (decoded === null || decoded === undefined) {
            return `<span class="tree-value null">null</span>`;
        }

        switch (decoded.type) {
            case 'nil':
                return `<span class="tree-value null">null</span><span class="tree-type">(nil)</span>`;

            case 'bool':
                return `<span class="tree-value boolean">${decoded.value}</span><span class="tree-type">(bool)</span>`;

            case 'str':
                const strVal = decoded.isHex ? decoded.value : `"${escapeHtml(decoded.value)}"`;
                return `<span class="tree-value string">${strVal}</span><span class="tree-type">(str)</span>`;

            case 'uint':
            case 'uint8':
            case 'uint16':
            case 'uint32':
            case 'uint64':
            case 'int':
            case 'int8':
            case 'int16':
            case 'int32':
            case 'int64':
                return `<span class="tree-value number">${decoded.value}</span><span class="tree-type">(${decoded.type})</span>`;

            case 'float32':
            case 'float64':
                return `<span class="tree-value number">${decoded.value}</span><span class="tree-type">(${decoded.type})</span>`;

            case 'bin':
                return `<span class="tree-value binary">&lt;${decoded.length} bytes&gt; ${decoded.value}</span><span class="tree-type">(bin)</span>`;

            case 'ext':
                return `<span class="tree-value binary">&lt;ext type ${decoded.extType}&gt; ${decoded.value}</span><span class="tree-type">(ext)</span>`;

            case 'array':
                if (decoded.value.length === 0) {
                    return `<span class="tree-value">[]</span><span class="tree-type">(array:0)</span>`;
                }
                let arrHtml = `<span class="tree-toggle">[</span><span class="tree-type">(array:${decoded.length})</span><ul>`;
                decoded.value.forEach((item, i) => {
                    arrHtml += `<li class="tree-item">`;
                    arrHtml += `<span class="tree-key">[${i}]</span><span class="tree-colon">:</span>`;
                    arrHtml += renderTreeView(item, indent + 1);
                    arrHtml += `</li>`;
                });
                arrHtml += `</ul><span class="tree-toggle">]</span>`;
                return arrHtml;

            case 'map':
                if (decoded.value.length === 0) {
                    return `<span class="tree-value">{}</span><span class="tree-type">(map:0)</span>`;
                }
                let mapHtml = `<span class="tree-toggle">{</span><span class="tree-type">(map:${decoded.length})</span><ul>`;
                decoded.value.forEach(entry => {
                    const keyStr = toPlainValue(entry.key);
                    mapHtml += `<li class="tree-item">`;
                    mapHtml += `<span class="tree-key">"${escapeHtml(keyStr)}"</span><span class="tree-colon">:</span>`;
                    mapHtml += renderTreeView(entry.value, indent + 1);
                    mapHtml += `</li>`;
                });
                mapHtml += `</ul><span class="tree-toggle">}</span>`;
                return mapHtml;

            default:
                return `<span class="tree-value">${escapeHtml(JSON.stringify(decoded))}</span>`;
        }
    }

    function renderJsonView(decoded) {
        const plain = toPlainValue(decoded);
        return `<pre class="json-output"><code>${escapeHtml(JSON.stringify(plain, null, 2))}</code></pre>`;
    }

    function renderHexView(bytes) {
        let html = '<div class="hex-output">';
        const bytesPerRow = 16;

        for (let i = 0; i < bytes.length; i += bytesPerRow) {
            const rowBytes = bytes.slice(i, i + bytesPerRow);
            const offset = i.toString(16).padStart(8, '0');

            html += `<div class="hex-row">`;
            html += `<span class="hex-offset">${offset}</span>`;
            html += `<span class="hex-bytes">`;

            for (let j = 0; j < rowBytes.length; j++) {
                const byte = rowBytes[j];
                html += `<span class="hex-byte">${byte.toString(16).padStart(2, '0')}</span>`;
            }

            // 填充
            for (let j = rowBytes.length; j < bytesPerRow; j++) {
                html += `<span class="hex-byte" style="visibility: hidden;">00</span>`;
            }

            html += `</span>`;

            // ASCII 表示
            let ascii = '';
            for (let j = 0; j < rowBytes.length; j++) {
                const byte = rowBytes[j];
                ascii += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
            }
            html += `<span class="hex-ascii">${escapeHtml(ascii)}</span>`;

            html += `</div>`;
        }

        html += '</div>';
        return html;
    }

    function renderOutput(decoded, bytes, view) {
        const output = document.getElementById('output-content');
        if (!output) return;

        let html = '';

        switch (view) {
            case 'tree':
                html = `<div class="msgpack-tree">${renderTreeView(decoded)}</div>`;
                break;
            case 'json':
                html = renderJsonView(decoded);
                break;
            case 'hex':
                html = renderHexView(bytes);
                break;
        }

        output.innerHTML = html;
    }

    // ========== 主要功能 ==========

    function performDecode() {
        const input = document.getElementById('decode-input')?.value || '';
        const format = document.getElementById('input-format')?.value || 'auto';
        const outputSection = document.getElementById('output-section');
        const outputInfo = document.getElementById('output-info');
        const outputContent = document.getElementById('output-content');

        if (!input.trim()) {
            if (outputSection) outputSection.style.display = 'none';
            return;
        }

        try {
            let bytes;
            if (format === 'auto') {
                const cleanInput = input.replace(/[\s\n\r]/g, '');
                if (isHex(cleanInput)) {
                    bytes = hexToBytes(input);
                } else {
                    bytes = base64ToBytes(input);
                }
            } else if (format === 'hex') {
                bytes = hexToBytes(input);
            } else {
                bytes = base64ToBytes(input);
            }

            const decoded = decodeMessagePack(input, format);
            currentResult = decoded;
            currentEncoded = bytes;

            // 显示信息
            const typeCount = countTypes(decoded);
            if (outputInfo) {
                outputInfo.textContent = `解码成功：${bytes.length} 字节，包含 ${typeCount.total} 个元素`;
            }

            // 显示视图选项卡
            document.getElementById('view-tabs')?.classList.remove('hidden');

            // 渲染输出
            renderOutput(decoded, bytes, currentView);

            if (outputSection) outputSection.style.display = 'block';

            REOT.utils?.showNotification('解码成功', 'success');

        } catch (error) {
            if (outputContent) {
                outputContent.innerHTML = `<div class="error-state">解码错误: ${escapeHtml(error.message)}</div>`;
            }
            if (outputInfo) outputInfo.textContent = '';
            document.getElementById('view-tabs')?.classList.add('hidden');
            if (outputSection) outputSection.style.display = 'block';
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    function performEncode() {
        const input = document.getElementById('encode-input')?.value || '';
        const compact = document.getElementById('compact-output')?.checked ?? true;
        const outputSection = document.getElementById('output-section');
        const outputInfo = document.getElementById('output-info');
        const outputContent = document.getElementById('output-content');

        if (!input.trim()) {
            if (outputSection) outputSection.style.display = 'none';
            return;
        }

        try {
            const bytes = encodeMessagePack(input);
            const decoded = new MessagePackDecoder(bytes).decode();
            currentResult = decoded;
            currentEncoded = bytes;

            // 显示信息
            if (outputInfo) {
                outputInfo.textContent = `编码成功：${bytes.length} 字节`;
            }

            // 隐藏视图选项卡（编码只显示 hex）
            document.getElementById('view-tabs')?.classList.add('hidden');

            // 渲染十六进制输出
            let hexStr = bytesToHex(bytes, compact ? '' : ' ');
            outputContent.innerHTML = `<pre class="json-output"><code>${hexStr}</code></pre>
                <div style="margin-top: 0.75rem; font-size: 0.8125rem; color: var(--text-secondary);">
                    Base64: <code style="word-break: break-all;">${bytesToBase64(bytes)}</code>
                </div>`;

            if (outputSection) outputSection.style.display = 'block';

            REOT.utils?.showNotification('编码成功', 'success');

        } catch (error) {
            if (outputContent) {
                outputContent.innerHTML = `<div class="error-state">编码错误: ${escapeHtml(error.message)}</div>`;
            }
            if (outputInfo) outputInfo.textContent = '';
            if (outputSection) outputSection.style.display = 'block';
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    function countTypes(decoded) {
        const counts = { total: 0 };

        function count(node) {
            if (!node || !node.type) return;
            counts.total++;
            counts[node.type] = (counts[node.type] || 0) + 1;

            if (node.type === 'array') {
                node.value.forEach(count);
            } else if (node.type === 'map') {
                node.value.forEach(entry => {
                    count(entry.key);
                    count(entry.value);
                });
            }
        }

        count(decoded);
        return counts;
    }

    function formatJson() {
        const input = document.getElementById('encode-input');
        if (!input) return;

        try {
            const parsed = JSON.parse(input.value);
            input.value = JSON.stringify(parsed, null, 2);
            REOT.utils?.showNotification('JSON 已格式化', 'success');
        } catch (e) {
            REOT.utils?.showNotification('JSON 格式无效', 'error');
        }
    }

    // 示例数据
    const SAMPLE_DATA = '82a46e616d65a454657374a576616c756573930102039195c403cb400921fb54442d18a3626172c40548656c6c6f';

    function loadSample() {
        const input = document.getElementById('decode-input');
        if (input) {
            input.value = SAMPLE_DATA;
            performDecode();
        }
    }

    function isMsgpackToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/protocol/msgpack');
    }

    // ========== 事件处理 ==========

    document.addEventListener('click', async (e) => {
        if (!isMsgpackToolActive()) return;

        const target = e.target;

        // 模式切换
        if (target.classList.contains('mode-tab')) {
            const mode = target.dataset.mode;
            if (mode) {
                currentMode = mode;
                document.querySelectorAll('.mode-tab').forEach(tab => tab.classList.remove('active'));
                target.classList.add('active');

                document.getElementById('decode-section')?.classList.toggle('hidden', mode !== 'decode');
                document.getElementById('encode-section')?.classList.toggle('hidden', mode !== 'encode');
                document.getElementById('output-section').style.display = 'none';
            }
        }

        // 视图切换
        if (target.classList.contains('view-tab')) {
            const view = target.dataset.view;
            if (view && currentResult) {
                document.querySelectorAll('.view-tab').forEach(tab => tab.classList.remove('active'));
                target.classList.add('active');
                currentView = view;
                renderOutput(currentResult, currentEncoded, view);
            }
        }

        // 解码
        if (target.id === 'decode-btn' || target.closest('#decode-btn')) {
            performDecode();
        }

        // 编码
        if (target.id === 'encode-btn' || target.closest('#encode-btn')) {
            performEncode();
        }

        // 加载示例
        if (target.id === 'sample-btn' || target.closest('#sample-btn')) {
            loadSample();
        }

        // 格式化 JSON
        if (target.id === 'format-json-btn' || target.closest('#format-json-btn')) {
            formatJson();
        }

        // 清除（解码）
        if (target.id === 'clear-decode-btn' || target.closest('#clear-decode-btn')) {
            const input = document.getElementById('decode-input');
            if (input) input.value = '';
            document.getElementById('output-section').style.display = 'none';
            currentResult = null;
            currentEncoded = null;
        }

        // 清除（编码）
        if (target.id === 'clear-encode-btn' || target.closest('#clear-encode-btn')) {
            const input = document.getElementById('encode-input');
            if (input) input.value = '';
            document.getElementById('output-section').style.display = 'none';
            currentResult = null;
            currentEncoded = null;
        }

        // 复制输出
        if (target.id === 'copy-output-btn' || target.closest('#copy-output-btn')) {
            let textToCopy = '';
            if (currentMode === 'encode' && currentEncoded) {
                textToCopy = bytesToHex(currentEncoded, '');
            } else if (currentResult) {
                if (currentView === 'hex' && currentEncoded) {
                    textToCopy = bytesToHex(currentEncoded, '');
                } else {
                    textToCopy = JSON.stringify(toPlainValue(currentResult), null, 2);
                }
            }
            if (textToCopy) {
                const success = await REOT.utils?.copyToClipboard(textToCopy);
                if (success) {
                    REOT.utils?.showNotification('已复制到剪贴板', 'success');
                }
            }
        }

        // 下载
        if (target.id === 'download-btn' || target.closest('#download-btn')) {
            if (currentEncoded) {
                const blob = new Blob([currentEncoded], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'data.msgpack';
                a.click();
                URL.revokeObjectURL(url);
                REOT.utils?.showNotification('文件已下载', 'success');
            }
        }
    });

    // 文件上传
    document.addEventListener('change', (e) => {
        if (!isMsgpackToolActive()) return;

        if (e.target.id === 'file-input') {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const bytes = new Uint8Array(event.target.result);
                const input = document.getElementById('decode-input');
                if (input) {
                    input.value = bytesToHex(bytes, '');
                }
                performDecode();
            };
            reader.readAsArrayBuffer(file);
        }
    });

    // 导出到全局
    window.MessagePackTool = { decodeMessagePack, encodeMessagePack, MessagePackDecoder, MessagePackEncoder };

})();
