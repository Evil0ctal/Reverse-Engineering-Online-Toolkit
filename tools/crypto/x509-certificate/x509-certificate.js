/**
 * X.509 证书工具
 * @description 密钥对生成、CSR创建、自签名证书、CA签发、证书解析
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // 密钥类型与参数的映射
    const KEY_SIZE_OPTIONS = {
        ECC: [
            { value: 'P-256', label: 'P-256' },
            { value: 'P-384', label: 'P-384' },
            { value: 'P-521', label: 'P-521' }
        ],
        RSA: [
            { value: 2048, label: 'RSA 2048' },
            { value: 4096, label: 'RSA 4096' }
        ]
    };

    // 更新密钥参数选项
    function updateKeySizeOptions(typeSelectId, sizeSelectId) {
        const typeSelect = document.getElementById(typeSelectId);
        const sizeSelect = document.getElementById(sizeSelectId);
        if (!typeSelect || !sizeSelect) return;

        const keyType = typeSelect.value;
        const options = KEY_SIZE_OPTIONS[keyType] || [];

        sizeSelect.innerHTML = '';
        options.forEach((opt, index) => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (index === 1) option.selected = true; // 默认选中第二个
            sizeSelect.appendChild(option);
        });
    }

    // 获取正确类型的密钥参数
    function getKeySize(sizeSelectId) {
        const sizeSelect = document.getElementById(sizeSelectId);
        if (!sizeSelect) return 'P-384';
        const value = sizeSelect.value;
        // RSA 参数需要转换为数字
        return isNaN(value) ? value : parseInt(value);
    }

    // 生成密钥对
    async function generateKeypair() {
        const keyType = document.getElementById('keypair-type')?.value || 'ECC';
        const keySize = getKeySize('keypair-size');

        try {
            REOT.utils?.showNotification('正在生成密钥对...', 'info');

            const result = await X509.keypair(keyType, keySize);

            document.getElementById('keypair-private').value = result.private_key;
            document.getElementById('keypair-public').value = result.public_key;

            REOT.utils?.showNotification('密钥对生成成功', 'success');
        } catch (error) {
            console.error('密钥生成错误:', error);
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    // 生成 CSR
    async function generateCSR() {
        const keyType = document.getElementById('csr-keytype')?.value || 'ECC';
        const keySize = getKeySize('csr-keysize');
        const cn = document.getElementById('csr-cn')?.value?.trim();

        if (!cn) {
            REOT.utils?.showNotification('请输入通用名称 (CN)', 'warning');
            return;
        }

        try {
            REOT.utils?.showNotification('正在生成 CSR...', 'info');

            // 构建主体信息
            const subject = X509.X509Name(cn);
            const o = document.getElementById('csr-o')?.value?.trim();
            const ou = document.getElementById('csr-ou')?.value?.trim();
            const c = document.getElementById('csr-c')?.value?.trim();
            const st = document.getElementById('csr-st')?.value?.trim();
            const l = document.getElementById('csr-l')?.value?.trim();

            if (o) subject.org(o);
            if (ou) subject.org_unit(ou);
            if (c) subject.country(c);
            if (st) subject.state(st);
            if (l) subject.location(l);

            // 构建 SAN
            const sanInput = document.getElementById('csr-san')?.value?.trim();
            let san = null;
            if (sanInput) {
                const sanList = sanInput.split(',').map(s => s.trim()).filter(s => s);
                if (sanList.length > 0) {
                    san = X509.SubjectAltNames(sanList);
                }
            }

            const result = await X509.csr(keyType, keySize, subject, san);

            document.getElementById('csr-private').value = result.private_key;
            document.getElementById('csr-public').value = result.public_key;
            document.getElementById('csr-output').value = result.csr;

            REOT.utils?.showNotification('CSR 生成成功', 'success');
        } catch (error) {
            console.error('CSR 生成错误:', error);
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    // 生成自签名证书
    async function generateSelfSigned() {
        const keyType = document.getElementById('selfsign-keytype')?.value || 'ECC';
        const keySize = getKeySize('selfsign-keysize');
        const days = parseInt(document.getElementById('selfsign-days')?.value) || 365;
        const isCa = document.getElementById('selfsign-isca')?.checked || false;
        const cn = document.getElementById('selfsign-cn')?.value?.trim();

        if (!cn) {
            REOT.utils?.showNotification('请输入通用名称 (CN)', 'warning');
            return;
        }

        try {
            REOT.utils?.showNotification('正在生成自签名证书...', 'info');

            // 构建主体信息
            const subject = X509.X509Name(cn);
            const o = document.getElementById('selfsign-o')?.value?.trim();
            const c = document.getElementById('selfsign-c')?.value?.trim();

            if (o) subject.org(o);
            if (c) subject.country(c);

            // 构建 SAN
            const sanInput = document.getElementById('selfsign-san')?.value?.trim();
            let san = X509.SubjectAltNames();
            if (sanInput) {
                const sanList = sanInput.split(',').map(s => s.trim()).filter(s => s);
                san.add(sanList);
            }

            // 创建证书信息
            const certInfo = X509.X509CertificateInfo(subject, san);
            certInfo.days(days);
            certInfo.isCa(isCa);

            const result = await X509.selfSignedCertificate(keyType, keySize, certInfo);

            document.getElementById('selfsign-private').value = result.private_key;
            document.getElementById('selfsign-public').value = result.public_key;
            document.getElementById('selfsign-cert').value = result.cer;

            REOT.utils?.showNotification('自签名证书生成成功', 'success');
        } catch (error) {
            console.error('自签名证书生成错误:', error);
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    // CA 签发证书
    async function issueCertificate() {
        const csrPem = document.getElementById('issue-csr')?.value?.trim();
        const caCertPem = document.getElementById('issue-ca-cert')?.value?.trim();
        const caKeyPem = document.getElementById('issue-ca-key')?.value?.trim();
        const days = parseInt(document.getElementById('issue-days')?.value) || 365;
        const isCa = document.getElementById('issue-isca')?.checked || false;

        if (!csrPem || !caCertPem || !caKeyPem) {
            REOT.utils?.showNotification('请填写 CSR、CA 证书和 CA 私钥', 'warning');
            return;
        }

        try {
            REOT.utils?.showNotification('正在签发证书...', 'info');

            // 解析 CSR 获取主体信息
            const csrInfo = await X509.parse(csrPem);

            // 创建证书信息
            const certInfo = X509.X509CertificateInfo(csrInfo.subject, csrInfo.subjectAltNames);
            certInfo.days(days);
            certInfo.isCa(isCa);

            const result = await X509.issue(csrPem, certInfo, caCertPem, caKeyPem);

            document.getElementById('issue-output').value = result.cer;

            REOT.utils?.showNotification('证书签发成功', 'success');
        } catch (error) {
            console.error('证书签发错误:', error);
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    // 解析 PEM
    async function parsePEM() {
        const input = document.getElementById('parse-input')?.value?.trim();
        const outputEl = document.getElementById('parse-output');

        if (!input) {
            REOT.utils?.showNotification('请输入 PEM 内容', 'warning');
            return;
        }

        try {
            REOT.utils?.showNotification('正在解析...', 'info');

            const result = await X509.parse(input);

            // 根据解析结果类型显示不同的内容
            let html = '';

            if (result && typeof result === 'object') {
                if (result.subject) {
                    // 证书或 CSR
                    html = renderCertificateInfo(result);
                } else if (result.algorithm) {
                    // 密钥
                    html = renderKeyInfo(result);
                } else {
                    html = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
                }
            } else {
                html = '<div class="parse-message">解析完成，但无法识别的格式</div>';
            }

            outputEl.innerHTML = html;
            REOT.utils?.showNotification('解析成功', 'success');
        } catch (error) {
            console.error('解析错误:', error);
            outputEl.innerHTML = `<div class="parse-error">解析失败: ${error.message}</div>`;
            REOT.utils?.showNotification(error.message, 'error');
        }
    }

    // 渲染证书/CSR 信息
    function renderCertificateInfo(info) {
        let html = '<div class="cert-info">';

        // 主体信息
        if (info.subject) {
            html += '<div class="info-section">';
            html += '<h4>主体信息 (Subject)</h4>';
            html += '<table class="info-table">';
            const subjectData = info.subject.all ? info.subject.all() : info.subject;
            for (const [key, value] of Object.entries(subjectData)) {
                if (value) {
                    html += `<tr><td class="info-key">${key}</td><td class="info-value">${escapeHtml(value)}</td></tr>`;
                }
            }
            html += '</table></div>';
        }

        // 签发者信息
        if (info.issuer) {
            html += '<div class="info-section">';
            html += '<h4>签发者信息 (Issuer)</h4>';
            html += '<table class="info-table">';
            const issuerData = info.issuer.all ? info.issuer.all() : info.issuer;
            for (const [key, value] of Object.entries(issuerData)) {
                if (value) {
                    html += `<tr><td class="info-key">${key}</td><td class="info-value">${escapeHtml(value)}</td></tr>`;
                }
            }
            html += '</table></div>';
        }

        // 有效期
        if (info.notBefore || info.notAfter) {
            html += '<div class="info-section">';
            html += '<h4>有效期 (Validity)</h4>';
            html += '<table class="info-table">';
            if (info.notBefore) {
                html += `<tr><td class="info-key">Not Before</td><td class="info-value">${formatDate(info.notBefore)}</td></tr>`;
            }
            if (info.notAfter) {
                html += `<tr><td class="info-key">Not After</td><td class="info-value">${formatDate(info.notAfter)}</td></tr>`;
            }
            html += '</table></div>';
        }

        // SAN
        if (info.subjectAltNames) {
            const sanList = info.subjectAltNames.all ? info.subjectAltNames.all() : [];
            if (sanList.length > 0) {
                html += '<div class="info-section">';
                html += '<h4>备用名称 (Subject Alternative Names)</h4>';
                html += '<ul class="san-list">';
                sanList.forEach(san => {
                    html += `<li>${escapeHtml(san)}</li>`;
                });
                html += '</ul></div>';
            }
        }

        // 公钥
        if (info.publicKeyPem) {
            html += '<div class="info-section">';
            html += '<h4>公钥 (Public Key)</h4>';
            html += `<pre class="pem-block">${escapeHtml(info.publicKeyPem)}</pre>`;
            html += '</div>';
        }

        // 签名算法
        if (info.signatureAlgorithm) {
            html += '<div class="info-section">';
            html += '<h4>签名算法</h4>';
            html += `<p class="info-value">${escapeHtml(info.signatureAlgorithm)}</p>`;
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    // 渲染密钥信息
    function renderKeyInfo(keyObj) {
        let html = '<div class="cert-info">';
        html += '<div class="info-section">';
        html += '<h4>密钥信息</h4>';
        html += '<table class="info-table">';

        if (keyObj.algorithm) {
            html += `<tr><td class="info-key">算法</td><td class="info-value">${escapeHtml(keyObj.algorithm.name || '')}</td></tr>`;
            if (keyObj.algorithm.namedCurve) {
                html += `<tr><td class="info-key">曲线</td><td class="info-value">${escapeHtml(keyObj.algorithm.namedCurve)}</td></tr>`;
            }
            if (keyObj.algorithm.modulusLength) {
                html += `<tr><td class="info-key">模数长度</td><td class="info-value">${keyObj.algorithm.modulusLength} bits</td></tr>`;
            }
        }

        html += '</table></div>';
        html += '<div class="parse-message">密钥已成功解析并导入</div>';
        html += '</div>';
        return html;
    }

    // 格式化日期
    function formatDate(dateStr) {
        if (!dateStr) return '';
        // UTCTime 格式: YYMMDDHHMMSSZ
        if (dateStr.length === 13 && dateStr.endsWith('Z')) {
            let year = parseInt(dateStr.substr(0, 2));
            year = year >= 50 ? 1900 + year : 2000 + year;
            const month = dateStr.substr(2, 2);
            const day = dateStr.substr(4, 2);
            const hour = dateStr.substr(6, 2);
            const min = dateStr.substr(8, 2);
            const sec = dateStr.substr(10, 2);
            return `${year}-${month}-${day} ${hour}:${min}:${sec} UTC`;
        }
        return dateStr;
    }

    // HTML 转义
    function escapeHtml(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // 加载示例证书 - 使用工具自动生成
    async function loadSampleCertificate() {
        try {
            REOT.utils?.showNotification('正在生成示例证书...', 'info');

            // 使用 X509 库生成一个示例自签名证书
            const subject = X509.X509Name('Example Certificate');
            subject.org('REOT Demo');
            subject.country('CN');

            const san = X509.SubjectAltNames();
            san.add(['localhost', '127.0.0.1']);

            const certInfo = X509.X509CertificateInfo(subject, san);
            certInfo.days(365);
            certInfo.isCa(false);

            const result = await X509.selfSignedCertificate('ECC', 'P-256', certInfo);

            document.getElementById('parse-input').value = result.cer;
            REOT.utils?.showNotification('示例证书已生成', 'success');
        } catch (error) {
            console.error('生成示例证书失败:', error);
            // 回退到静态示例 CSR
            const sampleCSR = `-----BEGIN CERTIFICATE REQUEST-----
MIHoMIGPAgEAMBMxETAPBgNVBAMMCGV4YW1wbGUwWTATBgcqhkjOPQIBBggqhkjO
PQMBBwNCAAQ7VJuPPxqcWM8VvBh7p1GXBJq7VzCg+sV3GXqvI8DwHWzH5rl+Vfby
KHVDQ7V4Y7ql5bUl3VtlVHyVVZFqLJfvoB4wHAYJKoZIhvcNAQkOMQ8wDTALBgNV
HREEBDAChwR/AAABMAoGCCqGSM49BAMCA0gAMEUCIQCpx9cI0rN1TnZk6QFSQZXJ
h4wFd+6pPfgUZu3A6u8UjQIgRkLt7DWN5dq5TfXHKPl+mN9q5RtJ1o7dRqPqgYKC
1Yg=
-----END CERTIFICATE REQUEST-----`;
            document.getElementById('parse-input').value = sampleCSR;
            REOT.utils?.showNotification('已加载示例 CSR', 'info');
        }
    }

    // 检查是否是当前工具页面
    function isToolActive() {
        const route = REOT.router?.getRoute();
        return route && route.includes('/tools/crypto/x509-certificate');
    }

    // 切换功能面板
    function switchPanel(feature) {
        // 更新标签页状态
        document.querySelectorAll('.feature-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.feature === feature);
        });

        // 更新面板显示
        document.querySelectorAll('.feature-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${feature}`);
        });
    }

    // 初始化密钥类型选择器
    function initKeyTypeSelectors() {
        const selectors = [
            ['keypair-type', 'keypair-size'],
            ['csr-keytype', 'csr-keysize'],
            ['selfsign-keytype', 'selfsign-keysize']
        ];

        selectors.forEach(([typeId, sizeId]) => {
            const typeSelect = document.getElementById(typeId);
            if (typeSelect) {
                typeSelect.addEventListener('change', () => {
                    updateKeySizeOptions(typeId, sizeId);
                });
                // 初始化选项
                updateKeySizeOptions(typeId, sizeId);
            }
        });
    }

    // 事件监听
    document.addEventListener('click', async (e) => {
        if (!isToolActive()) return;

        const target = e.target;

        // 功能标签页切换
        if (target.classList.contains('feature-tab')) {
            switchPanel(target.dataset.feature);
            return;
        }

        // 生成密钥对
        if (target.id === 'btn-gen-keypair' || target.closest('#btn-gen-keypair')) {
            await generateKeypair();
            return;
        }

        // 生成 CSR
        if (target.id === 'btn-gen-csr' || target.closest('#btn-gen-csr')) {
            await generateCSR();
            return;
        }

        // 生成自签名证书
        if (target.id === 'btn-gen-selfsign' || target.closest('#btn-gen-selfsign')) {
            await generateSelfSigned();
            return;
        }

        // CA 签发证书
        if (target.id === 'btn-issue-cert' || target.closest('#btn-issue-cert')) {
            await issueCertificate();
            return;
        }

        // 解析 PEM
        if (target.id === 'btn-parse' || target.closest('#btn-parse')) {
            await parsePEM();
            return;
        }

        // 加载示例
        if (target.id === 'btn-parse-sample' || target.closest('#btn-parse-sample')) {
            await loadSampleCertificate();
            return;
        }

        // 复制按钮
        if (target.classList.contains('copy-btn') || target.closest('.copy-btn')) {
            const btn = target.classList.contains('copy-btn') ? target : target.closest('.copy-btn');
            const targetId = btn.dataset.target;
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                const content = targetEl.value || targetEl.textContent;
                if (content) {
                    const success = await REOT.utils?.copyToClipboard(content);
                    if (success) {
                        REOT.utils?.showNotification('已复制到剪贴板', 'success');
                    }
                }
            }
            return;
        }
    });

    // 文件上传处理
    document.addEventListener('change', (e) => {
        if (!isToolActive()) return;

        if (e.target.id === 'parse-file-input') {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('parse-input').value = event.target.result;
                };
                reader.readAsText(file);
            }
        }
    });

    // DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initKeyTypeSelectors);
    } else {
        initKeyTypeSelectors();
    }

    // 导出模块
    window.X509CertificateTool = {
        generateKeypair,
        generateCSR,
        generateSelfSigned,
        issueCertificate,
        parsePEM
    };

})();
