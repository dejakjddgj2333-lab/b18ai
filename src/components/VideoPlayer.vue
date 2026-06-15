<template>
  <div class="video-player-wrapper" ref="containerRef">
    <div class="video-container">
      <video
        ref="videoRef"
        :src="src"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoadedMetadata"
        @play="isPlaying = true"
        @pause="isPlaying = false"
        @ended="isPlaying = false; showReplay = true"
        @waiting="isBuffering = true"
        @playing="isBuffering = false"
        @seeked="onSeeked"
        @click="togglePlay"
      />

      <div class="center-controls" @click="togglePlay">
        <transition name="fade-scale">
          <div v-if="!isPlaying && !isBuffering && !showReplay" class="play-overlay">
            <div class="play-circle">
              <el-icon size="32"><VideoPlay /></el-icon>
            </div>
          </div>
          <div v-else-if="showReplay" class="play-overlay" @click.stop="replay">
            <div class="play-circle">
              <el-icon size="28"><RefreshRight /></el-icon>
            </div>
            <span class="replay-text">{{ $t('videoPlayer.replay') }}</span>
          </div>
        </transition>
      </div>

      <div v-if="isBuffering || isLoading" class="buffering-overlay">
        <div class="spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring spinner-ring-2"></div>
        </div>
        <span class="buffering-text">{{ $t('videoPlayer.loading') }}</span>
      </div>

      <transition name="fade-scale">
        <div v-if="showClickFeedback" class="click-feedback">
          <el-icon size="48" color="rgba(255,255,255,0.9)">
            <VideoPlay v-if="!isPlaying"/>
            <VideoPause v-else/>
          </el-icon>
        </div>
      </transition>
    </div>

    <div class="controls-bar" :class="{ 'controls-visible': showControls || !isPlaying }">
      <el-button circle size="small" class="ctrl-btn" @click="togglePlay">
        <el-icon v-if="isPlaying"><VideoPause /></el-icon>
        <el-icon v-else><VideoPlay /></el-icon>
      </el-button>

      <span class="time-display">{{ formatTime(currentTime) }} <span class="time-sep">/</span> {{ formatTime(duration) }}</span>

      <div class="progress-area">
        <el-slider
          v-model="progress"
          :max="100"
          :show-tooltip="false"
          size="small"
          class="progress-slider"
          @input="onProgressInput"
          @change="onProgressChange"
        />
      </div>

      <div class="volume-area" @mouseenter="showVolume = true" @mouseleave="showVolume = false">
        <el-button circle size="small" class="ctrl-btn" @click="toggleMute">
          <el-icon v-if="isMuted"><Mute /></el-icon>
          <el-icon v-else-if="volume < 30"><Microphone /></el-icon>
          <el-icon v-else><Headset /></el-icon>
        </el-button>
        <transition name="volume-slide">
          <div v-show="showVolume" class="volume-slider-wrapper">
            <el-slider
              v-model="volume"
              :max="100"
              :show-tooltip="false"
              vertical
              height="80px"
              size="small"
              @change="onVolumeChange"
            />
          </div>
        </transition>
      </div>

      <el-button circle size="small" class="ctrl-btn" @click="toggleFullscreen">
        <el-icon><FullScreen /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  src: { type: String, required: true },
  title: { type: String, default: '' }
})

const emit = defineEmits(['timeupdate'])

const videoRef = ref(null)
const containerRef = ref(null)
const isPlaying = ref(false)
const isLoading = ref(true)
const isBuffering = ref(false)
const isMuted = ref(false)
const showReplay = ref(false)
const showControls = ref(false)
const showVolume = ref(false)
const showClickFeedback = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const volume = ref(80)

let controlsTimer = null
let feedbackTimer = null
let ignoreProgressUntil = 0

const togglePlay = () => {
  if (!videoRef.value) return

  showClickFeedback.value = true
  clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => { showClickFeedback.value = false }, 600)

  if (isPlaying.value) {
    videoRef.value.pause()
  } else {
    showReplay.value = false
    videoRef.value.play()
  }

  showControlsTemporarily()
}

const replay = () => {
  if (!videoRef.value) return
  videoRef.value.currentTime = 0
  showReplay.value = false
  videoRef.value.play()
}

const showControlsTemporarily = () => {
  showControls.value = true
  clearTimeout(controlsTimer)
  if (isPlaying.value) {
    controlsTimer = setTimeout(() => { showControls.value = false }, 3000)
  }
}

const toggleMute = () => {
  if (!videoRef.value) return
  videoRef.value.muted = !videoRef.value.muted
  isMuted.value = videoRef.value.muted
}

const toggleFullscreen = () => {
  if (!containerRef.value) return
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    containerRef.value.requestFullscreen()
  }
}

const onTimeUpdate = () => {
  if (!videoRef.value) return
  currentTime.value = videoRef.value.currentTime
  const d = duration.value
  // 锁定期内不更新进度条；duration 无效时也不更新，避免 progress 被设为 0 或 NaN
  if (Date.now() > ignoreProgressUntil && Number.isFinite(d) && d > 0) {
    progress.value = (currentTime.value / d) * 100
  }
  emit('timeupdate', currentTime.value)
}

const onLoadedMetadata = () => {
  if (!videoRef.value) return
  const d = videoRef.value.duration
  // 过滤掉 NaN / Infinity / 0 等无效时长
  duration.value = Number.isFinite(d) && d > 0 ? d : 0
  videoRef.value.volume = volume.value / 100
  isLoading.value = false
}

const onProgressInput = (val) => {
  // 拖动过程中始终锁住，让 v-model 控制滑块位置
  ignoreProgressUntil = Infinity
  progress.value = val
}

const onProgressChange = (val) => {
  // 先设锁，无论后续是否成功设置 currentTime，都要防止 timeupdate 把 progress 弹回
  ignoreProgressUntil = Date.now() + 500
  progress.value = val

  const video = videoRef.value
  const d = duration.value
  if (!video || !Number.isFinite(d) || d <= 0) return

  // 视频元数据还没准备好时不能 seek
  if (video.readyState < 1) return

  const targetTime = (val / 100) * d
  if (!Number.isFinite(targetTime) || targetTime < 0) return

  // 如果目标时间和当前时间几乎相同，跳过 seek，避免触发不必要的重新加载
  if (Math.abs(video.currentTime - targetTime) < 0.3) return

  try {
    video.currentTime = targetTime
  } catch (e) {
    console.warn('Seek failed:', e)
  }
}

const onSeeked = () => {
  // seeked 后再延迟 150ms 锁定，覆盖浏览器可能排队的旧 timeupdate
  ignoreProgressUntil = Date.now() + 150
}

const onVolumeChange = (val) => {
  if (!videoRef.value) return
  videoRef.value.volume = val / 100
  isMuted.value = val === 0
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

watch(() => props.src, () => {
  isLoading.value = true
  isPlaying.value = false
  showReplay.value = false
})
</script>

<style scoped>
.video-player-wrapper {
  background: #0f0f0f;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.video-container {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #0a0a0a;
  cursor: pointer;
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.center-controls {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.play-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.play-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a1a2e;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.play-circle:hover {
  transform: scale(1.1);
  background: #fff;
}

.replay-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
}

.buffering-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.4);
  z-index: 3;
}

.spinner {
  position: relative;
  width: 50px;
  height: 50px;
}

.spinner-ring {
  position: absolute;
  inset: 0;
  border: 3px solid transparent;
  border-top-color: #3898FF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-ring-2 {
  inset: 6px;
  border-top-color: #b18cff;
  animation-duration: 0.8s;
  animation-direction: reverse;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.buffering-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
}

.click-feedback {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 4;
  pointer-events: none;
}

.controls-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 70%, transparent 100%);
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: 5;
}

.controls-visible {
  opacity: 1;
}

.video-player-wrapper:hover .controls-bar {
  opacity: 1;
}

.ctrl-btn {
  background: rgba(255, 255, 255, 0.12) !important;
  border: none !important;
  color: #fff !important;
  transition: all 0.2s !important;
}

.ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  transform: scale(1.05);
}

.time-display {
  color: #fff;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  min-width: 90px;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}

.time-sep {
  color: rgba(255, 255, 255, 0.5);
  margin: 0 3px;
}

.progress-area {
  flex: 1;
  padding: 0 4px;
}

.progress-slider :deep(.el-slider__runway) {
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
}

.progress-slider :deep(.el-slider__bar) {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, #3898FF 0%, #c4b5fd 100%);
}

.progress-slider :deep(.el-slider__button-wrapper) {
  top: -9px;
}

.progress-slider :deep(.el-slider__button) {
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  background: #3898FF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s;
}

.progress-slider :deep(.el-slider__button:hover) {
  transform: scale(1.3);
}

.volume-area {
  position: relative;
  display: flex;
  align-items: center;
}

.volume-slider-wrapper {
  position: absolute;
  bottom: 44px;
  left: 50%;
  transform: translateX(-50%);
  padding: 14px 8px;
  background: rgba(30, 30, 40, 0.95);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.volume-slider-wrapper :deep(.el-slider__runway) {
  background: rgba(255, 255, 255, 0.2);
  width: 4px;
}

.volume-slider-wrapper :deep(.el-slider__bar) {
  width: 4px;
  background: linear-gradient(to top, #3898FF 0%, #c4b5fd 100%);
}

.volume-slider-wrapper :deep(.el-slider__button) {
  border: 2px solid #fff;
  background: #3898FF;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.6);
}

.volume-slide-enter-active,
.volume-slide-leave-active {
  transition: all 0.2s ease;
}

.volume-slide-enter-from,
.volume-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>