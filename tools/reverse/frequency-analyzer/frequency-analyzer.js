/**
 * 频率分析工具
 * @description 字符和字节频率分析（密码学分析）
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 英语字母频率（来自 Wikipedia）
    const ENGLISH_FREQUENCY = {
        'E': 12.702, 'T': 9.056, 'A': 8.167, 'O': 7.507, 'I': 6.966,
        'N': 6.749, 'S': 6.327, 'H': 6.094, 'R': 5.987, 'D': 4.253,
        'L': 4.025, 'C': 2.782, 'U': 2.758, 'M': 2.406, 'W': 2.360,
        'F': 2.228, 'G': 2.015, 'Y': 1.974, 'P': 1.929, 'B': 1.492,
        'V': 0.978, 'K': 0.772, 'J': 0.153, 'X': 0.150, 'Q': 0.095, 'Z': 0.074
    };

    let analysisResult = null;

    /**
     * 检查当前是否在频率分析工具页面
     */
    function isFrequencyAnalyzerActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/reverse/frequency-analyzer');
    }

    /**
     * 分析字符频率
     */
    function analyzeCharFrequency(text, caseSensitive = false) {
        if (!caseSensitive) {
            text = text.toUpperCase();
        }

        const freq = {};
        let total = 0;

        for (const char of text) {
            freq[char] = (freq[char] || 0) + 1;
            total++;
        }

        // 转换为数组并计算百分比
        const result = Object.entries(freq).map(([char, count]) => ({
            char,
            count,
            frequency: (count / total * 100).toFixed(3),
            percentage: count / total
        }));

        // 按频率降序排序
        result.sort((a, b) => b.count - a.count);

        return {
            items: result,
            total,
            unique: result.length
        };
    }

    /**
     * 分析字节频率
     */
    function analyzeByteFrequency(hexString) {
        // 解析十六进制
        hexString = hexString.replace(/[\s\n\r,;]/g, '').replace(/^0x/i, '');
        if (!/^[0-9a-fA-F]*$/.test(hexString)) {
            throw new Error('无效的十六进制字符串');
        }
        if (hexString.length % 2 !== 0) {
            hexString = '0' + hexString;
        }

        const freq = {};
        let total = 0;

        for (let i = 0; i < hexString.length; i += 2) {
            const byte = hexString.substr(i, 2).toUpperCase();
            freq[byte] = (freq[byte] || 0) + 1;
            total++;
        }

        const result = Object.entries(freq).map(([byte, count]) => ({
            char: '0x' + byte,
            count,
            frequency: (count / total * 100).toFixed(3),
            percentage: count / total
        }));

        result.sort((a, b) => b.count - a.count);

        return {
            items: result,
            total,
            unique: result.length
        };
    }

    /**
     * N-gram 分析
     */
    function analyzeNgram(text, n = 2, caseSensitive = false) {
        if (!caseSensitive) {
            text = text.toUpperCase();
        }

        // 只保留字母
        text = text.replace(/[^A-Za-z]/g, '');

        const freq = {};
        let total = 0;

        for (let i = 0; i <= text.length - n; i++) {
            const ngram = text.substr(i, n);
            freq[ngram] = (freq[ngram] || 0) + 1;
            total++;
        }

        const result = Object.entries(freq).map(([ngram, count]) => ({
            char: ngram,
            count,
            frequency: (count / total * 100).toFixed(3),
            percentage: count / total
        }));

        result.sort((a, b) => b.count - a.count);

        return {
            items: result,
            total,
            unique: result.length
        };
    }

    /**
     * 执行分析
     */
    function analyze() {
        const input = document.getElementById('input')?.value;
        const mode = document.getElementById('analysis-mode')?.value || 'char';
        const caseSensitive = document.getElementById('case-sensitive')?.value === 'yes';
        const ngramSize = parseInt(document.getElementById('ngram-size')?.value || '2', 10);

        if (!input || !input.trim()) {
            throw new Error('请输入要分析的内容');
        }

        let result;
        switch (mode) {
            case 'byte':
                result = analyzeByteFrequency(input);
                break;
            case 'ngram':
                result = analyzeNgram(input, ngramSize, caseSensitive);
                break;
            default:
                result = analyzeCharFrequency(input, caseSensitive);
        }

        analysisResult = result;

        // 更新统计
        document.getElementById('total-chars').textContent = result.total;
        document.getElementById('unique-chars').textContent = result.unique;

        // 渲染图表
        renderChart(result.items.slice(0, 30));

        // 渲染表格
        renderTable(result.items);

        // 显示结果区域
        document.getElementById('result-section').style.display = 'block';

        // 隐藏对比
        document.getElementById('comparison-section').style.display = 'none';
    }

    /**
     * 渲染频率图表
     */
    function renderChart(items) {
        const container = document.getElementById('chart-container');
        if (!container) return;

        const maxPercentage = items.length > 0 ? items[0].percentage : 0;

        container.innerHTML = items.map(item => {
            const height = (item.percentage / maxPercentage * 120) || 2;
            return `
                <div class="chart-bar">
                    <div class="chart-bar-fill" style="height: ${height}px"></div>
                    <span class="chart-bar-label">${escapeHtml(displayChar(item.char))}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * 渲染频率表格
     */
    function renderTable(items) {
        const tbody = document.getElementById('freq-tbody');
        if (!tbody) return;

        const maxPercentage = items.length > 0 ? items[0].percentage : 0;

        tbody.innerHTML = items.map(item => {
            const barWidth = (item.percentage / maxPercentage * 100) || 0;
            return `
                <tr>
                    <td class="char-cell">${escapeHtml(displayChar(item.char))}</td>
                    <td class="count-cell">${item.count}</td>
                    <td class="freq-cell">${item.frequency}%</td>
                    <td class="bar-cell">
                        <div class="freq-bar">
                            <div class="freq-bar-fill" style="width: ${barWidth}%"></div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * 与英语频率对比
     */
    function compareWithEnglish() {
        if (!analysisResult) {
            REOT.utils?.showNotification('请先进行分析', 'warning');
            return;
        }

        const container = document.getElementById('comparison-chart');
        const section = document.getElementById('comparison-section');

        if (!container || !section) return;

        // 构建输入频率映射（只看字母）
        const inputFreq = {};
        for (const item of analysisResult.items) {
            const char = item.char.toUpperCase();
            if (/^[A-Z]$/.test(char)) {
                inputFreq[char] = parseFloat(item.frequency);
            }
        }

        // 渲染对比
        const letters = 'ETAOINSHRDLCUMWFGYPBVKJXQZ'.split('');
        const maxFreq = Math.max(
            ...Object.values(ENGLISH_FREQUENCY),
            ...Object.values(inputFreq)
        );

        let html = letters.map(letter => {
            const inputVal = inputFreq[letter] || 0;
            const englishVal = ENGLISH_FREQUENCY[letter] || 0;
            const inputHeight = (inputVal / maxFreq * 40) || 2;
            const englishHeight = (englishVal / maxFreq * 40) || 2;
            const diff = (inputVal - englishVal).toFixed(1);
            const diffSign = parseFloat(diff) > 0 ? '+' : '';

            return `
                <div class="comparison-item">
                    <span class="comparison-char">${letter}</span>
                    <div class="comparison-bars">
                        <div class="comparison-bar input" style="height: ${inputHeight}px"></div>
                        <div class="comparison-bar english" style="height: ${englishHeight}px"></div>
                    </div>
                    <span class="comparison-diff">${diffSign}${diff}</span>
                </div>
            `;
        }).join('');

        html += `
            <div class="comparison-legend">
                <span class="legend-item"><span class="legend-color input"></span> 输入文本</span>
                <span class="legend-item"><span class="legend-color english"></span> 英语标准</span>
            </div>
        `;

        container.innerHTML = html;
        section.style.display = 'block';
    }

    /**
     * 显示字符（处理特殊字符）
     */
    function displayChar(char) {
        if (char === ' ') return '[空格]';
        if (char === '\n') return '[换行]';
        if (char === '\r') return '[回车]';
        if (char === '\t') return '[制表]';
        return char;
    }

    /**
     * HTML 转义
     */
    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }

    // 事件处理
    document.addEventListener('click', (e) => {
        if (!isFrequencyAnalyzerActive()) return;

        const target = e.target;

        // 分析按钮
        if (target.id === 'analyze-btn' || target.closest('#analyze-btn')) {
            try {
                analyze();
                REOT.utils?.showNotification('分析完成', 'success');
            } catch (error) {
                REOT.utils?.showNotification(error.message, 'error');
            }
        }

        // 清除按钮
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            const input = document.getElementById('input');
            const resultSection = document.getElementById('result-section');

            if (input) input.value = '';
            if (resultSection) resultSection.style.display = 'none';
            analysisResult = null;
        }

        // 对比英语按钮
        if (target.id === 'compare-english-btn' || target.closest('#compare-english-btn')) {
            compareWithEnglish();
        }
    });

    // 模式变化处理
    document.addEventListener('change', (e) => {
        if (!isFrequencyAnalyzerActive()) return;

        if (e.target.id === 'analysis-mode') {
            const ngramGroup = document.getElementById('ngram-size-group');
            if (ngramGroup) {
                ngramGroup.style.display = e.target.value === 'ngram' ? 'block' : 'none';
            }
        }
    });

    // 导出工具函数
    window.FrequencyAnalyzer = { analyzeCharFrequency, analyzeByteFrequency, analyzeNgram, ENGLISH_FREQUENCY };

})();
