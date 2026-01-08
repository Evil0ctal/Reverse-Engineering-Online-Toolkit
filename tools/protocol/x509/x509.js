/**
 * X.509 证书解析工具
 * @description 解析 PEM/DER 格式的 X.509 证书
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // ========== ASN.1 解析器 ==========

    const ASN1_TYPES = {
        0x01: 'BOOLEAN',
        0x02: 'INTEGER',
        0x03: 'BIT STRING',
        0x04: 'OCTET STRING',
        0x05: 'NULL',
        0x06: 'OBJECT IDENTIFIER',
        0x0C: 'UTF8String',
        0x13: 'PrintableString',
        0x14: 'T61String',
        0x16: 'IA5String',
        0x17: 'UTCTime',
        0x18: 'GeneralizedTime',
        0x30: 'SEQUENCE',
        0x31: 'SET',
        0xA0: 'CONTEXT [0]',
        0xA1: 'CONTEXT [1]',
        0xA2: 'CONTEXT [2]',
        0xA3: 'CONTEXT [3]'
    };

    // 常见 OID 映射
    const OID_MAP = {
        '2.5.4.3': 'CN',
        '2.5.4.6': 'C',
        '2.5.4.7': 'L',
        '2.5.4.8': 'ST',
        '2.5.4.10': 'O',
        '2.5.4.11': 'OU',
        '2.5.4.5': 'serialNumber',
        '2.5.4.9': 'street',
        '2.5.4.17': 'postalCode',
        '1.2.840.113549.1.1.1': 'rsaEncryption',
        '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
        '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
        '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption',
        '1.2.840.113549.1.1.13': 'sha512WithRSAEncryption',
        '1.2.840.10045.2.1': 'ecPublicKey',
        '1.2.840.10045.3.1.7': 'prime256v1',
        '1.3.132.0.34': 'secp384r1',
        '1.3.132.0.35': 'secp521r1',
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
        '1.3.6.1.5.5.7.48.1': 'OCSP',
        '1.3.6.1.5.5.7.48.2': 'caIssuers'
    };

    class ASN1Parser {
        constructor(data) {
            this.data = data;
            this.offset = 0;
        }

        parse() {
            return this.parseElement();
        }

        parseElement() {
            if (this.offset >= this.data.length) {
                return null;
            }

            const tag = this.data[this.offset++];
            const length = this.parseLength();
            const endOffset = this.offset + length;

            const element = {
                tag: tag,
                tagName: ASN1_TYPES[tag] || `TAG[${tag.toString(16)}]`,
                length: length,
                offset: this.offset - (length > 127 ? 3 : 2)
            };

            // 判断是否是构造类型
            if ((tag & 0x20) || tag === 0x30 || tag === 0x31 || (tag >= 0xA0 && tag <= 0xA3)) {
                element.children = [];
                while (this.offset < endOffset) {
                    const child = this.parseElement();
                    if (child) {
                        element.children.push(child);
                    }
                }
            } else {
                element.value = this.data.slice(this.offset, endOffset);
                this.offset = endOffset;

                // 解析特定类型的值
                if (tag === 0x02) { // INTEGER
                    element.intValue = this.parseInteger(element.value);
                } else if (tag === 0x06) { // OID
                    element.oid = this.parseOID(element.value);
                    element.oidName = OID_MAP[element.oid] || element.oid;
                } else if ([0x0C, 0x13, 0x14, 0x16].includes(tag)) { // String types
                    element.string = this.parseString(element.value);
                } else if (tag === 0x17 || tag === 0x18) { // Time
                    element.time = this.parseTime(element.value, tag);
                } else if (tag === 0x03) { // BIT STRING
                    element.unusedBits = element.value[0];
                    element.bits = element.value.slice(1);
                }
            }

            return element;
        }

        parseLength() {
            let length = this.data[this.offset++];
            if (length & 0x80) {
                const numBytes = length & 0x7F;
                length = 0;
                for (let i = 0; i < numBytes; i++) {
                    length = (length << 8) | this.data[this.offset++];
                }
            }
            return length;
        }

        parseInteger(bytes) {
            if (bytes.length <= 6) {
                let value = 0n;
                for (let i = 0; i < bytes.length; i++) {
                    value = (value << 8n) | BigInt(bytes[i]);
                }
                return value.toString();
            }
            return bytesToHex(bytes);
        }

        parseOID(bytes) {
            const parts = [];
            parts.push(Math.floor(bytes[0] / 40));
            parts.push(bytes[0] % 40);

            let value = 0;
            for (let i = 1; i < bytes.length; i++) {
                value = (value << 7) | (bytes[i] & 0x7F);
                if ((bytes[i] & 0x80) === 0) {
                    parts.push(value);
                    value = 0;
                }
            }

            return parts.join('.');
        }

        parseString(bytes) {
            return new TextDecoder().decode(bytes);
        }

        parseTime(bytes, tag) {
            const str = this.parseString(bytes);
            let year, month, day, hour, min, sec;

            if (tag === 0x17) { // UTCTime
                year = parseInt(str.substr(0, 2), 10);
                year += year >= 50 ? 1900 : 2000;
                month = parseInt(str.substr(2, 2), 10);
                day = parseInt(str.substr(4, 2), 10);
                hour = parseInt(str.substr(6, 2), 10);
                min = parseInt(str.substr(8, 2), 10);
                sec = parseInt(str.substr(10, 2), 10);
            } else { // GeneralizedTime
                year = parseInt(str.substr(0, 4), 10);
                month = parseInt(str.substr(4, 2), 10);
                day = parseInt(str.substr(6, 2), 10);
                hour = parseInt(str.substr(8, 2), 10);
                min = parseInt(str.substr(10, 2), 10);
                sec = parseInt(str.substr(12, 2), 10);
            }

            return new Date(Date.UTC(year, month - 1, day, hour, min, sec));
        }
    }

    // ========== 工具函数 ==========

    function bytesToHex(bytes) {
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    function formatHexWithColons(hex) {
        return hex.match(/.{2}/g)?.join(':').toUpperCase() || hex.toUpperCase();
    }

    function base64ToBytes(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    function parsePEM(pem) {
        const lines = pem.split('\n');
        let base64 = '';
        let inCert = false;

        for (const line of lines) {
            if (line.includes('BEGIN CERTIFICATE')) {
                inCert = true;
                continue;
            }
            if (line.includes('END CERTIFICATE')) {
                break;
            }
            if (inCert) {
                base64 += line.trim();
            }
        }

        if (!base64) {
            throw new Error('无法找到有效的证书数据');
        }

        return base64ToBytes(base64);
    }

    async function calculateFingerprint(data, algorithm) {
        const hashBuffer = await crypto.subtle.digest(algorithm, data);
        return formatHexWithColons(bytesToHex(new Uint8Array(hashBuffer)));
    }

    // ========== X.509 解析器 ==========

    class X509Parser {
        constructor(derData) {
            this.der = derData;
            this.asn1 = new ASN1Parser(derData).parse();
        }

        async parse() {
            const cert = {
                version: 1,
                serialNumber: 'unknown',
                signatureAlgorithm: 'unknown',
                issuer: {},
                subject: {},
                validity: { notBefore: new Date(), notAfter: new Date() },
                publicKey: { algorithm: 'unknown', keySize: 0 },
                extensions: [],
                fingerprints: { sha1: '', sha256: '' }
            };

            if (!this.asn1?.children?.[0]?.children) {
                throw new Error('无效的证书结构');
            }

            const tbsCert = this.asn1.children[0];
            const children = tbsCert.children;

            // 版本
            let idx = 0;
            if (children[0]?.tag === 0xA0) {
                const versionInt = children[0].children?.[0]?.intValue;
                cert.version = versionInt ? parseInt(versionInt) + 1 : 1;
                idx = 1;
            }

            // 序列号
            if (children[idx]) {
                cert.serialNumber = children[idx].intValue || bytesToHex(children[idx].value || []);
            }
            idx++;

            // 签名算法
            if (children[idx]?.children?.[0]) {
                cert.signatureAlgorithm = children[idx].children[0].oidName ||
                                          children[idx].children[0].oid || 'unknown';
            }
            idx++;

            // 颁发者
            if (children[idx]) {
                cert.issuer = this.parseName(children[idx]);
            }
            idx++;

            // 有效期
            if (children[idx]?.children) {
                const validityChildren = children[idx].children;
                if (validityChildren[0]?.time) {
                    cert.validity.notBefore = validityChildren[0].time;
                }
                if (validityChildren[1]?.time) {
                    cert.validity.notAfter = validityChildren[1].time;
                }
            }
            idx++;

            // 主题
            if (children[idx]) {
                cert.subject = this.parseName(children[idx]);
            }
            idx++;

            // 公钥
            if (children[idx]) {
                cert.publicKey = this.parsePublicKey(children[idx]);
            }
            idx++;

            // 扩展
            for (let i = idx; i < children.length; i++) {
                if (children[i]?.tag === 0xA3 && children[i].children?.[0]) {
                    cert.extensions = this.parseExtensions(children[i].children[0]);
                }
            }

            // 指纹
            try {
                cert.fingerprints = {
                    sha1: await calculateFingerprint(this.der, 'SHA-1'),
                    sha256: await calculateFingerprint(this.der, 'SHA-256')
                };
            } catch (e) {
                console.warn('计算指纹失败:', e);
            }

            // 检查有效性
            const now = new Date();
            cert.isValid = now >= cert.validity.notBefore && now <= cert.validity.notAfter;
            cert.isExpired = now > cert.validity.notAfter;
            cert.isNotYetValid = now < cert.validity.notBefore;

            return cert;
        }

        parseName(nameSeq) {
            const name = {};
            if (!nameSeq?.children) return name;
            for (const rdn of nameSeq.children) {
                try {
                    const attr = rdn.children?.[0];
                    if (attr?.children?.[0] && attr?.children?.[1]) {
                        const oid = attr.children[0].oidName || attr.children[0].oid;
                        const value = attr.children[1].string || bytesToHex(attr.children[1].value || []);
                        if (oid && value) {
                            name[oid] = value;
                        }
                    }
                } catch (e) {
                    // 跳过无法解析的字段
                }
            }
            return name;
        }

        parsePublicKey(pkInfo) {
            const result = {
                algorithm: 'unknown',
                keySize: 0
            };

            try {
                if (!pkInfo?.children?.[0]?.children?.[0]) {
                    return result;
                }

                const algorithmSeq = pkInfo.children[0];
                result.algorithm = algorithmSeq.children[0].oidName || algorithmSeq.children[0].oid || 'unknown';

                const pubKeyBitString = pkInfo.children[1];
                const pubKeyBits = pubKeyBitString?.bits || pubKeyBitString?.value?.slice(1);

                if (!pubKeyBits) {
                    return result;
                }

                if (result.algorithm === 'rsaEncryption') {
                    // 解析 RSA 公钥
                    try {
                        const rsaKey = new ASN1Parser(pubKeyBits).parse();
                        if (rsaKey?.children?.[0]?.value) {
                            const modulus = rsaKey.children[0].value;
                            // 计算密钥长度，跳过前导零
                            let keyLen = modulus.length;
                            if (modulus[0] === 0) keyLen--;
                            result.keySize = keyLen * 8;
                            result.modulus = bytesToHex(modulus).substring(0, 64) + '...';
                        }
                        if (rsaKey?.children?.[1]) {
                            result.exponent = rsaKey.children[1].intValue || '65537';
                        }
                    } catch (e) {
                        result.keySize = pubKeyBits.length * 8;
                    }
                } else if (result.algorithm === 'ecPublicKey') {
                    // EC 公钥
                    const curve = algorithmSeq.children[1]?.oidName || algorithmSeq.children[1]?.oid || 'unknown';
                    result.curve = curve;
                    // EC 密钥长度根据曲线估算
                    if (curve.includes('256') || curve === 'prime256v1') {
                        result.keySize = 256;
                    } else if (curve.includes('384') || curve === 'secp384r1') {
                        result.keySize = 384;
                    } else if (curve.includes('521') || curve === 'secp521r1') {
                        result.keySize = 521;
                    } else {
                        result.keySize = pubKeyBits.length * 4;
                    }
                } else {
                    // 其他算法
                    result.keySize = pubKeyBits.length * 8;
                }
            } catch (e) {
                console.warn('解析公钥失败:', e);
            }

            return result;
        }

        parseExtensions(extSeq) {
            const extensions = [];
            if (!extSeq?.children) return extensions;

            for (const ext of extSeq.children) {
                try {
                    if (!ext?.children?.[0]) continue;

                    const oid = ext.children[0].oidName || ext.children[0].oid || 'unknown';
                    const critical = ext.children.length > 2 && ext.children[1]?.tag === 0x01;
                    const valueIdx = critical ? 2 : 1;
                    const valueElement = ext.children[valueIdx];
                    const value = valueElement?.value || new Uint8Array(0);

                    const extension = {
                        oid: oid,
                        critical: critical,
                        value: this.parseExtensionValue(oid, value)
                    };
                    extensions.push(extension);
                } catch (e) {
                    // 跳过无法解析的扩展
                }
            }
            return extensions;
        }

        parseExtensionValue(oid, value) {
            try {
                const parsed = new ASN1Parser(value).parse();

                switch (oid) {
                    case 'basicConstraints':
                        return this.parseBasicConstraints(parsed);
                    case 'keyUsage':
                        return this.parseKeyUsage(parsed);
                    case 'subjectAltName':
                        return this.parseSubjectAltName(parsed);
                    case 'subjectKeyIdentifier':
                        return formatHexWithColons(bytesToHex(parsed.value));
                    case 'authorityKeyIdentifier':
                        return this.parseAuthorityKeyId(parsed);
                    case 'extKeyUsage':
                        return this.parseExtKeyUsage(parsed);
                    default:
                        return bytesToHex(value).substring(0, 100) + (value.length > 50 ? '...' : '');
                }
            } catch (e) {
                return bytesToHex(value).substring(0, 100);
            }
        }

        parseBasicConstraints(parsed) {
            const result = { isCA: false };
            if (parsed.children && parsed.children.length > 0) {
                if (parsed.children[0].tag === 0x01) {
                    result.isCA = parsed.children[0].value[0] !== 0;
                }
                if (parsed.children.length > 1) {
                    result.pathLen = parseInt(parsed.children[1].intValue);
                }
            }
            return result;
        }

        parseKeyUsage(parsed) {
            const usages = [];
            const bits = parsed.bits || parsed.value;
            const unusedBits = parsed.unusedBits || 0;
            const keyUsageNames = [
                'digitalSignature', 'nonRepudiation', 'keyEncipherment',
                'dataEncipherment', 'keyAgreement', 'keyCertSign',
                'cRLSign', 'encipherOnly', 'decipherOnly'
            ];

            if (bits && bits.length > 0) {
                for (let i = 0; i < 8 - unusedBits; i++) {
                    if (bits[0] & (0x80 >> i)) {
                        usages.push(keyUsageNames[i]);
                    }
                }
            }
            return usages;
        }

        parseSubjectAltName(parsed) {
            const names = [];
            if (parsed.children) {
                for (const child of parsed.children) {
                    if (child.tag === 0x82) { // DNS Name
                        names.push({ type: 'DNS', value: new TextDecoder().decode(child.value) });
                    } else if (child.tag === 0x87) { // IP Address
                        const ip = Array.from(child.value).join('.');
                        names.push({ type: 'IP', value: ip });
                    }
                }
            }
            return names;
        }

        parseAuthorityKeyId(parsed) {
            if (parsed.children && parsed.children[0]) {
                return formatHexWithColons(bytesToHex(parsed.children[0].value));
            }
            return '';
        }

        parseExtKeyUsage(parsed) {
            const usages = [];
            if (parsed.children) {
                for (const child of parsed.children) {
                    usages.push(child.oidName || child.oid);
                }
            }
            return usages;
        }
    }

    // ========== UI 函数 ==========

    function formatDate(date) {
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
    }

    function formatDN(name) {
        const parts = [];
        const order = ['CN', 'O', 'OU', 'L', 'ST', 'C'];
        for (const key of order) {
            if (name[key]) {
                parts.push(`${key}=${name[key]}`);
            }
        }
        // 添加其他字段
        for (const [key, value] of Object.entries(name)) {
            if (!order.includes(key)) {
                parts.push(`${key}=${value}`);
            }
        }
        return parts.join(', ');
    }

    function renderInfoGrid(container, data) {
        container.innerHTML = data.map(([label, value, copyable]) => `
            <div class="info-item">
                <span class="info-label">${label}</span>
                <span class="info-value ${copyable ? 'copyable' : ''}" ${copyable ? `data-copy="${value}"` : ''}>${value}</span>
            </div>
        `).join('');
    }

    function displayCertificate(cert) {
        const resultSection = document.getElementById('result-section');
        const statusSection = document.getElementById('status-section');

        // 基本信息
        renderInfoGrid(document.getElementById('basic-info'), [
            ['版本', `v${cert.version}`],
            ['序列号', cert.serialNumber, true],
            ['签名算法', cert.signatureAlgorithm]
        ]);

        // 主题
        const subjectInfo = [];
        for (const [key, value] of Object.entries(cert.subject)) {
            subjectInfo.push([key, value, true]);
        }
        renderInfoGrid(document.getElementById('subject-info'), subjectInfo);

        // 颁发者
        const issuerInfo = [];
        for (const [key, value] of Object.entries(cert.issuer)) {
            issuerInfo.push([key, value, true]);
        }
        renderInfoGrid(document.getElementById('issuer-info'), issuerInfo);

        // 有效期
        const now = new Date();
        const daysRemaining = Math.ceil((cert.validity.notAfter - now) / (1000 * 60 * 60 * 24));
        renderInfoGrid(document.getElementById('validity-info'), [
            ['生效时间', formatDate(cert.validity.notBefore)],
            ['过期时间', formatDate(cert.validity.notAfter)],
            ['剩余天数', cert.isExpired ? '已过期' : (cert.isNotYetValid ? '尚未生效' : `${daysRemaining} 天`)]
        ]);

        // 公钥信息
        const pubkeyInfo = [
            ['算法', cert.publicKey.algorithm],
            ['密钥长度', `${cert.publicKey.keySize} bits`]
        ];
        if (cert.publicKey.curve) {
            pubkeyInfo.push(['曲线', cert.publicKey.curve]);
        }
        if (cert.publicKey.exponent) {
            pubkeyInfo.push(['指数', cert.publicKey.exponent]);
        }
        renderInfoGrid(document.getElementById('pubkey-info'), pubkeyInfo);

        // 指纹
        renderInfoGrid(document.getElementById('fingerprint-info'), [
            ['SHA-1', cert.fingerprints.sha1, true],
            ['SHA-256', cert.fingerprints.sha256, true]
        ]);

        // 扩展信息
        const extContainer = document.getElementById('extensions-info');
        extContainer.innerHTML = cert.extensions.map(ext => {
            let valueStr = '';
            if (typeof ext.value === 'object') {
                if (Array.isArray(ext.value)) {
                    valueStr = ext.value.map(v => {
                        if (typeof v === 'object' && v.type) {
                            return `${v.type}: ${v.value}`;
                        }
                        return v;
                    }).join(', ');
                } else {
                    valueStr = JSON.stringify(ext.value);
                }
            } else {
                valueStr = ext.value;
            }

            return `
                <div class="extension-item">
                    <div class="extension-header">
                        <span class="extension-name">${ext.oid}</span>
                        ${ext.critical ? '<span class="critical-badge">Critical</span>' : ''}
                    </div>
                    <div class="extension-value">${valueStr}</div>
                </div>
            `;
        }).join('');

        // 状态指示器
        const indicator = document.getElementById('status-indicator');
        if (cert.isValid) {
            indicator.className = 'status-indicator valid';
            indicator.innerHTML = '<span class="status-icon">✓</span><span class="status-text">证书有效</span>';
        } else if (cert.isExpired) {
            indicator.className = 'status-indicator expired';
            indicator.innerHTML = '<span class="status-icon">✗</span><span class="status-text">证书已过期</span>';
        } else {
            indicator.className = 'status-indicator not-valid';
            indicator.innerHTML = '<span class="status-icon">!</span><span class="status-text">证书尚未生效</span>';
        }

        resultSection.style.display = 'block';
        statusSection.style.display = 'block';
    }

    // ========== 示例证书 ==========

    const SAMPLE_CERT = `-----BEGIN CERTIFICATE-----
MIIFazCCBFOgAwIBAgISA8bOOQmKk1hLnKcJ3HqjLmhZMA0GCSqGSIb3DQEBCwUA
MDIxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQD
EwJSMzAeFw0yNDAxMDEwMDAwMDBaFw0yNDAzMzEyMzU5NTlaMBkxFzAVBgNVBAMT
DmV4YW1wbGUuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Z3w
V8E9pjk0G4q9H4rOJ7+nG1DXQQ0IxOMExYr6M8vg7r2qJ0pKQ5R2+L5X8A2PXQP2
QG0KxJPLJPJXG7R3O6I4D8hXK4LpK7qI7G5x0vHK8vN3G8rE6B0K5rL5O8P0Q2T0
X4A0G8R5P2L7Q4V8M6S0K3J7H2D5F8N1B0C4E6A9Y2W0U1I3O5P7R9T0Q8E6W4
Y2U0I8O6P4R2T0Q8E6W4Y2U0I8O6P4R2T0QBAQA0AQAQAQAQAQAQAQAQAQAQAQ
AQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQAQIDAQAB
o4ICYjCCAl4wDgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUFBwMBBggr
BgEFBQcDAjAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBRExample0123456789AB
CDEFGHIJMAfBgNVHSMEGDAWgBQExample0123456789ABCDEFGHIJKLMNMFcG
CCsGAQUFBwEBBEswSTAiBggrBgEFBQcwAYYWaHR0cDovL3IzLm8ubGVuY3Iub3Jn
MCMGCCsGAQUFBzAChhdodHRwOi8vcjMuaS5sZW5jci5vcmcvMBkGA1UdEQQSMBCC
DmV4YW1wbGUuY29tMBMGA1UdIAQMMAowCAYGZ4EMAQIBMIIBBQYKKwYBBAHWeQIE
AgSB9gSB8wDxAHYARandom0Base64String0Here0For0Example012345
67890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0A
dQBIsONr2qZHNA/lagL6nTDrHFIBy1bdLIHZu7+rOdiEcwAAAY0Example012
AAAEAwBGMEQCIDRandomSignature0Here0For0Testing0Purpose0On
ly0This0Is0Not0A0Real0Cert0AiB0Random0Data0Here0MA0GCSqG
SIb3DQEBCwUAA4IBAQBRandomSignature0Data0Here0For0Testing
-----END CERTIFICATE-----`;

    // ========== 事件处理 ==========

    function isX509ToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/protocol/x509');
    }

    document.addEventListener('click', async (e) => {
        if (!isX509ToolActive()) return;

        const target = e.target;

        // 解析按钮
        if (target.id === 'parse-btn' || target.closest('#parse-btn')) {
            const input = document.getElementById('input');
            if (!input?.value.trim()) {
                REOT.utils?.showNotification('请输入证书内容', 'warning');
                return;
            }

            try {
                let derData;
                if (input.value.includes('BEGIN CERTIFICATE')) {
                    derData = parsePEM(input.value);
                } else {
                    // 尝试作为 Base64 解析
                    derData = base64ToBytes(input.value.replace(/\s/g, ''));
                }

                const parser = new X509Parser(derData);
                const cert = await parser.parse();
                displayCertificate(cert);
                REOT.utils?.showNotification('证书解析成功', 'success');
            } catch (error) {
                REOT.utils?.showNotification('解析失败: ' + error.message, 'error');
                console.error(error);
            }
        }

        // 加载示例
        if (target.id === 'sample-btn' || target.closest('#sample-btn')) {
            const input = document.getElementById('input');
            if (input) {
                input.value = SAMPLE_CERT;
            }
        }

        // 清除
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            const input = document.getElementById('input');
            const resultSection = document.getElementById('result-section');
            const statusSection = document.getElementById('status-section');

            if (input) input.value = '';
            if (resultSection) resultSection.style.display = 'none';
            if (statusSection) statusSection.style.display = 'none';
        }

        // 复制功能
        if (target.classList.contains('copyable')) {
            const value = target.dataset.copy || target.textContent;
            const success = await REOT.utils?.copyToClipboard(value);
            if (success) {
                REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
            }
        }

        // 折叠展开
        if (target.classList.contains('collapsible-header')) {
            const content = target.nextElementSibling;
            if (content) {
                content.style.display = content.style.display === 'none' ? 'block' : 'none';
            }
        }
    });

    // 文件上传
    document.addEventListener('change', (e) => {
        if (!isX509ToolActive()) return;

        if (e.target.id === 'file-input') {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const input = document.getElementById('input');
                if (input) {
                    // 尝试作为文本读取
                    const text = event.target.result;
                    if (text.includes('BEGIN CERTIFICATE') || /^[A-Za-z0-9+/=\s]+$/.test(text)) {
                        input.value = text;
                    } else {
                        // 作为二进制文件，转换为 Base64
                        const bytes = new Uint8Array(event.target.result);
                        let binary = '';
                        bytes.forEach(b => binary += String.fromCharCode(b));
                        input.value = btoa(binary);
                    }
                }
            };

            if (file.name.endsWith('.der')) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        }
    });

    // 导出到全局
    window.X509Tool = {
        ASN1Parser,
        X509Parser,
        parsePEM
    };

})();
