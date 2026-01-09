/**
 * Protobuf 解码工具
 * @description Protocol Buffers / gRPC 无 Schema 解码
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // Wire 类型
    const WIRE_TYPES = {
        0: 'Varint',
        1: '64-bit',
        2: 'Length-delimited',
        3: 'Start group (deprecated)',
        4: 'End group (deprecated)',
        5: '32-bit'
    };

    // 当前状态
    let currentFields = null;
    let currentView = 'table';
    let jsonEditor = null; // CodeMirror JSON 编辑器实例

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
        // 处理 URL-safe base64
        base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
        // 添加 padding
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

    function isHex(str) {
        return /^[0-9a-fA-F\s\n\r]+$/.test(str);
    }

    function isBase64(str) {
        return /^[A-Za-z0-9+/=\-_\s\n\r]+$/.test(str) && !isHex(str.replace(/[\s\n\r]/g, ''));
    }

    function detectAndConvert(input, forceGrpc = false) {
        input = input.trim();
        let data;

        // 尝试检测格式
        if (isHex(input)) {
            data = hexToBytes(input);
        } else if (isBase64(input)) {
            data = base64ToBytes(input);
        } else {
            throw new Error('无法识别的输入格式，请输入十六进制或 Base64 编码的数据');
        }

        // gRPC 模式：跳过 5 字节头 (1 byte compressed flag + 4 bytes length)
        if (forceGrpc && data.length > 5) {
            data = data.slice(5);
        }

        return data;
    }

    // ========== Protobuf 解析 ==========

    function readVarint(data, offset) {
        let result = 0n;
        let shift = 0n;
        let bytesRead = 0;

        while (offset < data.length) {
            const byte = data[offset];
            result |= BigInt(byte & 0x7f) << shift;
            bytesRead++;
            offset++;

            if ((byte & 0x80) === 0) {
                break;
            }
            shift += 7n;

            if (shift > 63n) {
                throw new Error('Varint 过长');
            }
        }

        return { value: result, bytesRead };
    }

    function zigzagDecode(n) {
        return (n >> 1n) ^ -(n & 1n);
    }

    // 二进制补码解释
    function interpretAsTwosComplement(n, bits) {
        const signBit = 1n << BigInt(bits - 1);
        if ((n & signBit) !== 0n) {
            return n - (1n << BigInt(bits));
        }
        return n;
    }

    /**
     * 解析 Protobuf 数据
     * @param {Uint8Array} data - 原始数据
     * @param {number} offset - 起始偏移量
     * @param {number} depth - 当前递归深度
     * @param {number} maxDepth - 最大递归深度
     * @returns {{ parts: Array, leftOver: Uint8Array }}
     */
    function parseProtobuf(data, offset = 0, depth = 0, maxDepth = 10) {
        const parts = [];
        let savedOffset = offset;

        while (offset < data.length && depth < maxDepth) {
            try {
                savedOffset = offset;
                const startOffset = offset;
                const tagResult = readVarint(data, offset);
                const tag = tagResult.value;
                offset += tagResult.bytesRead;

                const fieldNumber = Number(tag >> 3n);
                const wireType = Number(tag & 0x7n);

                if (fieldNumber === 0) {
                    break;
                }

                const field = {
                    fieldNumber,
                    wireType,
                    wireTypeName: WIRE_TYPES[wireType] || 'Unknown',
                    byteRange: [startOffset, 0]
                };

                switch (wireType) {
                    case 0: // Varint
                        const varintResult = readVarint(data, offset);
                        const varintValue = varintResult.value;
                        field.rawValue = varintValue.toString();
                        field.value = varintValue;
                        offset += varintResult.bytesRead;
                        break;

                    case 1: // 64-bit (fixed64)
                        if (offset + 8 > data.length) {
                            throw new Error('数据不完整');
                        }
                        field.value = data.slice(offset, offset + 8);
                        field.rawHex = bytesToHex(field.value, '');
                        offset += 8;
                        break;

                    case 2: // Length-delimited
                        const lengthResult = readVarint(data, offset);
                        const length = Number(lengthResult.value);
                        offset += lengthResult.bytesRead;

                        if (offset + length > data.length) {
                            throw new Error('数据不完整');
                        }

                        field.value = data.slice(offset, offset + length);
                        field.length = length;
                        offset += length;
                        break;

                    case 5: // 32-bit (fixed32)
                        if (offset + 4 > data.length) {
                            throw new Error('数据不完整');
                        }
                        field.value = data.slice(offset, offset + 4);
                        field.rawHex = bytesToHex(field.value, '');
                        offset += 4;
                        break;

                    case 3:
                    case 4:
                        // deprecated group types
                        break;

                    default:
                        throw new Error(`未知的 wire 类型: ${wireType}`);
                }

                field.byteRange[1] = offset;
                parts.push(field);

            } catch (e) {
                offset = savedOffset;
                break;
            }
        }

        return {
            parts,
            leftOver: data.slice(offset)
        };
    }

    /**
     * 解码 varint 的多种可能解释
     * @param {bigint} value - varint 原始值
     * @returns {Array<{type: string, value: string}>}
     */
    function decodeVarintParts(value) {
        const result = [];
        const uintVal = value;
        result.push({ type: 'uint', value: uintVal.toString() });

        // 尝试不同位宽的二进制补码解释
        for (const bits of [8, 16, 32, 64]) {
            const intVal = interpretAsTwosComplement(uintVal, bits);
            if (intVal.toString() !== uintVal.toString()) {
                result.push({ type: `int${bits}`, value: intVal.toString() });
            }
        }

        // sint (zigzag 解码)
        const sintVal = zigzagDecode(uintVal);
        if (sintVal.toString() !== uintVal.toString()) {
            result.push({ type: 'sint', value: sintVal.toString() });
        }

        return result;
    }

    /**
     * 解码 fixed32 的多种可能解释
     * @param {Uint8Array} value - 4 字节数据
     * @returns {Array<{type: string, value: string}>}
     */
    function decodeFixed32(value) {
        const view = new DataView(new Uint8Array(value).buffer);
        const intValue = view.getInt32(0, true);
        const uintValue = view.getUint32(0, true);
        const floatValue = view.getFloat32(0, true);

        const result = [];
        result.push({ type: 'int', value: intValue.toString() });
        if (intValue !== uintValue) {
            result.push({ type: 'uint', value: uintValue.toString() });
        }
        result.push({ type: 'float', value: floatValue.toString() });

        return result;
    }

    /**
     * 解码 fixed64 的多种可能解释
     * @param {Uint8Array} value - 8 字节数据
     * @returns {Array<{type: string, value: string}>}
     */
    function decodeFixed64(value) {
        const view = new DataView(new Uint8Array(value).buffer);
        const uintValue = view.getBigUint64(0, true);
        const intValue = view.getBigInt64(0, true);
        const doubleValue = view.getFloat64(0, true);

        const result = [];
        result.push({ type: 'int', value: intValue.toString() });
        if (intValue.toString() !== uintValue.toString()) {
            result.push({ type: 'uint', value: uintValue.toString() });
        }
        result.push({ type: 'double', value: doubleValue.toString() });

        return result;
    }

    /**
     * 解码 length-delimited 为字符串或字节
     * @param {Uint8Array} value - 字节数据
     * @returns {{type: string, value: string}}
     */
    function decodeStringOrBytes(value) {
        if (!value || value.length === 0) {
            return { type: 'string|bytes', value: '' };
        }
        try {
            const str = new TextDecoder('utf-8', { fatal: true }).decode(value);
            return { type: 'string', value: str };
        } catch (e) {
            return { type: 'bytes', value: bytesToHex(value, ' ') };
        }
    }

    /**
     * 获取字段的解析内容和子类型
     * @param {Object} part - 解析后的字段
     * @returns {{content: any, subType: string|null, nested: Object|null}}
     */
    function getPartContent(part) {
        switch (part.wireType) {
            case 0: // Varint
                return {
                    interpretations: decodeVarintParts(part.value),
                    subType: null,
                    nested: null
                };

            case 1: // 64-bit
                return {
                    interpretations: decodeFixed64(part.value),
                    subType: null,
                    nested: null
                };

            case 2: // Length-delimited
                // 首先尝试解析为嵌套 protobuf
                if (part.value.length > 0) {
                    const decoded = parseProtobuf(part.value, 0, 0, 10);
                    if (decoded.parts.length > 0 && decoded.leftOver.length === 0) {
                        return {
                            interpretations: null,
                            subType: 'protobuf',
                            nested: decoded
                        };
                    }
                }
                // 否则作为字符串或字节解释
                const strOrBytes = decodeStringOrBytes(part.value);
                return {
                    interpretations: [strOrBytes],
                    subType: strOrBytes.type,
                    nested: null
                };

            case 5: // 32-bit
                return {
                    interpretations: decodeFixed32(part.value),
                    subType: null,
                    nested: null
                };

            default:
                return {
                    interpretations: [{ type: 'unknown', value: 'Unknown type' }],
                    subType: null,
                    nested: null
                };
        }
    }

    /**
     * 将 wire 类型转换为可读字符串
     * @param {number} wireType - wire 类型
     * @param {string|null} subType - 子类型
     * @returns {string}
     */
    function wireTypeToString(wireType, subType) {
        switch (wireType) {
            case 0: return 'varint';
            case 1: return 'fixed64';
            case 2: return subType || 'len_delim';
            case 5: return 'fixed32';
            default: return 'unknown';
        }
    }

    // ========== 渲染函数 ==========

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    /**
     * 渲染树形视图 (使用新数据结构)
     * @param {{ parts: Array, leftOver: Uint8Array }} decoded - 解析结果
     * @param {number} depth - 当前深度
     * @returns {string} HTML
     */
    function renderTreeView(decoded, depth = 0) {
        const parts = decoded.parts || decoded;
        let html = '<ul class="protobuf-tree">';

        for (const part of parts) {
            const content = getPartContent(part);
            const typeStr = wireTypeToString(part.wireType, content.subType);

            html += '<li class="protobuf-field">';
            html += `<div class="field-header">`;
            html += `<span class="field-number">Field ${part.fieldNumber}</span>`;
            html += `<span class="wire-type">${typeStr}</span>`;

            // 显示主要值
            if (content.nested) {
                html += ` <span class="field-value nested">{${content.nested.parts.length} fields}</span>`;
            } else if (content.interpretations && content.interpretations.length > 0) {
                const primary = content.interpretations[0];
                const isString = primary.type === 'string';
                const valueClass = isString ? 'string' : 'number';
                const displayValue = isString ? `"${escapeHtml(primary.value)}"` : escapeHtml(primary.value);
                html += ` <span class="field-value ${valueClass}">${displayValue}</span>`;
            }

            // 字节范围
            html += ` <span class="field-meta">[${part.byteRange[0]}-${part.byteRange[1]}]</span>`;
            html += '</div>';

            // 显示其他解释
            if (content.interpretations && content.interpretations.length > 1) {
                const altInterps = content.interpretations.slice(1);
                if (altInterps.length > 0) {
                    const altText = altInterps.map(i => `${i.type}: ${i.value}`).join(' | ');
                    html += `<div class="field-alt">${escapeHtml(altText)}</div>`;
                }
            }

            // 嵌套消息
            if (content.nested) {
                html += renderTreeView(content.nested, depth + 1);
            }

            html += '</li>';
        }

        html += '</ul>';
        return html;
    }

    /**
     * 构建表格行数据 (使用新数据结构，匹配参考实现)
     * @param {{ parts: Array, leftOver: Uint8Array }} decoded - 解析结果
     * @returns {Array} 表格行数组
     */
    function buildTableRows(decoded) {
        const rows = [];
        const parts = decoded.parts || decoded;

        for (const part of parts) {
            const content = getPartContent(part);
            const typeStr = wireTypeToString(part.wireType, content.subType);

            // 构建内容显示
            let contentHtml = '';

            if (content.nested) {
                // 嵌套 protobuf，递归渲染为嵌套表格
                contentHtml = renderNestedTable(content.nested);
            } else if (content.interpretations) {
                // 显示解释 - 使用统一的样式结构
                contentHtml = '<div class="interp-list">';
                for (const interp of content.interpretations) {
                    let displayValue = String(interp.value);
                    // 截断过长的值
                    if (displayValue.length > 200) {
                        displayValue = displayValue.substring(0, 200) + '...';
                    }

                    // 根据类型应用不同样式
                    const valueClass = interp.type === 'string' ? 'value-string' :
                                      interp.type === 'bytes' ? 'value-bytes' : 'value-number';

                    contentHtml += `<div class="interp-item">`;
                    contentHtml += `<span class="interp-label">As ${escapeHtml(interp.type)}:</span> `;
                    contentHtml += `<span class="interp-value ${valueClass}">${escapeHtml(displayValue)}</span>`;
                    contentHtml += `</div>`;
                }
                contentHtml += '</div>';
            }

            rows.push({
                byteRange: `${part.byteRange[0]}-${part.byteRange[1]}`,
                field: part.fieldNumber,
                wireType: typeStr,
                content: contentHtml,
                hasNested: !!content.nested
            });
        }

        return rows;
    }

    /**
     * 渲染嵌套表格
     * @param {{ parts: Array, leftOver: Uint8Array }} decoded - 解析结果
     * @returns {string} HTML
     */
    function renderNestedTable(decoded) {
        let html = `<table class="nested-protobuf-table">
            <thead>
                <tr>
                    <th>Bytes</th>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Content</th>
                </tr>
            </thead>
            <tbody>`;

        const rows = buildTableRows(decoded);
        for (const row of rows) {
            html += `<tr>
                <td class="byte-range">${row.byteRange}</td>
                <td class="field-num">${row.field}</td>
                <td class="wire">${row.wireType}</td>
                <td class="content">${row.content}</td>
            </tr>`;
        }

        html += '</tbody></table>';
        return html;
    }

    /**
     * 渲染完整表格 HTML
     * @param {{ parts: Array, leftOver: Uint8Array }} decoded - 解析结果
     * @returns {string} HTML
     */
    function renderTableHtml(decoded) {
        let html = `<div class="table-container">
            <table class="protobuf-table">
                <thead>
                    <tr>
                        <th>Bytes</th>
                        <th>Field</th>
                        <th>Type</th>
                        <th>Content</th>
                    </tr>
                </thead>
                <tbody>`;

        const rows = buildTableRows(decoded);
        for (const row of rows) {
            const rowClass = row.hasNested ? 'row-nested' : '';
            html += `<tr class="${rowClass}">
                <td class="byte-range">${row.byteRange}</td>
                <td class="field-num">${row.field}</td>
                <td class="wire">${row.wireType}</td>
                <td class="content">${row.content}</td>
            </tr>`;
        }

        html += '</tbody></table></div>';
        return html;
    }

    /**
     * 将解析结果转换为 JSON 对象
     * @param {{ parts: Array, leftOver: Uint8Array }} decoded - 解析结果
     * @returns {Object}
     */
    function fieldsToJson(decoded) {
        const result = {};
        const parts = decoded.parts || decoded;

        for (const part of parts) {
            const key = `field_${part.fieldNumber}`;
            let value;

            const content = getPartContent(part);

            if (content.nested) {
                value = fieldsToJson(content.nested);
            } else if (content.interpretations && content.interpretations.length > 0) {
                const interps = content.interpretations;
                const stringInterp = interps.find(i => i.type === 'string');
                const numInterp = interps.find(i => ['uint', 'int', 'int8', 'int16', 'int32', 'int64'].includes(i.type));
                const floatInterp = interps.find(i => ['float', 'double'].includes(i.type));

                if (stringInterp) {
                    value = stringInterp.value;
                } else if (numInterp) {
                    const numStr = numInterp.value;
                    try {
                        const num = BigInt(numStr);
                        value = num <= Number.MAX_SAFE_INTEGER && num >= Number.MIN_SAFE_INTEGER
                            ? Number(num) : numStr;
                    } catch {
                        value = numStr;
                    }
                } else if (floatInterp) {
                    value = parseFloat(floatInterp.value);
                } else {
                    value = interps[0].value;
                }
            } else {
                value = null;
            }

            // 处理重复字段
            if (result[key] !== undefined) {
                if (!Array.isArray(result[key])) {
                    result[key] = [result[key]];
                }
                result[key].push(value);
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    function renderJsonView(fields) {
        // 返回编辑器容器的 HTML
        return '<div id="json-editor-container" class="json-editor-container"></div>';
    }

    /**
     * 初始化或更新 JSON 编辑器
     */
    async function initJsonEditor(jsonStr) {
        const container = document.getElementById('json-editor-container');
        if (!container) {
            console.warn('JSON editor container not found');
            return;
        }

        // 销毁旧的编辑器实例
        if (jsonEditor) {
            jsonEditor.destroy();
            jsonEditor = null;
        }

        // 验证 JSON 字符串完整性
        console.log('JSON string length:', jsonStr.length);

        // 检查 CodeEditor 是否可用
        if (!REOT.CodeEditor) {
            console.log('CodeEditor not available, using fallback');
            // 回退到普通的 pre/code 显示
            container.innerHTML = `<pre class="json-output"><code>${escapeHtml(jsonStr)}</code></pre>`;
            return;
        }

        try {
            const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

            jsonEditor = await REOT.CodeEditor.create(container, {
                language: 'json',
                value: jsonStr,
                readOnly: true,
                theme: theme,
                lineNumbers: true,
                foldGutter: true
            });

            // 验证编辑器内容
            const editorContent = jsonEditor.getValue();
            console.log('Editor content length:', editorContent.length);
            if (editorContent.length !== jsonStr.length) {
                console.warn('JSON content mismatch! Original:', jsonStr.length, 'Editor:', editorContent.length);
            }
        } catch (error) {
            console.error('Failed to initialize JSON editor:', error);
            // 回退到普通显示
            container.innerHTML = `<pre class="json-output"><code>${escapeHtml(jsonStr)}</code></pre>`;
        }
    }

    /**
     * 销毁 JSON 编辑器
     */
    function destroyJsonEditor() {
        if (jsonEditor) {
            jsonEditor.destroy();
            jsonEditor = null;
        }
    }

    /**
     * 渲染输出
     * @param {{ parts: Array, leftOver: Uint8Array }} decoded - 解析结果
     * @param {string} view - 视图类型
     * @param {string} infoHtml - 信息 HTML
     */
    async function renderOutput(decoded, view, infoHtml = '') {
        const output = document.getElementById('output');
        const outputActions = document.getElementById('output-actions');

        if (!decoded || !decoded.parts || decoded.parts.length === 0) {
            output.innerHTML = '<div class="error-state">未能解析出任何字段，请检查数据格式</div>';
            outputActions?.classList.add('hidden');
            output?.classList.remove('json-view-active');
            destroyJsonEditor();
            return;
        }

        // 如果不是 JSON 视图，销毁编辑器并移除类
        if (view !== 'json') {
            destroyJsonEditor();
            output?.classList.remove('json-view-active');
        } else {
            output?.classList.add('json-view-active');
        }

        let html = '';

        switch (view) {
            case 'tree':
                html = renderTreeView(decoded);
                break;
            case 'table':
                html = renderTableHtml(decoded);
                break;
            case 'json':
                html = renderJsonView(decoded);
                break;
        }

        // 一次性设置 HTML，包括 info
        output.innerHTML = infoHtml + html;
        outputActions?.classList.remove('hidden');

        // 如果是 JSON 视图，初始化编辑器
        if (view === 'json') {
            const json = fieldsToJson(decoded);
            const jsonStr = JSON.stringify(json, null, 2);
            await initJsonEditor(jsonStr);
        }
    }

    // ========== 主要功能 ==========

    async function decodeProtobuf() {
        const input = document.getElementById('input')?.value || '';
        const grpcMode = document.getElementById('grpc-mode')?.checked || false;
        const output = document.getElementById('output');

        if (!input.trim()) {
            if (output) output.innerHTML = '<div class="empty-state">请输入 Protobuf 数据</div>';
            document.getElementById('output-actions')?.classList.add('hidden');
            destroyJsonEditor();
            return;
        }

        try {
            const data = detectAndConvert(input, grpcMode);
            const decoded = parseProtobuf(data);

            currentFields = decoded;

            if (decoded.parts.length === 0) {
                if (output) output.innerHTML = '<div class="error-state">未能解析出任何字段，请检查数据格式</div>';
                return;
            }

            // 显示解析信息
            const leftOverInfo = decoded.leftOver.length > 0 ? `，剩余 ${decoded.leftOver.length} 字节未解析` : '';
            const infoHtml = `<div class="parse-info">解析了 ${data.length} 字节，找到 ${countFields(decoded)} 个字段${leftOverInfo}</div>`;

            // 一次性渲染输出，避免重复初始化编辑器
            await renderOutput(decoded, currentView, infoHtml);

            REOT.utils?.showNotification('解码成功', 'success');

        } catch (error) {
            if (output) {
                output.innerHTML = `<div class="error-state">解码错误: ${escapeHtml(error.message)}</div>`;
            }
            document.getElementById('output-actions')?.classList.add('hidden');
            destroyJsonEditor();
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    /**
     * 递归计算字段数量
     * @param {{ parts: Array, leftOver: Uint8Array }} decoded - 解析结果
     * @returns {number}
     */
    function countFields(decoded) {
        const parts = decoded.parts || decoded;
        let count = parts.length;
        for (const part of parts) {
            const content = getPartContent(part);
            if (content.nested) {
                count += countFields(content.nested);
            }
        }
        return count;
    }

    // 示例数据: 复杂的 Protobuf 消息，包含多种字段类型
    const SAMPLE_DATA = '08d2a4808204100218dacbaafd032204313233332a1337353332373331343934313331313839323536320a323134323834303535313a0634302e302e33421c7630352e30302e30302d616c7068612e352d6f762d616e64726f696448c08080505208000000000000000060b4e49e930d6a06d8954de437b872065eafe04f83fd7a1308e205100a1804280c300638f4fff7810d400a82011941773339454b69345f687a73426a316d61456b7a76386b592d8801b4e49e930d9201100dc81b6dc87ce87cf3be2890d07fe2299a01202fa2f3ad3f63f54340e27b971d0a66976c75b600194af04fb9d0587a1f8eddeaa2010130a801e205ba011d0a07506978656c203610121a0a676f6f676c65706c61792080808a8003c20184014d44476e475a6a51723355424c5468307954426f6b39537a6e72497147585967554446396f766b50535561486668794c4657777748516376534569794e514f6d32656b464967544f7852535a7641374f55506232574647586b54715056725a56656f706e6d68564b374451787263415546752f6a706e34554e6e4864766f504c4176453dc8010ad201100810120c95c422a691f6f51729912e8bd801f4fff7810de001b609e8010af00106f80184eba78e0682021a645ff7b6088eb3d991a1d58867810f67263c763047f94818866d880204';

    function isProtobufToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/protocol/protobuf');
    }

    // ========== 事件处理 ==========

    document.addEventListener('change', (e) => {
        if (!isProtobufToolActive()) return;

        if (e.target.id === 'file-input') {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const bytes = new Uint8Array(event.target.result);
                const input = document.getElementById('input');
                if (input) {
                    input.value = bytesToHex(bytes, '');
                }
                decodeProtobuf();
            };
            reader.readAsArrayBuffer(file);
        }
    });

    document.addEventListener('click', async (e) => {
        if (!isProtobufToolActive()) return;

        const target = e.target;

        if (target.id === 'decode-btn' || target.closest('#decode-btn')) {
            decodeProtobuf();
        }

        if (target.id === 'sample-btn' || target.closest('#sample-btn')) {
            const input = document.getElementById('input');
            if (input) input.value = SAMPLE_DATA;
            decodeProtobuf();
        }

        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            const input = document.getElementById('input');
            const output = document.getElementById('output');
            if (input) input.value = '';
            if (output) {
                output.innerHTML = '<div class="empty-state">请输入 Protobuf 数据并点击解码</div>';
                output.classList.remove('json-view-active');
            }
            document.getElementById('output-actions')?.classList.add('hidden');
            currentFields = null;
            destroyJsonEditor();
        }

        // 视图切换
        if (target.classList.contains('view-tab')) {
            const view = target.dataset.view;
            if (view && currentFields) {
                // 更新标签状态
                document.querySelectorAll('.view-tab').forEach(tab => tab.classList.remove('active'));
                target.classList.add('active');

                currentView = view;

                // 保留解析信息
                const parseInfo = document.querySelector('.parse-info');
                const infoHtml = parseInfo ? parseInfo.outerHTML : '';

                // 一次性渲染，避免重复初始化
                await renderOutput(currentFields, view, infoHtml);
            }
        }

        // 复制输出
        if (target.id === 'copy-output-btn' || target.closest('#copy-output-btn')) {
            if (currentFields) {
                let textToCopy = '';
                if (currentView === 'json') {
                    textToCopy = JSON.stringify(fieldsToJson(currentFields), null, 2);
                } else {
                    textToCopy = JSON.stringify(currentFields, null, 2);
                }
                const success = await REOT.utils?.copyToClipboard(textToCopy);
                if (success) {
                    REOT.utils?.showNotification('已复制到剪贴板', 'success');
                }
            }
        }

        // 下载 JSON
        if (target.id === 'download-json-btn' || target.closest('#download-json-btn')) {
            if (currentFields) {
                const json = JSON.stringify(fieldsToJson(currentFields), null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'protobuf-decoded.json';
                a.click();
                URL.revokeObjectURL(url);
                REOT.utils?.showNotification('JSON 文件已下载', 'success');
            }
        }
    });

    window.ProtobufTool = { parseProtobuf, decodeProtobuf, fieldsToJson };

})();
