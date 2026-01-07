/**
 * 字符统计工具
 * @description 字符、单词、行数统计
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const inputEl = document.getElementById('input');
    const charCountEl = document.getElementById('char-count');
    const charNoSpaceEl = document.getElementById('char-no-space');
    const wordCountEl = document.getElementById('word-count');
    const lineCountEl = document.getElementById('line-count');
    const sentenceCountEl = document.getElementById('sentence-count');
    const paragraphCountEl = document.getElementById('paragraph-count');
    const byteCountEl = document.getElementById('byte-count');
    const cjkCountEl = document.getElementById('cjk-count');
    const clearBtn = document.getElementById('clear-btn');

    /**
     * 统计文本
     * @param {string} text
     * @returns {Object}
     */
    function analyze(text) {
        // 字符数
        const characters = text.length;

        // 字符数(不含空格)
        const charactersNoSpace = text.replace(/\s/g, '').length;

        // 单词数 (支持英文和CJK)
        const words = text.trim()
            ? text.trim().split(/\s+/).filter(w => w.length > 0).length
            : 0;

        // 行数
        const lines = text ? text.split('\n').length : 0;

        // 句子数
        const sentences = text.split(/[.!?。！？]+/).filter(s => s.trim().length > 0).length;

        // 段落数
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

        // 字节数 (UTF-8)
        const bytes = new TextEncoder().encode(text).length;

        // CJK 字符数 (中日韩)
        const cjkMatches = text.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g);
        const cjk = cjkMatches ? cjkMatches.length : 0;

        return {
            characters,
            charactersNoSpace,
            words,
            lines,
            sentences,
            paragraphs,
            bytes,
            cjk
        };
    }

    /**
     * 更新统计显示
     */
    function updateStats() {
        const text = inputEl.value;
        const stats = analyze(text);

        charCountEl.textContent = stats.characters.toLocaleString();
        charNoSpaceEl.textContent = stats.charactersNoSpace.toLocaleString();
        wordCountEl.textContent = stats.words.toLocaleString();
        lineCountEl.textContent = stats.lines.toLocaleString();
        sentenceCountEl.textContent = stats.sentences.toLocaleString();
        paragraphCountEl.textContent = stats.paragraphs.toLocaleString();
        byteCountEl.textContent = stats.bytes.toLocaleString();
        cjkCountEl.textContent = stats.cjk.toLocaleString();
    }

    // 事件监听
    if (inputEl) {
        inputEl.addEventListener('input', updateStats);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            inputEl.value = '';
            updateStats();
        });
    }

    // 导出到全局
    window.TextStatsTool = { analyze };

    // 设置默认示例数据
    if (inputEl && !inputEl.value) {
        inputEl.value = `REOT - 逆向工程在线工具箱

这是一个纯前端实现的在线工具箱，所有计算都在本地浏览器中完成。

Features:
- Encoding & Decoding
- Encryption & Decryption
- Text Processing
- And more...

你好，世界！Hello, World! こんにちは！`;
        updateStats();
    }
})();
