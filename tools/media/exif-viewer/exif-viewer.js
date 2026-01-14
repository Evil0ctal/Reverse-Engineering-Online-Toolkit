/**
 * EXIF 查看工具
 * @description 读取图片 EXIF 元数据，支持 JPEG/TIFF/HEIC/PNG/AVIF 格式
 * @author Evil0ctal
 * @license Apache-2.0
 */

(function() {
    'use strict';

    // ==================== exifr 库动态加载 ====================

    let exifrLoaded = false;
    let exifrLoadingPromise = null;

    /**
     * 动态加载 exifr 库
     */
    function loadExifrLibrary() {
        if (exifrLoaded && typeof exifr !== 'undefined') {
            return Promise.resolve();
        }

        if (exifrLoadingPromise) {
            return exifrLoadingPromise;
        }

        exifrLoadingPromise = new Promise((resolve, reject) => {
            if (typeof exifr !== 'undefined') {
                exifrLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            const basePath = window.REOT?.router?.pathPrefix || '';
            script.src = `${basePath}/libs/exif/exifr.min.js`;
            script.onload = () => {
                exifrLoaded = true;
                resolve();
            };
            script.onerror = () => {
                exifrLoadingPromise = null;
                reject(new Error('无法加载 exifr 库'));
            };
            document.head.appendChild(script);
        });

        return exifrLoadingPromise;
    }

    // ==================== DOM 元素 ====================

    const uploadArea = document.getElementById('upload-area');
    const imageInput = document.getElementById('image-input');
    const previewSection = document.getElementById('preview-section');
    const previewImage = document.getElementById('preview-image');
    const imageInfo = document.getElementById('image-info');
    const clearBtn = document.getElementById('clear-btn');
    const exifSection = document.getElementById('exif-section');
    const noExifSection = document.getElementById('no-exif-section');
    const thumbnailSection = document.getElementById('thumbnail-section');
    const thumbnailImage = document.getElementById('thumbnail-image');
    const copyJsonBtn = document.getElementById('copy-json-btn');
    const exportBtn = document.getElementById('export-btn');
    const mapContainer = document.getElementById('map-container');
    const mapLink = document.getElementById('map-link');

    // 表格
    const basicTable = document.getElementById('basic-table');
    const cameraTable = document.getElementById('camera-table');
    const gpsTable = document.getElementById('gps-table');
    const allTable = document.getElementById('all-table');

    // 当前 EXIF 数据
    let currentExifData = null;
    let currentFileName = '';

    // ==================== EXIF 字段分类 ====================

    const basicFields = [
        'ImageWidth', 'ImageHeight', 'ExifImageWidth', 'ExifImageHeight',
        'DateTime', 'DateTimeOriginal', 'DateTimeDigitized', 'CreateDate', 'ModifyDate',
        'Orientation', 'ColorSpace', 'PixelXDimension', 'PixelYDimension',
        'XResolution', 'YResolution', 'ResolutionUnit',
        'Software', 'Artist', 'Copyright', 'ImageDescription'
    ];

    const cameraFields = [
        'Make', 'Model', 'LensModel', 'LensMake', 'LensInfo',
        'ExposureTime', 'FNumber', 'ExposureProgram', 'ISO',
        'ShutterSpeedValue', 'ApertureValue', 'BrightnessValue',
        'ExposureBiasValue', 'ExposureCompensation', 'MaxApertureValue',
        'MeteringMode', 'LightSource', 'Flash', 'FocalLength', 'FocalLengthIn35mmFormat',
        'WhiteBalance', 'DigitalZoomRatio', 'SceneCaptureType', 'Contrast',
        'Saturation', 'Sharpness', 'SubjectDistanceRange'
    ];

    const gpsFields = [
        'latitude', 'longitude', 'GPSLatitude', 'GPSLatitudeRef',
        'GPSLongitude', 'GPSLongitudeRef', 'GPSAltitude', 'GPSAltitudeRef',
        'GPSTimeStamp', 'GPSDateStamp', 'GPSSpeed', 'GPSSpeedRef',
        'GPSTrack', 'GPSTrackRef', 'GPSImgDirection', 'GPSImgDirectionRef'
    ];

    // ==================== 工具函数 ====================

    /**
     * 格式化 EXIF 值
     */
    function formatExifValue(key, value) {
        if (value === undefined || value === null) {
            return '-';
        }

        // 处理 Date 对象
        if (value instanceof Date) {
            return value.toLocaleString();
        }

        // 特殊字段格式化
        switch (key) {
            case 'ExposureTime':
                if (typeof value === 'number') {
                    if (value < 1) {
                        return `1/${Math.round(1/value)}s`;
                    }
                    return `${value}s`;
                }
                return String(value);

            case 'FNumber':
                return `f/${value}`;

            case 'FocalLength':
            case 'FocalLengthIn35mmFormat':
                return `${value}mm`;

            case 'ISO':
                return `ISO ${value}`;

            case 'Flash':
                const flashModes = {
                    0: '未闪光',
                    1: '闪光',
                    5: '闪光，无返回光',
                    7: '闪光，有返回光',
                    9: '闪光，强制',
                    13: '闪光，强制，无返回光',
                    15: '闪光，强制，有返回光',
                    16: '未闪光，强制禁用',
                    24: '未闪光，自动',
                    25: '闪光，自动',
                    29: '闪光，自动，无返回光',
                    31: '闪光，自动，有返回光'
                };
                return flashModes[value] || `${value}`;

            case 'MeteringMode':
                const meteringModes = {
                    0: '未知', 1: '平均测光', 2: '中央重点', 3: '点测光',
                    4: '多点测光', 5: '矩阵测光', 6: '局部测光'
                };
                return meteringModes[value] || `${value}`;

            case 'ExposureProgram':
                const programs = {
                    0: '未定义', 1: '手动', 2: '程序自动', 3: '光圈优先',
                    4: '快门优先', 5: '创意', 6: '动作', 7: '人像', 8: '风景'
                };
                return programs[value] || `${value}`;

            case 'Orientation':
                const orientations = {
                    1: '正常', 2: '水平翻转', 3: '旋转180°', 4: '垂直翻转',
                    5: '顺时针90°+水平翻转', 6: '顺时针90°',
                    7: '逆时针90°+水平翻转', 8: '逆时针90°'
                };
                return orientations[value] || `${value}`;

            case 'ColorSpace':
                return value === 1 ? 'sRGB' : (value === 65535 ? 'Uncalibrated' : `${value}`);

            case 'WhiteBalance':
                return value === 0 ? '自动' : '手动';

            case 'latitude':
            case 'longitude':
                return typeof value === 'number' ? value.toFixed(6) + '°' : String(value);

            case 'GPSAltitude':
                return typeof value === 'number' ? `${value.toFixed(1)}m` : String(value);

            default:
                if (Array.isArray(value)) {
                    return value.join(', ');
                }
                if (typeof value === 'object') {
                    return JSON.stringify(value);
                }
                return String(value);
        }
    }

    /**
     * 渲染表格行
     */
    function renderTableRows(table, fields, data) {
        table.textContent = '';
        let hasData = false;

        for (const field of fields) {
            const value = data[field];
            if (value !== undefined && value !== null) {
                hasData = true;
                const row = document.createElement('tr');

                const labelCell = document.createElement('td');
                labelCell.className = 'exif-label';
                labelCell.textContent = field;

                const valueCell = document.createElement('td');
                valueCell.className = 'exif-value';
                valueCell.textContent = formatExifValue(field, value);

                row.appendChild(labelCell);
                row.appendChild(valueCell);
                table.appendChild(row);
            }
        }

        if (!hasData) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 2;
            cell.className = 'no-data';
            cell.textContent = REOT.i18n?.t('tools.exif-viewer.noData') || '无数据';
            row.appendChild(cell);
            table.appendChild(row);
        }
    }

    /**
     * 渲染全部数据表格
     */
    function renderAllData(table, data) {
        table.textContent = '';

        const sortedKeys = Object.keys(data).sort();

        for (const key of sortedKeys) {
            const value = data[key];
            if (value !== undefined && value !== null && key !== 'thumbnail') {
                const row = document.createElement('tr');

                const labelCell = document.createElement('td');
                labelCell.className = 'exif-label';
                labelCell.textContent = key;

                const valueCell = document.createElement('td');
                valueCell.className = 'exif-value';
                valueCell.textContent = formatExifValue(key, value);

                row.appendChild(labelCell);
                row.appendChild(valueCell);
                table.appendChild(row);
            }
        }
    }

    // ==================== HEIC EXIF 解析 ====================

    /**
     * 解析 HEIC 文件中的 EXIF 数据
     * HEIC 使用 ISO Base Media File Format (ISOBMFF)
     * 直接使用手动 TIFF 解析器，不依赖 exifr
     */
    function parseHeicExif(buffer) {
        const uint8 = new Uint8Array(buffer);

        // 在 HEIC 文件中查找所有可能的 EXIF 位置
        const exifLocations = [];

        // 查找 'Exif\0\0' 标记 (45 78 69 66 00 00)
        for (let i = 0; i < uint8.length - 10; i++) {
            if (uint8[i] === 0x45 && uint8[i+1] === 0x78 &&
                uint8[i+2] === 0x69 && uint8[i+3] === 0x66 &&
                uint8[i+4] === 0x00 && uint8[i+5] === 0x00) {
                // TIFF 头部从 'Exif\0\0' 之后开始
                const tiffOffset = i + 6;
                // 验证 TIFF 头部 (II 或 MM)
                if (tiffOffset + 4 < uint8.length) {
                    const tiffMarker = String.fromCharCode(uint8[tiffOffset], uint8[tiffOffset + 1]);
                    if (tiffMarker === 'II' || tiffMarker === 'MM') {
                        exifLocations.push(tiffOffset);
                    }
                }
            }
        }

        console.log('Found EXIF locations in HEIC:', exifLocations.map(o => '0x' + o.toString(16)));

        // 使用手动 TIFF 解析器解析找到的 EXIF 数据
        for (const offset of exifLocations) {
            try {
                console.log('Parsing TIFF at offset:', '0x' + offset.toString(16));
                const result = parseTiffManually(buffer, offset);

                if (result && Object.keys(result).length > 0) {
                    console.log('HEIC EXIF parse success, found', Object.keys(result).length, 'tags');
                    return result;
                }
            } catch (e) {
                console.warn('TIFF parse failed at offset 0x' + offset.toString(16) + ':', e.message);
            }
        }

        return null;
    }

    /**
     * 手动解析 TIFF 格式的 EXIF 数据
     */
    function parseTiffManually(buffer, tiffStartOffset) {
        const view = new DataView(buffer);
        const uint8 = new Uint8Array(buffer);

        // 读取字节序标记
        const byteOrder = String.fromCharCode(uint8[tiffStartOffset], uint8[tiffStartOffset + 1]);
        const isLittleEndian = byteOrder === 'II';

        // 验证 TIFF 魔数 (0x002a)
        const tiffMagic = isLittleEndian ?
            view.getUint16(tiffStartOffset + 2, true) :
            view.getUint16(tiffStartOffset + 2, false);

        if (tiffMagic !== 0x002a) {
            throw new Error('Invalid TIFF magic number');
        }

        // TIFF 标签名称映射
        const tiffTagNames = {
            // IFD0 标签
            0x010f: 'Make',
            0x0110: 'Model',
            0x0112: 'Orientation',
            0x011a: 'XResolution',
            0x011b: 'YResolution',
            0x0128: 'ResolutionUnit',
            0x0131: 'Software',
            0x0132: 'DateTime',
            0x0213: 'YCbCrPositioning',
            0x8769: 'ExifIFDPointer',
            0x8825: 'GPSInfoIFDPointer',
            // EXIF 子 IFD 标签
            0x829a: 'ExposureTime',
            0x829d: 'FNumber',
            0x8822: 'ExposureProgram',
            0x8827: 'ISO',
            0x9000: 'ExifVersion',
            0x9003: 'DateTimeOriginal',
            0x9004: 'DateTimeDigitized',
            0x9201: 'ShutterSpeedValue',
            0x9202: 'ApertureValue',
            0x9203: 'BrightnessValue',
            0x9204: 'ExposureBiasValue',
            0x9205: 'MaxApertureValue',
            0x9207: 'MeteringMode',
            0x9208: 'LightSource',
            0x9209: 'Flash',
            0x920a: 'FocalLength',
            0x927c: 'MakerNote',
            0xa001: 'ColorSpace',
            0xa002: 'ExifImageWidth',
            0xa003: 'ExifImageHeight',
            0xa20e: 'FocalPlaneXResolution',
            0xa20f: 'FocalPlaneYResolution',
            0xa210: 'FocalPlaneResolutionUnit',
            0xa402: 'ExposureMode',
            0xa403: 'WhiteBalance',
            0xa405: 'FocalLengthIn35mmFormat',
            0xa406: 'SceneCaptureType',
            0xa432: 'LensInfo',
            0xa433: 'LensMake',
            0xa434: 'LensModel',
            // GPS 子 IFD 标签
            0x0000: 'GPSVersionID',
            0x0001: 'GPSLatitudeRef',
            0x0002: 'GPSLatitude',
            0x0003: 'GPSLongitudeRef',
            0x0004: 'GPSLongitude',
            0x0005: 'GPSAltitudeRef',
            0x0006: 'GPSAltitude',
            0x0007: 'GPSTimeStamp',
            0x0008: 'GPSSatellites',
            0x0009: 'GPSStatus',
            0x000a: 'GPSMeasureMode',
            0x000b: 'GPSDOP',
            0x000c: 'GPSSpeedRef',
            0x000d: 'GPSSpeed',
            0x000e: 'GPSTrackRef',
            0x000f: 'GPSTrack',
            0x0010: 'GPSImgDirectionRef',
            0x0011: 'GPSImgDirection',
            0x0012: 'GPSMapDatum',
            0x001d: 'GPSDateStamp'
        };

        const result = {};

        /**
         * 读取 IFD 条目的值
         */
        function readTagValue(entryOffset, type, count) {
            const valueOffset = entryOffset + 8;
            const typeSize = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
            const totalSize = (typeSize[type] || 1) * count;

            // 如果值大于 4 字节，valueOffset 处存储的是指向实际数据的偏移量
            let dataOffset;
            if (totalSize <= 4) {
                dataOffset = valueOffset;
            } else {
                const offsetVal = isLittleEndian ?
                    view.getUint32(valueOffset, true) :
                    view.getUint32(valueOffset, false);
                dataOffset = tiffStartOffset + offsetVal;
            }

            if (dataOffset + totalSize > buffer.byteLength) {
                return undefined;
            }

            switch (type) {
                case 1: // BYTE
                case 7: // UNDEFINED
                    if (count === 1) {
                        return uint8[dataOffset];
                    } else {
                        const bytes = [];
                        for (let i = 0; i < count && i < 32; i++) {
                            bytes.push(uint8[dataOffset + i]);
                        }
                        return bytes;
                    }

                case 2: // ASCII
                    let str = '';
                    for (let i = 0; i < count - 1; i++) {
                        const ch = uint8[dataOffset + i];
                        if (ch === 0) break;
                        str += String.fromCharCode(ch);
                    }
                    return str;

                case 3: // SHORT
                    if (count === 1) {
                        return isLittleEndian ?
                            view.getUint16(dataOffset, true) :
                            view.getUint16(dataOffset, false);
                    } else {
                        const shorts = [];
                        for (let i = 0; i < count && i < 16; i++) {
                            shorts.push(isLittleEndian ?
                                view.getUint16(dataOffset + i * 2, true) :
                                view.getUint16(dataOffset + i * 2, false));
                        }
                        return shorts;
                    }

                case 4: // LONG
                    if (count === 1) {
                        return isLittleEndian ?
                            view.getUint32(dataOffset, true) :
                            view.getUint32(dataOffset, false);
                    } else {
                        const longs = [];
                        for (let i = 0; i < count && i < 16; i++) {
                            longs.push(isLittleEndian ?
                                view.getUint32(dataOffset + i * 4, true) :
                                view.getUint32(dataOffset + i * 4, false));
                        }
                        return longs;
                    }

                case 5: // RATIONAL (unsigned)
                case 10: // SRATIONAL (signed)
                    const rationals = [];
                    for (let i = 0; i < count && i < 8; i++) {
                        const num = isLittleEndian ?
                            view.getUint32(dataOffset + i * 8, true) :
                            view.getUint32(dataOffset + i * 8, false);
                        const den = isLittleEndian ?
                            view.getUint32(dataOffset + i * 8 + 4, true) :
                            view.getUint32(dataOffset + i * 8 + 4, false);
                        rationals.push(den !== 0 ? num / den : 0);
                    }
                    return count === 1 ? rationals[0] : rationals;

                case 9: // SLONG (signed)
                    if (count === 1) {
                        return isLittleEndian ?
                            view.getInt32(dataOffset, true) :
                            view.getInt32(dataOffset, false);
                    }
                    return undefined;

                default:
                    return undefined;
            }
        }

        /**
         * 解析一个 IFD
         */
        function parseIFD(ifdOffset, isGpsIFD = false) {
            const ifdResult = {};
            const absoluteOffset = tiffStartOffset + ifdOffset;

            if (absoluteOffset + 2 > buffer.byteLength) {
                return ifdResult;
            }

            const numEntries = isLittleEndian ?
                view.getUint16(absoluteOffset, true) :
                view.getUint16(absoluteOffset, false);

            for (let i = 0; i < numEntries && i < 200; i++) {
                const entryOffset = absoluteOffset + 2 + (i * 12);
                if (entryOffset + 12 > buffer.byteLength) break;

                const tag = isLittleEndian ?
                    view.getUint16(entryOffset, true) :
                    view.getUint16(entryOffset, false);

                const type = isLittleEndian ?
                    view.getUint16(entryOffset + 2, true) :
                    view.getUint16(entryOffset + 2, false);

                const count = isLittleEndian ?
                    view.getUint32(entryOffset + 4, true) :
                    view.getUint32(entryOffset + 4, false);

                // GPS IFD 使用不同的标签编号
                let tagName;
                if (isGpsIFD) {
                    tagName = tiffTagNames[tag] || ('GPSTag_0x' + tag.toString(16).padStart(4, '0'));
                } else {
                    tagName = tiffTagNames[tag] || ('Tag_0x' + tag.toString(16).padStart(4, '0'));
                }

                try {
                    const value = readTagValue(entryOffset, type, count);
                    if (value !== undefined) {
                        ifdResult[tagName] = value;
                    }
                } catch (e) {
                    // Ignore parsing errors for individual tags
                }
            }

            return ifdResult;
        }

        // 读取 IFD0 偏移
        const ifd0Offset = isLittleEndian ?
            view.getUint32(tiffStartOffset + 4, true) :
            view.getUint32(tiffStartOffset + 4, false);

        // 解析 IFD0
        const ifd0Data = parseIFD(ifd0Offset, false);
        Object.assign(result, ifd0Data);

        // 解析 EXIF 子 IFD
        if (ifd0Data.ExifIFDPointer) {
            const exifOffset = ifd0Data.ExifIFDPointer;
            const exifData = parseIFD(exifOffset, false);
            Object.assign(result, exifData);
            delete result.ExifIFDPointer;
        }

        // 解析 GPS 子 IFD
        if (ifd0Data.GPSInfoIFDPointer) {
            const gpsOffset = ifd0Data.GPSInfoIFDPointer;
            const gpsData = parseIFD(gpsOffset, true);
            Object.assign(result, gpsData);
            delete result.GPSInfoIFDPointer;

            // 转换 GPS 坐标为十进制格式
            if (gpsData.GPSLatitude && gpsData.GPSLatitudeRef) {
                const lat = gpsData.GPSLatitude;
                if (Array.isArray(lat) && lat.length >= 3) {
                    let decimal = lat[0] + lat[1] / 60 + lat[2] / 3600;
                    if (gpsData.GPSLatitudeRef === 'S') decimal = -decimal;
                    result.latitude = decimal;
                }
            }

            if (gpsData.GPSLongitude && gpsData.GPSLongitudeRef) {
                const lng = gpsData.GPSLongitude;
                if (Array.isArray(lng) && lng.length >= 3) {
                    let decimal = lng[0] + lng[1] / 60 + lng[2] / 3600;
                    if (gpsData.GPSLongitudeRef === 'W') decimal = -decimal;
                    result.longitude = decimal;
                }
            }
        }

        return result;
    }

    // ==================== 支持的格式检测 ====================

    /**
     * 检查是否为支持的图片格式
     */
    function isSupportedFormat(file) {
        const supportedTypes = [
            'image/jpeg',
            'image/tiff',
            'image/heic',
            'image/heif',
            'image/png',
            'image/webp',
            'image/avif'
        ];

        // 检查 MIME 类型
        if (supportedTypes.includes(file.type)) {
            return true;
        }

        // 检查文件扩展名（某些浏览器可能不识别 HEIC 的 MIME）
        const ext = file.name.toLowerCase().split('.').pop();
        const supportedExts = ['jpg', 'jpeg', 'tif', 'tiff', 'heic', 'heif', 'png', 'webp', 'avif'];
        return supportedExts.includes(ext);
    }

    /**
     * 获取文件格式显示名
     */
    function getFormatName(file) {
        const ext = file.name.toLowerCase().split('.').pop();
        const formatNames = {
            'jpg': 'JPEG',
            'jpeg': 'JPEG',
            'tif': 'TIFF',
            'tiff': 'TIFF',
            'heic': 'HEIC',
            'heif': 'HEIF',
            'png': 'PNG',
            'webp': 'WebP',
            'avif': 'AVIF'
        };
        return formatNames[ext] || ext.toUpperCase();
    }

    // ==================== 主要操作 ====================

    /**
     * 处理文件选择
     */
    function handleFile(file) {
        if (!file) return;

        // 验证文件类型
        if (!isSupportedFormat(file)) {
            REOT.utils?.showNotification(
                REOT.i18n?.t('tools.exif-viewer.unsupportedFormat') || '不支持的图片格式',
                'warning'
            );
            return;
        }

        currentFileName = file.name;
        const formatName = getFormatName(file);

        // 创建预览（HEIC 需要特殊处理）
        const ext = file.name.toLowerCase().split('.').pop();
        if (ext === 'heic' || ext === 'heif') {
            // HEIC 格式浏览器可能不支持直接预览
            previewImage.src = '';
            previewImage.alt = 'HEIC 格式预览不可用';
            previewSection.style.display = 'block';

            // 显示文件基本信息
            const sizeKB = (file.size / 1024).toFixed(1);
            const sizeMB = (file.size / 1024 / 1024).toFixed(2);
            const sizeStr = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
            imageInfo.textContent = `${file.name} | ${formatName} | ${sizeStr}`;
        } else {
            // 其他格式正常预览
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                previewSection.style.display = 'block';

                // 显示文件基本信息
                const sizeKB = (file.size / 1024).toFixed(1);
                const sizeMB = (file.size / 1024 / 1024).toFixed(2);
                const sizeStr = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
                imageInfo.textContent = `${file.name} | ${formatName} | ${sizeStr}`;
            };
            reader.readAsDataURL(file);
        }

        // 提取 EXIF 数据
        extractExif(file);
    }

    /**
     * 提取 EXIF 数据
     */
    async function extractExif(file) {
        try {
            // 使用 exifr 解析所有元数据
            const ext = file.name.toLowerCase().split('.').pop();
            const isHeic = (ext === 'heic' || ext === 'heif');
            let allTags;

            if (isHeic) {
                // HEIC 文件：使用自定义解析器，不依赖 exifr
                const buffer = await file.arrayBuffer();
                allTags = parseHeicExif(buffer);
            } else {
                // 其他格式使用 exifr 标准解析
                await loadExifrLibrary();
                allTags = await exifr.parse(file, true);
            }

            if (!allTags || Object.keys(allTags).length === 0) {
                exifSection.style.display = 'none';
                noExifSection.style.display = 'block';
                thumbnailSection.style.display = 'none';
                currentExifData = null;
                return;
            }

            currentExifData = allTags;
            noExifSection.style.display = 'none';
            exifSection.style.display = 'block';

            // 渲染各个标签页
            renderTableRows(basicTable, basicFields, allTags);
            renderTableRows(cameraTable, cameraFields, allTags);
            renderTableRows(gpsTable, gpsFields, allTags);
            renderAllData(allTable, allTags);

            // 处理 GPS 数据
            handleGPSData(allTags);

            // 尝试获取缩略图（HEIC 不支持，跳过）
            if (!isHeic) {
                try {
                    await loadExifrLibrary();
                    const thumbBuffer = await exifr.thumbnail(file);
                    if (thumbBuffer) {
                        const blob = new Blob([thumbBuffer], { type: 'image/jpeg' });
                        thumbnailImage.src = URL.createObjectURL(blob);
                        thumbnailSection.style.display = 'block';
                    } else {
                        thumbnailSection.style.display = 'none';
                    }
                } catch (e) {
                    thumbnailSection.style.display = 'none';
                }
            } else {
                // HEIC 缩略图暂不支持
                thumbnailSection.style.display = 'none';
            }

            REOT.utils?.showNotification(
                REOT.i18n?.t('tools.exif-viewer.extractSuccess') || 'EXIF 数据提取成功',
                'success'
            );

        } catch (error) {
            console.error('EXIF extraction error:', error);
            exifSection.style.display = 'none';
            noExifSection.style.display = 'block';
            thumbnailSection.style.display = 'none';
            currentExifData = null;
            REOT.utils?.showNotification(
                (REOT.i18n?.t('tools.exif-viewer.extractError') || '提取失败: ') + error.message,
                'error'
            );
        }
    }

    /**
     * 处理 GPS 数据
     */
    function handleGPSData(data) {
        // exifr 直接提供 latitude 和 longitude 作为十进制数
        const lat = data.latitude;
        const lng = data.longitude;

        if (lat !== undefined && lng !== undefined && lat !== null && lng !== null) {
            mapContainer.style.display = 'block';
            // 使用 OpenStreetMap
            mapLink.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`;
        } else {
            mapContainer.style.display = 'none';
        }
    }

    /**
     * 清除数据
     */
    function clearAll() {
        previewImage.src = '';
        previewSection.style.display = 'none';
        exifSection.style.display = 'none';
        noExifSection.style.display = 'none';
        thumbnailSection.style.display = 'none';
        currentExifData = null;
        currentFileName = '';
        imageInput.value = '';
    }

    /**
     * 复制 JSON
     */
    async function copyJson() {
        if (!currentExifData) {
            REOT.utils?.showNotification(
                REOT.i18n?.t('tools.exif-viewer.noData') || '无数据',
                'warning'
            );
            return;
        }

        // 创建可序列化的副本
        const cleanData = {};
        for (const key of Object.keys(currentExifData)) {
            const value = currentExifData[key];
            if (key !== 'thumbnail' && value !== undefined) {
                // 处理 Date 对象
                if (value instanceof Date) {
                    cleanData[key] = value.toISOString();
                } else if (value instanceof ArrayBuffer || value instanceof Uint8Array) {
                    // 跳过二进制数据
                    continue;
                } else {
                    cleanData[key] = value;
                }
            }
        }

        const json = JSON.stringify(cleanData, null, 2);
        const success = await REOT.utils?.copyToClipboard(json);
        if (success) {
            REOT.utils?.showNotification(REOT.i18n?.t('common.copied') || '已复制', 'success');
        }
    }

    /**
     * 导出数据
     */
    function exportData() {
        if (!currentExifData) {
            REOT.utils?.showNotification(
                REOT.i18n?.t('tools.exif-viewer.noData') || '无数据',
                'warning'
            );
            return;
        }

        // 创建可序列化的副本
        const cleanData = {};
        for (const key of Object.keys(currentExifData)) {
            const value = currentExifData[key];
            if (key !== 'thumbnail' && value !== undefined) {
                // 处理 Date 对象
                if (value instanceof Date) {
                    cleanData[key] = value.toISOString();
                } else if (value instanceof ArrayBuffer || value instanceof Uint8Array) {
                    // 跳过二进制数据
                    continue;
                } else {
                    cleanData[key] = value;
                }
            }
        }

        const json = JSON.stringify(cleanData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const baseName = currentFileName.replace(/\.[^.]+$/, '');
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}_exif.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        REOT.utils?.showNotification(
            REOT.i18n?.t('tools.exif-viewer.exportSuccess') || '导出成功',
            'success'
        );
    }

    /**
     * 切换标签页
     */
    function switchTab(tabId) {
        // 更新标签按钮状态
        document.querySelectorAll('.exif-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // 更新面板显示
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `tab-${tabId}`);
        });
    }

    // ==================== 事件绑定 ====================

    // 上传区域点击
    if (uploadArea) {
        uploadArea.addEventListener('click', () => imageInput.click());
    }

    // 文件选择
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
    }

    // 拖拽上传
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');

            if (e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    // 清除按钮
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAll);
    }

    // 复制 JSON
    if (copyJsonBtn) {
        copyJsonBtn.addEventListener('click', copyJson);
    }

    // 导出
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    // 标签页切换
    document.querySelectorAll('.exif-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // ==================== 导出到全局 ====================

    window.ExifViewerTool = {
        extractExif,
        formatExifValue,
        isSupportedFormat
    };

})();
