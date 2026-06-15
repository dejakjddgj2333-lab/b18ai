import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 300000
})

// 分类相关API
export const categoryApi = {
  getList: (locale = 'zh-CN') => api.get('/categories', { params: { locale } }),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  autoTranslate: (id, sourceLocale, targetLocales) => api.post(`/categories/${id}/auto-translate`, { sourceLocale, targetLocales })
}

// 视频相关API
export const videoApi = {
  getList: (categoryId, page, pageSize = 8, locale = 'zh-CN') => {
    const params = { locale };
    if (categoryId) params.categoryId = categoryId;
    if (page) { params.page = page; params.pageSize = pageSize; }
    return api.get('/videos', { params });
  },
  getById: (id, locale = 'zh-CN') => api.get(`/videos/${id}`, { params: { locale } }),
  upload: (formData, onProgress) => api.post('/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  }),
  update: (id, data) => api.put(`/videos/${id}`, data),
  delete: (id) => api.delete(`/videos/${id}`),
  autoTranslate: (id, sourceLocale, targetLocales) => api.post(`/videos/${id}/auto-translate`, { sourceLocale, targetLocales }),
  analyze: (id) => api.post(`/videos/${id}/analyze`),
  generateMetadata: (id, locale) => api.post(`/videos/${id}/generate-metadata`, { locale }),
  search: (q, locale, categoryId, page, pageSize = 8) =>
    api.get('/videos/search', { params: { q, locale, categoryId, page, pageSize } }),
  smartSearch: (question, locale, categoryId) =>
    api.post('/videos/smart-search', { question, locale, categoryId })
}

// 聊天相关API
export const chatApi = {
  sendMessage: (videoId, message, videoTime, locale, history) =>
    api.post(`/chat/${videoId}`, { message, videoTime, locale, history }),
  clearChat: (videoId) =>
    api.delete(`/chat/${videoId}`)
}

// 知识库相关API
export const knowledgeApi = {
  getList: () => api.get('/knowledge'),
  upload: (formData, onProgress) => api.post('/knowledge/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  }),
  getById: (id) => api.get(`/knowledge/${id}`),
  getChunks: (id) => api.get(`/knowledge/${id}/chunks`),
  delete: (id) => api.delete(`/knowledge/${id}`),
  reparse: (id) => api.post(`/knowledge/${id}/reparse`)
}

export default api
