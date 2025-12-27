// src/workers/dash.worker.js

/**
 * 内部类：BiliDashAdapter
 * 用于将 Bilibili API 返回的非标准 DASH JSON 数据转换为标准的 MPD XML 格式。
 * 直接将逻辑包含在 Worker 中，避免 import 路径问题。
 */
class BiliDashAdapter {

  /**
   * 生成 MPD XML 字符串
   * @param {Object} dashData - B站 API 返回的 result.dash 对象
   * @returns {string} - 标准的 MPD XML 字符串
   */
  static generateMpd(dashData) {
    if (!dashData) {
      return '';
    }

    // 1. 获取基本信息
    const durationStr = `PT${dashData.duration}S`;
    const minBufferTime = dashData.minBufferTime || dashData.min_buffer_time || 1.5;
    const minBufferTimeStr = `PT${minBufferTime}S`;

    // 2. 构建 XML 头部
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" 
     type="static" 
     minBufferTime="${minBufferTimeStr}" 
     mediaPresentationDuration="${durationStr}">
  <Period>
`;

    // 3. 处理视频流
    if (dashData.video && dashData.video.length > 0) {
      // 过滤支持的编码：H.264 (avc1), H.265 (hvc1/hev1), AV1 (av01)
      const validVideos = dashData.video.filter(v => {
        const codec = (v.codecs || '').toLowerCase();
        return codec.includes('avc1') || 
               codec.includes('hvc1') || 
               codec.includes('hev1') || 
               codec.includes('av01');
      });
      
      // 如果没有筛选出标准编码，则使用原始列表作为回退
      const videosToUse = validVideos.length > 0 ? validVideos : dashData.video;

      xml += `    <AdaptationSet mimeType="video/mp4" contentType="video" subsegmentAlignment="true" subsegmentStartsWithSAP="1">\n`;
      videosToUse.forEach(video => {
        xml += BiliDashAdapter._generateRepresentation(video);
      });
      xml += `    </AdaptationSet>\n`;
    }

    // 4. 处理音频流
    if (dashData.audio && dashData.audio.length > 0) {
      xml += `    <AdaptationSet mimeType="audio/mp4" contentType="audio" subsegmentAlignment="true" subsegmentStartsWithSAP="1">\n`;
      dashData.audio.forEach(audio => {
        xml += BiliDashAdapter._generateRepresentation(audio);
      });
      xml += `    </AdaptationSet>\n`;
    }

    // 5. 闭合标签
    xml += `  </Period>
</MPD>`;

    return xml;
  }

  static _generateRepresentation(streamItem) {
    const id = streamItem.id || 0;
    const bandwidth = streamItem.bandwidth || 0;
    
    // 清洗 codecs
    let codecs = streamItem.codecs || '';
    if (codecs) {
        codecs = codecs.replace(/["']/g, '').trim();
        if (codecs.includes(',')) codecs = codecs.split(',')[0];
        if (codecs.startsWith('avc1')) codecs = 'avc1.4d401e'; 
    }

    const width = streamItem.width || 0;
    const height = streamItem.height || 0;
    const frameRate = streamItem.frameRate || streamItem.frame_rate || '';
    
    let sar = streamItem.sar || '1:1';
    if (sar === 'N/A' || !/^\d+:\d+$/.test(sar)) sar = '1:1';

    // 处理 URL
    const rawUrl = streamItem.baseUrl || streamItem.base_url || '';
    const escapedUrl = BiliDashAdapter._escapeXml(rawUrl);
    
    // 处理 SegmentBase
    let initialization = '';
    let indexRange = '';

    if (streamItem.SegmentBase) {
      initialization = streamItem.SegmentBase.Initialization || '';
      indexRange = streamItem.SegmentBase.indexRange || '';
    }

    return `      <Representation id="${id}" bandwidth="${bandwidth}" codecs="${codecs}" width="${width}" height="${height}" frameRate="${frameRate}" sar="${sar}">
        <BaseURL>${escapedUrl}</BaseURL>
        <SegmentBase indexRange="${indexRange}">
          <Initialization range="${initialization}" />
        </SegmentBase>
      </Representation>\n`;
  }

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

// Worker 消息处理入口
self.onmessage = (e) => {
  const { dashData } = e.data;
  try {
    // 调用上面定义的 Adapter 生成 XML
    const xml = BiliDashAdapter.generateMpd(dashData);
    
    self.postMessage({ success: true, xml });
  } catch (err) {
    self.postMessage({ success: false, error: err.message });
  }
};