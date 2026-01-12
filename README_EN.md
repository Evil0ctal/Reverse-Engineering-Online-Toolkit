<div align="center">

# Reverse Engineering Online Toolkit (REOT)

**A powerful pure frontend online toolkit for reverse engineering**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub Stars](https://img.shields.io/github/stars/Evil0ctal/Reverse-Engineering-Online-Toolkit?style=social)](https://github.com/Evil0ctal/Reverse-Engineering-Online-Toolkit)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Evil0ctal/Reverse-Engineering-Online-Toolkit/pulls)

[English](./README_EN.md) | [简体中文](./README.md)

</div>

---

## About

**Reverse Engineering Online Toolkit (REOT)** is a pure frontend online toolkit for reverse engineering. This project aims to provide security researchers, reverse engineers, and developers with a convenient, efficient, and installation-free collection of online tools for handling common encoding, decoding, encryption, decryption, and data conversion operations during reverse engineering.

### Key Features

- **Pure Frontend** - All computations are performed locally in the browser. Data is never uploaded to servers, protecting your privacy
- **Zero Installation** - Just open your browser to use. No software or plugins required
- **Internationalization** - Multi-language support based on I18N, with Chinese and English by default
- **Responsive Design** - Works on desktop and mobile devices, use it anywhere
- **Modular Architecture** - Easy to extend, convenient for community contributions
- **Modern UI** - Clean and beautiful user interface for a great user experience

---

## Features

### Encoding & Decoding

| Feature | Description | Status |
|---------|-------------|--------|
| **Base64** | Base64 encoding/decoding, supports standard Base64 and URL-safe Base64 | ✅ Done |
| **Base32** | Base32 encoding/decoding | ✅ Done |
| **Base58** | Base58 encoding/decoding (commonly used for Bitcoin addresses) | ✅ Done |
| **URL Encoding** | URL encoding/decoding, supports component encoding and full URL encoding | ✅ Done |
| **HTML Entities** | HTML entity encoding/decoding | ✅ Done |
| **Unicode** | Unicode encoding/decoding (\uXXXX format) | ✅ Done |
| **Hex String** | Hexadecimal string to text conversion | ✅ Done |
| **ASCII** | ASCII code and character conversion | ✅ Done |
| **Punycode** | Internationalized domain name Punycode encoding/decoding | ✅ Done |
| **ROT13/ROT47** | ROT13 and ROT47 encoding | ✅ Done |
| **Morse Code** | Morse code encoding/decoding | ✅ Done |

### Compression

| Feature | Description | Status |
|---------|-------------|--------|
| **GZIP** | GZIP compression/decompression | ✅ Done |
| **Deflate** | Deflate compression/decompression | ✅ Done |
| **ZSTD** | Zstandard compression/decompression | ✅ Done |
| **Brotli** | Brotli compression/decompression | ✅ Done |
| **LZ4** | LZ4 compression/decompression | ✅ Done |

### Hashing

| Feature | Description | Status |
|---------|-------------|--------|
| **MD5** | MD5 hash calculation | ✅ Done |
| **SHA-1** | SHA-1 hash calculation | ✅ Done |
| **SHA-2 Family** | SHA-256, SHA-384, SHA-512 | ✅ Done |
| **SHA-3 Family** | SHA3-224, SHA3-256, SHA3-384, SHA3-512 | ✅ Done |
| **BLAKE2** | BLAKE2b, BLAKE2s hash calculation | ✅ Done |
| **CRC** | CRC8, CRC16, CRC32, CRC32C checksum calculation | ✅ Done |
| **RIPEMD** | RIPEMD-160 hash calculation | ✅ Done |
| **Hash Type Identifier** | Automatically identify hash types based on length and format | ✅ Done |

### HMAC

| Feature | Description | Status |
|---------|-------------|--------|
| **HMAC** | HMAC-SHA1, HMAC-SHA256, HMAC-SHA384, HMAC-SHA512 calculation | ✅ Done |

### Symmetric Encryption

| Feature | Description | Status |
|---------|-------------|--------|
| **AES** | AES encryption/decryption (CBC, CTR, GCM modes) | ✅ Done |
| **DES** | DES encryption/decryption | ✅ Done |
| **3DES** | Triple DES encryption/decryption | ✅ Done |
| **RC4** | RC4 stream cipher | ✅ Done |
| **Blowfish** | Blowfish encryption/decryption | ✅ Done |
| **ChaCha20** | ChaCha20 encryption/decryption | ✅ Done |
| **SM4** | Chinese SM4 encryption/decryption | ✅ Done |

### Asymmetric Encryption

| Feature | Description | Status |
|---------|-------------|--------|
| **RSA** | RSA encryption/decryption (1024/2048/4096 bit) | ✅ Done |
| **ECC** | Elliptic Curve Cryptography | ✅ Done |
| **SM2** | Chinese SM2 encryption/decryption | ✅ Done |
| **Ed25519** | Ed25519 signing/verification | ✅ Done |

### Data Formatting

| Feature | Description | Status |
|---------|-------------|--------|
| **JSON** | JSON formatting, minification, validation | ✅ Done |
| **XML** | XML formatting, minification, validation | ✅ Done |
| **YAML** | YAML formatting and JSON conversion | ✅ Done |
| **TOML** | TOML formatting and parsing | ✅ Done |
| **CSV** | CSV parsing and formatting | ✅ Done |
| **SQL** | SQL formatting | ✅ Done |
| **HTML** | HTML formatting and minification | ✅ Done |
| **CSS** | CSS formatting and minification | ✅ Done |
| **JavaScript** | JavaScript formatting and minification | ✅ Done |

### Binary Analysis

| Feature | Description | Status |
|---------|-------------|--------|
| **Hex Viewer** | Hexadecimal viewer | ✅ Done |
| **Binary Editor** | Binary file viewing and editing | ✅ Done |
| **File Hash** | Calculate various hash values for files | ✅ Done |
| **File Type Detection** | Detect file type based on Magic Number | ✅ Done |
| **Byte Order Conversion** | Big-endian and little-endian conversion | ✅ Done |

### Protocol Parsing

| Feature | Description | Status |
|---------|-------------|--------|
| **JWT** | JWT Token parsing and verification | ✅ Done |
| **Protobuf** | Protocol Buffers decoding (schema-less parsing) | ✅ Done |
| **ASN.1** | ASN.1 DER/BER parsing | ✅ Done |
| **X.509 Certificate** | X.509 certificate parsing | ✅ Done |
| **PEM** | PEM format parsing | ✅ Done |
| **MessagePack** | MessagePack binary serialization encoding/decoding | ✅ Done |
| **Plist** | Apple Property List parsing (XML and binary formats) | ✅ Done |

### Network Tools

| Feature | Description | Status |
|---------|-------------|--------|
| **Cookie Parser** | Cookie string parsing and formatting | ✅ Done |
| **User-Agent Parser** | User-Agent string parsing | ✅ Done |
| **HTTP Header Parser** | HTTP request/response header parsing | ✅ Done |
| **IP Address Converter** | IP address format conversion (decimal, integer, hex, binary) | ✅ Done |
| **URL Parser** | URL component parsing | ✅ Done |
| **cURL to Code** | Convert cURL commands to various language code | ✅ Done |
| **CIDR Calculator** | CIDR subnet division and IP range calculation | ✅ Done |

### Generators

| Feature | Description | Status |
|---------|-------------|--------|
| **UUID** | UUID v1/v4/v5/v7 generation | ✅ Done |
| **Timestamp** | Unix timestamp conversion and generation | ✅ Done |
| **Barcode Generator** | QR code and various barcode generation (CODE128, EAN, UPC, etc.) | ✅ Done |
| **Barcode Scanner** | Camera/image scanning for QR codes and various barcodes | ✅ Done |
| **Random String** | Random string generator | ✅ Done |
| **Password Generator** | Secure password generator | ✅ Done |
| **Key Pair Generator** | RSA/ECC key pair generation | ✅ Done |
| **Lorem Ipsum** | Placeholder text generation | ✅ Done |
| **Snowflake ID Decoder** | Parse Twitter/Discord style Snowflake IDs | ✅ Done |

### Number Conversion

| Feature | Description | Status |
|---------|-------------|--------|
| **Base Conversion** | Binary, octal, decimal, hexadecimal conversion | ✅ Done |
| **Byte Unit Conversion** | B, KB, MB, GB, TB unit conversion (SI/IEC) | ✅ Done |
| **Color Conversion** | HEX, RGB, HSL, HSV color format conversion | ✅ Done |
| **Time Unit Conversion** | Seconds, minutes, hours, days unit conversion | ✅ Done |
| **IEEE 754** | Floating point IEEE 754 representation viewer | ✅ Done |

### Text Processing

| Feature | Description | Status |
|---------|-------------|--------|
| **Regex Tester** | Online regex testing and debugging | ✅ Done |
| **Text Diff** | Compare differences between two texts | ✅ Done |
| **Character Statistics** | Character, word, line count statistics | ✅ Done |
| **Case Converter** | Uppercase, lowercase, camelCase, snake_case conversion | ✅ Done |
| **Text Deduplication** | Remove duplicate lines | ✅ Done |
| **Text Sorting** | Sort text lines | ✅ Done |

### Reverse Engineering Specific

| Feature | Description | Status |
|---------|-------------|--------|
| **String Extractor** | Extract readable strings from binary data | ✅ Done |
| **XOR Analyzer** | XOR encryption analysis and decryption | ✅ Done |
| **Frequency Analyzer** | Character frequency analysis (cryptanalysis) | ✅ Done |
| **Pattern Search** | Binary pattern search | ✅ Done |
| **Offset Calculator** | Memory address offset calculation | ✅ Done |
| **Struct Parser** | C struct memory layout visualization | ✅ Done |

### System Tools

| Feature | Description | Status |
|---------|-------------|--------|
| **Crontab Parser** | Convert between cron expressions and human-readable text | ✅ Done |
| **Unix Permission Calculator** | Convert between chmod numeric and symbolic notation | ✅ Done |

---

## Project Structure

```
Reverse-Engineering-Online-Toolkit/
├── index.html                       # Main entry file
├── README.md                        # Chinese README
├── README_EN.md                     # English README
├── LICENSE                          # Apache 2.0 License
├── CONTRIBUTING.md                  # Contribution guide
├── CHANGELOG.md                     # Changelog
├── package.json                     # Project configuration
├── assets/                          # Static assets
│   ├── css/                         # Stylesheets
│   │   ├── main.css                 # Main styles
│   │   ├── themes/                  # Theme files
│   │   │   ├── light.css            # Light theme
│   │   │   └── dark.css             # Dark theme
│   │   └── components/              # Component styles
│   ├── js/                          # JavaScript files
│   │   ├── main.js                  # Main entry
│   │   ├── router.js                # Router management
│   │   ├── i18n.js                  # Internationalization module
│   │   └── utils.js                 # Utility functions
│   ├── images/                      # Image assets
│   │   ├── logo.svg                 # Project logo
│   │   ├── favicon.ico              # Website icon
│   │   └── icons/                   # Tool icons
│   └── fonts/                       # Font files
├── libs/                            # Third-party libraries
│   ├── crypto-js/                   # Encryption library
│   ├── pako/                        # GZIP compression library
│   ├── zstd-codec/                  # ZSTD compression library
│   ├── qrcode/                      # QR code library
│   └── ...                          # Other dependencies
├── locales/                         # Global i18n files (homepage, common text)
│   ├── zh-CN.json                   # Simplified Chinese
│   ├── en-US.json                   # English (US)
│   └── ...                          # Other languages
├── tools/                           # Tool modules directory
│   ├── encoding/                    # Encoding tools
│   │   ├── base64/
│   │   │   ├── base64.html          # Tool page (named by tool ID)
│   │   │   ├── base64.js            # Core logic
│   │   │   ├── base64.css           # Tool styles
│   │   │   ├── README.md            # Tool documentation
│   │   │   └── locales/             # Tool-specific i18n (optional)
│   │   │       ├── zh-CN.json       # Chinese translation
│   │   │       └── en-US.json       # English translation
│   │   ├── url-encode/
│   │   ├── hex/
│   │   └── .../
│   ├── compression/                 # Compression tools
│   ├── hashing/                     # Hashing tools
│   ├── hmac/                        # HMAC tools
│   ├── encryption/                  # Encryption tools
│   ├── formatting/                  # Formatting tools
│   ├── binary/                      # Binary tools
│   ├── protocol/                    # Protocol parsing
│   ├── network/                     # Network tools
│   ├── generators/                  # Generators
│   ├── converters/                  # Converters
│   └── text/                        # Text processing
├── components/                      # Common components
│   ├── header/                      # Header component
│   ├── sidebar/                     # Sidebar component
│   ├── footer/                      # Footer component
│   ├── code-editor/                 # Code editor component
│   ├── file-uploader/               # File uploader component
│   ├── copy-button/                 # Copy button component
│   └── .../                         # Other common components
├── docs/                            # Documentation
│   ├── api.md                       # API documentation
│   ├── development.md               # Development guide
│   └── deployment.md                # Deployment guide
└── tests/                           # Tests
    ├── unit/                        # Unit tests
    └── e2e/                         # End-to-end tests
```

---

## Quick Start

### Online Usage

- **Official Website**: [https://reot.dev](https://reot.dev)
- **GitHub Pages**: [https://evil0ctal.github.io/Reverse-Engineering-Online-Toolkit](https://evil0ctal.github.io/Reverse-Engineering-Online-Toolkit)

### Local Development (Docker Recommended)

Since this project is a SPA (Single Page Application), it requires server support for route redirection. Docker is recommended for local development:

```bash
# Clone the repository
git clone https://github.com/Evil0ctal/Reverse-Engineering-Online-Toolkit.git

# Enter project directory
cd Reverse-Engineering-Online-Toolkit

# Start with Docker Compose (recommended, supports hot reload)
docker-compose up -d

# Then visit http://localhost:8080
```

**Other methods** (require SPA routing support):

```bash
# Method 1: Use Node.js serve (with SPA support)
npx serve -s -l 8080

# Method 2: Use Docker directly
docker build -t reot:latest .
docker run -d -p 8080:80 reot:latest
```

> **Note**: Simple HTTP servers (like `python -m http.server`) don't support SPA routing. Directly accessing tool page URLs will result in 404 errors.

### Docker Production Deployment

```bash
# Build image
docker build -t reot:latest .

# Run container
docker run -d -p 80:80 --name reot reot:latest

# Or use Docker Compose
docker-compose up -d
```

---

## Contributing

We welcome community contributions! Whether it's adding new tools, fixing bugs, improving documentation, or adding new language support, your contributions will help more people.

### How to Contribute New Features/Tools

#### 1. Fork and Clone the Repository

```bash
# Fork this repository to your GitHub account
# Then clone your forked repository
git clone https://github.com/YOUR_USERNAME/Reverse-Engineering-Online-Toolkit.git
cd Reverse-Engineering-Online-Toolkit
```

#### 2. Create a New Branch

```bash
# Create a feature branch
git checkout -b feature/your-tool-name
```

#### 3. Create Tool Directory Structure

Assuming you want to add a new tool named `my-tool` in the `encoding` category:

```bash
# Create tool directory
mkdir -p tools/encoding/my-tool
```

The tool directory structure should be:

```
tools/encoding/my-tool/
├── my-tool.html         # Tool HTML page (named by tool ID)
├── my-tool.js           # Tool core logic
├── my-tool.css          # Tool styles (optional)
├── README.md            # Tool documentation
└── locales/             # Tool-specific i18n (optional)
    ├── zh-CN.json       # Chinese translation
    └── en-US.json       # English translation
```

#### 4. Implement the Tool

**my-tool.html template:**

> Note: Tool HTML files only need to contain the `.tool-container` fragment, which is dynamically loaded by the main framework.

```html
<div class="tool-container">
    <!-- Tool header -->
    <header class="tool-header">
        <h1 data-i18n="tools.my-tool.title">My Tool</h1>
        <p data-i18n="tools.my-tool.description">Tool description</p>
    </header>

    <!-- Tool main -->
    <main class="tool-main">
        <!-- Input section -->
        <section class="input-section">
            <label data-i18n="common.input">Input</label>
            <textarea id="input" data-i18n-placeholder="tools.my-tool.placeholder"></textarea>
        </section>

        <!-- Action buttons -->
        <section class="action-section">
            <button id="encode-btn" class="btn btn--primary" data-i18n="common.encode">Encode</button>
            <button id="decode-btn" class="btn btn--primary" data-i18n="common.decode">Decode</button>
            <button id="clear-btn" class="btn btn--secondary" data-i18n="common.clear">Clear</button>
            <button id="copy-btn" class="btn btn--secondary" data-i18n="common.copy">Copy Result</button>
        </section>

        <!-- Output section -->
        <section class="output-section">
            <label data-i18n="common.output">Output</label>
            <textarea id="output" readonly></textarea>
        </section>
    </main>
</div>
```

**my-tool.js template:**

```javascript
/**
 * My Tool
 * @description Tool functionality description
 * @author Your Name <your.email@example.com>
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // DOM elements
    const inputEl = document.getElementById('input');
    const outputEl = document.getElementById('output');
    const encodeBtnEl = document.getElementById('encode-btn');
    const decodeBtnEl = document.getElementById('decode-btn');
    const clearBtnEl = document.getElementById('clear-btn');
    const copyBtnEl = document.getElementById('copy-btn');

    /**
     * Encode function
     * @param {string} input - Input string
     * @returns {string} - Encoded string
     */
    function encode(input) {
        try {
            // Your encoding implementation
            return encodedResult;
        } catch (error) {
            throw new Error(`Encoding failed: ${error.message}`);
        }
    }

    /**
     * Decode function
     * @param {string} input - Encoded string
     * @returns {string} - Decoded string
     */
    function decode(input) {
        try {
            // Your decoding implementation
            return decodedResult;
        } catch (error) {
            throw new Error(`Decoding failed: ${error.message}`);
        }
    }

    // Event listeners
    encodeBtnEl.addEventListener('click', () => {
        try {
            const result = encode(inputEl.value);
            outputEl.value = result;
        } catch (error) {
            outputEl.value = error.message;
        }
    });

    decodeBtnEl.addEventListener('click', () => {
        try {
            const result = decode(inputEl.value);
            outputEl.value = result;
        } catch (error) {
            outputEl.value = error.message;
        }
    });

    clearBtnEl.addEventListener('click', () => {
        inputEl.value = '';
        outputEl.value = '';
    });

    copyBtnEl.addEventListener('click', () => {
        REOT.utils.copyToClipboard(outputEl.value);
    });

    // Export to global (optional, for testing)
    window.MyTool = { encode, decode };

})();
```

#### 5. Add Internationalization Support

REOT uses a **modular internationalization architecture** where tool translation files are stored in the tool directory, not the global locales folder.

**Step 1: Add basic tool info in root locales** (for sidebar and search)

Add to the `tools` object in `locales/zh-CN.json`:

```json
{
    "tools": {
        "my-tool": {
            "title": "My Tool",
            "description": "This is my tool description"
        }
    }
}
```

Add to the `tools` object in `locales/en-US.json`:

```json
{
    "tools": {
        "my-tool": {
            "title": "My Tool",
            "description": "This is my tool description"
        }
    }
}
```

**Step 2: Create tool-specific locales folder** (for detailed translations)

```bash
mkdir -p tools/encoding/my-tool/locales
```

Create `tools/encoding/my-tool/locales/zh-CN.json`:

```json
{
    "title": "My Tool",
    "description": "This is my tool description",
    "placeholder": "Enter content to process",
    "optionA": "Option A",
    "optionB": "Option B",
    "errorMessage": "Processing failed, please check your input"
}
```

Create `tools/encoding/my-tool/locales/en-US.json`:

```json
{
    "title": "My Tool",
    "description": "This is my tool description",
    "placeholder": "Enter content to process",
    "optionA": "Option A",
    "optionB": "Option B",
    "errorMessage": "Processing failed, please check your input"
}
```

**Note**: Keys in tool locales files are automatically merged into the `tools.{tool-id}` namespace, so use `data-i18n="tools.my-tool.placeholder"` in HTML to reference them.

**Advantages of modular i18n**:
- Each tool is fully self-contained, easy to add/remove tools
- On-demand loading, only loads current tool's translations
- Different developers modifying different tools won't cause Git merge conflicts

#### 6. Register the Tool

Add tool registration info in `assets/js/tools-registry.js`:

```javascript
REOT.tools.register({
    id: 'my-tool',
    category: 'encoding',
    name: 'tools.my-tool.title',        // i18n key
    description: 'tools.my-tool.description',
    icon: 'icon-my-tool',               // Icon class name
    path: '/tools/encoding/my-tool/',
    keywords: ['my', 'tool', 'encode']  // Search keywords
});
```

#### 7. Write Tool Documentation

Create `README.md` in the tool directory:

```markdown
# My Tool

## Description

Brief description of the tool's functionality and purpose.

## Usage

1. Enter content in the input box
2. Click "Encode" or "Decode" button
3. View the result in the output box

## Technical Implementation

Brief description of the implementation principle and algorithms/libraries used.

## References

- [Link 1](https://example.com)
- [Link 2](https://example.com)
```

#### 8. Commit Code

```bash
# Add changes
git add .

# Commit changes
git commit -m "feat(encoding): add my-tool

- Implement encoding functionality
- Implement decoding functionality
- Add Chinese and English i18n support
- Add tool documentation"

# Push to remote
git push origin feature/your-tool-name
```

#### 9. Create Pull Request

1. Visit your forked repository page
2. Click "New Pull Request" button
3. Select `base: main` <- `compare: feature/your-tool-name`
4. Fill in PR title and description, including:
   - Feature description
   - Screenshots (if UI changes)
   - Testing instructions
5. Submit PR and wait for review

### Contributing New Language Support

**Adding global translations:**

1. Copy `en-US.json` in the `locales/` directory
2. Rename to the corresponding language code, e.g., `ja-JP.json` (Japanese)
3. Translate all text
4. Add the new language code to the `supportedLocales` array in `assets/js/i18n.js`
5. Submit PR

**Adding tool translations:**

1. Find the `locales/` folder under the tool directory (e.g., `tools/formatting/json/locales/`)
2. Copy `en-US.json` and rename to the new language code
3. Translate all text
4. Submit PR

**Note**: Tool translation files are optional. If a tool doesn't have a translation file for a language, the system will automatically fall back to the default language (zh-CN).

### Code Standards

- **JavaScript**: Follow [ESLint](https://eslint.org/) standard configuration
- **CSS**: Follow [BEM](http://getbem.com/) naming convention
- **HTML**: Semantic tags, follow accessibility standards
- **Commit Messages**: Follow [Conventional Commits](https://www.conventionalcommits.org/) specification
  - `feat`: New feature
  - `fix`: Bug fix
  - `docs`: Documentation update
  - `style`: Code format adjustment
  - `refactor`: Code refactoring
  - `test`: Testing related
  - `chore`: Build/tooling related

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)

---

## License

This project is licensed under the [Apache License 2.0](./LICENSE).

```
Copyright 2026 Evil0ctal

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## Acknowledgments

Thanks to the following open source projects:

- [CryptoJS](https://github.com/brix/crypto-js) - Encryption library
- [Pako](https://github.com/nodeca/pako) - GZIP compression library
- [zstd-codec](https://github.com/nicholassmith/zstd-codec) - ZSTD compression library
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) - QR code generation library
- [JsBarcode](https://github.com/lindell/JsBarcode) - Barcode generation library
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) - Barcode scanning library
- And all contributors!

---

## Contact

- **Author**: Evil0ctal
- **GitHub**: [@Evil0ctal](https://github.com/Evil0ctal)
- **Issues**: [Submit an issue](https://github.com/Evil0ctal/Reverse-Engineering-Online-Toolkit/issues)

---

<div align="center">

**If this project helps you, please give it a ⭐ Star!**

Made with ❤️ by [Evil0ctal](https://github.com/Evil0ctal)

</div>
