/**
 * CIDR 子网计算器
 * @description CIDR 子网划分与 IP 范围计算
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM 元素
    const cidrInputEl = document.getElementById('cidr-input');
    const calculateBtnEl = document.getElementById('calculate-btn');
    const resultSectionEl = document.getElementById('result-section');
    const binarySectionEl = document.getElementById('binary-section');
    const checkIpInputEl = document.getElementById('check-ip-input');
    const checkBtnEl = document.getElementById('check-btn');
    const checkResultEl = document.getElementById('check-result');
    const subnetCountEl = document.getElementById('subnet-count');
    const divideBtnEl = document.getElementById('divide-btn');
    const subnetResultsEl = document.getElementById('subnet-results');

    // 当前计算的网络信息
    let currentNetwork = null;

    /**
     * 将 IP 地址转换为 32 位整数
     * @param {string} ip - IP 地址字符串
     * @returns {number} - 32 位整数
     */
    function ipToInt(ip) {
        const parts = ip.split('.').map(p => parseInt(p, 10));
        return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
    }

    /**
     * 将 32 位整数转换为 IP 地址
     * @param {number} int - 32 位整数
     * @returns {string} - IP 地址字符串
     */
    function intToIp(int) {
        return [
            (int >>> 24) & 255,
            (int >>> 16) & 255,
            (int >>> 8) & 255,
            int & 255
        ].join('.');
    }

    /**
     * 将数字转换为带点分隔的二进制字符串
     * @param {number} int - 32 位整数
     * @returns {string} - 二进制字符串
     */
    function intToBinary(int) {
        const binary = (int >>> 0).toString(2).padStart(32, '0');
        return [
            binary.slice(0, 8),
            binary.slice(8, 16),
            binary.slice(16, 24),
            binary.slice(24, 32)
        ].join('.');
    }

    /**
     * 根据 CIDR 前缀长度计算子网掩码
     * @param {number} prefix - CIDR 前缀长度
     * @returns {number} - 子网掩码整数
     */
    function prefixToMask(prefix) {
        if (prefix === 0) return 0;
        return (~0 << (32 - prefix)) >>> 0;
    }

    /**
     * 解析 CIDR 表示法
     * @param {string} cidr - CIDR 字符串
     * @returns {Object|null} - 解析结果
     */
    function parseCidr(cidr) {
        const match = cidr.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
        if (!match) return null;

        const ip = match[1];
        const prefix = parseInt(match[2], 10);

        // 验证 IP 地址
        const parts = ip.split('.').map(p => parseInt(p, 10));
        if (parts.some(p => p < 0 || p > 255)) return null;

        // 验证前缀长度
        if (prefix < 0 || prefix > 32) return null;

        return { ip, prefix };
    }

    /**
     * 判断 IP 类别
     * @param {number} firstOctet - 第一个八位组
     * @returns {string} - IP 类别
     */
    function getIpClass(firstOctet) {
        if (firstOctet < 128) return 'A';
        if (firstOctet < 192) return 'B';
        if (firstOctet < 224) return 'C';
        if (firstOctet < 240) return 'D (组播)';
        return 'E (保留)';
    }

    /**
     * 判断 IP 类型（公有/私有）
     * @param {number} ipInt - IP 整数
     * @returns {string} - IP 类型
     */
    function getIpType(ipInt) {
        const firstOctet = (ipInt >>> 24) & 255;
        const secondOctet = (ipInt >>> 16) & 255;

        // 私有地址范围
        // 10.0.0.0 - 10.255.255.255
        if (firstOctet === 10) return '私有 (Class A)';
        // 172.16.0.0 - 172.31.255.255
        if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) return '私有 (Class B)';
        // 192.168.0.0 - 192.168.255.255
        if (firstOctet === 192 && secondOctet === 168) return '私有 (Class C)';
        // 127.0.0.0 - 127.255.255.255
        if (firstOctet === 127) return '本地回环';
        // 169.254.0.0 - 169.254.255.255
        if (firstOctet === 169 && secondOctet === 254) return '链路本地';
        // 224.0.0.0 - 239.255.255.255
        if (firstOctet >= 224 && firstOctet <= 239) return '组播';
        // 240.0.0.0 - 255.255.255.255
        if (firstOctet >= 240) return '保留';

        return '公有';
    }

    /**
     * 计算网络信息
     * @param {string} cidr - CIDR 字符串
     * @returns {Object|null} - 网络信息
     */
    function calculateNetwork(cidr) {
        const parsed = parseCidr(cidr);
        if (!parsed) return null;

        const { ip, prefix } = parsed;
        const ipInt = ipToInt(ip);
        const mask = prefixToMask(prefix);
        const wildcardMask = ~mask >>> 0;

        const networkAddress = (ipInt & mask) >>> 0;
        const broadcastAddress = (networkAddress | wildcardMask) >>> 0;

        const totalHosts = Math.pow(2, 32 - prefix);
        const usableHosts = prefix >= 31 ? totalHosts : totalHosts - 2;

        const firstHost = prefix >= 31 ? networkAddress : networkAddress + 1;
        const lastHost = prefix >= 31 ? broadcastAddress : broadcastAddress - 1;

        const firstOctet = (ipInt >>> 24) & 255;

        return {
            cidr,
            ip,
            prefix,
            ipInt,
            mask,
            maskStr: intToIp(mask),
            wildcardMask: intToIp(wildcardMask),
            networkAddress: intToIp(networkAddress),
            networkAddressInt: networkAddress,
            broadcastAddress: intToIp(broadcastAddress),
            broadcastAddressInt: broadcastAddress,
            firstHost: intToIp(firstHost),
            firstHostInt: firstHost,
            lastHost: intToIp(lastHost),
            lastHostInt: lastHost,
            totalHosts,
            usableHosts,
            ipClass: getIpClass(firstOctet),
            ipType: getIpType(networkAddress),
            ipBinary: intToBinary(ipInt),
            maskBinary: intToBinary(mask),
            networkBinary: intToBinary(networkAddress)
        };
    }

    /**
     * 格式化大数字
     * @param {number} num - 数字
     * @returns {string} - 格式化后的字符串
     */
    function formatNumber(num) {
        return num.toLocaleString();
    }

    /**
     * 显示计算结果
     * @param {Object} network - 网络信息
     */
    function displayResult(network) {
        if (!network) {
            resultSectionEl.style.display = 'none';
            binarySectionEl.style.display = 'none';
            return;
        }

        currentNetwork = network;

        // 显示基本信息
        document.getElementById('network-address').textContent = network.networkAddress;
        document.getElementById('broadcast-address').textContent = network.broadcastAddress;
        document.getElementById('subnet-mask').textContent = network.maskStr;
        document.getElementById('wildcard-mask').textContent = network.wildcardMask;
        document.getElementById('first-host').textContent = network.firstHost;
        document.getElementById('last-host').textContent = network.lastHost;
        document.getElementById('total-hosts').textContent = formatNumber(network.totalHosts);
        document.getElementById('usable-hosts').textContent = formatNumber(network.usableHosts);
        document.getElementById('ip-class').textContent = network.ipClass;
        document.getElementById('ip-type').textContent = network.ipType;

        // 显示二进制
        document.getElementById('ip-binary').textContent = network.ipBinary;
        document.getElementById('mask-binary').textContent = network.maskBinary;
        document.getElementById('network-binary').textContent = network.networkBinary;

        resultSectionEl.style.display = 'block';
        binarySectionEl.style.display = 'block';
    }

    /**
     * 检查 IP 是否在范围内
     */
    function checkIpInRange() {
        if (!currentNetwork) return;

        const ip = checkIpInputEl.value.trim();
        if (!ip) {
            checkResultEl.style.display = 'none';
            return;
        }

        // 验证 IP 格式
        const match = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
        if (!match) {
            checkResultEl.className = 'check-result out-of-range';
            checkResultEl.style.display = 'block';
            document.getElementById('check-result-text').textContent = '无效的 IP 地址格式';
            return;
        }

        const parts = ip.split('.').map(p => parseInt(p, 10));
        if (parts.some(p => p < 0 || p > 255)) {
            checkResultEl.className = 'check-result out-of-range';
            checkResultEl.style.display = 'block';
            document.getElementById('check-result-text').textContent = '无效的 IP 地址';
            return;
        }

        const ipInt = ipToInt(ip);
        const inRange = ipInt >= currentNetwork.networkAddressInt &&
                        ipInt <= currentNetwork.broadcastAddressInt;

        checkResultEl.style.display = 'block';
        if (inRange) {
            checkResultEl.className = 'check-result in-range';
            document.getElementById('check-result-text').textContent =
                `✓ ${ip} 在 ${currentNetwork.cidr} 范围内`;
        } else {
            checkResultEl.className = 'check-result out-of-range';
            document.getElementById('check-result-text').textContent =
                `✗ ${ip} 不在 ${currentNetwork.cidr} 范围内`;
        }
    }

    /**
     * 划分子网
     */
    function divideSubnets() {
        if (!currentNetwork) return;

        const count = parseInt(subnetCountEl.value, 10);
        const bitsNeeded = Math.ceil(Math.log2(count));
        const newPrefix = currentNetwork.prefix + bitsNeeded;

        if (newPrefix > 32) {
            subnetResultsEl.innerHTML = '<div class="subnet-item"><span style="color: #ef4444;">无法划分：子网掩码超过 /32</span></div>';
            subnetResultsEl.style.display = 'block';
            return;
        }

        const subnets = [];
        const subnetSize = Math.pow(2, 32 - newPrefix);

        for (let i = 0; i < count; i++) {
            const subnetStart = currentNetwork.networkAddressInt + (i * subnetSize);
            const subnetEnd = subnetStart + subnetSize - 1;
            const usableHosts = newPrefix >= 31 ? subnetSize : subnetSize - 2;

            subnets.push({
                cidr: `${intToIp(subnetStart)}/${newPrefix}`,
                range: `${intToIp(subnetStart)} - ${intToIp(subnetEnd)}`,
                hosts: usableHosts
            });
        }

        subnetResultsEl.innerHTML = subnets.map((subnet, index) => `
            <div class="subnet-item">
                <span class="subnet-cidr">#${index + 1} ${subnet.cidr}</span>
                <span class="subnet-range">${subnet.range}</span>
                <span class="subnet-hosts">${formatNumber(subnet.hosts)} 可用</span>
            </div>
        `).join('');
        subnetResultsEl.style.display = 'block';
    }

    /**
     * 执行计算
     */
    function calculate() {
        const cidr = cidrInputEl.value.trim();
        const network = calculateNetwork(cidr);

        if (!network) {
            resultSectionEl.style.display = 'none';
            binarySectionEl.style.display = 'none';
            subnetResultsEl.style.display = 'none';
            checkResultEl.style.display = 'none';
            return;
        }

        displayResult(network);
    }

    // 事件监听
    if (calculateBtnEl) {
        calculateBtnEl.addEventListener('click', calculate);
    }

    if (cidrInputEl) {
        cidrInputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                calculate();
            }
        });
        cidrInputEl.addEventListener('input', calculate);
    }

    if (checkBtnEl) {
        checkBtnEl.addEventListener('click', checkIpInRange);
    }

    if (checkIpInputEl) {
        checkIpInputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkIpInRange();
            }
        });
    }

    if (divideBtnEl) {
        divideBtnEl.addEventListener('click', divideSubnets);
    }

    // 预设按钮
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cidr = btn.getAttribute('data-cidr');
            if (cidr) {
                cidrInputEl.value = cidr;
                calculate();
            }
        });
    });

    // 参考表点击
    document.querySelectorAll('.clickable-row').forEach(row => {
        row.addEventListener('click', () => {
            const cidr = row.getAttribute('data-cidr');
            if (cidr) {
                cidrInputEl.value = cidr;
                calculate();
            }
        });
    });

    // 初始化
    calculate();

    // 导出到全局
    window.CidrTool = { calculateNetwork, ipToInt, intToIp };
})();
