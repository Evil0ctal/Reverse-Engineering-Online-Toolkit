# Changelog

[English](./CHANGELOG_EN.md) | [简体中文](./CHANGELOG.md)

---

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2026-01-11

### Added
- **File Type Detection** - Expanded file signature database to 100+ formats covering common reverse engineering file types
  - Compression: ZSTD, LZ4, Zlib, XZ, 7z, RAR5, etc.
  - Mobile Apps: DEX, ODEX, VDEX, OAT, ART, AXML, ARSC, IPA structure
  - Executables: Mach-O (32/64/FAT), WASM, LLVM Bitcode
  - Bytecode: Python PYC, Lua bytecode, Java Class
  - Debug Symbols: PDB, Minidump
  - Network Capture: PCAP, PCAPNG
  - Game Assets: Unity AssetBundle
  - Cryptography: Keystore, PKCS#12
- **File Type Detection** - Added categorized display showing supported formats in 17 categories
  - Compression/Container/Disk Image, Android/iOS/Mobile, Security/Cryptography
  - Binary/Executable, Multimedia, Document/Data, etc.
  - Reverse engineering important categories are highlighted

---

## [1.0.4] - 2026-01-11

### Fixed
- **JSON Formatter** - Fixed null value check for code variable copy function
- **Cookie Parser** - Fixed tool page detection logic to ensure button events respond correctly

---

## [1.0.3] - 2026-01-11

### Added
- **JSON Formatter** - Added code variable copy to tree view context menu, supports Python (strict/safe mode) and JavaScript (bracket/dot/optional chaining)
- **Cookie Parser** - Support bidirectional conversion between string, JSON and Netscape formats, compatible with curl and browser exported cookie files
- **HTTP Header Parser** - Support bidirectional conversion between multi-line and JSON formats (object/array)

---

## [1.0.2] - 2026-01-09

### Fixed
- **GZIP** - Fixed inability to decompress uploaded .gz files
- **Deflate** - Fixed file upload decompression, auto-detect zlib format
- **Brotli** - Now uses Google's official brotli-wasm library for real Brotli compression/decompression
- **LZ4** - Fixed frame parsing logic, properly handle FLG flags and multi-block decompression
- **ZSTD** - Fixed inability to decompress real ZSTD files

---

## [1.0.1] - 2026-01-09

### Added

#### New Tools
- **Brotli** - Brotli compression/decompression
- **Deflate** - Deflate compression/decompression
- **ZSTD** - Zstandard compression/decompression
- **LZ4** - LZ4 high-speed compression/decompression
- **ECC** - Elliptic Curve Cryptography (ECDH key exchange and ECIES encryption)
- **SM2** - Chinese SM2 elliptic curve encryption and digital signature
- **Ed25519** - Ed25519 digital signature algorithm
- **Binary Editor** - Binary file viewing and editing with undo/redo, search/replace
- **BLAKE2** - BLAKE2b, BLAKE2s hash calculation
- **SHA-3 Family** - SHA3-224, SHA3-256, SHA3-384, SHA3-512
- **RIPEMD** - RIPEMD-160 hash calculation
- **DES/3DES** - DES and Triple DES encryption/decryption
- **RC4** - RC4 stream cipher
- **Blowfish** - Blowfish encryption/decryption
- **ChaCha20** - ChaCha20 encryption/decryption
- **SM4** - Chinese SM4 encryption/decryption
- **XML** - XML formatting, minification, validation
- **YAML** - YAML formatting and JSON conversion
- **TOML** - TOML formatting and parsing
- **CSV** - CSV parsing and formatting
- **SQL** - SQL formatting
- **HTML** - HTML formatting and minification
- **CSS** - CSS formatting and minification
- **JavaScript** - JavaScript formatting and minification
- **Hex Viewer** - Hexadecimal viewer with virtual scrolling for large files
- **File Hash** - Calculate various hash values for files
- **File Type Detection** - Detect file type based on Magic Number
- **Byte Order Conversion** - Big-endian and little-endian conversion
- **IEEE 754** - Floating point IEEE 754 representation viewer
- **Protobuf** - Protocol Buffers decoding (schema-less parsing)
- **ASN.1** - ASN.1 DER/BER parsing
- **X.509 Certificate** - X.509 certificate parsing
- **PEM** - PEM format parsing
- **Cookie Parser** - Cookie string parsing and formatting
- **User-Agent Parser** - User-Agent string parsing
- **HTTP Header Parser** - HTTP request/response header parsing
- **cURL to Code** - Convert cURL commands to various language code (Python, JavaScript, PHP, Ruby, Go, Rust, etc.)
- **Key Pair Generator** - RSA/ECC key pair generation
- **String Extractor** - Extract readable strings from binary data
- **XOR Analyzer** - XOR encryption analysis and decryption
- **Frequency Analyzer** - Character frequency analysis (cryptanalysis)
- **Pattern Search** - Binary pattern search
- **Offset Calculator** - Memory address offset calculation
- **Struct Parser** - C struct memory layout visualization

#### cURL to Code Tool Enhancements
- Support for Python (requests, httpx, aiohttp, curl_cffi)
- Support for JavaScript (fetch, axios, node-fetch)
- Support for PHP (cURL, Guzzle)
- Support for Ruby (Net::HTTP, Faraday)
- Support for Go (net/http, resty)
- Support for Rust (reqwest, ureq, rnet)
- Support for Java (HttpClient, OkHttp)
- Support for C# (HttpClient)
- Support for Swift (URLSession)
- Support for Kotlin (OkHttp)
- Added FastAPI server code generation (with automatic type inference)
- Added syntax highlighting, word wrap, and click-to-copy functionality
- Added HTTP library feature comparison table
- Support for custom quote styles

#### Homepage Upgrade
- New Hero section design with gradient background and animations
- Added real-time GitHub stats badges (Stars, Issues, PRs, Forks)
- Added customizable Quick Access section with localStorage persistence
- Added Browse by Category feature
- Compressed stats and features into compact badge bar
- All tools can be added to Quick Access

#### Documentation
- Added English README (README_EN.md)
- Added English Contributing Guide (CONTRIBUTING_EN.md)
- Added official domain reot.dev

### Fixed
- Fixed page stuck on "Redirecting..." when refreshing on custom domain
- Fixed base path detection logic, supports arbitrary subdirectory deployment and custom domains
- Fixed SPA tool button not responding and cross-tool event interference issues
- Fixed GitHub Pages deployment resource path issues
- Fixed null access error when parsing X.509 certificates
- Fixed JSON tree view context menu position offset
- Fixed CSS formatter parsing minified code issue
- Fixed text tool HTML filename not matching tool ID issue

### Optimized
- Added syntax highlighting to formatting tools (JSON/XML/YAML/CSV)
- Hex viewer supports virtual scrolling for large files
- Compressed homepage layout, optimized vertical space usage
- Refactored cURL to Code tool into a fully functional parser

---

## [1.0.0] - 2026-01-07

### Added

#### Encoding & Decoding Tools
- **Base64** - Base64 encoding/decoding, supports standard Base64 and URL-safe Base64
- **Base32** - Base32 encoding/decoding
- **Base58** - Base58 encoding/decoding (commonly used for Bitcoin addresses)
- **URL Encoding** - URL encoding/decoding, supports component encoding and full URL encoding
- **HTML Entities** - HTML entity encoding/decoding
- **Unicode** - Unicode encoding/decoding (\uXXXX format)
- **Hex String** - Hexadecimal string to text conversion
- **ASCII** - ASCII code and character conversion
- **Punycode** - Internationalized domain name Punycode encoding/decoding
- **ROT13/ROT47** - ROT13 and ROT47 encoding
- **Morse Code** - Morse code encoding/decoding

#### Hashing Tools
- **MD5** - MD5 hash calculation
- **SHA Family** - SHA-1, SHA-256, SHA-384, SHA-512 hash calculation
- **CRC** - CRC8, CRC16, CRC32, CRC32C checksum calculation
- **HMAC** - HMAC-SHA1, HMAC-SHA256, HMAC-SHA384, HMAC-SHA512 calculation

#### Encryption & Decryption Tools
- **AES** - AES encryption/decryption (CBC, CTR, GCM modes)
- **RSA** - RSA encryption/decryption (1024/2048/4096 bit)

#### Data Formatting Tools
- **JSON** - JSON formatting, minification, validation

#### Protocol Parsing Tools
- **JWT** - JWT Token parsing and verification

#### Network Tools
- **URL Parser** - URL component parsing
- **IP Address Converter** - IP address format conversion (decimal, integer, hex, binary)

#### Generator Tools
- **UUID** - UUID v1/v4/v5/v7 generation
- **Timestamp** - Unix timestamp conversion and generation
- **Random String** - Random string generator
- **Password Generator** - Secure password generator
- **Barcode Generator** - QR code and various barcode generation (CODE128, EAN, UPC, etc.)
- **Barcode Scanner** - Camera/image scanning for QR codes and various barcodes
- **Lorem Ipsum** - Placeholder text generation

#### Number Conversion Tools
- **Base Conversion** - Binary, octal, decimal, hexadecimal conversion
- **Byte Unit Conversion** - B, KB, MB, GB, TB unit conversion (SI/IEC)
- **Color Conversion** - HEX, RGB, HSL, HSV color format conversion
- **Time Unit Conversion** - Seconds, minutes, hours, days unit conversion

#### Text Processing Tools
- **Regex Tester** - Online regex testing and debugging
- **Text Diff** - Compare differences between two texts
- **Character Statistics** - Character, word, line count statistics
- **Case Converter** - Uppercase, lowercase, camelCase, snake_case conversion
- **Text Deduplication** - Remove duplicate lines
- **Text Sorting** - Sort text lines

#### Core Framework
- Main page layout and responsive design
- Light/dark theme switching
- Chinese and English language support (modular i18n architecture)
- SPA routing system
- Tool registration and search system
- Sidebar navigation

### Fixed
- Fixed routing issues when deploying to GitHub Pages
- Fixed 404 error when directly accessing tool page URLs
- Fixed `getBasePath()` returning wrong path on tool pages
- Fixed i18n placeholder not showing translations on GitHub Pages

### Optimized
- Tool HTML files use `{toolId}.html` naming format to avoid conflicts with directory index
- Added Docker Compose support for local development with hot reload
- Added nginx configuration for SPA routing support
- All tools have default sample data, ready to use immediately
- Each tool has its own locales directory, supporting modular internationalization

---

## Planned

### Encryption & Decryption
- ECC Elliptic Curve Cryptography
- SM2 Chinese encryption/decryption
- Ed25519 signing/verification

### Compression
- ZSTD compression/decompression
- LZ4 compression/decompression

### Binary Analysis
- Binary Editor

---

## Versioning

- **Major**: Incompatible API changes
- **Minor**: Backwards-compatible functionality additions
- **Patch**: Backwards-compatible bug fixes

## Contributors

Thanks to all the developers who contributed to this project!

- [@Evil0ctal](https://github.com/Evil0ctal) - Project creator and main maintainer
