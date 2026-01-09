/**
 * ASN.1 解析工具
 * @description ASN.1 DER/BER 格式解析与可视化
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // ASN.1 标签类型
    const TAG_CLASSES = ['Universal', 'Application', 'Context-specific', 'Private'];

    const UNIVERSAL_TAGS = {
        0x00: 'EOC',
        0x01: 'BOOLEAN',
        0x02: 'INTEGER',
        0x03: 'BIT STRING',
        0x04: 'OCTET STRING',
        0x05: 'NULL',
        0x06: 'OBJECT IDENTIFIER',
        0x07: 'ObjectDescriptor',
        0x08: 'EXTERNAL',
        0x09: 'REAL',
        0x0A: 'ENUMERATED',
        0x0B: 'EMBEDDED PDV',
        0x0C: 'UTF8String',
        0x0D: 'RELATIVE-OID',
        0x0E: 'TIME',
        0x10: 'SEQUENCE',
        0x11: 'SET',
        0x12: 'NumericString',
        0x13: 'PrintableString',
        0x14: 'T61String',
        0x15: 'VideotexString',
        0x16: 'IA5String',
        0x17: 'UTCTime',
        0x18: 'GeneralizedTime',
        0x19: 'GraphicString',
        0x1A: 'VisibleString',
        0x1B: 'GeneralString',
        0x1C: 'UniversalString',
        0x1D: 'CHARACTER STRING',
        0x1E: 'BMPString',
        0x1F: 'DATE',
        0x20: 'TIME-OF-DAY',
        0x21: 'DATE-TIME',
        0x22: 'DURATION'
    };

    // 常见 OID
    const OID_MAP = {
        '1.2.840.113549.1.1.1': 'rsaEncryption',
        '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
        '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
        '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption',
        '1.2.840.113549.1.1.13': 'sha512WithRSAEncryption',
        '1.2.840.10045.2.1': 'ecPublicKey',
        '1.2.840.10045.3.1.7': 'prime256v1',
        '1.3.132.0.34': 'secp384r1',
        '1.3.132.0.35': 'secp521r1',
        '2.5.4.3': 'commonName',
        '2.5.4.6': 'countryName',
        '2.5.4.7': 'localityName',
        '2.5.4.8': 'stateOrProvinceName',
        '2.5.4.10': 'organizationName',
        '2.5.4.11': 'organizationalUnitName',
        '2.5.29.14': 'subjectKeyIdentifier',
        '2.5.29.15': 'keyUsage',
        '2.5.29.17': 'subjectAltName',
        '2.5.29.19': 'basicConstraints',
        '2.5.29.35': 'authorityKeyIdentifier',
        '2.5.29.37': 'extKeyUsage'
    };

    function hexToBytes(hex) {
        hex = hex.replace(/[\s\n\r]/g, '');
        if (hex.length % 2 !== 0) {
            throw new Error('十六进制字符串长度必须为偶数');
        }
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
            const byte = parseInt(hex.substr(i * 2, 2), 16);
            if (isNaN(byte)) {
                throw new Error(`无效的十六进制字符: ${hex.substr(i * 2, 2)}`);
            }
            bytes[i] = byte;
        }
        return bytes;
    }

    function base64ToBytes(base64) {
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

    function parseOID(bytes) {
        if (bytes.length === 0) return '';
        const oid = [];
        oid.push(Math.floor(bytes[0] / 40));
        oid.push(bytes[0] % 40);

        let value = 0;
        for (let i = 1; i < bytes.length; i++) {
            value = (value << 7) | (bytes[i] & 0x7f);
            if ((bytes[i] & 0x80) === 0) {
                oid.push(value);
                value = 0;
            }
        }
        return oid.join('.');
    }

    function parseLength(data, offset) {
        if (offset >= data.length) {
            throw new Error('数据不完整');
        }

        const firstByte = data[offset];

        if (firstByte < 0x80) {
            return { length: firstByte, bytesRead: 1 };
        }

        if (firstByte === 0x80) {
            return { length: -1, bytesRead: 1 }; // 不定长度
        }

        const numBytes = firstByte & 0x7f;
        if (offset + numBytes >= data.length) {
            throw new Error('数据不完整');
        }

        let length = 0;
        for (let i = 0; i < numBytes; i++) {
            length = (length << 8) | data[offset + 1 + i];
        }

        return { length, bytesRead: numBytes + 1 };
    }

    function parseASN1(data, offset = 0, depth = 0, maxDepth = 20) {
        const results = [];

        while (offset < data.length && depth < maxDepth) {
            const startOffset = offset;
            const tag = data[offset];
            const tagClass = (tag & 0xc0) >> 6;
            const isConstructed = (tag & 0x20) !== 0;
            const tagNumber = tag & 0x1f;

            let tagName;
            if (tagClass === 0) {
                tagName = UNIVERSAL_TAGS[tag & 0x3f] || `Universal [${tagNumber}]`;
            } else if (tagClass === 2) {
                tagName = `[${tagNumber}]`;
            } else {
                tagName = `${TAG_CLASSES[tagClass]} [${tagNumber}]`;
            }

            const lengthInfo = parseLength(data, offset + 1);
            const headerLength = 1 + lengthInfo.bytesRead;
            const contentOffset = offset + headerLength;
            const contentLength = lengthInfo.length;

            if (contentLength < 0) {
                // 不定长度，跳过处理
                offset = data.length;
                continue;
            }

            if (contentOffset + contentLength > data.length) {
                throw new Error(`数据不完整: 需要 ${contentLength} 字节，只有 ${data.length - contentOffset} 字节`);
            }

            const content = data.slice(contentOffset, contentOffset + contentLength);

            const node = {
                offset: startOffset,
                headerLength,
                length: contentLength,
                totalLength: headerLength + contentLength,
                tag,
                tagClass: TAG_CLASSES[tagClass],
                tagName,
                constructed: isConstructed,
                raw: bytesToHex(data.slice(startOffset, contentOffset + contentLength).slice(0, 32))
            };

            // 解析值
            if (tagClass === 0) {
                switch (tag & 0x3f) {
                    case 0x01: // BOOLEAN
                        node.value = content[0] !== 0;
                        break;
                    case 0x02: // INTEGER
                        if (contentLength <= 8) {
                            let value = 0n;
                            for (const byte of content) {
                                value = (value << 8n) | BigInt(byte);
                            }
                            node.value = value.toString();
                        } else {
                            node.value = bytesToHex(content.slice(0, 16)) + (contentLength > 16 ? '...' : '');
                        }
                        node.bitLength = contentLength * 8;
                        break;
                    case 0x03: // BIT STRING
                        node.unusedBits = content[0];
                        node.value = bytesToHex(content.slice(1, 17)) + (contentLength > 17 ? '...' : '');
                        if (content.length > 1 && isConstructed === false) {
                            try {
                                node.children = parseASN1(content.slice(1), 0, depth + 1, maxDepth);
                            } catch {}
                        }
                        break;
                    case 0x04: // OCTET STRING
                        node.value = bytesToHex(content.slice(0, 16)) + (contentLength > 16 ? '...' : '');
                        try {
                            node.children = parseASN1(content, 0, depth + 1, maxDepth);
                        } catch {}
                        break;
                    case 0x05: // NULL
                        node.value = null;
                        break;
                    case 0x06: // OID
                        const oid = parseOID(content);
                        node.value = oid;
                        node.oidName = OID_MAP[oid];
                        break;
                    case 0x0C: case 0x12: case 0x13: case 0x14:
                    case 0x16: case 0x1A: case 0x1B: case 0x1E:
                        try {
                            node.value = new TextDecoder().decode(content);
                        } catch {
                            node.value = bytesToHex(content);
                        }
                        break;
                    case 0x17: // UTCTime
                        const utcStr = new TextDecoder().decode(content);
                        node.value = formatUTCTime(utcStr);
                        node.raw_time = utcStr;
                        break;
                    case 0x18: // GeneralizedTime
                        const genStr = new TextDecoder().decode(content);
                        node.value = formatGeneralizedTime(genStr);
                        node.raw_time = genStr;
                        break;
                    default:
                        if (isConstructed) {
                            node.children = parseASN1(content, 0, depth + 1, maxDepth);
                        } else {
                            node.value = bytesToHex(content.slice(0, 16)) + (contentLength > 16 ? '...' : '');
                        }
                }
            } else if (isConstructed) {
                node.children = parseASN1(content, 0, depth + 1, maxDepth);
            } else {
                node.value = bytesToHex(content.slice(0, 16)) + (contentLength > 16 ? '...' : '');
            }

            results.push(node);
            offset = contentOffset + contentLength;
        }

        return results;
    }

    function formatUTCTime(str) {
        const match = str.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?Z?$/);
        if (!match) return str;
        let year = parseInt(match[1], 10);
        year = year >= 50 ? 1900 + year : 2000 + year;
        return `${year}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6] || '00'} UTC`;
    }

    function formatGeneralizedTime(str) {
        const match = str.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?/);
        if (!match) return str;
        return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6] || '00'}`;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    function renderASN1Tree(nodes, depth = 0) {
        let html = '<ul class="asn1-tree">';

        for (const node of nodes) {
            html += '<li class="asn1-node">';
            html += `<div class="asn1-header">`;
            html += `<span class="asn1-tag ${node.constructed ? 'constructed' : 'primitive'}">${escapeHtml(node.tagName)}</span>`;

            if (node.oidName) {
                html += ` <span class="asn1-oid-name">${escapeHtml(node.oidName)}</span>`;
            }

            if (node.value !== undefined && node.value !== null) {
                const valueStr = typeof node.value === 'boolean' ? (node.value ? 'TRUE' : 'FALSE') : String(node.value);
                html += ` <span class="asn1-value">${escapeHtml(valueStr)}</span>`;
            }

            html += ` <span class="asn1-meta">[${node.offset}:${node.length}]</span>`;

            if (node.bitLength) {
                html += ` <span class="asn1-bits">(${node.bitLength} bits)</span>`;
            }

            html += '</div>';

            if (node.children && node.children.length > 0) {
                html += renderASN1Tree(node.children, depth + 1);
            }

            html += '</li>';
        }

        html += '</ul>';
        return html;
    }

    function parseInput() {
        const input = document.getElementById('input')?.value || '';
        const format = document.getElementById('input-format')?.value || 'hex';
        const output = document.getElementById('output');

        if (!input.trim()) {
            if (output) output.innerHTML = '<div class="empty-state">请输入 ASN.1 数据</div>';
            return;
        }

        try {
            let data;

            if (format === 'hex') {
                data = hexToBytes(input);
            } else if (format === 'base64') {
                data = base64ToBytes(input);
            } else if (format === 'pem') {
                const match = input.match(/-----BEGIN [^-]+-----\s*([\s\S]*?)\s*-----END/);
                if (!match) {
                    throw new Error('无效的 PEM 格式');
                }
                data = base64ToBytes(match[1]);
            }

            const parsed = parseASN1(data);

            if (output) {
                output.innerHTML = `<div class="parse-info">解析了 ${data.length} 字节的数据</div>` + renderASN1Tree(parsed);
            }

            REOT.utils?.showNotification('解析成功', 'success');

        } catch (error) {
            if (output) {
                output.innerHTML = `<div class="error-state">解析错误: ${escapeHtml(error.message)}</div>`;
            }
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    // 示例数据：包含 OID、整数和字符串的 ASN.1 结构
    // SEQUENCE { SEQUENCE { OID rsaEncryption, NULL }, INTEGER, INTEGER, UTF8String }
    const SAMPLE_DATA = '3030300d06092a864886f70d01010105000201000208fedcba98765432100c1248656c6c6f20415343494920576f726c6421';

    function isAsn1ToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/protocol/asn1');
    }

    document.addEventListener('change', (e) => {
        if (!isAsn1ToolActive()) return;

        if (e.target.id === 'file-input') {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const bytes = new Uint8Array(event.target.result);
                const input = document.getElementById('input');
                const formatSelect = document.getElementById('input-format');
                if (input) {
                    input.value = bytesToHex(bytes, '');
                }
                if (formatSelect) {
                    formatSelect.value = 'hex';
                }
                parseInput();
            };
            reader.readAsArrayBuffer(file);
        }
    });

    document.addEventListener('click', async (e) => {
        if (!isAsn1ToolActive()) return;

        const target = e.target;

        if (target.id === 'parse-btn' || target.closest('#parse-btn')) {
            parseInput();
        }

        if (target.id === 'sample-btn' || target.closest('#sample-btn')) {
            const input = document.getElementById('input');
            const formatSelect = document.getElementById('input-format');
            if (input) input.value = SAMPLE_DATA;
            if (formatSelect) formatSelect.value = 'hex';
            parseInput();
        }

        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            const input = document.getElementById('input');
            const output = document.getElementById('output');
            if (input) input.value = '';
            if (output) output.innerHTML = '';
        }
    });

    window.ASN1Tool = { parseASN1, parseInput };

})();
