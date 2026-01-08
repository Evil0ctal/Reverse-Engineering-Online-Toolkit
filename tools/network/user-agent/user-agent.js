/**
 * User-Agent 解析器工具
 * @description 解析 User-Agent 字符串
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 浏览器正则表达式
    const browsers = [
        { name: 'Edge', regex: /Edg(?:e|A|iOS)?\/(\d+[\d.]*)/ },
        { name: 'Opera', regex: /(?:OPR|Opera)\/(\d+[\d.]*)/ },
        { name: 'Chrome', regex: /(?:Chrome|CriOS)\/(\d+[\d.]*)/ },
        { name: 'Firefox', regex: /(?:Firefox|FxiOS)\/(\d+[\d.]*)/ },
        { name: 'Safari', regex: /Safari\/(\d+[\d.]*)/, version: /Version\/(\d+[\d.]*)/ },
        { name: 'IE', regex: /(?:MSIE |rv:)(\d+[\d.]*)/ },
        { name: 'Samsung Browser', regex: /SamsungBrowser\/(\d+[\d.]*)/ },
        { name: 'UC Browser', regex: /UCBrowser\/(\d+[\d.]*)/ },
        { name: 'QQ Browser', regex: /QQBrowser\/(\d+[\d.]*)/ },
        { name: 'Brave', regex: /Brave\/(\d+[\d.]*)/ }
    ];

    // 浏览器引擎
    const engines = [
        { name: 'Blink', regex: /Chrome\/(\d+[\d.]*)/ },
        { name: 'WebKit', regex: /AppleWebKit\/(\d+[\d.]*)/ },
        { name: 'Gecko', regex: /Gecko\/(\d+[\d.]*)/ },
        { name: 'Trident', regex: /Trident\/(\d+[\d.]*)/ },
        { name: 'EdgeHTML', regex: /Edge\/(\d+[\d.]*)/ },
        { name: 'Presto', regex: /Presto\/(\d+[\d.]*)/ }
    ];

    // 操作系统
    const operatingSystems = [
        { name: 'Windows 11', regex: /Windows NT 10\.0.*Win64/ },
        { name: 'Windows 10', regex: /Windows NT 10\.0/ },
        { name: 'Windows 8.1', regex: /Windows NT 6\.3/ },
        { name: 'Windows 8', regex: /Windows NT 6\.2/ },
        { name: 'Windows 7', regex: /Windows NT 6\.1/ },
        { name: 'Windows Vista', regex: /Windows NT 6\.0/ },
        { name: 'Windows XP', regex: /Windows NT 5\.[12]/ },
        { name: 'macOS', regex: /Mac OS X (\d+[._]\d+[._]?\d*)/, version: true },
        { name: 'iOS', regex: /(?:iPhone|iPad|iPod).*OS (\d+[._]\d+[._]?\d*)/, version: true },
        { name: 'Android', regex: /Android (\d+[\d.]*)/, version: true },
        { name: 'Linux', regex: /Linux/ },
        { name: 'Ubuntu', regex: /Ubuntu/ },
        { name: 'Chrome OS', regex: /CrOS/ },
        { name: 'FreeBSD', regex: /FreeBSD/ }
    ];

    // 设备类型
    const deviceTypes = [
        { type: 'Mobile', regex: /Mobile|Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/ },
        { type: 'Tablet', regex: /Tablet|iPad|Android(?!.*Mobile)|Kindle|PlayBook/ },
        { type: 'Smart TV', regex: /SmartTV|SMART-TV|GoogleTV|HbbTV|NetCast|NETTV|AppleTV|Roku|Fire TV/ },
        { type: 'Console', regex: /PlayStation|Xbox|Nintendo/ },
        { type: 'Wearable', regex: /Watch/ },
        { type: 'Desktop', regex: /./ } // 默认
    ];

    // 设备厂商
    const vendors = [
        { name: 'Apple', regex: /iPhone|iPad|iPod|Macintosh/ },
        { name: 'Samsung', regex: /Samsung|SM-|GT-/ },
        { name: 'Huawei', regex: /Huawei|HUAWEI/ },
        { name: 'Xiaomi', regex: /Xiaomi|MI |Redmi/ },
        { name: 'OPPO', regex: /OPPO/ },
        { name: 'Vivo', regex: /vivo/ },
        { name: 'OnePlus', regex: /OnePlus/ },
        { name: 'Google', regex: /Pixel|Nexus/ },
        { name: 'Sony', regex: /Sony/ },
        { name: 'LG', regex: /LG/ },
        { name: 'HTC', regex: /HTC/ },
        { name: 'Microsoft', regex: /Windows Phone|Xbox/ }
    ];

    // 机器人
    const bots = [
        { name: 'Googlebot', regex: /Googlebot/ },
        { name: 'Bingbot', regex: /bingbot/ },
        { name: 'Baiduspider', regex: /Baiduspider/ },
        { name: 'YandexBot', regex: /YandexBot/ },
        { name: 'DuckDuckBot', regex: /DuckDuckBot/ },
        { name: 'Slurp', regex: /Slurp/ },
        { name: 'facebookexternalhit', regex: /facebookexternalhit/ },
        { name: 'Twitterbot', regex: /Twitterbot/ },
        { name: 'LinkedInBot', regex: /LinkedInBot/ },
        { name: 'bot', regex: /bot|crawler|spider|crawl/i }
    ];

    // CPU 架构
    const cpuArchitectures = [
        { name: 'x64', regex: /x86_64|x64|Win64|WOW64|amd64/ },
        { name: 'x86', regex: /i[3456]86|x86/ },
        { name: 'ARM64', regex: /aarch64|arm64/ },
        { name: 'ARM', regex: /arm/i },
        { name: 'PowerPC', regex: /PowerPC|PPC/ },
        { name: 'MIPS', regex: /MIPS/ }
    ];

    /**
     * 解析 User-Agent
     */
    function parseUserAgent(ua) {
        if (!ua || typeof ua !== 'string') {
            return null;
        }

        const result = {
            browser: { name: 'Unknown', version: null, engine: null },
            os: { name: 'Unknown', version: null, platform: null },
            device: { type: 'Desktop', vendor: null, model: null },
            isBot: false,
            botName: null,
            isMobile: false,
            cpu: { architecture: null }
        };

        // 解析浏览器
        for (const browser of browsers) {
            const match = ua.match(browser.regex);
            if (match) {
                result.browser.name = browser.name;
                if (browser.version) {
                    const versionMatch = ua.match(browser.version);
                    result.browser.version = versionMatch ? versionMatch[1] : match[1];
                } else {
                    result.browser.version = match[1];
                }
                break;
            }
        }

        // 解析引擎
        for (const engine of engines) {
            const match = ua.match(engine.regex);
            if (match) {
                result.browser.engine = engine.name;
                break;
            }
        }

        // 解析操作系统
        for (const os of operatingSystems) {
            const match = ua.match(os.regex);
            if (match) {
                result.os.name = os.name;
                if (os.version && match[1]) {
                    result.os.version = match[1].replace(/_/g, '.');
                }
                break;
            }
        }

        // 确定平台
        if (/Windows/.test(ua)) {
            result.os.platform = 'Windows';
        } else if (/Macintosh|Mac OS/.test(ua)) {
            result.os.platform = 'macOS';
        } else if (/iPhone|iPad|iPod/.test(ua)) {
            result.os.platform = 'iOS';
        } else if (/Android/.test(ua)) {
            result.os.platform = 'Android';
        } else if (/Linux/.test(ua)) {
            result.os.platform = 'Linux';
        }

        // 解析设备类型
        for (const device of deviceTypes) {
            if (device.regex.test(ua)) {
                result.device.type = device.type;
                break;
            }
        }

        // 解析设备厂商
        for (const vendor of vendors) {
            if (vendor.regex.test(ua)) {
                result.device.vendor = vendor.name;
                break;
            }
        }

        // 检测机器人
        for (const bot of bots) {
            if (bot.regex.test(ua)) {
                result.isBot = true;
                result.botName = bot.name;
                break;
            }
        }

        // 检测移动端
        result.isMobile = /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

        // 解析 CPU 架构
        for (const cpu of cpuArchitectures) {
            if (cpu.regex.test(ua)) {
                result.cpu.architecture = cpu.name;
                break;
            }
        }

        return result;
    }

    /**
     * 获取浏览器图标
     */
    function getBrowserIcon(name) {
        const icons = {
            'Chrome': '🔵',
            'Firefox': '🦊',
            'Safari': '🧭',
            'Edge': '🌀',
            'Opera': '🔴',
            'IE': '🌐',
            'Samsung Browser': '📱',
            'UC Browser': '🟠',
            'Brave': '🦁'
        };
        return icons[name] || '🌐';
    }

    /**
     * 获取操作系统图标
     */
    function getOsIcon(platform) {
        const icons = {
            'Windows': '🪟',
            'macOS': '🍎',
            'iOS': '📱',
            'Android': '🤖',
            'Linux': '🐧'
        };
        return icons[platform] || '💻';
    }

    /**
     * 获取设备图标
     */
    function getDeviceIcon(type) {
        const icons = {
            'Mobile': '📱',
            'Tablet': '📱',
            'Desktop': '🖥️',
            'Smart TV': '📺',
            'Console': '🎮',
            'Wearable': '⌚'
        };
        return icons[type] || '📱';
    }

    /**
     * 显示解析结果
     */
    function displayResult(result) {
        const resultSection = document.getElementById('result-section');
        if (!resultSection) return;

        resultSection.style.display = 'block';

        // 浏览器信息
        document.getElementById('browser-icon').textContent = getBrowserIcon(result.browser.name);
        document.getElementById('browser-name').textContent = result.browser.name;
        document.getElementById('browser-version').textContent = result.browser.version || '-';
        document.getElementById('browser-engine').textContent = result.browser.engine || '-';

        // 操作系统信息
        document.getElementById('os-icon').textContent = getOsIcon(result.os.platform);
        document.getElementById('os-name').textContent = result.os.name;
        document.getElementById('os-version').textContent = result.os.version || '-';
        document.getElementById('os-platform').textContent = result.os.platform || '-';

        // 设备信息
        document.getElementById('device-icon').textContent = getDeviceIcon(result.device.type);
        document.getElementById('device-type').textContent = result.device.type;
        document.getElementById('device-vendor').textContent = result.device.vendor || '-';
        document.getElementById('device-model').textContent = result.device.model || '-';

        // 其他信息
        document.getElementById('is-bot').textContent = result.isBot ? `是 (${result.botName})` : '否';
        document.getElementById('is-mobile').textContent = result.isMobile ? '是' : '否';
        document.getElementById('cpu-arch').textContent = result.cpu.architecture || '-';

        // JSON 输出
        document.getElementById('json-output').value = JSON.stringify(result, null, 2);
    }

    /**
     * 复制到剪贴板
     */
    async function copyToClipboard(text) {
        const success = await REOT.utils?.copyToClipboard(text);
        if (success) {
            REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
        }
    }

    // 事件委托处理器
    document.addEventListener('click', (e) => {
        const target = e.target;

        // 解析按钮
        if (target.id === 'parse-btn' || target.closest('#parse-btn')) {
            const input = document.getElementById('input');
            if (!input.value.trim()) {
                REOT.utils?.showNotification('请输入 User-Agent 字符串', 'warning');
                return;
            }

            const result = parseUserAgent(input.value.trim());
            if (result) {
                displayResult(result);
                REOT.utils?.showNotification('解析成功', 'success');
            } else {
                REOT.utils?.showNotification('解析失败', 'error');
            }
        }

        // 获取当前浏览器
        if (target.id === 'get-browser-btn' || target.closest('#get-browser-btn')) {
            const input = document.getElementById('input');
            if (input) {
                input.value = navigator.userAgent;
                REOT.utils?.showNotification('已获取当前浏览器的 User-Agent', 'success');
            }
        }

        // 清除按钮
        if (target.id === 'clear-btn' || target.closest('#clear-btn')) {
            const input = document.getElementById('input');
            const resultSection = document.getElementById('result-section');

            if (input) input.value = '';
            if (resultSection) resultSection.style.display = 'none';
        }

        // 复制 JSON
        if (target.id === 'copy-btn' || target.closest('#copy-btn')) {
            const jsonOutput = document.getElementById('json-output');
            if (jsonOutput && jsonOutput.value) {
                copyToClipboard(jsonOutput.value);
            }
        }
    });

    // 导出工具函数
    window.UserAgentTool = {
        parse: parseUserAgent
    };

    // 设置默认示例数据
    const defaultInput = document.getElementById('input');
    if (defaultInput && !defaultInput.value) {
        defaultInput.value = navigator.userAgent;
    }

})();
