import request from '@/api/request'

export const searchVideos = (keyword, page = 1, pageSize = 20) => {
  return request({
    url: '/x/web-interface/search/type',
    method: 'GET',
    params: {
      keyword,
      search_type: 'video',
      page,
      page_size: pageSize
    }
  })
}

// 热门搜索 (可选)
export const getHotSearch = () => {
  return request({
    url: '/x/web-interface/search/square',
    method: 'GET',
    params: { limit: 10 }
  })
}
