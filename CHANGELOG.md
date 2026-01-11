# 更新日志

[English](./CHANGELOG_EN.md) | [简体中文](./CHANGELOG.md)

---

本项目的所有重要更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.5] - 2026-01-11

### 新增
- **文件类型检测** - 扩展文件签名数据库至 100+ 种格式，覆盖逆向工程常用文件类型
  - 压缩格式：ZSTD、LZ4、Zlib、XZ、7z、RAR5 等
  - 移动应用：DEX、ODEX、VDEX、OAT、ART、AXML、ARSC、IPA 结构
  - 可执行文件：Mach-O（32/64/FAT）、WASM、LLVM Bitcode
  - 字节码：Python PYC、Lua 字节码、Java Class
  - 调试符号：PDB、Minidump
  - 网络抓包：PCAP、PCAPNG
  - 游戏资源：Unity AssetBundle
  - 密码学：Keystore、PKCS#12
- **文件类型检测** - 新增分类展示功能，将支持的格式按 17 个类别分组显示
  - 压缩/容器/镜像、Android/iOS/移动应用、安全/密码学
  - 二进制/可执行、多媒体、文档/数据等分类
  - 逆向工程重点类别高亮显示

---

## [1.0.4] - 2026-01-11

### 修复
- **JSON 格式化** - 修复代码变量复制功能空值检查
- **Cookie 解析器** - 修复工具页面检测逻辑，确保按钮事件正确响应

---

## [1.0.3] - 2026-01-11

### 新增
- **JSON 格式化** - 树视图右键菜单新增代码变量复制功能，支持 Python（严格/安全模式）和 JavaScript（括号/点号/可选链）
- **Cookie 解析器** - 支持字符串、JSON、Netscape 三种格式互转，兼容 curl 和浏览器导出的 Cookie 文件
- **HTTP 头解析** - 支持多行格式与 JSON 格式（对象/数组）互转

---

## [1.0.2] - 2026-01-09

### 修复
- **GZIP** - 修复无法解压上传的 .gz 文件问题
- **Deflate** - 修复无法解压上传文件问题，支持自动检测 zlib 格式
- **Brotli** - 使用 Google 官方 brotli-wasm 库，支持真正的 Brotli 压缩/解压
- **LZ4** - 修复帧解析逻辑，正确处理 FLG 标志位和多块解压
- **ZSTD** - 修复无法解压真实 ZSTD 文件问题

---

## [1.0.1] - 2026-01-09

### 新增

#### 新工具
- **Brotli** - Brotli 压缩与解压
- **Deflate** - Deflate 压缩与解压
- **ZSTD** - Zstandard 压缩与解压
- **LZ4** - LZ4 高速压缩与解压
- **ECC** - 椭圆曲线加密 (ECDH 密钥交换与 ECIES 加解密)
- **SM2** - 国密 SM2 椭圆曲线加解密与签名验签
- **Ed25519** - Ed25519 数字签名算法
- **二进制编辑器** - 二进制文件查看与编辑，支持撤销/重做、搜索替换
- **BLAKE2** - BLAKE2b, BLAKE2s 哈希计算
- **SHA-3 系列** - SHA3-224, SHA3-256, SHA3-384, SHA3-512
- **RIPEMD** - RIPEMD-160 哈希计算
- **DES/3DES** - DES 和 Triple DES 加解密
- **RC4** - RC4 流加密
- **Blowfish** - Blowfish 加解密
- **ChaCha20** - ChaCha20 加解密
- **SM4** - 国密 SM4 加解密
- **XML** - XML 格式化、压缩、校验
- **YAML** - YAML 格式化与 JSON 互转
- **TOML** - TOML 格式化与解析
- **CSV** - CSV 解析与格式化
- **SQL** - SQL 格式化
- **HTML** - HTML 格式化与压缩
- **CSS** - CSS 格式化与压缩
- **JavaScript** - JavaScript 格式化与压缩
- **Hex 查看器** - 十六进制查看器，支持大文件虚拟滚动
- **文件哈希** - 计算文件的各种哈希值
- **文件类型检测** - 基于 Magic Number 检测文件类型
- **字节序转换** - 大端序与小端序转换
- **IEEE 754** - 浮点数 IEEE 754 表示查看
- **Protobuf** - Protocol Buffers 解码（无 Schema 解析）
- **ASN.1** - ASN.1 DER/BER 解析
- **X.509 证书** - X.509 证书解析
- **PEM** - PEM 格式解析
- **Cookie 解析** - Cookie 字符串解析与格式化
- **User-Agent 解析** - User-Agent 字符串解析
- **HTTP 头解析** - HTTP 请求/响应头解析
- **cURL 转代码** - cURL 命令转换为各语言代码（Python、JavaScript、PHP、Ruby、Go、Rust 等）
- **密钥对生成** - RSA/ECC 密钥对生成
- **字符串提取** - 从二进制数据中提取可读字符串
- **XOR 分析** - XOR 加密分析与解密
- **频率分析** - 字符频率分析（密码学分析）
- **模式搜索** - 二进制模式搜索
- **偏移计算器** - 内存地址偏移计算
- **结构体解析** - C 结构体内存布局可视化

#### cURL 转代码工具增强
- 支持 Python (requests, httpx, aiohttp, curl_cffi)
- 支持 JavaScript (fetch, axios, node-fetch)
- 支持 PHP (cURL, Guzzle)
- 支持 Ruby (Net::HTTP, Faraday)
- 支持 Go (net/http, resty)
- 支持 Rust (reqwest, ureq, rnet)
- 支持 Java (HttpClient, OkHttp)
- 支持 C# (HttpClient)
- 支持 Swift (URLSession)
- 支持 Kotlin (OkHttp)
- 添加 FastAPI 服务端代码生成（自动类型推断）
- 添加代码高亮、自动换行和点击复制功能
- 添加 HTTP 库功能对比表格
- 支持自定义引号样式

#### 首页升级
- 全新 Hero 区域设计，添加渐变背景和动画效果
- 添加 GitHub 实时统计徽章（Stars、Issues、PRs、Forks）
- 添加可自定义的快速访问区域，支持 localStorage 持久化
- 添加按分类浏览功能
- 压缩统计和特性展示为紧凑徽章栏
- 所有工具支持收藏到快速访问

#### 文档
- 添加英文版 README (README_EN.md)
- 添加英文版贡献指南 (CONTRIBUTING_EN.md)
- 添加官方域名 reot.dev

### 修复
- 修复自定义域名下刷新页面卡在 "Redirecting..." 的问题
- 修复 base path 检测逻辑，支持任意子目录部署和自定义域名
- 修复 SPA 工具按钮点击无响应和跨工具事件干扰问题
- 修复 GitHub Pages 部署资源路径问题
- 修复 X.509 证书解析时的空值访问错误
- 修复 JSON 树形视图右键菜单位置偏移问题
- 修复 CSS 格式化工具解析压缩代码的问题
- 修复文本工具 HTML 文件名与工具 ID 不匹配的问题

### 优化
- 格式化工具（JSON/XML/YAML/CSV）添加语法高亮
- Hex 查看器支持大文件虚拟滚动
- 首页布局压缩，优化垂直空间利用
- cURL 转代码工具重构为功能完整的解析器

---

## [1.0.0] - 2026-01-07

### 新增

#### 编码与解码工具
- **Base64** - Base64 编码与解码，支持标准 Base64 和 URL 安全的 Base64
- **Base32** - Base32 编码与解码
- **Base58** - Base58 编码与解码（常用于比特币地址）
- **URL 编码** - URL 编码与解码，支持组件编码和完整 URL 编码
- **HTML 实体** - HTML 实体编码与解码
- **Unicode** - Unicode 编码与解码（\uXXXX 格式）
- **Hex 字符串** - 十六进制字符串与文本互转
- **ASCII** - ASCII 码与字符互转
- **Punycode** - 国际化域名 Punycode 编解码
- **ROT13/ROT47** - ROT13 和 ROT47 编码
- **Morse 电码** - 摩斯电码编码与解码

#### 哈希计算工具
- **MD5** - MD5 哈希计算
- **SHA 系列** - SHA-1, SHA-256, SHA-384, SHA-512 哈希计算
- **CRC** - CRC8, CRC16, CRC32, CRC32C 校验计算
- **HMAC** - HMAC-SHA1, HMAC-SHA256, HMAC-SHA384, HMAC-SHA512 计算

#### 加密与解密工具
- **AES** - AES 加解密（CBC, CTR, GCM 模式）
- **RSA** - RSA 加解密（1024/2048/4096 bit）

#### 数据格式化工具
- **JSON** - JSON 格式化、压缩、校验

#### 协议解析工具
- **JWT** - JWT Token 解析与验证

#### 网络工具
- **URL 解析** - URL 组成部分解析
- **IP 地址转换** - IP 地址格式转换（十进制、整数、十六进制、二进制）

#### 生成器工具
- **UUID** - UUID v1/v4/v5/v7 生成
- **时间戳** - Unix 时间戳转换与生成
- **随机字符串** - 随机字符串生成器
- **密码生成** - 安全密码生成器
- **条码生成器** - QR码和各种条形码生成（CODE128, EAN, UPC等）
- **条码扫描器** - 摄像头/图片扫描QR码和各种条形码
- **Lorem Ipsum** - 占位文本生成

#### 数值转换工具
- **进制转换** - 二进制、八进制、十进制、十六进制互转
- **字节单位转换** - B, KB, MB, GB, TB 等单位转换（SI/IEC）
- **颜色转换** - HEX, RGB, HSL, HSV 颜色格式互转
- **时间单位转换** - 秒、分钟、小时、天等单位转换

#### 文本处理工具
- **正则表达式测试** - 正则表达式在线测试与调试
- **文本差异对比** - 两段文本的差异对比
- **字符统计** - 字符、单词、行数统计
- **大小写转换** - 大小写、驼峰、下划线等格式转换
- **文本去重** - 去除重复行
- **文本排序** - 文本行排序

#### 基础框架
- 主页面布局与响应式设计
- 亮色/暗色主题切换
- 中英文语言支持（模块化 i18n 架构）
- SPA 路由系统
- 工具注册与搜索系统
- 侧边栏导航

### 修复
- 修复 GitHub Pages 部署时的路由问题
- 修复直接访问工具页面 URL 时的 404 错误
- 修复 `getBasePath()` 在工具页面返回错误路径的问题
- 修复 i18n 占位符在 GitHub Pages 上不显示翻译的问题

### 优化
- 工具 HTML 文件使用 `{toolId}.html` 命名格式，避免与目录索引冲突
- 添加 Docker Compose 支持本地开发热更新
- 添加 nginx 配置支持 SPA 路由
- 所有工具添加默认示例数据，打开即可体验
- 每个工具拥有独立的 locales 目录，支持模块化国际化

---

## 计划中

### 加密与解密
- ECC 椭圆曲线加密
- SM2 国密加解密
- Ed25519 签名验签

### 压缩与解压
- ZSTD 压缩与解压
- LZ4 压缩与解压

### 二进制分析
- 二进制编辑器

---

## 版本说明

- **主版本号 (Major)**: 不兼容的 API 修改
- **次版本号 (Minor)**: 向下兼容的功能新增
- **修订号 (Patch)**: 向下兼容的问题修正

## 贡献者

感谢所有为本项目做出贡献的开发者！

- [@Evil0ctal](https://github.com/Evil0ctal) - 项目创建者与主要维护者
