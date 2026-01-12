/**
 * Plist 解析工具
 * @description Apple Property List 解析（XML 和二进制格式）
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 当前状态
    let currentResult = null;
    let currentView = 'tree';
    let currentFormat = 'xml';

    // 二进制 plist 魔数
    const BPLIST_MAGIC = 'bplist';

    // ========== 工具函数 ==========

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    function bytesToHex(bytes, separator = ' ') {
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join(separator);
    }

    // ========== XML Plist 解析 ==========

    function parseXmlPlist(xmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, 'text/xml');

        // 检查解析错误
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            throw new Error('XML 解析错误: ' + parseError.textContent);
        }

        // 查找 plist 根元素
        const plist = doc.querySelector('plist');
        if (!plist) {
            throw new Error('无效的 Plist: 缺少 <plist> 根元素');
        }

        // 获取第一个子元素（dict, array, string 等）
        const firstChild = getFirstElementChild(plist);
        if (!firstChild) {
            return null;
        }

        return parseXmlElement(firstChild);
    }

    function getFirstElementChild(node) {
        for (let child = node.firstChild; child; child = child.nextSibling) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                return child;
            }
        }
        return null;
    }

    function getElementChildren(node) {
        const children = [];
        for (let child = node.firstChild; child; child = child.nextSibling) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                children.push(child);
            }
        }
        return children;
    }

    function parseXmlElement(element) {
        const tagName = element.tagName.toLowerCase();

        switch (tagName) {
            case 'dict':
                return parseDictElement(element);

            case 'array':
                return parseArrayElement(element);

            case 'string':
                return {
                    type: 'string',
                    value: element.textContent || ''
                };

            case 'integer':
                return {
                    type: 'integer',
                    value: parseInt(element.textContent, 10)
                };

            case 'real':
                return {
                    type: 'real',
                    value: parseFloat(element.textContent)
                };

            case 'true':
                return {
                    type: 'boolean',
                    value: true
                };

            case 'false':
                return {
                    type: 'boolean',
                    value: false
                };

            case 'date':
                return {
                    type: 'date',
                    value: element.textContent
                };

            case 'data':
                return {
                    type: 'data',
                    value: element.textContent.trim()
                };

            default:
                return {
                    type: 'unknown',
                    tag: tagName,
                    value: element.textContent
                };
        }
    }

    function parseDictElement(element) {
        const entries = [];
        const children = getElementChildren(element);

        for (let i = 0; i < children.length; i += 2) {
            const keyElement = children[i];
            const valueElement = children[i + 1];

            if (!keyElement || keyElement.tagName.toLowerCase() !== 'key') {
                throw new Error('Dict 格式错误: 期望 <key> 元素');
            }

            if (!valueElement) {
                throw new Error('Dict 格式错误: 缺少值元素');
            }

            entries.push({
                key: keyElement.textContent,
                value: parseXmlElement(valueElement)
            });
        }

        return {
            type: 'dict',
            value: entries
        };
    }

    function parseArrayElement(element) {
        const items = [];
        const children = getElementChildren(element);

        for (const child of children) {
            items.push(parseXmlElement(child));
        }

        return {
            type: 'array',
            value: items
        };
    }

    // ========== 二进制 Plist 解析 ==========

    class BinaryPlistParser {
        constructor(buffer) {
            this.buffer = new Uint8Array(buffer);
            this.view = new DataView(buffer);
            this.objects = [];
            this.offsetSize = 0;
            this.objectRefSize = 0;
            this.numObjects = 0;
            this.topObjectOffset = 0;
            this.offsetTableOffset = 0;
        }

        parse() {
            // 检查魔数
            const magic = String.fromCharCode(...this.buffer.slice(0, 6));
            if (magic !== BPLIST_MAGIC) {
                throw new Error('无效的二进制 Plist: 魔数不匹配');
            }

            // 读取 trailer (最后 32 字节)
            const trailerOffset = this.buffer.length - 32;

            // offset size (1 byte at offset 6)
            this.offsetSize = this.buffer[trailerOffset + 6];

            // object ref size (1 byte at offset 7)
            this.objectRefSize = this.buffer[trailerOffset + 7];

            // num objects (8 bytes at offset 8)
            this.numObjects = Number(this.view.getBigUint64(trailerOffset + 8, false));

            // top object offset (8 bytes at offset 16)
            this.topObjectOffset = Number(this.view.getBigUint64(trailerOffset + 16, false));

            // offset table offset (8 bytes at offset 24)
            this.offsetTableOffset = Number(this.view.getBigUint64(trailerOffset + 24, false));

            // 读取偏移表
            const offsets = this.readOffsetTable();

            // 解析所有对象
            for (let i = 0; i < this.numObjects; i++) {
                this.objects[i] = this.parseObject(offsets[i]);
            }

            // 返回顶层对象
            return this.objects[this.topObjectOffset];
        }

        readOffsetTable() {
            const offsets = [];
            let pos = this.offsetTableOffset;

            for (let i = 0; i < this.numObjects; i++) {
                offsets.push(this.readSizedInt(pos, this.offsetSize));
                pos += this.offsetSize;
            }

            return offsets;
        }

        readSizedInt(offset, size) {
            let value = 0;
            for (let i = 0; i < size; i++) {
                value = (value << 8) | this.buffer[offset + i];
            }
            return value;
        }

        parseObject(offset) {
            const marker = this.buffer[offset];
            const objectType = (marker & 0xf0) >> 4;
            const objectInfo = marker & 0x0f;

            switch (objectType) {
                case 0x0: // null, bool, fill
                    return this.parseSimple(objectInfo);

                case 0x1: // int
                    return this.parseInt(offset, objectInfo);

                case 0x2: // real
                    return this.parseReal(offset, objectInfo);

                case 0x3: // date
                    return this.parseDate(offset);

                case 0x4: // data
                    return this.parseData(offset, objectInfo);

                case 0x5: // ascii string
                    return this.parseAsciiString(offset, objectInfo);

                case 0x6: // unicode string
                    return this.parseUnicodeString(offset, objectInfo);

                case 0xa: // array
                    return this.parseArray(offset, objectInfo);

                case 0xd: // dict
                    return this.parseDict(offset, objectInfo);

                default:
                    return { type: 'unknown', marker: marker.toString(16) };
            }
        }

        parseSimple(info) {
            switch (info) {
                case 0x0:
                    return { type: 'null', value: null };
                case 0x8:
                    return { type: 'boolean', value: false };
                case 0x9:
                    return { type: 'boolean', value: true };
                default:
                    return { type: 'fill', value: null };
            }
        }

        parseInt(offset, info) {
            const size = 1 << info;
            let value;

            if (size <= 4) {
                value = this.readSizedInt(offset + 1, size);
            } else {
                value = Number(this.view.getBigInt64(offset + 1, false));
            }

            return { type: 'integer', value };
        }

        parseReal(offset, info) {
            const size = 1 << info;
            let value;

            if (size === 4) {
                value = this.view.getFloat32(offset + 1, false);
            } else {
                value = this.view.getFloat64(offset + 1, false);
            }

            return { type: 'real', value };
        }

        parseDate(offset) {
            const timestamp = this.view.getFloat64(offset + 1, false);
            // Apple 时间戳是从 2001-01-01 开始的秒数
            const date = new Date((timestamp + 978307200) * 1000);
            return { type: 'date', value: date.toISOString() };
        }

        getLength(offset, info) {
            if (info === 0x0f) {
                const intMarker = this.buffer[offset + 1];
                const intInfo = intMarker & 0x0f;
                const intSize = 1 << intInfo;
                const length = this.readSizedInt(offset + 2, intSize);
                return { length, headerSize: 2 + intSize };
            }
            return { length: info, headerSize: 1 };
        }

        parseData(offset, info) {
            const { length, headerSize } = this.getLength(offset, info);
            const data = this.buffer.slice(offset + headerSize, offset + headerSize + length);
            return { type: 'data', value: btoa(String.fromCharCode(...data)) };
        }

        parseAsciiString(offset, info) {
            const { length, headerSize } = this.getLength(offset, info);
            const bytes = this.buffer.slice(offset + headerSize, offset + headerSize + length);
            const str = String.fromCharCode(...bytes);
            return { type: 'string', value: str };
        }

        parseUnicodeString(offset, info) {
            const { length, headerSize } = this.getLength(offset, info);
            const bytes = this.buffer.slice(offset + headerSize, offset + headerSize + length * 2);
            let str = '';
            for (let i = 0; i < bytes.length; i += 2) {
                str += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
            }
            return { type: 'string', value: str };
        }

        parseArray(offset, info) {
            const { length, headerSize } = this.getLength(offset, info);
            const items = [];

            for (let i = 0; i < length; i++) {
                const refOffset = offset + headerSize + i * this.objectRefSize;
                const ref = this.readSizedInt(refOffset, this.objectRefSize);
                items.push(this.objects[ref] || { type: 'ref', value: ref });
            }

            return { type: 'array', value: items };
        }

        parseDict(offset, info) {
            const { length, headerSize } = this.getLength(offset, info);
            const entries = [];
            const keysStart = offset + headerSize;
            const valuesStart = keysStart + length * this.objectRefSize;

            for (let i = 0; i < length; i++) {
                const keyRef = this.readSizedInt(keysStart + i * this.objectRefSize, this.objectRefSize);
                const valueRef = this.readSizedInt(valuesStart + i * this.objectRefSize, this.objectRefSize);

                const keyObj = this.objects[keyRef];
                const valueObj = this.objects[valueRef];

                entries.push({
                    key: keyObj?.value || `ref:${keyRef}`,
                    value: valueObj || { type: 'ref', value: valueRef }
                });
            }

            return { type: 'dict', value: entries };
        }
    }

    function parseBinaryPlist(buffer) {
        const parser = new BinaryPlistParser(buffer);
        return parser.parse();
    }

    // ========== 转换函数 ==========

    function plistToJson(plistObj) {
        if (!plistObj) return null;

        switch (plistObj.type) {
            case 'dict':
                const obj = {};
                for (const entry of plistObj.value) {
                    obj[entry.key] = plistToJson(entry.value);
                }
                return obj;

            case 'array':
                return plistObj.value.map(plistToJson);

            case 'string':
            case 'integer':
            case 'real':
            case 'boolean':
            case 'date':
                return plistObj.value;

            case 'data':
                return `<data>${plistObj.value}</data>`;

            case 'null':
                return null;

            default:
                return plistObj.value;
        }
    }

    function plistToXml(plistObj, indent = 0) {
        const pad = '  '.repeat(indent);

        if (!plistObj) return `${pad}<string></string>`;

        switch (plistObj.type) {
            case 'dict':
                let dictXml = `${pad}<dict>\n`;
                for (const entry of plistObj.value) {
                    dictXml += `${pad}  <key>${escapeXmlText(entry.key)}</key>\n`;
                    dictXml += plistToXml(entry.value, indent + 1) + '\n';
                }
                dictXml += `${pad}</dict>`;
                return dictXml;

            case 'array':
                let arrXml = `${pad}<array>\n`;
                for (const item of plistObj.value) {
                    arrXml += plistToXml(item, indent + 1) + '\n';
                }
                arrXml += `${pad}</array>`;
                return arrXml;

            case 'string':
                return `${pad}<string>${escapeXmlText(plistObj.value)}</string>`;

            case 'integer':
                return `${pad}<integer>${plistObj.value}</integer>`;

            case 'real':
                return `${pad}<real>${plistObj.value}</real>`;

            case 'boolean':
                return `${pad}<${plistObj.value ? 'true' : 'false'}/>`;

            case 'date':
                return `${pad}<date>${plistObj.value}</date>`;

            case 'data':
                return `${pad}<data>${plistObj.value}</data>`;

            default:
                return `${pad}<string>${escapeXmlText(String(plistObj.value || ''))}</string>`;
        }
    }

    function escapeXmlText(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // ========== 渲染函数 ==========

    function renderTreeView(plistObj, indent = 0) {
        if (!plistObj) return '<span class="tree-value">null</span>';

        switch (plistObj.type) {
            case 'dict':
                if (plistObj.value.length === 0) {
                    return `<span class="tree-value">{}</span><span class="tree-type">(dict)</span>`;
                }
                let dictHtml = `<span class="tree-toggle">{</span><span class="tree-type">(dict:${plistObj.value.length})</span><ul>`;
                for (const entry of plistObj.value) {
                    dictHtml += `<li class="tree-item">`;
                    dictHtml += `<span class="tree-key">"${escapeHtml(entry.key)}"</span><span class="tree-colon">:</span>`;
                    dictHtml += renderTreeView(entry.value, indent + 1);
                    dictHtml += `</li>`;
                }
                dictHtml += `</ul><span class="tree-toggle">}</span>`;
                return dictHtml;

            case 'array':
                if (plistObj.value.length === 0) {
                    return `<span class="tree-value">[]</span><span class="tree-type">(array)</span>`;
                }
                let arrHtml = `<span class="tree-toggle">[</span><span class="tree-type">(array:${plistObj.value.length})</span><ul>`;
                plistObj.value.forEach((item, i) => {
                    arrHtml += `<li class="tree-item">`;
                    arrHtml += `<span class="tree-key">[${i}]</span><span class="tree-colon">:</span>`;
                    arrHtml += renderTreeView(item, indent + 1);
                    arrHtml += `</li>`;
                });
                arrHtml += `</ul><span class="tree-toggle">]</span>`;
                return arrHtml;

            case 'string':
                return `<span class="tree-value string">"${escapeHtml(plistObj.value)}"</span><span class="tree-type">(string)</span>`;

            case 'integer':
                return `<span class="tree-value number">${plistObj.value}</span><span class="tree-type">(integer)</span>`;

            case 'real':
                return `<span class="tree-value number">${plistObj.value}</span><span class="tree-type">(real)</span>`;

            case 'boolean':
                return `<span class="tree-value boolean">${plistObj.value}</span><span class="tree-type">(boolean)</span>`;

            case 'date':
                return `<span class="tree-value date">${escapeHtml(plistObj.value)}</span><span class="tree-type">(date)</span>`;

            case 'data':
                const dataPreview = plistObj.value.length > 50 ? plistObj.value.substring(0, 50) + '...' : plistObj.value;
                return `<span class="tree-value data">${escapeHtml(dataPreview)}</span><span class="tree-type">(data)</span>`;

            default:
                return `<span class="tree-value">${escapeHtml(JSON.stringify(plistObj.value))}</span>`;
        }
    }

    function renderOutput(result, view) {
        const output = document.getElementById('output-content');
        if (!output) return;

        let html = '';

        switch (view) {
            case 'tree':
                html = `<div class="plist-tree">${renderTreeView(result)}</div>`;
                break;

            case 'json':
                const json = plistToJson(result);
                html = `<pre class="code-output"><code>${escapeHtml(JSON.stringify(json, null, 2))}</code></pre>`;
                break;

            case 'xml':
                const xmlBody = plistToXml(result);
                const fullXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
${xmlBody}
</plist>`;
                html = `<pre class="code-output"><code>${escapeHtml(fullXml)}</code></pre>`;
                break;
        }

        output.innerHTML = html;
    }

    // ========== 主要功能 ==========

    function performParse() {
        const input = document.getElementById('plist-input')?.value || '';
        const format = document.getElementById('input-format')?.value || 'auto';
        const outputSection = document.getElementById('output-section');
        const outputInfo = document.getElementById('output-info');
        const outputContent = document.getElementById('output-content');

        if (!input.trim()) {
            if (outputSection) outputSection.style.display = 'none';
            return;
        }

        try {
            let result;
            let detectedFormat = format;

            if (format === 'auto') {
                // 自动检测格式
                if (input.trim().startsWith('<?xml') || input.trim().startsWith('<plist') || input.trim().startsWith('<dict')) {
                    detectedFormat = 'xml';
                } else if (input.trim().startsWith('bplist')) {
                    detectedFormat = 'binary';
                } else {
                    // 尝试作为 XML 解析
                    detectedFormat = 'xml';
                }
            }

            currentFormat = detectedFormat;

            if (detectedFormat === 'xml') {
                result = parseXmlPlist(input);
            } else {
                // 二进制格式需要从文件上传
                throw new Error('请通过文件上传提供二进制 Plist 数据');
            }

            currentResult = result;

            // 统计信息
            const stats = countElements(result);
            if (outputInfo) {
                outputInfo.textContent = `解析成功：${detectedFormat.toUpperCase()} 格式，包含 ${stats.total} 个元素（${stats.dict} 个字典，${stats.array} 个数组）`;
            }

            renderOutput(result, currentView);

            if (outputSection) outputSection.style.display = 'block';

            REOT.utils?.showNotification('解析成功', 'success');

        } catch (error) {
            if (outputContent) {
                outputContent.innerHTML = `<div class="error-state">解析错误: ${escapeHtml(error.message)}</div>`;
            }
            if (outputInfo) outputInfo.textContent = '';
            if (outputSection) outputSection.style.display = 'block';
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    function countElements(plistObj) {
        const stats = { total: 0, dict: 0, array: 0 };

        function count(obj) {
            if (!obj) return;
            stats.total++;

            switch (obj.type) {
                case 'dict':
                    stats.dict++;
                    obj.value.forEach(entry => count(entry.value));
                    break;
                case 'array':
                    stats.array++;
                    obj.value.forEach(count);
                    break;
            }
        }

        count(plistObj);
        return stats;
    }

    // 示例 Plist
    const SAMPLE_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>MyApp</string>
    <key>CFBundleIdentifier</key>
    <string>com.example.myapp</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>CFBundleExecutable</key>
    <string>MyApp</string>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>arm64</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    <key>BuildNumber</key>
    <integer>42</integer>
    <key>ReleaseDate</key>
    <date>2024-01-15T10:30:00Z</date>
    <key>EnableFeatureX</key>
    <true/>
    <key>Price</key>
    <real>9.99</real>
</dict>
</plist>`;

    function loadSample() {
        const input = document.getElementById('plist-input');
        if (input) {
            input.value = SAMPLE_PLIST;
            performParse();
        }
    }

    function isPlistToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/protocol/plist');
    }

    // ========== 事件处理 ==========

    document.addEventListener('click', async (e) => {
        if (!isPlistToolActive()) return;

        const target = e.target;

        // 解析按钮
        if (target.id === 'parse-btn' || target.closest('#parse-btn')) {
            performParse();
        }

        // 加载示例
        if (target.id === 'sample-btn' || target.closest('#sample-btn')) {
            loadSample();
        }

        // 清除按钮
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            const input = document.getElementById('plist-input');
            if (input) input.value = '';
            document.getElementById('output-section').style.display = 'none';
            currentResult = null;
        }

        // 视图切换
        if (target.classList.contains('view-tab')) {
            const view = target.dataset.view;
            if (view && currentResult) {
                document.querySelectorAll('.view-tab').forEach(tab => tab.classList.remove('active'));
                target.classList.add('active');
                currentView = view;
                renderOutput(currentResult, view);
            }
        }

        // 复制按钮
        if (target.id === 'copy-btn' || target.closest('#copy-btn')) {
            if (currentResult) {
                let textToCopy;
                if (currentView === 'xml') {
                    textToCopy = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
${plistToXml(currentResult)}
</plist>`;
                } else {
                    textToCopy = JSON.stringify(plistToJson(currentResult), null, 2);
                }
                const success = await REOT.utils?.copyToClipboard(textToCopy);
                if (success) {
                    REOT.utils?.showNotification('已复制到剪贴板', 'success');
                }
            }
        }

        // 下载 JSON
        if (target.id === 'download-json-btn' || target.closest('#download-json-btn')) {
            if (currentResult) {
                const json = JSON.stringify(plistToJson(currentResult), null, 2);
                downloadFile(json, 'plist.json', 'application/json');
            }
        }

        // 下载 XML
        if (target.id === 'download-xml-btn' || target.closest('#download-xml-btn')) {
            if (currentResult) {
                const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
${plistToXml(currentResult)}
</plist>`;
                downloadFile(xml, 'data.plist', 'application/xml');
            }
        }
    });

    // 文件上传
    document.addEventListener('change', (e) => {
        if (!isPlistToolActive()) return;

        if (e.target.id === 'file-input') {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();

            reader.onload = (event) => {
                const arrayBuffer = event.target.result;
                const bytes = new Uint8Array(arrayBuffer);

                // 检查是否是二进制 plist
                const magic = String.fromCharCode(...bytes.slice(0, 6));

                if (magic === BPLIST_MAGIC) {
                    try {
                        currentResult = parseBinaryPlist(arrayBuffer);
                        currentFormat = 'binary';

                        const stats = countElements(currentResult);
                        const outputInfo = document.getElementById('output-info');
                        if (outputInfo) {
                            outputInfo.textContent = `解析成功：二进制格式，包含 ${stats.total} 个元素`;
                        }

                        renderOutput(currentResult, currentView);
                        document.getElementById('output-section').style.display = 'block';
                        REOT.utils?.showNotification('二进制 Plist 解析成功', 'success');
                    } catch (error) {
                        REOT.utils?.showNotification('二进制 Plist 解析失败: ' + error.message, 'error');
                    }
                } else {
                    // 作为文本处理
                    const text = new TextDecoder().decode(bytes);
                    const input = document.getElementById('plist-input');
                    if (input) {
                        input.value = text;
                        performParse();
                    }
                }
            };

            reader.readAsArrayBuffer(file);
        }
    });

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        REOT.utils?.showNotification('文件已下载', 'success');
    }

    // 导出到全局
    window.PlistTool = { parseXmlPlist, parseBinaryPlist, plistToJson, plistToXml };

})();
