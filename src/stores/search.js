import { defineStore } from 'pinia'
import { searchVideos, getHotSearch } from '@/api/modules/search'

export const useSearchStore = defineStore('search', {
  state: () => ({
    keyword: '',
    resultList: [],
    hotList: [],
    page: 1,
    isLoading: false,
    hasMore: true
  }),

  actions: {
    async loadHotSearch() {
      try {
        const res = await getHotSearch()
        if (res.code === 0) {
          // B站热搜结构可能有变，根据实际返回调整，这里假设是 trending.list
          this.hotList = res.data?.trending?.list || []
        }
      } catch (e) {
        console.error('加载热搜失败', e)
      }
    },

    async doSearch(keyword) {
      if (!keyword) return
      
      this.keyword = keyword
      this.page = 1
      this.resultList = []
      this.hasMore = true
      this.isLoading = true
      
      try {
        await this._fetchData()
      } finally {
        this.isLoading = false
      }
    },
    
    async loadMore() {
      if (this.isLoading || !this.hasMore) return
      
      this.isLoading = true
      try {
        this.page++
        await this._fetchData()
      } finally {
        this.isLoading = false
      }
    },
    
    async _fetchData() {
      const res = await searchVideos(this.keyword, this.page)
      if (res.code === 0 && res.data?.result) {
        const newItems = res.data.result
        if (newItems.length > 0) {
          // 🔥 关键修改：使用新引用赋值，确保 UniversalVideoGrid 的 watch 能触发
          this.resultList = [...this.resultList, ...newItems]
        } else {
          this.hasMore = false
        }
      } else {
        this.hasMore = false
      }
    }
  }
})
