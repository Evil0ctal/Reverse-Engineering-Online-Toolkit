/**
 * 时间戳转换工具
 * @description Unix 时间戳转换与生成
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const currentSecondsEl = document.getElementById('current-seconds');
    const currentMillisEl = document.getElementById('current-millis');
    const currentDatetimeEl = document.getElementById('current-datetime');
    const timestampInputEl = document.getElementById('timestamp-input');
    const timestampUnitEl = document.getElementById('timestamp-unit');
    const convertToDateBtnEl = document.getElementById('convert-to-date-btn');
    const localDatetimeEl = document.getElementById('local-datetime');
    const utcDatetimeEl = document.getElementById('utc-datetime');
    const isoDatetimeEl = document.getElementById('iso-datetime');
    const datetimeInputEl = document.getElementById('datetime-input');
    const convertToTimestampBtnEl = document.getElementById('convert-to-timestamp-btn');
    const nowBtnEl = document.getElementById('now-btn');
    const resultSecondsEl = document.getElementById('result-seconds');
    const resultMillisEl = document.getElementById('result-millis');

    /**
     * 格式化日期时间
     * @param {Date} date - 日期对象
     * @returns {string} - 格式化后的字符串
     */
    function formatLocalDateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const ms = String(date.getMilliseconds()).padStart(3, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
    }

    /**
     * 格式化 UTC 日期时间
     * @param {Date} date - 日期对象
     * @returns {string} - 格式化后的字符串
     */
    function formatUTCDateTime(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        const ms = String(date.getUTCMilliseconds()).padStart(3, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms} UTC`;
    }

    /**
     * 更新当前时间显示
     */
    function updateCurrentTime() {
        const now = Date.now();
        const date = new Date(now);

        if (currentSecondsEl) {
            currentSecondsEl.textContent = Math.floor(now / 1000);
        }
        if (currentMillisEl) {
            currentMillisEl.textContent = now;
        }
        if (currentDatetimeEl) {
            currentDatetimeEl.textContent = formatLocalDateTime(date);
        }
    }

    /**
     * 时间戳转日期时间
     */
    function convertToDate() {
        const input = timestampInputEl.value.trim();
        if (!input) {
            return;
        }

        let timestamp = parseInt(input, 10);
        if (isNaN(timestamp)) {
            localDatetimeEl.value = '无效的时间戳';
            utcDatetimeEl.value = '';
            isoDatetimeEl.value = '';
            return;
        }

        // 根据单位转换为毫秒
        if (timestampUnitEl.value === 'seconds') {
            timestamp *= 1000;
        }

        const date = new Date(timestamp);

        if (isNaN(date.getTime())) {
            localDatetimeEl.value = '无效的时间戳';
            utcDatetimeEl.value = '';
            isoDatetimeEl.value = '';
            return;
        }

        localDatetimeEl.value = formatLocalDateTime(date);
        utcDatetimeEl.value = formatUTCDateTime(date);
        isoDatetimeEl.value = date.toISOString();
    }

    /**
     * 日期时间转时间戳
     */
    function convertToTimestamp() {
        const input = datetimeInputEl.value;
        if (!input) {
            return;
        }

        const date = new Date(input);

        if (isNaN(date.getTime())) {
            resultSecondsEl.value = '无效的日期时间';
            resultMillisEl.value = '';
            return;
        }

        const millis = date.getTime();
        resultSecondsEl.value = Math.floor(millis / 1000);
        resultMillisEl.value = millis;
    }

    /**
     * 设置为当前时间
     */
    function setNow() {
        const now = new Date();
        // 格式化为 datetime-local 需要的格式
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        datetimeInputEl.value = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        convertToTimestamp();
    }

    // 事件监听
    if (convertToDateBtnEl) {
        convertToDateBtnEl.addEventListener('click', convertToDate);
    }

    if (timestampInputEl) {
        timestampInputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                convertToDate();
            }
        });
        // 实时转换
        timestampInputEl.addEventListener('input', convertToDate);
    }

    if (convertToTimestampBtnEl) {
        convertToTimestampBtnEl.addEventListener('click', convertToTimestamp);
    }

    if (datetimeInputEl) {
        datetimeInputEl.addEventListener('change', convertToTimestamp);
    }

    if (nowBtnEl) {
        nowBtnEl.addEventListener('click', setNow);
    }

    // 复制按钮
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl && targetEl.value) {
                const success = await REOT.utils?.copyToClipboard(targetEl.value);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        });
    });

    // 每秒更新当前时间
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    // 初始化日期输入为当前时间
    setNow();

    // 导出到全局
    window.TimestampTool = { convertToDate, convertToTimestamp };
})();
