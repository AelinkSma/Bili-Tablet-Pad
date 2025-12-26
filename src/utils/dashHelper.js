/**
 * BiliDashAdapter
 * 用于将 Bilibili API 返回的非标准 DASH JSON 数据转换为标准的 MPD (Media Presentation Description) XML 格式。
 * 供 dash.js 使用。
 */
export class BiliDashAdapter {

  /**
   * 生成 MPD XML 字符串
   * @param {Object} dashData - B站 API 返回的 result.dash 对象
   * @returns {string} - 标准的 MPD XML 字符串
   */
  static generateMpd(dashData) {
    if (!dashData) {
      console.error('BiliDashAdapter: dashData is null or undefined');
      return '';
    }

    // 1. 获取基本信息
    // duration 可能是秒数，需要转换为 ISO 8601 格式 (PTxxS)
    const durationStr = `PT${dashData.duration}S`;
    const minBufferTime = dashData.minBufferTime || dashData.min_buffer_time || 1.5;
    const minBufferTimeStr = `PT${minBufferTime}S`;

    // 2. 构建 XML 头部
    // 🔧 修复：移除 strict profile，让 dashjs 自动推断，防止因 profile 不匹配导致静默失败
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" 
     type="static" 
     minBufferTime="${minBufferTimeStr}" 
     mediaPresentationDuration="${durationStr}">
  <Period>
`;

    // 3. 处理视频流 (Video AdaptationSet)
    if (dashData.video && dashData.video.length > 0) {
      // 🌟 核心修复：放宽过滤，允许 H.264 (avc1), H.265 (hvc1/hev1), AV1 (av01)
      const validVideos = dashData.video.filter(v => {
        const codec = (v.codecs || '').toLowerCase();
        return codec.includes('avc1') || 
               codec.includes('hvc1') || 
               codec.includes('hev1') || 
               codec.includes('av01');
      });

      if (validVideos.length > 0) {
         if (validVideos.length < dashData.video.length) {
            console.log(`🧹 [BiliDashAdapter] Filtered out ${dashData.video.length - validVideos.length} unsupported streams (keeping AVC/HEVC/AV1).`);
         }
         dashData.video = validVideos;
      } else {
         console.warn('⚠️ [BiliDashAdapter] No standard codecs found, using original list as fallback.');
      }

      xml += `    <AdaptationSet mimeType="video/mp4" contentType="video" subsegmentAlignment="true" subsegmentStartsWithSAP="1">
`;
      dashData.video.forEach(video => {
        xml += BiliDashAdapter._generateRepresentation(video);
      });
      xml += `    </AdaptationSet>
`;
    }

    // 4. 处理音频流 (Audio AdaptationSet)
    if (dashData.audio && dashData.audio.length > 0) {
      xml += `    <AdaptationSet mimeType="audio/mp4" contentType="audio" subsegmentAlignment="true" subsegmentStartsWithSAP="1">
`;
      dashData.audio.forEach(audio => {
        xml += BiliDashAdapter._generateRepresentation(audio);
      });
      xml += `    </AdaptationSet>
`;
    }

    // 5. 闭合标签
    xml += `  </Period>
</MPD>`;

    console.log('📝 [BiliDashAdapter] Generated MPD (First 500 chars):', xml.substring(0, 500));
    if (dashData.video && dashData.video.length > 0) {
      console.log('🎞️ [BiliDashAdapter] Video Codecs:', dashData.video.map(v => v.codecs).join(', '));
    }

    return xml;
  }

  /**
   * 内部方法：生成单个 Representation 节点
   * @param {Object} streamItem - video 或 audio 数组中的单项
   * @returns {string} Representation XML 片段
   */
  static _generateRepresentation(streamItem) {
    // 提取必要字段，且处理字段可能不存在的情况
    const id = streamItem.id || 0;
    const bandwidth = streamItem.bandwidth || 0;
    
    // 🔧 修复：清洗 codecs，移除可能的引号或多余字符
    let codecs = streamItem.codecs || '';
    if (codecs) {
        codecs = codecs.replace(/["']/g, '').trim();
        // 如果包含逗号，只取第一个 (极其罕见，但防御性编程)
        if (codecs.includes(',')) {
            codecs = codecs.split(',')[0];
        }
        
        // ✨ 保持针对 avc1 的兼容性修复，但不要误伤 hvc1
        if (codecs.startsWith('avc1')) {
             codecs = 'avc1.4d401e'; 
        }
    }

    const width = streamItem.width || 0;
    const height = streamItem.height || 0;
    const frameRate = streamItem.frameRate || streamItem.frame_rate || '';
    
    // 🔧 修复：sar 必须是 "x:y" 格式，B站有时返回 "N/A" 或空，导致 dashjs 解析失败
    let sar = streamItem.sar || '1:1';
    if (sar === 'N/A' || !/^\d+:\d+$/.test(sar)) {
      sar = '1:1';
    }

    // 处理 BaseURL (通常 B 站返回的是 baseUrl 或 base_url)
    // 需要进行 XML 转义，因为 URL 可能包含 & 等特殊字符
    const rawUrl = streamItem.baseUrl || streamItem.base_url || '';
    const escapedUrl = BiliDashAdapter._escapeXml(rawUrl);
    
    // 🔍 调试：检查 URL 转义
    if (id === 80 || id === '80') { 
        // console.log(`🔗 [BiliDashAdapter] BaseURL (Raw): ${rawUrl.substring(0, 50)}...`);
    }

    // 处理 SegmentBase
    // B站数据通常在 SegmentBase.Initialization 和 SegmentBase.indexRange
    let initialization = '';
    let indexRange = '';

    if (streamItem.SegmentBase) {
      initialization = streamItem.SegmentBase.Initialization || '';
      indexRange = streamItem.SegmentBase.indexRange || '';
      // 🔍 调试 SegmentBase
      if (id === 80 || id === '80') {
        console.log(`📏 [SegmentBase] ID: ${id}, Init: ${initialization}, Index: ${indexRange}`);
      }
    }
    
    if (!initialization || !indexRange) {
        console.warn(`⚠️ [BiliDashAdapter] Missing SegmentBase info for id ${id}. Init: ${initialization}, Index: ${indexRange}`);
    }

    // 构建 XML
    // 注意：dash.js 实际上主要依赖 BaseURL 和 SegmentBase 来进行 Range 请求
    return `      <Representation id="${id}" bandwidth="${bandwidth}" codecs="${codecs}" width="${width}" height="${height}" frameRate="${frameRate}" sar="${sar}">
        <BaseURL>${escapedUrl}</BaseURL>
        <SegmentBase indexRange="${indexRange}">
          <Initialization range="${initialization}" />
        </SegmentBase>
      </Representation>
`;
  }

  /**
   * 简单的 XML 特殊字符转义
   * @param {string} unsafe 
   * @returns {string}
   */
  static _escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'\\"]/g, function (c) {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  }
}
