/**
 * CBOR 编解码工具
 * @description Concise Binary Object Representation (RFC 8949) 编码与解码
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // ==================== CBOR 库动态加载 ====================

    let cborLoaded = false;
    let cborLoadingPromise = null;

    /**
     * 动态加载 CBOR 库
     */
    function loadCBORLibrary() {
        if (cborLoaded && typeof CBOR !== 'undefined') {
            return Promise.resolve();
        }

        if (cborLoadingPromise) {
            return cborLoadingPromise;
        }

        cborLoadingPromise = new Promise((resolve, reject) => {
            if (typeof CBOR !== 'undefined') {
                cborLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            const basePath = window.REOT?.router?.pathPrefix || '';
            script.src = `${basePath}/libs/cbor/cbor.min.js`;
            script.onload = () => {
                cborLoaded = true;
                resolve();
            };
            script.onerror = () => {
                cborLoadingPromise = null;
                reject(new Error('无法加载 CBOR 库'));
            };
            document.head.appendChild(script);
        });

        return cborLoadingPromise;
    }

    // ==================== DOM 元素 ====================

    // 模式切换
    const encodeTab = document.getElementById('encode-tab');
    const decodeTab = document.getElementById('decode-tab');
    const encodeSection = document.getElementById('encode-section');
    const decodeSection = document.getElementById('decode-section');

    // 编码相关
    const encodeInput = document.getElementById('encode-input');
    const encodeOutput = document.getElementById('encode-output');
    const encodeBtn = document.getElementById('encode-btn');
    const encodeClearBtn = document.getElementById('encode-clear-btn');
    const encodeCopyBtn = document.getElementById('encode-copy-btn');
    const encodeDownloadBtn = document.getElementById('encode-download-btn');
    const encodeInfo = document.getElementById('encode-info');
    const encodeByteSize = document.getElementById('encode-byte-size');

    // 解码相关
    const decodeInput = document.getElementById('decode-input');
    const decodeOutput = document.getElementById('decode-output');
    const decodeBtn = document.getElementById('decode-btn');
    const decodeClearBtn = document.getElementById('decode-clear-btn');
    const decodeCopyBtn = document.getElementById('decode-copy-btn');
    const prettyOutputCheckbox = document.getElementById('pretty-output');
    const cborFileInput = document.getElementById('cbor-file-input');
    const uploadFileBtn = document.getElementById('upload-file-btn');

    // 当前编码的 ArrayBuffer (用于下载)
    let currentEncodedBuffer = null;

    // ==================== 工具函数 ====================

    /**
     * Hex 字符串转 ArrayBuffer
     */
    function hexToArrayBuffer(hex) {
        const cleaned = hex.replace(/\s/g, '');
        const bytes = new Uint8Array(cleaned.length / 2);
        for (let i = 0; i < cleaned.length; i += 2) {
            bytes[i / 2] = parseInt(cleaned.substr(i, 2), 16);
        }
        return bytes.buffer;
    }

    /**
     * ArrayBuffer 转 Hex
     */
    function arrayBufferToHex(buffer) {
        const bytes = new Uint8Array(buffer);
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * ArrayBuffer 转 Base64
     */
    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        return btoa(binary);
    }

    /**
     * Base64 转 ArrayBuffer
     */
    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * 验证 Hex 字符串
     */
    function isValidHex(str) {
        const cleaned = str.replace(/\s/g, '');
        return /^[0-9a-fA-F]*$/.test(cleaned) && cleaned.length % 2 === 0;
    }

    /**
     * 验证 Base64 字符串
     */
    function isValidBase64(str) {
        try {
            atob(str.trim());
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 获取选中的编码格式
     */
    function getEncodeFormat() {
        const radio = document.querySelector('input[name="encode-format"]:checked');
        return radio ? radio.value : 'hex';
    }

    /**
     * 获取选中的解码输入格式
     */
    function getDecodeInputFormat() {
        const radio = document.querySelector('input[name="decode-input-format"]:checked');
        return radio ? radio.value : 'hex';
    }

    // ==================== 模式切换 ====================

    function switchMode(mode) {
        if (mode === 'encode') {
            encodeTab.classList.add('active');
            decodeTab.classList.remove('active');
            encodeSection.style.display = 'block';
            decodeSection.style.display = 'none';
        } else {
            encodeTab.classList.remove('active');
            decodeTab.classList.add('active');
            encodeSection.style.display = 'none';
            decodeSection.style.display = 'block';
        }
    }

    // ==================== 编码操作 ====================

    /**
     * 将 JSON 编码为 CBOR
     */
    async function encodeCBOR() {
        try {
            // 先加载库
            await loadCBORLibrary();

            const jsonStr = encodeInput.value.trim();
            if (!jsonStr) {
                encodeOutput.value = REOT.i18n?.t('tools.cbor.errorNoInput') || '请输入 JSON 数据';
                encodeInfo.style.display = 'none';
                return;
            }

            // 解析 JSON
            let data;
            try {
                data = JSON.parse(jsonStr);
            } catch (e) {
                throw new Error('无效的 JSON 格式: ' + e.message);
            }

            // 编码为 CBOR
            const encoded = CBOR.encode(data);
            currentEncodedBuffer = encoded;

            // 格式化输出
            const format = getEncodeFormat();
            if (format === 'base64') {
                encodeOutput.value = arrayBufferToBase64(encoded);
            } else {
                encodeOutput.value = arrayBufferToHex(encoded);
            }

            // 显示字节大小
            encodeByteSize.textContent = encoded.byteLength;
            encodeInfo.style.display = 'block';

            REOT.utils?.showNotification(REOT.i18n?.t('tools.cbor.encodeSuccess') || '编码成功', 'success');

        } catch (error) {
            encodeOutput.value = (REOT.i18n?.t('tools.cbor.error') || '错误: ') + error.message;
            encodeInfo.style.display = 'none';
            currentEncodedBuffer = null;
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    /**
     * 清除编码区域
     */
    function clearEncode() {
        encodeInput.value = '';
        encodeOutput.value = '';
        encodeInfo.style.display = 'none';
        currentEncodedBuffer = null;
    }

    /**
     * 复制编码结果
     */
    async function copyEncodeResult() {
        const output = encodeOutput.value;
        if (output && !output.startsWith('请') && !output.startsWith('错误')) {
            const success = await REOT.utils?.copyToClipboard(output);
            if (success) {
                REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
            }
        }
    }

    /**
     * 下载 CBOR 文件
     */
    function downloadCBOR() {
        if (!currentEncodedBuffer) {
            REOT.utils?.showNotification(REOT.i18n?.t('tools.cbor.errorNoData') || '没有可下载的数据', 'warning');
            return;
        }

        const blob = new Blob([currentEncodedBuffer], { type: 'application/cbor' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.cbor';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        REOT.utils?.showNotification(REOT.i18n?.t('tools.cbor.downloadSuccess') || '下载成功', 'success');
    }

    // ==================== 解码操作 ====================

    /**
     * 将 CBOR 解码为 JSON
     */
    async function decodeCBOR() {
        try {
            // 先加载库
            await loadCBORLibrary();

            const input = decodeInput.value.trim();
            if (!input) {
                decodeOutput.value = REOT.i18n?.t('tools.cbor.errorNoInput') || '请输入 CBOR 数据';
                return;
            }

            // 转换输入为 ArrayBuffer
            let buffer;
            const format = getDecodeInputFormat();

            if (format === 'base64') {
                if (!isValidBase64(input)) {
                    throw new Error('无效的 Base64 格式');
                }
                buffer = base64ToArrayBuffer(input);
            } else {
                if (!isValidHex(input)) {
                    throw new Error('无效的 Hex 格式');
                }
                buffer = hexToArrayBuffer(input);
            }

            // 解码 CBOR
            const decoded = CBOR.decode(buffer);

            // 格式化输出
            const pretty = prettyOutputCheckbox.checked;
            if (pretty) {
                decodeOutput.value = JSON.stringify(decoded, null, 2);
            } else {
                decodeOutput.value = JSON.stringify(decoded);
            }

            REOT.utils?.showNotification(REOT.i18n?.t('tools.cbor.decodeSuccess') || '解码成功', 'success');

        } catch (error) {
            decodeOutput.value = (REOT.i18n?.t('tools.cbor.error') || '错误: ') + error.message;
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    /**
     * 清除解码区域
     */
    function clearDecode() {
        decodeInput.value = '';
        decodeOutput.value = '';
    }

    /**
     * 复制解码结果
     */
    async function copyDecodeResult() {
        const output = decodeOutput.value;
        if (output && !output.startsWith('请') && !output.startsWith('错误')) {
            const success = await REOT.utils?.copyToClipboard(output);
            if (success) {
                REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
            }
        }
    }

    /**
     * 处理文件上传
     */
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const buffer = e.target.result;
            // 将文件内容转为 Hex 显示
            decodeInput.value = arrayBufferToHex(buffer);

            // 切换到 Hex 格式
            const hexRadio = document.querySelector('input[name="decode-input-format"][value="hex"]');
            if (hexRadio) hexRadio.checked = true;

            REOT.utils?.showNotification(
                (REOT.i18n?.t('tools.cbor.fileLoaded') || '文件已加载') + `: ${file.name}`,
                'success'
            );
        };
        reader.onerror = function() {
            REOT.utils?.showNotification(REOT.i18n?.t('tools.cbor.fileError') || '文件读取失败', 'error');
        };
        reader.readAsArrayBuffer(file);
    }

    // ==================== 事件绑定 ====================

    // 模式切换
    if (encodeTab) {
        encodeTab.addEventListener('click', () => switchMode('encode'));
    }
    if (decodeTab) {
        decodeTab.addEventListener('click', () => switchMode('decode'));
    }

    // 编码操作
    if (encodeBtn) {
        encodeBtn.addEventListener('click', encodeCBOR);
    }
    if (encodeClearBtn) {
        encodeClearBtn.addEventListener('click', clearEncode);
    }
    if (encodeCopyBtn) {
        encodeCopyBtn.addEventListener('click', copyEncodeResult);
    }
    if (encodeDownloadBtn) {
        encodeDownloadBtn.addEventListener('click', downloadCBOR);
    }

    // 编码格式切换时更新输出
    document.querySelectorAll('input[name="encode-format"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (currentEncodedBuffer) {
                const format = getEncodeFormat();
                if (format === 'base64') {
                    encodeOutput.value = arrayBufferToBase64(currentEncodedBuffer);
                } else {
                    encodeOutput.value = arrayBufferToHex(currentEncodedBuffer);
                }
            }
        });
    });

    // 解码操作
    if (decodeBtn) {
        decodeBtn.addEventListener('click', decodeCBOR);
    }
    if (decodeClearBtn) {
        decodeClearBtn.addEventListener('click', clearDecode);
    }
    if (decodeCopyBtn) {
        decodeCopyBtn.addEventListener('click', copyDecodeResult);
    }

    // 文件上传
    if (uploadFileBtn) {
        uploadFileBtn.addEventListener('click', () => cborFileInput.click());
    }
    if (cborFileInput) {
        cborFileInput.addEventListener('change', handleFileUpload);
    }

    // ==================== 初始化 ====================

    // 设置默认示例
    if (encodeInput && !encodeInput.value) {
        encodeInput.value = JSON.stringify({
            name: "CBOR Example",
            version: 1,
            enabled: true,
            tags: ["binary", "compact"],
            metadata: {
                created: "2024-01-01"
            }
        }, null, 2);
    }

    // 导出到全局
    window.CBORTool = {
        encode: encodeCBOR,
        decode: decodeCBOR,
        hexToArrayBuffer,
        arrayBufferToHex,
        arrayBufferToBase64,
        base64ToArrayBuffer
    };

})();
