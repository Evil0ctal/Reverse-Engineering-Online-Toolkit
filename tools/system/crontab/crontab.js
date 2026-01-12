/**
 * Crontab 解析器
 * @description Cron 表达式与人类可读文本互转
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const cronInputEl = document.getElementById('cron-input');
    const parseBtnEl = document.getElementById('parse-btn');
    const resultCardEl = document.getElementById('result-card');
    const resultTextEl = document.getElementById('result-text');
    const nextRunsListEl = document.getElementById('next-runs-list');
    const generateBtnEl = document.getElementById('generate-btn');

    // 编辑器元素
    const minuteTypeEl = document.getElementById('minute-type');
    const minuteValueEl = document.getElementById('minute-value');
    const hourTypeEl = document.getElementById('hour-type');
    const hourValueEl = document.getElementById('hour-value');
    const dayTypeEl = document.getElementById('day-type');
    const dayValueEl = document.getElementById('day-value');
    const monthTypeEl = document.getElementById('month-type');
    const monthValueEl = document.getElementById('month-value');
    const weekdayTypeEl = document.getElementById('weekday-type');
    const weekdayValueEl = document.getElementById('weekday-value');

    // 特殊表达式映射
    const SPECIAL_EXPRESSIONS = {
        '@yearly': '0 0 1 1 *',
        '@annually': '0 0 1 1 *',
        '@monthly': '0 0 1 * *',
        '@weekly': '0 0 * * 0',
        '@daily': '0 0 * * *',
        '@midnight': '0 0 * * *',
        '@hourly': '0 * * * *',
        '@reboot': '@reboot'
    };

    // 月份名称
    const MONTHS = ['', '一月', '二月', '三月', '四月', '五月', '六月',
                    '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const MONTHS_EN = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

    // 星期名称
    const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    /**
     * 解析单个字段
     * @param {string} field - 字段值
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {Array} - 解析后的值数组
     */
    function parseField(field, min, max) {
        const values = new Set();

        // 处理逗号分隔的多个值
        const parts = field.split(',');

        for (const part of parts) {
            // 处理步进值 (*/n 或 start-end/n)
            if (part.includes('/')) {
                const [range, stepStr] = part.split('/');
                const step = parseInt(stepStr, 10);

                let start = min;
                let end = max;

                if (range !== '*') {
                    if (range.includes('-')) {
                        [start, end] = range.split('-').map(v => parseInt(v, 10));
                    } else {
                        start = parseInt(range, 10);
                    }
                }

                for (let i = start; i <= end; i += step) {
                    values.add(i);
                }
            }
            // 处理范围 (start-end)
            else if (part.includes('-')) {
                const [start, end] = part.split('-').map(v => parseInt(v, 10));
                for (let i = start; i <= end; i++) {
                    values.add(i);
                }
            }
            // 处理通配符
            else if (part === '*') {
                for (let i = min; i <= max; i++) {
                    values.add(i);
                }
            }
            // 处理单个值
            else {
                values.add(parseInt(part, 10));
            }
        }

        return Array.from(values).sort((a, b) => a - b);
    }

    /**
     * 解析 Cron 表达式
     * @param {string} expression - Cron 表达式
     * @returns {Object} - 解析结果
     */
    function parseCron(expression) {
        const expr = expression.trim().toLowerCase();

        // 处理特殊表达式
        if (expr.startsWith('@')) {
            if (expr === '@reboot') {
                return {
                    valid: true,
                    special: 'reboot',
                    description: '系统启动时执行'
                };
            }
            const expanded = SPECIAL_EXPRESSIONS[expr];
            if (expanded && expanded !== '@reboot') {
                return parseCron(expanded);
            }
            return { valid: false, error: '无效的特殊表达式' };
        }

        const parts = expr.split(/\s+/);

        // 标准 cron 是 5 个字段
        if (parts.length !== 5) {
            return { valid: false, error: `需要 5 个字段，但得到 ${parts.length} 个` };
        }

        try {
            const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

            return {
                valid: true,
                minute: parseField(minute, 0, 59),
                hour: parseField(hour, 0, 23),
                dayOfMonth: parseField(dayOfMonth, 1, 31),
                month: parseField(month, 1, 12),
                dayOfWeek: parseField(dayOfWeek, 0, 7).map(d => d === 7 ? 0 : d), // 规范化星期日
                raw: { minute, hour, dayOfMonth, month, dayOfWeek }
            };
        } catch (e) {
            return { valid: false, error: '解析错误: ' + e.message };
        }
    }

    /**
     * 生成人类可读描述
     * @param {Object} parsed - 解析后的 cron 对象
     * @returns {string} - 人类可读描述
     */
    function generateDescription(parsed) {
        if (parsed.special === 'reboot') {
            return '系统启动时执行';
        }

        const { raw } = parsed;
        const parts = [];

        // 时间部分
        if (raw.minute === '*' && raw.hour === '*') {
            parts.push('每分钟');
        } else if (raw.minute.includes('/')) {
            const step = raw.minute.split('/')[1];
            parts.push(`每 ${step} 分钟`);
        } else if (raw.hour === '*') {
            parts.push(`在每小时的第 ${raw.minute} 分钟`);
        } else if (raw.minute === '0' && !raw.hour.includes('/') && !raw.hour.includes(',') && !raw.hour.includes('-')) {
            parts.push(`在 ${raw.hour}:00`);
        } else if (raw.hour.includes('/')) {
            const step = raw.hour.split('/')[1];
            parts.push(`每 ${step} 小时，在第 ${raw.minute} 分钟`);
        } else if (raw.hour.includes('-')) {
            const [start, end] = raw.hour.split('-');
            parts.push(`从 ${start}:${raw.minute.padStart(2, '0')} 到 ${end}:${raw.minute.padStart(2, '0')}`);
        } else if (raw.hour.includes(',')) {
            const hours = raw.hour.split(',');
            parts.push(`在 ${hours.map(h => `${h}:${raw.minute.padStart(2, '0')}`).join(', ')}`);
        } else {
            parts.push(`在 ${raw.hour}:${raw.minute.padStart(2, '0')}`);
        }

        // 日期部分
        if (raw.dayOfMonth === '*' && raw.month === '*' && raw.dayOfWeek === '*') {
            parts.push('每天');
        } else {
            // 星期
            if (raw.dayOfWeek !== '*') {
                if (raw.dayOfWeek === '1-5') {
                    parts.push('工作日');
                } else if (raw.dayOfWeek === '0,6' || raw.dayOfWeek === '6,0') {
                    parts.push('周末');
                } else if (raw.dayOfWeek.includes('-')) {
                    const [start, end] = raw.dayOfWeek.split('-').map(d => parseInt(d, 10));
                    parts.push(`从${WEEKDAYS[start]}到${WEEKDAYS[end]}`);
                } else if (raw.dayOfWeek.includes(',')) {
                    const days = raw.dayOfWeek.split(',').map(d => WEEKDAYS[parseInt(d, 10)]);
                    parts.push(days.join('、'));
                } else {
                    const day = parseInt(raw.dayOfWeek, 10);
                    parts.push(WEEKDAYS[day]);
                }
            }

            // 日
            if (raw.dayOfMonth !== '*') {
                if (raw.dayOfMonth.includes(',')) {
                    const days = raw.dayOfMonth.split(',');
                    parts.push(`每月 ${days.join('、')} 号`);
                } else if (raw.dayOfMonth.includes('-')) {
                    const [start, end] = raw.dayOfMonth.split('-');
                    parts.push(`每月 ${start} 到 ${end} 号`);
                } else {
                    parts.push(`每月 ${raw.dayOfMonth} 号`);
                }
            }

            // 月
            if (raw.month !== '*') {
                if (raw.month.includes(',')) {
                    const months = raw.month.split(',').map(m => MONTHS[parseInt(m, 10)]);
                    parts.push(`在 ${months.join('、')}`);
                } else if (raw.month.includes('-')) {
                    const [start, end] = raw.month.split('-').map(m => parseInt(m, 10));
                    parts.push(`从 ${MONTHS[start]} 到 ${MONTHS[end]}`);
                } else {
                    parts.push(`在 ${MONTHS[parseInt(raw.month, 10)]}`);
                }
            }
        }

        return parts.join('，');
    }

    /**
     * 计算下次执行时间
     * @param {Object} parsed - 解析后的 cron 对象
     * @param {number} count - 要计算的次数
     * @returns {Array} - 下次执行时间数组
     */
    function getNextRuns(parsed, count = 5) {
        if (parsed.special === 'reboot') {
            return [];
        }

        const results = [];
        const now = new Date();
        let current = new Date(now);

        // 最多检查一年
        const maxDate = new Date(now);
        maxDate.setFullYear(maxDate.getFullYear() + 1);

        while (results.length < count && current < maxDate) {
            // 增加一分钟
            current.setMinutes(current.getMinutes() + 1);
            current.setSeconds(0);
            current.setMilliseconds(0);

            const minute = current.getMinutes();
            const hour = current.getHours();
            const dayOfMonth = current.getDate();
            const month = current.getMonth() + 1;
            const dayOfWeek = current.getDay();

            // 检查是否匹配
            if (parsed.minute.includes(minute) &&
                parsed.hour.includes(hour) &&
                parsed.dayOfMonth.includes(dayOfMonth) &&
                parsed.month.includes(month) &&
                parsed.dayOfWeek.includes(dayOfWeek)) {
                results.push(new Date(current));
            }
        }

        return results;
    }

    /**
     * 格式化相对时间
     * @param {Date} date - 日期
     * @returns {string} - 相对时间字符串
     */
    function formatRelativeTime(date) {
        const now = new Date();
        const diff = date - now;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} 天后`;
        } else if (hours > 0) {
            return `${hours} 小时后`;
        } else if (minutes > 0) {
            return `${minutes} 分钟后`;
        } else {
            return '即将执行';
        }
    }

    /**
     * 格式化日期时间
     * @param {Date} date - 日期
     * @returns {string} - 格式化后的字符串
     */
    function formatDateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const weekday = WEEKDAYS[date.getDay()];

        return `${year}-${month}-${day} ${hours}:${minutes} (${weekday})`;
    }

    /**
     * 解析并显示结果
     */
    function parseAndDisplay() {
        const expression = cronInputEl.value.trim();

        if (!expression) {
            resultCardEl.classList.remove('error');
            resultTextEl.classList.remove('error');
            resultTextEl.innerHTML = '<span data-i18n="tools.crontab.enterExpression">请输入 Cron 表达式</span>';
            nextRunsListEl.innerHTML = '<div class="placeholder-text" data-i18n="tools.crontab.parseFirst">解析表达式后显示</div>';
            return;
        }

        const parsed = parseCron(expression);

        if (!parsed.valid) {
            resultCardEl.classList.add('error');
            resultTextEl.classList.add('error');
            resultTextEl.textContent = '错误: ' + parsed.error;
            nextRunsListEl.innerHTML = '<div class="placeholder-text">无法计算执行时间</div>';
            return;
        }

        resultCardEl.classList.remove('error');
        resultTextEl.classList.remove('error');

        // 显示描述
        const description = generateDescription(parsed);
        resultTextEl.textContent = description;

        // 显示下次执行时间
        const nextRuns = getNextRuns(parsed, 5);

        if (nextRuns.length === 0) {
            nextRunsListEl.innerHTML = '<div class="placeholder-text">未来一年内没有匹配的执行时间</div>';
        } else {
            nextRunsListEl.innerHTML = nextRuns.map((date, index) => `
                <div class="next-run-item">
                    <span class="next-run-index">${index + 1}</span>
                    <span class="next-run-time">${formatDateTime(date)}</span>
                    <span class="next-run-relative">${formatRelativeTime(date)}</span>
                </div>
            `).join('');
        }
    }

    /**
     * 从可视化编辑器生成表达式
     */
    function generateFromEditor() {
        const fields = [
            { type: minuteTypeEl, value: minuteValueEl, default: '*' },
            { type: hourTypeEl, value: hourValueEl, default: '*' },
            { type: dayTypeEl, value: dayValueEl, default: '*' },
            { type: monthTypeEl, value: monthValueEl, default: '*' },
            { type: weekdayTypeEl, value: weekdayValueEl, default: '*' }
        ];

        const parts = fields.map(field => {
            const type = field.type.value;
            const value = field.value.value.trim();

            switch (type) {
                case '*':
                    return '*';
                case 'specific':
                    return value || field.default;
                case 'range':
                    return value || field.default;
                case 'step':
                    return value ? `*/${value}` : '*';
                default:
                    return '*';
            }
        });

        cronInputEl.value = parts.join(' ');
        parseAndDisplay();
    }

    /**
     * 更新编辑器输入框状态
     */
    function updateEditorInputs() {
        const pairs = [
            [minuteTypeEl, minuteValueEl],
            [hourTypeEl, hourValueEl],
            [dayTypeEl, dayValueEl],
            [monthTypeEl, monthValueEl],
            [weekdayTypeEl, weekdayValueEl]
        ];

        pairs.forEach(([typeEl, valueEl]) => {
            const isDisabled = typeEl.value === '*';
            valueEl.disabled = isDisabled;
            if (isDisabled) {
                valueEl.value = '';
            }
        });
    }

    // 事件监听
    if (parseBtnEl) {
        parseBtnEl.addEventListener('click', parseAndDisplay);
    }

    if (cronInputEl) {
        cronInputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                parseAndDisplay();
            }
        });
        // 实时解析
        cronInputEl.addEventListener('input', parseAndDisplay);
    }

    if (generateBtnEl) {
        generateBtnEl.addEventListener('click', generateFromEditor);
    }

    // 编辑器类型选择变化
    [minuteTypeEl, hourTypeEl, dayTypeEl, monthTypeEl, weekdayTypeEl].forEach(el => {
        if (el) {
            el.addEventListener('change', updateEditorInputs);
        }
    });

    // 预设按钮
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cron = btn.getAttribute('data-cron');
            if (cron) {
                cronInputEl.value = cron;
                parseAndDisplay();
            }
        });
    });

    // 常用表达式点击
    document.querySelectorAll('.reference-item').forEach(item => {
        item.addEventListener('click', () => {
            const cron = item.getAttribute('data-cron');
            if (cron) {
                cronInputEl.value = cron;
                parseAndDisplay();
            }
        });
    });

    // 初始化
    updateEditorInputs();
    parseAndDisplay();

    // 导出到全局
    window.CrontabTool = { parseCron, generateDescription, getNextRuns };
})();
