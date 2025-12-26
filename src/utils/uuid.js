// src/utils/uuid.js

const BUVID_KEY = 'bili_pad_buvid3';

// 一个简单的 UUID 生成器 (无需安装 npm 包)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const getBuvid3 = () => {
  // 1. 尝试从本地缓存读取
  let buvid = localStorage.getItem(BUVID_KEY);
  
  // 2. 如果没有，则生成一个新的并存入缓存
  if (!buvid) {
    buvid = generateUUID() + 'infoc';
    localStorage.setItem(BUVID_KEY, buvid);
    console.log('🎉 新设备初始化，生成 Buvid3:', buvid);
  }
  
  return buvid;
};