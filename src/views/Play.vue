<template>
  <div class="play-page">
    <div class="play-header">
      <div class="back-btn" @click="$router.push('/')">
        <div class="back-icon">
          <el-icon><ArrowLeft /></el-icon>
        </div>
        <span>{{ $t('play.back') }}</span>
      </div>
      <div v-if="video" class="video-title-header">
        <el-icon><VideoPlay /></el-icon>
        <span>{{ video.title }}</span>
      </div>
    </div>

    <div class="play-layout">
      <!-- 视频播放器区域 -->
      <div class="video-section">
        <div class="video-player-wrap">
          <VideoPlayer
            v-if="video"
            :src="videoUrl"
            :title="video.title"
            @timeupdate="handleTimeUpdate"
          />
          <div v-else class="video-placeholder">
            <div class="placeholder-spinner">
              <div class="spinner-ring"></div>
              <div class="spinner-ring spinner-ring-2"></div>
            </div>
          </div>
        </div>
        <div v-if="video" class="video-detail-card">
          <div class="detail-header">
            <div class="detail-title-section">
              <h1>{{ video.title }}</h1>
              <div class="detail-meta">
                <span class="meta-tag">
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(video.createdAt) }}
                </span>
                <span class="meta-tag">
                  <el-icon><Files /></el-icon>
                  {{ formatSize(video.size) }}
                </span>
              </div>
            </div>
          </div>
          <div v-if="video.description" class="detail-desc">
            <div class="desc-label">
              <el-icon><Document /></el-icon>
              {{ $t('play.intro') }}
            </div>
            <p>{{ video.description }}</p>
          </div>
        </div>
      </div>

      <!-- AI 问答侧边栏 -->
      <div class="chat-section">
        <!-- 移动端标签切换 -->
        <div class="mobile-tabs">
          <div
            class="tab"
            :class="{ active: activeTab === 'chat' }"
            @click="activeTab = 'chat'"
          >
            {{ $t('play.chatTab') }}
          </div>
          <div
            class="tab"
            :class="{ active: activeTab === 'desc' }"
            @click="activeTab = 'desc'"
          >
            {{ $t('play.descTab') }}
          </div>
        </div>

        <!-- 内容区 -->
        <div class="chat-main">
          <AIChat
            v-show="activeTab === 'chat'"
            :video-id="videoId"
            :video-title="video?.title || ''"
            :video-time="currentTime"
          />
          <div v-if="video && activeTab === 'desc'" class="mobile-desc-panel">
            <div class="mobile-desc-header">
              <h1>{{ video.title }}</h1>
              <div class="mobile-desc-meta">
                <span class="mobile-meta-tag">
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(video.createdAt) }}
                </span>
                <span class="mobile-meta-tag">
                  <el-icon><Files /></el-icon>
                  {{ formatSize(video.size) }}
                </span>
              </div>
            </div>
            <div v-if="video.description" class="mobile-desc-body">
              <div class="mobile-desc-label">
                <el-icon><Document /></el-icon>
                {{ $t('play.intro') }}
              </div>
              <p>{{ video.description }}</p>
            </div>
            <div v-else class="mobile-desc-empty">{{ $t('admin.noDesc') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { videoApi } from '../api'
import VideoPlayer from '../components/VideoPlayer.vue'
import AIChat from '../components/AIChat.vue'

const route = useRoute()
const { t, locale } = useI18n()
const videoId = route.params.id
const video = ref(null)
const currentTime = ref(0)
const activeTab = ref('chat')

// 监听语言切换，重新加载视频以获取本地化标题/描述
watch(locale, () => {
  loadVideo()
})

const videoUrl = computed(() => {
  if (!video.value) return ''
  // 视频流直接走线上域名，绕过 Vite 代理（代理不适合处理 Range 请求）
  if (video.value.url.startsWith('/api/videos/stream/')) {
    return `https://b18.ai${video.value.url}`
  }
  return video.value.url
})

const loadVideo = async () => {
  try {
    const res = await videoApi.getById(videoId, locale.value)
    if (res.data.success) {
      video.value = res.data.data
    }
  } catch (error) {
    ElMessage.error(t('messages.getVideoFailed'))
  }
}

const handleTimeUpdate = (time) => {
  currentTime.value = time
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

onMounted(loadVideo)
</script>

<style scoped>
.play-page {
  padding-bottom: 32px;
}

.play-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.back-btn:hover {
  color: #a78bfa;
}

.back-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(123, 92, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.back-btn:hover .back-icon {
  background: rgba(123, 92, 255, 0.1);
  border-color: rgba(123, 92, 255, 0.2);
}

.video-title-header {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.video-title-header .el-icon {
  color: #7B5CFF;
}

.play-layout {
  display: grid;
  grid-template-columns: 1fr 460px;
  gap: 24px;
  align-items: start;
}

.video-section {
  min-width: 0;
}

.video-player-wrap {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #0a0a0a;
  border-radius: 20px;
  overflow: hidden;
}

.video-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(123, 92, 255, 0.04) 0%, rgba(1, 5, 16, 0.6) 100%);
}

.placeholder-spinner {
  position: relative;
  width: 40px;
  height: 40px;
}

.placeholder-spinner .spinner-ring {
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  border-top-color: #7B5CFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.placeholder-spinner .spinner-ring-2 {
  inset: 5px;
  border-top-color: #9F7AEA;
  animation-duration: 0.8s;
  animation-direction: reverse;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.video-detail-card {
  margin-top: 20px;
  padding: 28px;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(123, 92, 255, 0.08);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
}

.detail-header {
  margin-bottom: 20px;
}

.detail-title-section h1 {
  font-family: 'Orbitron', sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12px;
  line-height: 1.3;
}

.detail-meta {
  display: flex;
  gap: 12px;
}

.meta-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(123, 92, 255, 0.08);
  border-radius: 8px;
  font-size: 13px;
  color: #a78bfa;
  font-weight: 500;
  border: 1px solid rgba(123, 92, 255, 0.1);
}

.detail-desc {
  padding-top: 20px;
  border-top: 1px solid rgba(123, 92, 255, 0.08);
}

.desc-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 10px;
}

.desc-label .el-icon {
  color: #7B5CFF;
}

.detail-desc p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.8;
}

.chat-section {
  position: sticky;
  top: 20px;
  height: calc(100vh - 200px);
  max-height: calc(100vh - 200px);
  display: flex;
}

.mobile-tabs {
  display: none;
}

.chat-main {
  flex: 1;
  display: flex;
  min-height: 0;
}

@media (max-width: 1100px) {
  .play-layout {
    grid-template-columns: 1fr;
  }
  .chat-section {
    position: relative;
    top: 0;
    height: 520px;
  }
}

/* 移动端优化：固定布局，页面不滚动，只有聊天区可滚动 */
@media (max-width: 768px) {
  .play-page {
    padding-bottom: 0;
    height: calc(100dvh - 32px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .play-header {
    gap: 12px;
    margin-bottom: 12px;
    flex-shrink: 0;
  }

  .back-btn span {
    display: none;
  }

  .video-title-header {
    font-size: 14px;
  }

  .video-title-header span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
  }

  .play-layout {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 12px;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .video-section {
    flex-shrink: 0;
  }

  /* 隐藏简介卡片 */
  .video-detail-card {
    display: none;
  }

  .chat-section {
    position: relative;
    top: 0;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .mobile-tabs {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.015);
    border-radius: 12px;
    border: 1px solid rgba(123, 92, 255, 0.08);
    margin-bottom: 8px;
  }

  .tab {
    flex: 1;
    text-align: center;
    padding: 8px 0;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: all 0.3s;
    user-select: none;
  }

  .tab.active {
    color: #fff;
    background: linear-gradient(135deg, rgba(123, 92, 255, 0.35) 0%, rgba(159, 122, 234, 0.25) 100%);
    box-shadow: 0 2px 8px rgba(123, 92, 255, 0.15);
  }

  .chat-main {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
  }

  .mobile-desc-panel {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 16px;
    background: rgba(255, 255, 255, 0.015);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    border: 1px solid rgba(123, 92, 255, 0.08);
  }

  .mobile-desc-header h1 {
    font-family: 'Orbitron', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 10px;
    line-height: 1.3;
  }

  .mobile-desc-meta {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;
  }

  .mobile-meta-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: rgba(123, 92, 255, 0.08);
    border-radius: 6px;
    font-size: 12px;
    color: #a78bfa;
    font-weight: 500;
    border: 1px solid rgba(123, 92, 255, 0.1);
  }

  .mobile-meta-tag .el-icon {
    font-size: 12px;
  }

  .mobile-desc-body {
    padding-top: 12px;
    border-top: 1px solid rgba(123, 92, 255, 0.08);
  }

  .mobile-desc-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 8px;
  }

  .mobile-desc-label .el-icon {
    color: #7B5CFF;
    font-size: 14px;
  }

  .mobile-desc-body p {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.45);
    line-height: 1.7;
  }

  .mobile-desc-empty {
    text-align: center;
    padding: 40px 20px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.25);
  }
}
</style>
