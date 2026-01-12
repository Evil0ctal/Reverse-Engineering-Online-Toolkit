/**
 * 哈希类型识别工具
 * @description 根据长度和格式自动识别哈希类型
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 哈希类型定义
    const HASH_TYPES = [
        // CRC 校验
        { name: 'CRC16', length: 4, pattern: /^[a-fA-F0-9]{4}$/, confidence: 'low', description: 'CRC-16 校验码' },
        { name: 'CRC32', length: 8, pattern: /^[a-fA-F0-9]{8}$/, confidence: 'medium', description: 'CRC-32 校验码' },
        { name: 'CRC64', length: 16, pattern: /^[a-fA-F0-9]{16}$/, confidence: 'low', description: 'CRC-64 校验码' },

        // MD 系列
        { name: 'MD4', length: 32, pattern: /^[a-fA-F0-9]{32}$/, confidence: 'low', description: 'MD4 消息摘要' },
        { name: 'MD5', length: 32, pattern: /^[a-fA-F0-9]{32}$/, confidence: 'high', description: 'MD5 消息摘要（最常见）' },

        // SHA 系列
        { name: 'SHA-1', length: 40, pattern: /^[a-fA-F0-9]{40}$/, confidence: 'high', description: 'SHA-1 哈希' },
        { name: 'SHA-224', length: 56, pattern: /^[a-fA-F0-9]{56}$/, confidence: 'medium', description: 'SHA-224 哈希' },
        { name: 'SHA-256', length: 64, pattern: /^[a-fA-F0-9]{64}$/, confidence: 'high', description: 'SHA-256 哈希（最常用）' },
        { name: 'SHA-384', length: 96, pattern: /^[a-fA-F0-9]{96}$/, confidence: 'high', description: 'SHA-384 哈希' },
        { name: 'SHA-512', length: 128, pattern: /^[a-fA-F0-9]{128}$/, confidence: 'high', description: 'SHA-512 哈希' },

        // SHA-3 系列
        { name: 'SHA3-224', length: 56, pattern: /^[a-fA-F0-9]{56}$/, confidence: 'low', description: 'SHA3-224 哈希' },
        { name: 'SHA3-256', length: 64, pattern: /^[a-fA-F0-9]{64}$/, confidence: 'low', description: 'SHA3-256 哈希' },
        { name: 'SHA3-384', length: 96, pattern: /^[a-fA-F0-9]{96}$/, confidence: 'low', description: 'SHA3-384 哈希' },
        { name: 'SHA3-512', length: 128, pattern: /^[a-fA-F0-9]{128}$/, confidence: 'low', description: 'SHA3-512 哈希' },

        // RIPEMD
        { name: 'RIPEMD-128', length: 32, pattern: /^[a-fA-F0-9]{32}$/, confidence: 'low', description: 'RIPEMD-128 哈希' },
        { name: 'RIPEMD-160', length: 40, pattern: /^[a-fA-F0-9]{40}$/, confidence: 'medium', description: 'RIPEMD-160 哈希（比特币地址）' },
        { name: 'RIPEMD-256', length: 64, pattern: /^[a-fA-F0-9]{64}$/, confidence: 'low', description: 'RIPEMD-256 哈希' },
        { name: 'RIPEMD-320', length: 80, pattern: /^[a-fA-F0-9]{80}$/, confidence: 'medium', description: 'RIPEMD-320 哈希' },

        // BLAKE2
        { name: 'BLAKE2s-256', length: 64, pattern: /^[a-fA-F0-9]{64}$/, confidence: 'low', description: 'BLAKE2s-256 哈希' },
        { name: 'BLAKE2b-256', length: 64, pattern: /^[a-fA-F0-9]{64}$/, confidence: 'low', description: 'BLAKE2b-256 哈希' },
        { name: 'BLAKE2b-384', length: 96, pattern: /^[a-fA-F0-9]{96}$/, confidence: 'low', description: 'BLAKE2b-384 哈希' },
        { name: 'BLAKE2b-512', length: 128, pattern: /^[a-fA-F0-9]{128}$/, confidence: 'low', description: 'BLAKE2b-512 哈希' },

        // Windows/NTLM
        { name: 'NTLM', length: 32, pattern: /^[a-fA-F0-9]{32}$/, confidence: 'low', description: 'Windows NTLM 哈希' },
        { name: 'LM', length: 32, pattern: /^[a-fA-F0-9]{32}$/, confidence: 'low', description: 'Windows LAN Manager 哈希' },

        // MySQL
        { name: 'MySQL 3.x', length: 16, pattern: /^[a-fA-F0-9]{16}$/, confidence: 'medium', description: 'MySQL 3.x 密码哈希' },
        { name: 'MySQL 4.x/5.x', length: 41, pattern: /^\*[a-fA-F0-9]{40}$/, confidence: 'high', description: 'MySQL 4.x/5.x 密码哈希' },

        // bcrypt
        { name: 'bcrypt', length: 60, pattern: /^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/, confidence: 'high', description: 'bcrypt 密码哈希' },

        // Argon2
        { name: 'Argon2i', pattern: /^\$argon2i\$/, confidence: 'high', description: 'Argon2i 密码哈希' },
        { name: 'Argon2d', pattern: /^\$argon2d\$/, confidence: 'high', description: 'Argon2d 密码哈希' },
        { name: 'Argon2id', pattern: /^\$argon2id\$/, confidence: 'high', description: 'Argon2id 密码哈希（推荐）' },

        // scrypt
        { name: 'scrypt', pattern: /^\$scrypt\$/, confidence: 'high', description: 'scrypt 密码哈希' },

        // Unix crypt
        { name: 'MD5crypt', pattern: /^\$1\$[./0-9A-Za-z]{8}\$[./0-9A-Za-z]{22}$/, confidence: 'high', description: 'MD5crypt (Unix)' },
        { name: 'SHA-256crypt', pattern: /^\$5\$(rounds=\d+\$)?[./0-9A-Za-z]+\$[./0-9A-Za-z]{43}$/, confidence: 'high', description: 'SHA-256crypt (Unix)' },
        { name: 'SHA-512crypt', pattern: /^\$6\$(rounds=\d+\$)?[./0-9A-Za-z]+\$[./0-9A-Za-z]{86}$/, confidence: 'high', description: 'SHA-512crypt (Unix)' },
        { name: 'Blowfish crypt', pattern: /^\$2[aby]?\$\d{2}\$/, confidence: 'high', description: 'Blowfish crypt (Unix)' },

        // DES crypt
        { name: 'DES crypt', length: 13, pattern: /^[./0-9A-Za-z]{13}$/, confidence: 'medium', description: 'DES crypt (传统 Unix)' },

        // PBKDF2
        { name: 'PBKDF2-SHA1', pattern: /^pbkdf2_sha1\$/, confidence: 'high', description: 'PBKDF2-SHA1 (Django)' },
        { name: 'PBKDF2-SHA256', pattern: /^pbkdf2_sha256\$/, confidence: 'high', description: 'PBKDF2-SHA256 (Django)' },

        // 其他
        { name: 'Whirlpool', length: 128, pattern: /^[a-fA-F0-9]{128}$/, confidence: 'low', description: 'Whirlpool 哈希' },
        { name: 'Tiger-192', length: 48, pattern: /^[a-fA-F0-9]{48}$/, confidence: 'medium', description: 'Tiger-192 哈希' },
        { name: 'Snefru-256', length: 64, pattern: /^[a-fA-F0-9]{64}$/, confidence: 'low', description: 'Snefru-256 哈希' },
        { name: 'GOST R 34.11-94', length: 64, pattern: /^[a-fA-F0-9]{64}$/, confidence: 'low', description: 'GOST R 34.11-94 哈希' },
        { name: 'Haval-256', length: 64, pattern: /^[a-fA-F0-9]{64}$/, confidence: 'low', description: 'Haval-256 哈希' },

        // Keccak
        { name: 'Keccak-256', length: 64, pattern: /^[a-fA-F0-9]{64}$/, confidence: 'low', description: 'Keccak-256 哈希（以太坊）' },
        { name: 'Keccak-512', length: 128, pattern: /^[a-fA-F0-9]{128}$/, confidence: 'low', description: 'Keccak-512 哈希' },

        // xxHash
        { name: 'xxHash32', length: 8, pattern: /^[a-fA-F0-9]{8}$/, confidence: 'low', description: 'xxHash32 非加密哈希' },
        { name: 'xxHash64', length: 16, pattern: /^[a-fA-F0-9]{16}$/, confidence: 'low', description: 'xxHash64 非加密哈希' },

        // MurmurHash
        { name: 'MurmurHash3-32', length: 8, pattern: /^[a-fA-F0-9]{8}$/, confidence: 'low', description: 'MurmurHash3 32位' },
        { name: 'MurmurHash3-128', length: 32, pattern: /^[a-fA-F0-9]{32}$/, confidence: 'low', description: 'MurmurHash3 128位' },

        // FNV
        { name: 'FNV-1a-32', length: 8, pattern: /^[a-fA-F0-9]{8}$/, confidence: 'low', description: 'FNV-1a 32位哈希' },
        { name: 'FNV-1a-64', length: 16, pattern: /^[a-fA-F0-9]{16}$/, confidence: 'low', description: 'FNV-1a 64位哈希' },

        // Adler
        { name: 'Adler-32', length: 8, pattern: /^[a-fA-F0-9]{8}$/, confidence: 'low', description: 'Adler-32 校验码' },

        // Base64 encoded hashes
        { name: 'Base64 MD5', length: 24, pattern: /^[A-Za-z0-9+/]{22}==$/, confidence: 'medium', description: 'Base64 编码的 MD5' },
        { name: 'Base64 SHA-1', length: 28, pattern: /^[A-Za-z0-9+/]{27}=$/, confidence: 'medium', description: 'Base64 编码的 SHA-1' },
        { name: 'Base64 SHA-256', length: 44, pattern: /^[A-Za-z0-9+/]{43}=$/, confidence: 'medium', description: 'Base64 编码的 SHA-256' },

        // Oracle
        { name: 'Oracle 10g', length: 16, pattern: /^[a-fA-F0-9]{16}$/, confidence: 'low', description: 'Oracle 10g 密码哈希' },
        { name: 'Oracle 11g', length: 40, pattern: /^S:[a-fA-F0-9]{40}$/i, confidence: 'high', description: 'Oracle 11g 密码哈希' },

        // PostgreSQL
        { name: 'PostgreSQL MD5', length: 35, pattern: /^md5[a-fA-F0-9]{32}$/, confidence: 'high', description: 'PostgreSQL MD5 密码哈希' },

        // Cisco
        { name: 'Cisco Type 5', pattern: /^\$1\$[./0-9A-Za-z]{4}\$[./0-9A-Za-z]{22}$/, confidence: 'high', description: 'Cisco IOS Type 5 密码' },
        { name: 'Cisco Type 7', pattern: /^[0-9]{2}[0-9A-Fa-f]+$/, confidence: 'low', description: 'Cisco IOS Type 7 密码（可逆）' },

        // Wordpress
        { name: 'WordPress (phpass)', pattern: /^\$P\$[./0-9A-Za-z]{31}$/, confidence: 'high', description: 'WordPress 密码哈希' },

        // Drupal
        { name: 'Drupal 7', pattern: /^\$S\$[./0-9A-Za-z]{52}$/, confidence: 'high', description: 'Drupal 7 密码哈希' },

        // Joomla
        { name: 'Joomla 2.5.18+', pattern: /^\$2[ay]\$\d{2}\$[./A-Za-z0-9]{53}$/, confidence: 'high', description: 'Joomla 2.5.18+ 密码哈希' },

        // Django
        { name: 'Django SHA-1', pattern: /^sha1\$[a-zA-Z0-9]+\$[a-fA-F0-9]{40}$/, confidence: 'high', description: 'Django SHA-1 密码哈希' },
        { name: 'Django MD5', pattern: /^md5\$[a-zA-Z0-9]+\$[a-fA-F0-9]{32}$/, confidence: 'high', description: 'Django MD5 密码哈希' }
    ];

    /**
     * 识别哈希类型
     * @param {string} hash - 哈希字符串
     * @returns {Array} 可能的哈希类型列表
     */
    function identifyHash(hash) {
        hash = hash.trim();
        if (!hash) return [];

        const results = [];
        const hashLength = hash.length;

        for (const type of HASH_TYPES) {
            // 如果定义了长度，先检查长度
            if (type.length && type.length !== hashLength) {
                continue;
            }

            // 检查正则模式
            if (type.pattern && type.pattern.test(hash)) {
                results.push({
                    name: type.name,
                    confidence: type.confidence,
                    description: type.description
                });
            }
        }

        // 按置信度排序：high > medium > low
        const confidenceOrder = { high: 0, medium: 1, low: 2 };
        results.sort((a, b) => confidenceOrder[a.confidence] - confidenceOrder[b.confidence]);

        return results;
    }

    /**
     * 获取哈希信息
     * @param {string} hash - 哈希字符串
     * @returns {Object} 哈希信息
     */
    function getHashInfo(hash) {
        hash = hash.trim();
        const info = {
            length: hash.length,
            isHex: /^[a-fA-F0-9]+$/.test(hash),
            isBase64: /^[A-Za-z0-9+/]+=*$/.test(hash),
            hasPrefix: /^[\$*]/.test(hash),
            prefix: ''
        };

        // 提取前缀
        const prefixMatch = hash.match(/^(\$[a-zA-Z0-9]+\$|\*)/);
        if (prefixMatch) {
            info.prefix = prefixMatch[1];
        }

        return info;
    }

    // ========== 渲染函数 ==========

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    function renderResults(hashes) {
        const resultList = document.getElementById('result-list');
        if (!resultList) return;

        let html = '';

        for (const hash of hashes) {
            const types = identifyHash(hash);
            const info = getHashInfo(hash);

            const isSingleMatch = types.length === 1 && types[0].confidence === 'high';

            html += `<div class="result-item ${isSingleMatch ? 'single-match' : ''}">`;
            html += `<div class="result-hash">${escapeHtml(hash)}</div>`;

            // 显示哈希信息
            html += `<div class="result-info">`;
            html += `<span>长度: ${info.length}</span>`;
            if (info.isHex) html += `<span>格式: 十六进制</span>`;
            else if (info.isBase64) html += `<span>格式: Base64</span>`;
            if (info.prefix) html += `<span>前缀: ${escapeHtml(info.prefix)}</span>`;
            html += `</div>`;

            // 显示可能的类型
            html += `<div class="result-types">`;
            html += `<div class="result-types-label">可能的类型</div>`;

            if (types.length === 0) {
                html += `<div class="no-match">
                    <div class="no-match-icon">❓</div>
                    <div>未能识别此哈希类型</div>
                </div>`;
            } else {
                html += `<div class="type-list">`;
                for (const type of types) {
                    html += `<div class="type-tag ${type.confidence}-confidence">`;
                    html += `<span class="type-name">${escapeHtml(type.name)}</span>`;
                    html += `<span class="type-confidence">${getConfidenceLabel(type.confidence)}</span>`;
                    html += `</div>`;
                }
                html += `</div>`;

                // 显示最可能类型的描述
                if (types.length > 0) {
                    html += `<div class="type-description">${escapeHtml(types[0].description)}</div>`;
                }
            }

            html += `</div>`;
            html += `</div>`;
        }

        resultList.innerHTML = html;
    }

    function getConfidenceLabel(confidence) {
        switch (confidence) {
            case 'high': return '高';
            case 'medium': return '中';
            case 'low': return '低';
            default: return '';
        }
    }

    // ========== 主要功能 ==========

    function performIdentify() {
        const input = document.getElementById('hash-input')?.value || '';
        const resultSection = document.getElementById('result-section');

        if (!input.trim()) {
            if (resultSection) resultSection.style.display = 'none';
            return;
        }

        // 按行分割，过滤空行
        const hashes = input.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (hashes.length === 0) {
            if (resultSection) resultSection.style.display = 'none';
            return;
        }

        renderResults(hashes);

        if (resultSection) resultSection.style.display = 'block';

        REOT.utils?.showNotification(`识别了 ${hashes.length} 个哈希值`, 'success');
    }

    function isHashIdentifierToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/hashing/hash-identifier');
    }

    // ========== 事件处理 ==========

    document.addEventListener('click', async (e) => {
        if (!isHashIdentifierToolActive()) return;

        const target = e.target;

        // 识别按钮
        if (target.id === 'identify-btn' || target.closest('#identify-btn')) {
            performIdentify();
        }

        // 粘贴按钮
        if (target.id === 'paste-btn' || target.closest('#paste-btn')) {
            try {
                const text = await navigator.clipboard.readText();
                const input = document.getElementById('hash-input');
                if (input) {
                    input.value = text;
                    performIdentify();
                }
            } catch (e) {
                REOT.utils?.showNotification('无法访问剪贴板', 'error');
            }
        }

        // 清除按钮
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            const input = document.getElementById('hash-input');
            if (input) input.value = '';
            document.getElementById('result-section').style.display = 'none';
        }

        // 示例点击
        if (target.closest('.example-item')) {
            const item = target.closest('.example-item');
            const hash = item.getAttribute('data-hash');
            if (hash) {
                const input = document.getElementById('hash-input');
                if (input) {
                    input.value = hash;
                    performIdentify();
                }
            }
        }
    });

    // 输入框回车触发识别
    document.addEventListener('keypress', (e) => {
        if (!isHashIdentifierToolActive()) return;

        if (e.target.id === 'hash-input' && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            performIdentify();
        }
    });

    // 实时识别（输入后延迟）
    let identifyTimeout = null;
    document.addEventListener('input', (e) => {
        if (!isHashIdentifierToolActive()) return;

        if (e.target.id === 'hash-input') {
            clearTimeout(identifyTimeout);
            identifyTimeout = setTimeout(() => {
                performIdentify();
            }, 500);
        }
    });

    // 导出到全局
    window.HashIdentifierTool = { identifyHash, getHashInfo };

})();
