/**
 * 颜色转换工具
 * @description HEX, RGB, HSL, HSV 颜色格式互转
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const colorPreview = document.getElementById('color-preview');
    const colorPicker = document.getElementById('color-picker');
    const hexInput = document.getElementById('hex');
    const rgbR = document.getElementById('rgb-r');
    const rgbG = document.getElementById('rgb-g');
    const rgbB = document.getElementById('rgb-b');
    const hslH = document.getElementById('hsl-h');
    const hslS = document.getElementById('hsl-s');
    const hslL = document.getElementById('hsl-l');
    const hsvH = document.getElementById('hsv-h');
    const hsvS = document.getElementById('hsv-s');
    const hsvV = document.getElementById('hsv-v');
    const cssHex = document.getElementById('css-hex');
    const cssRgb = document.getElementById('css-rgb');
    const cssHsl = document.getElementById('css-hsl');

    /**
     * HEX 转 RGB
     */
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return { r, g, b };
    }

    /**
     * RGB 转 HEX
     */
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = Math.round(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
    }

    /**
     * RGB 转 HSL
     */
    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    /**
     * HSL 转 RGB
     */
    function hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }

    /**
     * RGB 转 HSV
     */
    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, v = max;
        const d = max - min;
        s = max === 0 ? 0 : d / max;

        if (max === min) {
            h = 0;
        } else {
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
    }

    /**
     * HSV 转 RGB
     */
    function hsvToRgb(h, s, v) {
        h /= 360; s /= 100; v /= 100;
        let r, g, b;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }

        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }

    /**
     * 更新所有字段
     */
    function updateAll(rgb, source) {
        const { r, g, b } = rgb;
        const hex = rgbToHex(r, g, b);
        const hsl = rgbToHsl(r, g, b);
        const hsv = rgbToHsv(r, g, b);

        // 更新预览
        colorPreview.style.backgroundColor = hex;
        colorPicker.value = hex;

        // 更新输入框
        if (source !== 'hex') hexInput.value = hex;
        if (source !== 'rgb') {
            rgbR.value = r;
            rgbG.value = g;
            rgbB.value = b;
        }
        if (source !== 'hsl') {
            hslH.value = hsl.h;
            hslS.value = hsl.s;
            hslL.value = hsl.l;
        }
        if (source !== 'hsv') {
            hsvH.value = hsv.h;
            hsvS.value = hsv.s;
            hsvV.value = hsv.v;
        }

        // 更新 CSS 格式
        cssHex.textContent = hex;
        cssRgb.textContent = `rgb(${r}, ${g}, ${b})`;
        cssHsl.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    }

    // 事件监听 - 颜色选择器
    colorPicker.addEventListener('input', (e) => {
        const rgb = hexToRgb(e.target.value);
        updateAll(rgb, 'picker');
    });

    // 事件监听 - HEX
    hexInput.addEventListener('input', (e) => {
        const hex = e.target.value;
        if (/^#?[0-9A-Fa-f]{3,6}$/.test(hex)) {
            const rgb = hexToRgb(hex);
            updateAll(rgb, 'hex');
        }
    });

    // 事件监听 - RGB
    [rgbR, rgbG, rgbB].forEach(el => {
        el.addEventListener('input', () => {
            const r = parseInt(rgbR.value) || 0;
            const g = parseInt(rgbG.value) || 0;
            const b = parseInt(rgbB.value) || 0;
            updateAll({ r, g, b }, 'rgb');
        });
    });

    // 事件监听 - HSL
    [hslH, hslS, hslL].forEach(el => {
        el.addEventListener('input', () => {
            const h = parseInt(hslH.value) || 0;
            const s = parseInt(hslS.value) || 0;
            const l = parseInt(hslL.value) || 0;
            const rgb = hslToRgb(h, s, l);
            updateAll(rgb, 'hsl');
        });
    });

    // 事件监听 - HSV
    [hsvH, hsvS, hsvV].forEach(el => {
        el.addEventListener('input', () => {
            const h = parseInt(hsvH.value) || 0;
            const s = parseInt(hsvS.value) || 0;
            const v = parseInt(hsvV.value) || 0;
            const rgb = hsvToRgb(h, s, v);
            updateAll(rgb, 'hsv');
        });
    });

    // 复制按钮
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                const success = await REOT.utils?.copyToClipboard(targetEl.textContent);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        });
    });

    // 初始化
    updateAll({ r: 255, g: 87, b: 51 }, 'init');

    // 导出到全局
    window.ColorTool = { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbToHsv, hsvToRgb };
})();
