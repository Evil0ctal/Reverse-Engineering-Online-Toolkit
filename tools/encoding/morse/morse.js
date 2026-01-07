/**
 * 摩斯电码工具
 * @description 摩斯电码编码与解码
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 摩斯电码映射表
    const MORSE_CODE = {
        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
        'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
        'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
        'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
        'Y': '-.--', 'Z': '--..',
        '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
        '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
        '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
        '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
        ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
        '"': '.-..-.', '$': '...-..-', '@': '.--.-.', ' ': '/'
    };

    // 反向映射
    const REVERSE_MORSE = {};
    for (const [char, code] of Object.entries(MORSE_CODE)) {
        REVERSE_MORSE[code] = char;
    }

    // DOM 元素
    const inputEl = document.getElementById('input');
    const outputEl = document.getElementById('output');
    const encodeBtn = document.getElementById('encode-btn');
    const decodeBtn = document.getElementById('decode-btn');
    const playBtn = document.getElementById('play-btn');
    const swapBtn = document.getElementById('swap-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');

    // 音频上下文
    let audioContext = null;

    /**
     * 文本转摩斯电码
     * @param {string} input
     * @returns {string}
     */
    function encode(input) {
        if (!input) return '';

        return input.toUpperCase()
            .split('')
            .map(char => MORSE_CODE[char] || char)
            .join(' ')
            .replace(/  +/g, ' / '); // 空格变成 /
    }

    /**
     * 摩斯电码转文本
     * @param {string} input
     * @returns {string}
     */
    function decode(input) {
        if (!input) return '';

        return input.trim()
            .split(' / ')
            .map(word => {
                return word.trim()
                    .split(' ')
                    .map(code => REVERSE_MORSE[code] || code)
                    .join('');
            })
            .join(' ');
    }

    /**
     * 播放摩斯电码音频
     * @param {string} morse
     */
    async function play(morse) {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const dotDuration = 0.1; // 点的持续时间（秒）
        const dashDuration = dotDuration * 3; // 划的持续时间
        const pauseDuration = dotDuration; // 符号间暂停
        const letterPause = dotDuration * 3; // 字母间暂停
        const wordPause = dotDuration * 7; // 单词间暂停
        const frequency = 600; // 频率 Hz

        let time = audioContext.currentTime;

        for (const char of morse) {
            if (char === '.') {
                await playTone(frequency, time, dotDuration);
                time += dotDuration + pauseDuration;
            } else if (char === '-') {
                await playTone(frequency, time, dashDuration);
                time += dashDuration + pauseDuration;
            } else if (char === ' ') {
                time += letterPause;
            } else if (char === '/') {
                time += wordPause;
            }
        }
    }

    /**
     * 播放单个音调
     * @param {number} frequency
     * @param {number} startTime
     * @param {number} duration
     */
    function playTone(frequency, startTime, duration) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.5, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }

    /**
     * 显示错误
     * @param {string} message
     */
    function showError(message) {
        outputEl.value = `错误: ${message}`;
        if (window.REOT?.utils?.showNotification) {
            window.REOT.utils.showNotification(message, 'error');
        }
    }

    // 事件监听
    if (encodeBtn) {
        encodeBtn.addEventListener('click', () => {
            try {
                outputEl.value = encode(inputEl.value);
            } catch (error) {
                showError(error.message);
            }
        });
    }

    if (decodeBtn) {
        decodeBtn.addEventListener('click', () => {
            try {
                outputEl.value = decode(inputEl.value);
            } catch (error) {
                showError(error.message);
            }
        });
    }

    if (playBtn) {
        playBtn.addEventListener('click', async () => {
            try {
                const morse = outputEl.value || encode(inputEl.value);
                if (morse) {
                    await play(morse);
                }
            } catch (error) {
                showError(error.message);
            }
        });
    }

    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            const temp = inputEl.value;
            inputEl.value = outputEl.value;
            outputEl.value = temp;
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            inputEl.value = '';
            outputEl.value = '';
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            if (outputEl.value) {
                const success = await REOT.utils?.copyToClipboard(outputEl.value);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        });
    }

    // 导出到全局
    window.MorseTool = { encode, decode, play };

    // 设置默认示例数据
    if (inputEl && !inputEl.value) {
        inputEl.value = 'SOS HELLO WORLD';
    }
})();
