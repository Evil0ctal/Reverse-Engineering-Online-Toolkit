/**
 * PEM 格式解析工具
 * @description 解析 PEM 格式的证书、密钥等数据
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // PEM 类型映射
    const PEM_TYPES = {
        'CERTIFICATE': { name: '证书', icon: '📜' },
        'X509 CERTIFICATE': { name: 'X.509 证书', icon: '📜' },
        'TRUSTED CERTIFICATE': { name: '受信任证书', icon: '✅' },
        'PRIVATE KEY': { name: '私钥 (PKCS#8)', icon: '🔑' },
        'ENCRYPTED PRIVATE KEY': { name: '加密私钥', icon: '🔐' },
        'RSA PRIVATE KEY': { name: 'RSA 私钥', icon: '🔑' },
        'RSA PUBLIC KEY': { name: 'RSA 公钥', icon: '🔓' },
        'EC PRIVATE KEY': { name: 'EC 私钥', icon: '🔑' },
        'PUBLIC KEY': { name: '公钥', icon: '🔓' },
        'CERTIFICATE REQUEST': { name: '证书请求 (CSR)', icon: '📝' },
        'NEW CERTIFICATE REQUEST': { name: '新证书请求', icon: '📝' },
        'X509 CRL': { name: '证书吊销列表', icon: '🚫' },
        'PKCS7': { name: 'PKCS#7 数据', icon: '📦' },
        'CMS': { name: 'CMS 数据', icon: '📦' },
        'SSH2 PUBLIC KEY': { name: 'SSH2 公钥', icon: '🔓' },
        'OPENSSH PRIVATE KEY': { name: 'OpenSSH 私钥', icon: '🔑' },
        'PGP PUBLIC KEY BLOCK': { name: 'PGP 公钥', icon: '🔓' },
        'PGP PRIVATE KEY BLOCK': { name: 'PGP 私钥', icon: '🔑' },
        'PGP MESSAGE': { name: 'PGP 消息', icon: '✉️' },
        'PGP SIGNATURE': { name: 'PGP 签名', icon: '✍️' }
    };

    // ASN.1 标签类型
    const ASN1_TAGS = {
        0x01: 'BOOLEAN',
        0x02: 'INTEGER',
        0x03: 'BIT STRING',
        0x04: 'OCTET STRING',
        0x05: 'NULL',
        0x06: 'OBJECT IDENTIFIER',
        0x0C: 'UTF8String',
        0x12: 'NumericString',
        0x13: 'PrintableString',
        0x14: 'T61String',
        0x16: 'IA5String',
        0x17: 'UTCTime',
        0x18: 'GeneralizedTime',
        0x1E: 'BMPString',
        0x30: 'SEQUENCE',
        0x31: 'SET'
    };

    // 常见 OID 映射
    const OID_MAP = {
        '2.5.4.3': 'commonName (CN)',
        '2.5.4.6': 'countryName (C)',
        '2.5.4.7': 'localityName (L)',
        '2.5.4.8': 'stateOrProvinceName (ST)',
        '2.5.4.10': 'organizationName (O)',
        '2.5.4.11': 'organizationalUnitName (OU)',
        '2.5.4.5': 'serialNumber',
        '2.5.4.9': 'streetAddress',
        '2.5.4.17': 'postalCode',
        '1.2.840.113549.1.1.1': 'rsaEncryption',
        '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
        '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
        '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption',
        '1.2.840.113549.1.1.13': 'sha512WithRSAEncryption',
        '1.2.840.10045.2.1': 'ecPublicKey',
        '1.2.840.10045.3.1.7': 'prime256v1 (P-256)',
        '1.3.132.0.34': 'secp384r1 (P-384)',
        '1.3.132.0.35': 'secp521r1 (P-521)',
        '1.2.840.10045.4.3.2': 'ecdsa-with-SHA256',
        '1.2.840.10045.4.3.3': 'ecdsa-with-SHA384',
        '1.2.840.10045.4.3.4': 'ecdsa-with-SHA512',
        '2.5.29.14': 'subjectKeyIdentifier',
        '2.5.29.15': 'keyUsage',
        '2.5.29.17': 'subjectAltName',
        '2.5.29.19': 'basicConstraints',
        '2.5.29.31': 'cRLDistributionPoints',
        '2.5.29.32': 'certificatePolicies',
        '2.5.29.35': 'authorityKeyIdentifier',
        '2.5.29.37': 'extKeyUsage',
        '1.3.6.1.5.5.7.1.1': 'authorityInfoAccess',
        '1.3.6.1.5.5.7.3.1': 'serverAuth',
        '1.3.6.1.5.5.7.3.2': 'clientAuth',
        '1.3.6.1.5.5.7.3.3': 'codeSigning',
        '1.3.6.1.5.5.7.3.4': 'emailProtection'
    };

    /**
     * Base64 解码
     */
    function base64Decode(str) {
        const binary = atob(str.replace(/\s/g, ''));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * 解析 PEM 块
     */
    function parsePEMBlocks(pemText) {
        const blocks = [];
        const regex = /-----BEGIN ([^-]+)-----\s*([\s\S]*?)\s*-----END \1-----/g;
        let match;

        while ((match = regex.exec(pemText)) !== null) {
            const type = match[1].trim();
            const base64Data = match[2].replace(/\s/g, '');

            try {
                const derData = base64Decode(base64Data);
                blocks.push({
                    type,
                    typeName: PEM_TYPES[type]?.name || type,
                    icon: PEM_TYPES[type]?.icon || '📄',
                    base64: base64Data,
                    der: derData,
                    size: derData.length
                });
            } catch (e) {
                blocks.push({
                    type,
                    typeName: PEM_TYPES[type]?.name || type,
                    icon: PEM_TYPES[type]?.icon || '📄',
                    base64: base64Data,
                    error: 'Base64 解码失败: ' + e.message
                });
            }
        }

        return blocks;
    }

    /**
     * 解析 ASN.1 长度
     */
    function parseASN1Length(data, offset) {
        if (offset >= data.length) {
            throw new Error('数据不完整');
        }

        const firstByte = data[offset];

        if (firstByte < 0x80) {
            return { length: firstByte, bytesRead: 1 };
        }

        const numBytes = firstByte & 0x7f;

        if (numBytes === 0) {
            return { length: -1, bytesRead: 1 }; // 不定长度
        }

        if (offset + numBytes >= data.length) {
            throw new Error('数据不完整');
        }

        let length = 0;
        for (let i = 0; i < numBytes; i++) {
            length = (length << 8) | data[offset + 1 + i];
        }

        return { length, bytesRead: numBytes + 1 };
    }

    /**
     * 解析 OID
     */
    function parseOID(data) {
        if (data.length === 0) return '';

        const oid = [];
        oid.push(Math.floor(data[0] / 40));
        oid.push(data[0] % 40);

        let value = 0;
        for (let i = 1; i < data.length; i++) {
            value = (value << 7) | (data[i] & 0x7f);
            if ((data[i] & 0x80) === 0) {
                oid.push(value);
                value = 0;
            }
        }

        return oid.join('.');
    }

    /**
     * 格式化十六进制
     */
    function formatHex(data, maxLength = 32) {
        const hex = Array.from(data.slice(0, maxLength))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ');
        return data.length > maxLength ? hex + '...' : hex;
    }

    /**
     * 解析 ASN.1 结构
     */
    function parseASN1(data, offset = 0, depth = 0, maxDepth = 10) {
        const result = [];

        while (offset < data.length && depth < maxDepth) {
            if (offset >= data.length) break;

            const tag = data[offset];
            const tagClass = (tag & 0xc0) >> 6;
            const isConstructed = (tag & 0x20) !== 0;
            const tagNumber = tag & 0x1f;

            const lengthInfo = parseASN1Length(data, offset + 1);
            const contentOffset = offset + 1 + lengthInfo.bytesRead;
            const contentLength = lengthInfo.length;

            if (contentLength < 0 || contentOffset + contentLength > data.length) {
                break;
            }

            const content = data.slice(contentOffset, contentOffset + contentLength);

            const item = {
                tag,
                tagName: ASN1_TAGS[tag] || `TAG 0x${tag.toString(16).padStart(2, '0')}`,
                offset,
                length: contentLength,
                constructed: isConstructed
            };

            // 解析内容
            if (tag === 0x06) { // OID
                const oidStr = parseOID(content);
                item.value = oidStr;
                item.oidName = OID_MAP[oidStr] || null;
            } else if (tag === 0x02) { // INTEGER
                if (contentLength <= 8) {
                    let value = 0n;
                    for (let i = 0; i < content.length; i++) {
                        value = (value << 8n) | BigInt(content[i]);
                    }
                    item.value = value.toString();
                } else {
                    item.value = formatHex(content, 16);
                }
            } else if (tag === 0x03) { // BIT STRING
                item.unusedBits = content[0];
                item.value = formatHex(content.slice(1), 16);
            } else if (tag === 0x04) { // OCTET STRING
                item.value = formatHex(content, 16);
            } else if (tag === 0x05) { // NULL
                item.value = 'NULL';
            } else if (tag === 0x01) { // BOOLEAN
                item.value = content[0] !== 0 ? 'TRUE' : 'FALSE';
            } else if ([0x0C, 0x12, 0x13, 0x14, 0x16, 0x1E].includes(tag)) { // String types
                try {
                    item.value = new TextDecoder().decode(content);
                } catch {
                    item.value = formatHex(content, 32);
                }
            } else if (tag === 0x17) { // UTCTime
                const timeStr = new TextDecoder().decode(content);
                item.value = formatUTCTime(timeStr);
            } else if (tag === 0x18) { // GeneralizedTime
                const timeStr = new TextDecoder().decode(content);
                item.value = formatGeneralizedTime(timeStr);
            } else if (isConstructed) {
                item.children = parseASN1(content, 0, depth + 1, maxDepth);
            } else {
                item.value = formatHex(content, 16);
            }

            result.push(item);
            offset = contentOffset + contentLength;
        }

        return result;
    }

    /**
     * 格式化 UTCTime
     */
    function formatUTCTime(str) {
        const match = str.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?Z?$/);
        if (!match) return str;

        let year = parseInt(match[1], 10);
        year = year >= 50 ? 1900 + year : 2000 + year;

        return `${year}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6] || '00'} UTC`;
    }

    /**
     * 格式化 GeneralizedTime
     */
    function formatGeneralizedTime(str) {
        const match = str.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?/);
        if (!match) return str;

        return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6] || '00'}`;
    }

    /**
     * 渲染 ASN.1 树
     */
    function renderASN1Tree(items, depth = 0) {
        let html = '<ul class="asn1-tree">';

        for (const item of items) {
            const indent = '  '.repeat(depth);
            html += '<li class="asn1-node">';
            html += `<span class="asn1-tag">${item.tagName}</span>`;

            if (item.oidName) {
                html += ` <span class="asn1-oid-name">(${item.oidName})</span>`;
            }

            if (item.value !== undefined) {
                html += ` <span class="asn1-value">${escapeHtml(String(item.value))}</span>`;
            }

            html += ` <span class="asn1-meta">[offset: ${item.offset}, len: ${item.length}]</span>`;

            if (item.children && item.children.length > 0) {
                html += renderASN1Tree(item.children, depth + 1);
            }

            html += '</li>';
        }

        html += '</ul>';
        return html;
    }

    /**
     * HTML 转义
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * 解析并显示结果
     */
    function parsePEM() {
        const input = document.getElementById('input')?.value || '';
        const output = document.getElementById('output');

        if (!input.trim()) {
            if (output) output.innerHTML = '<div class="empty-state">请输入 PEM 格式数据</div>';
            return;
        }

        const blocks = parsePEMBlocks(input);

        if (blocks.length === 0) {
            if (output) output.innerHTML = '<div class="error-state">未找到有效的 PEM 块</div>';
            return;
        }

        let html = '';

        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];

            html += '<div class="pem-block">';
            html += `<div class="pem-header">`;
            html += `<span class="pem-icon">${block.icon}</span>`;
            html += `<span class="pem-type">${block.typeName}</span>`;
            html += `<span class="pem-label">${block.type}</span>`;
            html += '</div>';

            html += '<div class="pem-info">';
            html += `<div class="info-row"><span class="info-label">大小:</span> ${block.size || 0} 字节</div>`;

            if (block.error) {
                html += `<div class="info-row error">${block.error}</div>`;
            } else if (block.der) {
                html += `<div class="info-row"><span class="info-label">DER (十六进制):</span></div>`;
                html += `<div class="hex-dump">${formatHex(block.der, 64)}</div>`;

                // 解析 ASN.1 结构
                try {
                    const asn1 = parseASN1(block.der);
                    html += `<div class="info-row"><span class="info-label">ASN.1 结构:</span></div>`;
                    html += renderASN1Tree(asn1);
                } catch (e) {
                    html += `<div class="info-row warning">ASN.1 解析错误: ${e.message}</div>`;
                }
            }

            html += '</div>';
            html += '</div>';
        }

        if (output) {
            output.innerHTML = html;
        }

        REOT.utils?.showNotification(`解析完成，找到 ${blocks.length} 个 PEM 块`, 'success');
    }

    // 示例证书
    const SAMPLE_CERT = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAKHBfpS/SONpMA0GCSqGSIb3DQEBCwUAMBExDzANBgNVBAMMBnNh
bXBsZTAeFw0yNDAxMDEwMDAwMDBaFw0yNTAxMDEwMDAwMDBaMBExDzANBgNVBAMM
BnNhbXBsZTBcMA0GCSqGSIb3DQEBAQUAA0sAMEgCQQC6WR4hJgDvcMYKFOTvZCMM
8fJLxJsXLezEkxqS5gN7XtuPGPtLqjYlHqoLcTgydRSvbKss9BfSvLQAybOjSk7h
AgMBAAGjUDBOMB0GA1UdDgQWBBRKP9T2j+HFNK3kPGGplxHMpUQhkjAfBgNVHSME
GDAWgBRKP9T2j+HFNK3kPGGplxHMpUQhkjAMBgNVHRMEBTADAQH/MA0GCSqGSIb3
DQEBCwUAA0EAV5H+U7pMgFHsNUVl0BvMuDzXYXKrYapUg4WqKXGDxN0+vCP09nPy
WsLb5P7YqfC9u7FjdKdyhLGvQseJ0snx/A==
-----END CERTIFICATE-----`;

    // 示例私钥
    const SAMPLE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIBOgIBAAJBALpZHiEmAO9wxgoU5O9kIwzx8kvEmxct7MSTGpLmA3te248Y+0uq
NiUeqgtxODJ1FK9sqyz0F9K8tADJs6NKTuECAwEAAQJAE+IpLYuJu8n8TgMVGG7l
8pXK5o5Xrge+Lzz2G6BpDYK1TE1M8c9aRgYhMzM0c/5WkKN8lRlF9P7qFJwX5Qz
AQIhAO2FLu0N2MU+R1qzMBqLndN1aH+DBcFkMIllNdxu1EeRAiEAyMBN2n87oJBY
9pJo4YLJjLG8c5KNpFNuYnA5ppRKgqECICRrbpjv8L7BNLi/k5n4V+RImhgYf5g7
3Mrq0S0kVb8RAiEAqLIKLrGQhJ7A7rlPNGP1pMYbZpBSdSPIJYXUIvJ3/4ECITFO
HHjF0Q5vvfJLqT9Dqo/FLPpde+yt8SzYr2V6SPkk
-----END RSA PRIVATE KEY-----`;

    // 检查当前是否在 PEM 工具页面
    function isPemToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/protocol/pem');
    }

    // 文件上传处理
    document.addEventListener('change', (e) => {
        if (!isPemToolActive()) return;

        if (e.target.id === 'file-input') {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const input = document.getElementById('input');
                if (input) {
                    input.value = event.target.result;
                    parsePEM();
                }
            };
            reader.readAsText(file);
        }
    });

    // 事件委托处理器
    document.addEventListener('click', async (e) => {
        if (!isPemToolActive()) return;

        const target = e.target;

        // 解析按钮
        if (target.id === 'parse-btn' || target.closest('#parse-btn')) {
            parsePEM();
        }

        // 示例证书按钮
        if (target.id === 'sample-cert-btn' || target.closest('#sample-cert-btn')) {
            const input = document.getElementById('input');
            if (input) {
                input.value = SAMPLE_CERT;
                parsePEM();
            }
        }

        // 示例密钥按钮
        if (target.id === 'sample-key-btn' || target.closest('#sample-key-btn')) {
            const input = document.getElementById('input');
            if (input) {
                input.value = SAMPLE_KEY;
                parsePEM();
            }
        }

        // 清除按钮
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            const input = document.getElementById('input');
            const output = document.getElementById('output');
            if (input) input.value = '';
            if (output) output.innerHTML = '';
        }

        // 复制按钮
        if (target.id === 'copy-btn' || target.closest('#copy-btn')) {
            const output = document.getElementById('output');
            if (output && output.textContent) {
                const success = await REOT.utils?.copyToClipboard(output.textContent);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        }
    });

    // 导出工具函数
    window.PEMTool = {
        parsePEMBlocks,
        parseASN1,
        parsePEM
    };

})();
