/**
 * Snowflake ID 解码器
 * @description 解析 Twitter/Discord 风格雪花 ID，提取时间戳和节点信息
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 纪元配置（毫秒时间戳）
    const EPOCHS = {
        twitter: 1288834974657,      // 2010-11-04 01:42:54.657 UTC
        discord: 1420070400000,      // 2015-01-01 00:00:00.000 UTC
        instagram: 1293840000000,    // 2011-01-01 00:00:00.000 UTC
        sony: 1288834974657          // 与 Twitter 相同
    };

    // DOM 元素
    const snowflakeInputEl = document.getElementById('snowflake-input');
    const decodeBtnEl = document.getElementById('decode-btn');
    const epochTypeEl = document.getElementById('epoch-type');
    const customEpochEl = document.getElementById('custom-epoch');
    const resultSectionEl = document.getElementById('result-section');
    const binarySectionEl = document.getElementById('binary-section');

    // 生成相关元素
    const genDatetimeEl = document.getElementById('gen-datetime');
    const genWorkerEl = document.getElementById('gen-worker');
    const genDatacenterEl = document.getElementById('gen-datacenter');
    const genSequenceEl = document.getElementById('gen-sequence');
    const generateBtnEl = document.getElementById('generate-btn');
    const generatedResultEl = document.getElementById('generated-result');
    const generatedIdEl = document.getElementById('generated-id');

    /**
     * 获取当前纪元
     * @returns {number} - 纪元毫秒时间戳
     */
    function getEpoch() {
        const type = epochTypeEl.value;
        if (type === 'custom') {
            return parseInt(customEpochEl.value, 10) || 0;
        }
        return EPOCHS[type] || EPOCHS.discord;
    }

    /**
     * 解码 Snowflake ID
     * @param {string} id - Snowflake ID 字符串
     * @param {number} epoch - 纪元毫秒时间戳
     * @returns {Object|null} - 解码结果
     */
    function decodeSnowflake(id, epoch) {
        // 移除空格并验证
        id = id.trim();
        if (!/^\d+$/.test(id)) {
            return null;
        }

        try {
            // 使用 BigInt 处理大数
            const snowflake = BigInt(id);

            // Snowflake 结构 (64 位):
            // 1 位符号 | 41 位时间戳 | 5 位数据中心 ID | 5 位 Worker ID | 12 位序列号

            const timestamp = Number((snowflake >> 22n) + BigInt(epoch));
            const datacenterId = Number((snowflake >> 17n) & 0x1Fn);
            const workerId = Number((snowflake >> 12n) & 0x1Fn);
            const sequence = Number(snowflake & 0xFFFn);

            // 创建日期
            const date = new Date(timestamp);

            // 二进制表示
            const binary = snowflake.toString(2).padStart(64, '0');

            return {
                id,
                timestamp,
                date,
                datacenterId,
                workerId,
                sequence,
                binary,
                epoch
            };
        } catch (e) {
            return null;
        }
    }

    /**
     * 生成 Snowflake ID
     * @param {number} timestamp - 毫秒时间戳
     * @param {number} datacenterId - 数据中心 ID (0-31)
     * @param {number} workerId - Worker ID (0-31)
     * @param {number} sequence - 序列号 (0-4095)
     * @param {number} epoch - 纪元
     * @returns {string} - Snowflake ID
     */
    function generateSnowflake(timestamp, datacenterId, workerId, sequence, epoch) {
        const timestampBits = BigInt(timestamp - epoch) << 22n;
        const datacenterBits = BigInt(datacenterId & 0x1F) << 17n;
        const workerBits = BigInt(workerId & 0x1F) << 12n;
        const sequenceBits = BigInt(sequence & 0xFFF);

        const snowflake = timestampBits | datacenterBits | workerBits | sequenceBits;
        return snowflake.toString();
    }

    /**
     * 格式化日期时间
     * @param {Date} date - 日期对象
     * @returns {string} - 格式化字符串
     */
    function formatDateTime(date) {
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
     * 格式化相对时间
     * @param {Date} date - 日期对象
     * @returns {string} - 相对时间字符串
     */
    function formatRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const absDiff = Math.abs(diff);

        const seconds = Math.floor(absDiff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        const suffix = diff >= 0 ? '前' : '后';

        if (years > 0) return `${years} 年${suffix}`;
        if (months > 0) return `${months} 个月${suffix}`;
        if (days > 0) return `${days} 天${suffix}`;
        if (hours > 0) return `${hours} 小时${suffix}`;
        if (minutes > 0) return `${minutes} 分钟${suffix}`;
        return `${seconds} 秒${suffix}`;
    }

    /**
     * 格式化二进制显示（带颜色标记）
     * @param {string} binary - 64 位二进制字符串
     * @returns {string} - HTML 字符串
     */
    function formatBinaryDisplay(binary) {
        // 1 位符号 + 41 位时间戳 + 5 位数据中心 + 5 位 worker + 12 位序列
        const sign = binary.slice(0, 1);
        const timestamp = binary.slice(1, 42);
        const datacenter = binary.slice(42, 47);
        const worker = binary.slice(47, 52);
        const sequence = binary.slice(52, 64);

        return `<span style="color: var(--text-secondary)">${sign}</span>` +
               `<span class="timestamp">${timestamp}</span>` +
               `<span class="datacenter">${datacenter}</span>` +
               `<span class="worker">${worker}</span>` +
               `<span class="sequence">${sequence}</span>`;
    }

    /**
     * 显示解码结果
     * @param {Object} result - 解码结果
     */
    function displayResult(result) {
        if (!result) {
            resultSectionEl.style.display = 'none';
            binarySectionEl.style.display = 'none';
            return;
        }

        // 显示结果
        document.getElementById('result-timestamp').textContent = result.timestamp;
        document.getElementById('result-datetime').textContent = formatDateTime(result.date);
        document.getElementById('result-relative').textContent = formatRelativeTime(result.date);
        document.getElementById('result-worker').textContent = result.workerId;
        document.getElementById('result-datacenter').textContent = result.datacenterId;
        document.getElementById('result-sequence').textContent = result.sequence;

        // 显示二进制
        document.getElementById('binary-full').innerHTML = formatBinaryDisplay(result.binary);

        resultSectionEl.style.display = 'block';
        binarySectionEl.style.display = 'block';
    }

    /**
     * 执行解码
     */
    function decode() {
        const id = snowflakeInputEl.value.trim();
        if (!id) {
            resultSectionEl.style.display = 'none';
            binarySectionEl.style.display = 'none';
            return;
        }

        const epoch = getEpoch();
        const result = decodeSnowflake(id, epoch);
        displayResult(result);
    }

    /**
     * 执行生成
     */
    function generate() {
        const datetime = genDatetimeEl.value;
        if (!datetime) {
            return;
        }

        const timestamp = new Date(datetime).getTime();
        const workerId = parseInt(genWorkerEl.value, 10) || 0;
        const datacenterId = parseInt(genDatacenterEl.value, 10) || 0;
        const sequence = parseInt(genSequenceEl.value, 10) || 0;
        const epoch = getEpoch();

        const snowflake = generateSnowflake(timestamp, datacenterId, workerId, sequence, epoch);

        generatedIdEl.textContent = snowflake;
        generatedResultEl.style.display = 'flex';

        // 自动解码生成的 ID
        snowflakeInputEl.value = snowflake;
        decode();
    }

    /**
     * 初始化生成器日期时间
     */
    function initGeneratorDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        genDatetimeEl.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // 事件监听
    if (decodeBtnEl) {
        decodeBtnEl.addEventListener('click', decode);
    }

    if (snowflakeInputEl) {
        snowflakeInputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                decode();
            }
        });
        snowflakeInputEl.addEventListener('input', decode);
    }

    if (epochTypeEl) {
        epochTypeEl.addEventListener('change', () => {
            if (epochTypeEl.value === 'custom') {
                customEpochEl.style.display = 'block';
            } else {
                customEpochEl.style.display = 'none';
            }
            decode();
        });
    }

    if (customEpochEl) {
        customEpochEl.addEventListener('input', decode);
    }

    if (generateBtnEl) {
        generateBtnEl.addEventListener('click', generate);
    }

    // 示例点击
    document.querySelectorAll('.example-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.getAttribute('data-id');
            const epoch = item.getAttribute('data-epoch');

            if (id) {
                snowflakeInputEl.value = id;
            }
            if (epoch && epochTypeEl) {
                epochTypeEl.value = epoch;
                customEpochEl.style.display = 'none';
            }
            decode();
        });
    });

    // 复制按钮
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                const text = targetEl.textContent;
                const success = await REOT.utils?.copyToClipboard(text);
                if (success) {
                    REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
                }
            }
        });
    });

    // 初始化
    initGeneratorDateTime();

    // 导出到全局
    window.SnowflakeTool = { decodeSnowflake, generateSnowflake };
})();
