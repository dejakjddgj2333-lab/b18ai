<template>
  <div class="home">
    <div class="hero">
      <div class="hero-glow"></div>
      <div class="hero-content">
        <div class="hero-badge">
          <el-icon><StarFilled /></el-icon>
          {{ $t('home.badge') }}
        </div>
        <h1 class="hero-title">
          {{ $t('home.title') }}
        </h1>
        <p class="hero-subtitle">{{ $t('home.subtitle') }}</p>
        <p class="hero-desc">{{ $t('home.desc') }}</p>
      </div>
    </div>

    <div class="section" ref="videosSection">
      <div class="section-header">
        <div class="section-title">
          <div class="title-icon">
            <el-icon><VideoCamera /></el-icon>
          </div>
          <div class="title-text">
            <h2>{{ $t('home.sectionTitle') }}</h2>
          </div>
        </div>
        <!-- AI智能搜索 -->
        <div class="search-box">
          <el-input
            v-model="searchQuery"
            :placeholder="$t('home.smartPlaceholder')"
            class="search-input"
            clearable
            @clear="clearSearch"
            @keydown.enter.prevent="handleSmartSearch"
          >
            <template #prefix>
              <el-icon><MagicStick /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <!-- AI分析中提示 -->
      <div v-if="smartLoading" class="ai-analyzing-bar">
        <div class="analyzing-spinner"></div>
        <span>{{ $t('home.analyzing') }}</span>
      </div>

      <!-- AI推荐提示 -->
      <div v-if="isSearching && !smartLoading && smartQuestion" class="search-result-bar smart-bar">
        <span class="search-result-text">
          {{ $t('home.smartResult', { count: displayVideos.length }) }}
        </span>
        <span class="search-clear" @click="clearSearch">{{ $t('home.clearSearch') }}</span>
      </div>

      <!-- 分类筛选栏（始终显示，只要存在分类） -->
      <div v-if="categories.length > 0 && !isSearching" class="category-filter-bar">
        <div
          class="category-tag"
          :class="{ active: activeCategory === 'all' }"
          @click="selectCategory('all')"
        >
          {{ $t('home.allCategories') }}
        </div>
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="category-tag"
          :class="{ active: activeCategory === cat.id }"
          @click="selectCategory(cat.id)"
        >
          {{ cat.name }}
        </div>
      </div>

      <div v-if="loading || smartLoading" class="loading-grid">
        <div v-for="i in 4" :key="i" class="skeleton-card">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="image" style="width: 100%; height: 200px; border-radius: 16px 16px 0 0;" />
              <div style="padding: 20px;">
                <el-skeleton-item variant="h3" style="width: 70%;" />
                <el-skeleton-item variant="text" style="width: 50%; margin-top: 12px;" />
                <el-skeleton-item variant="text" style="width: 30%; margin-top: 8px;" />
              </div>
            </template>
          </el-skeleton>
        </div>
      </div>

      <div v-else-if="displayVideos.length === 0" class="empty-state">
        <div class="empty-icon">
          <el-icon size="80" color="rgba(123,92,255,0.2)"><VideoCamera /></el-icon>
        </div>
        <h3>{{ isSearching ? $t('home.searchEmpty') : $t('home.emptyTitle') }}</h3>
        <p v-if="isSearching" class="search-empty-hint">{{ $t('home.searchEmptyHint') }}</p>
      </div>

      <div v-else class="video-grid">
        <div
          v-for="(video, index) in displayVideos"
          :key="video.id"
          class="video-card"
          @click="goToPlay(video.id)"
        >
          <div class="video-thumbnail">
            <img
              v-if="video.thumbnail"
              :src="`https://b18.ai${video.thumbnail}`"
              class="thumbnail-img"
              alt="cover"
            />
            <div v-else class="thumbnail-bg">
              <el-icon size="56" color="rgba(123, 92, 255, 0.3)"><VideoPlay /></el-icon>
            </div>
            <div class="play-overlay">
              <div class="play-btn">
                <el-icon size="28"><CaretRight /></el-icon>
              </div>
            </div>
            <div class="video-badge">
              <el-icon><Monitor /></el-icon>
              {{ $t('home.videoBadge') }}
            </div>
          </div>
          <div class="video-info">
            <h3 class="video-title">{{ video.title }}</h3>
            <p class="video-desc">{{ video.description || $t('admin.noDesc') }}</p>
            <!-- AI推荐理由 -->
            <div v-if="video.recommendReason" class="recommend-reason">
              <el-icon><MagicStick /></el-icon>
              <span>{{ video.recommendReason }}</span>
            </div>
            <div v-if="video.categoryName" class="video-category">
              <el-tag size="small" effect="plain" class="category-tag-name">
                <el-icon><Folder /></el-icon>
                {{ video.categoryName }}
              </el-tag>
            </div>
            <div class="video-meta">
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(video.createdAt) }}
              </span>
              <span class="meta-item">
                <el-icon><Files /></el-icon>
                {{ formatSize(video.size) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载更多骨架屏 -->
      <div v-if="loadingMore" class="loading-grid load-more-skeleton">
        <div v-for="i in 4" :key="i" class="skeleton-card">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="image" style="width: 100%; height: 200px; border-radius: 16px 16px 0 0;" />
              <div style="padding: 20px;">
                <el-skeleton-item variant="h3" style="width: 70%;" />
                <el-skeleton-item variant="text" style="width: 50%; margin-top: 12px;" />
                <el-skeleton-item variant="text" style="width: 30%; margin-top: 8px;" />
              </div>
            </template>
          </el-skeleton>
        </div>
      </div>

      <!-- 加载更多提示 -->
      <div v-if="videos.length > 0" class="load-more-area">
        <div v-if="!hasMore" class="load-more-done">
          {{ $t('home.noMore') }}
        </div>
        <div ref="loadMoreTrigger" class="load-more-trigger"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { videoApi, categoryApi } from '../api'

const router = useRouter()
const { locale } = useI18n()
const videos = ref([])
const categories = ref([])
const activeCategory = ref('all')
const loading = ref(true)
const loadingCategories = ref(false)
const currentPage = ref(1)
const total = ref(0)
const loadingMore = ref(false)
const loadMoreTrigger = ref(null)
const PAGE_SIZE = 8

// AI智能搜索相关
const searchQuery = ref('')
const isSearching = ref(false)
const searchTotal = ref(0)
const searchVideos = ref([])
const smartLoading = ref(false)
const smartQuestion = ref('')

// 显示的视频列表（搜索时显示搜索结果，否则显示正常列表）
const displayVideos = computed(() => isSearching.value ? searchVideos.value : videos.value)

const hasMore = computed(() => {
  if (isSearching.value) return false // AI搜索不支持分页
  return videos.value.length < total.value
})

const loadCategories = async () => {
  try {
    loadingCategories.value = true
    const res = await categoryApi.getList(locale.value)
    if (res.data.success) {
      categories.value = res.data.data
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
  } finally {
    loadingCategories.value = false
  }
}

// 监听语言切换，重新加载分类和视频
watch(locale, () => {
  loadCategories()
  if (isSearching.value && searchQuery.value.trim()) {
    handleSmartSearch()
  } else {
    const cid = activeCategory.value === 'all' ? null : activeCategory.value
    loadVideos(cid, 1, false)
  }
})

const loadVideos = async (categoryId = null, page = 1, append = false) => {
  const isFirstPage = page === 1
  if (isFirstPage) {
    loading.value = true
  } else {
    loadingMore.value = true
  }
  try {
    const cid = categoryId === 'all' ? null : categoryId
    const res = await videoApi.getList(cid, page, PAGE_SIZE, locale.value)
    if (res.data.success) {
      const data = res.data.data
      if (data.list !== undefined) {
        // 分页模式
        if (append) {
          videos.value.push(...data.list)
        } else {
          videos.value = data.list
        }
        total.value = data.total
        currentPage.value = data.page
      } else {
        // 向后兼容：不分页
        videos.value = data
        total.value = data.length
        currentPage.value = 1
      }
    }
  } catch (error) {
    ElMessage.error('Failed to get video list')
  } finally {
    if (isFirstPage) {
      loading.value = false
    } else {
      loadingMore.value = false
    }
  }
}

// 防止 IntersectionObserver 短时间内重复触发
let lastLoadTime = 0
const loadMore = () => {
  const now = Date.now()
  if (now - lastLoadTime < 500) return
  if (loadingMore.value || !hasMore.value || isSearching.value) return
  lastLoadTime = now
  const cid = activeCategory.value === 'all' ? null : activeCategory.value
  loadVideos(cid, currentPage.value + 1, true)
}

// AI智能推荐
const handleSmartSearch = async () => {
  const question = searchQuery.value.trim()
  if (!question) {
    clearSearch()
    return
  }

  smartLoading.value = true
  searchVideos.value = []

  try {
    const res = await videoApi.smartSearch(
      question,
      locale.value,
      activeCategory.value === 'all' ? null : activeCategory.value
    )
    if (res.data.success) {
      const data = res.data.data
      searchVideos.value = data.list
      searchTotal.value = data.total
      smartQuestion.value = data.question
      isSearching.value = true
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || 'AI推荐失败')
  } finally {
    smartLoading.value = false
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  isSearching.value = false
  searchVideos.value = []
  searchTotal.value = 0
  smartQuestion.value = ''
}

const selectCategory = (categoryId) => {
  activeCategory.value = categoryId
  currentPage.value = 1
  total.value = 0
  videos.value = []
  const cid = categoryId === 'all' ? null : categoryId
  loadVideos(cid, 1, false)
  // 如果在搜索模式下，重新推荐
  if (isSearching.value && searchQuery.value.trim()) {
    handleSmartSearch()
  }
}

const goToPlay = (id) => {
  router.push(`/play/${id}`)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// IntersectionObserver 监听触底加载
let observer = null
const initObserver = () => {
  if (observer) observer.disconnect()
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && hasMore.value && !loadingMore.value) {
        loadMore()
      }
    })
  }, { rootMargin: '100px' })

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
}

onMounted(() => {
  loadCategories()
  loadVideos().then(() => {
    initObserver()
  })
})
</script>

<style scoped>
.home {
  padding-bottom: 60px;
}

.hero {
  position: relative;
  border-radius: 32px;
  padding: 48px 40px;
  margin-bottom: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  overflow: hidden;
  border: 1px solid rgba(123, 92, 255, 0.1);
  background: radial-gradient(120% 120% at 50% 0%, rgba(123, 92, 255, 0.1) 0%, rgba(1, 5, 16, 0.5) 50%, rgba(1, 5, 16, 0.95) 100%);
}

.hero-glow {
  position: absolute;
  width: 400px;
  height: 400px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(123, 92, 255, 0.45) 0%, rgba(123, 92, 255, 0.15) 40%, transparent 70%);
  pointer-events: none;
  filter: blur(80px);
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 600px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: rgba(123, 92, 255, 0.1);
  border: 1px solid rgba(123, 92, 255, 0.2);
  border-radius: 100px;
  color: #a78bfa;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 20px;
}

.hero-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 56px;
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
  margin-bottom: 12px;
  letter-spacing: 4px;
  text-shadow: 0 0 60px rgba(123, 92, 255, 0.3);
}

.hero-subtitle {
  font-size: 22px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
  line-height: 1.4;
}

.hero-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.7;
  margin-bottom: 0;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}

.section {
  margin-top: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
  flex-wrap: wrap;
}

/* 搜索框 */
.search-box {
  flex-shrink: 0;
}

.search-input {
  width: 280px;
}

.search-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.03);
  box-shadow: 0 0 0 1px rgba(123, 92, 255, 0.15) inset;
  border-radius: 12px;
  padding: 0 12px;
  transition: all 0.3s;
}

.search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(123, 92, 255, 0.3) inset;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px rgba(123, 92, 255, 0.5) inset, 0 0 0 3px rgba(123, 92, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}

.search-input :deep(.el-input__inner) {
  height: 40px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
}

.search-input :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.25);
}

.search-input :deep(.el-input__prefix) {
  color: rgba(123, 92, 255, 0.4);
}

.search-input :deep(.el-input__suffix-inner .el-icon) {
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
}

.search-input :deep(.el-input__suffix-inner .el-icon:hover) {
  color: #ff7373;
}

/* 搜索结果提示栏 */
.search-result-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 10px 16px;
  background: rgba(123, 92, 255, 0.05);
  border: 1px solid rgba(123, 92, 255, 0.1);
  border-radius: 12px;
}

.search-result-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.search-clear {
  font-size: 13px;
  color: #a78bfa;
  cursor: pointer;
  transition: color 0.2s;
}

.search-clear:hover {
  color: #c4b5fd;
}

/* 搜索模式切换 */
.search-mode-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.search-mode-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(123, 92, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s;
}

.search-mode-tab:hover {
  color: rgba(255, 255, 255, 0.6);
  border-color: rgba(123, 92, 255, 0.2);
}

.search-mode-tab.active {
  color: #fff;
  background: linear-gradient(135deg, rgba(123, 92, 255, 0.4) 0%, rgba(159, 122, 234, 0.3) 100%);
  border-color: rgba(123, 92, 255, 0.3);
}

.smart-bar {
  background: rgba(212, 160, 255, 0.05);
  border-color: rgba(212, 160, 255, 0.15);
}

/* AI分析中提示 */
.ai-analyzing-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(123, 92, 255, 0.05);
  border: 1px solid rgba(123, 92, 255, 0.1);
  border-radius: 12px;
  font-size: 14px;
  color: #a78bfa;
}

.analyzing-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(123, 92, 255, 0.15);
  border-top-color: #a78bfa;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* AI推荐理由 */
.recommend-reason {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 12px;
  padding: 8px 10px;
  background: rgba(123, 92, 255, 0.06);
  border: 1px solid rgba(123, 92, 255, 0.1);
  border-radius: 8px;
  font-size: 12px;
  color: #a78bfa;
  line-height: 1.5;
}

.recommend-reason .el-icon {
  flex-shrink: 0;
  margin-top: 1px;
  font-size: 13px;
}

.search-empty-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 8px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.title-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #7B5CFF 0%, #9F7AEA 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  box-shadow: 0 4px 20px rgba(123, 92, 255, 0.3);
}

.title-text h2 {
  font-family: 'Orbitron', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  line-height: 1.2;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.skeleton-card {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(123, 92, 255, 0.05);
}

.empty-state {
  text-align: center;
  padding: 80px 40px;
  background: rgba(255, 255, 255, 0.015);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  border: 1px solid rgba(123, 92, 255, 0.06);
}

.empty-icon {
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 8px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.video-card {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(123, 92, 255, 0.06);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.video-card:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 20px 40px rgba(123, 92, 255, 0.1);
  border-color: rgba(123, 92, 255, 0.15);
}

.video-thumbnail {
  height: 200px;
  position: relative;
  overflow: hidden;
}

.thumbnail-bg {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(123, 92, 255, 0.06) 0%, rgba(159, 122, 234, 0.06) 50%, rgba(123, 92, 255, 0.04) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.5s ease;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.5s ease;
}

.video-card:hover .thumbnail-bg {
  transform: scale(1.08);
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: all 0.4s ease;
}

.video-card:hover .play-overlay {
  opacity: 1;
}

.play-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transform: scale(0.8);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: #010510;
}

.video-card:hover .play-btn {
  transform: scale(1);
}

.video-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
}

.video-info {
  padding: 22px;
}

.video-title {
  font-size: 17px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.video-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.video-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.2);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  transition: color 0.2s;
}

.video-card:hover .meta-item {
  color: rgba(255, 255, 255, 0.35);
}

@media (max-width: 768px) {
  .hero {
    padding: 32px 20px;
    margin-bottom: 24px;
    border-radius: 20px;
    min-height: auto;
  }

  .hero-title {
    font-size: 32px;
    letter-spacing: 2px;
  }

  .hero-subtitle {
    font-size: 18px;
  }

  .hero-desc {
    font-size: 14px;
    margin-bottom: 0;
  }

  .section-header {
    margin-bottom: 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .search-box {
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .title-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .title-text h2 {
    font-size: 16px;
  }

  .video-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .video-thumbnail {
    height: 120px;
  }

  .video-info {
    padding: 10px 12px;
  }

  .video-title {
    font-size: 13px;
  }

  .video-desc {
    font-size: 11px;
    -webkit-line-clamp: 1;
  }

  .video-meta {
    font-size: 11px;
  }

  .empty-state {
    padding: 48px 20px;
  }

  .empty-state h3 {
    font-size: 15px;
  }

  .loading-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

/* 分类筛选栏 */
.category-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.015);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(123, 92, 255, 0.06);
}

.category-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(123, 92, 255, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.category-tag:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(123, 92, 255, 0.08);
  border-color: rgba(123, 92, 255, 0.2);
}

.category-tag.active {
  color: #fff;
  background: linear-gradient(135deg, rgba(123, 92, 255, 0.35) 0%, rgba(159, 122, 234, 0.25) 100%);
  border-color: rgba(123, 92, 255, 0.3);
  box-shadow: 0 2px 12px rgba(123, 92, 255, 0.15);
}

/* 视频分类标签 */
.video-category {
  margin-bottom: 12px;
}

.category-tag-name {
  border-radius: 8px;
  font-weight: 500;
  color: #a78bfa;
  border-color: rgba(123, 92, 255, 0.2);
  background: rgba(123, 92, 255, 0.05);
}

.category-tag-name .el-icon {
  margin-right: 4px;
}

@media (max-width: 768px) {
  .category-filter-bar {
    padding: 12px 14px;
    gap: 8px;
    margin-bottom: 16px;
  }

  .category-tag {
    padding: 6px 14px;
    font-size: 12px;
  }
}

/* 加载更多 */
.load-more-area {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(123, 92, 255, 0.06);
}

.load-more-skeleton {
  margin-top: 24px;
}

.load-more-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(123, 92, 255, 0.15);
  border-top-color: #a78bfa;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.load-more-done {
  text-align: center;
  padding: 16px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.25);
}

.load-more-trigger {
  height: 40px;
}

@media (max-width: 768px) {
  .load-more-area {
    margin-top: 20px;
    padding-top: 16px;
  }
}
</style>
