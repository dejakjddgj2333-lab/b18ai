<template>
  <div class="ai-chat">
    <div class="chat-header">
      <div class="header-main">
        <div class="header-avatar">
          <el-icon><MagicStick /></el-icon>
        </div>
        <div class="header-info">
          <span class="header-name">{{ $t('chat.title') }}</span>
          <div class="header-status">
            <span class="status-dot"></span>
            <span class="status-text">{{ $t('chat.online') }}</span>
          </div>
        </div>
      </div>
      <el-tooltip :content="$t('chat.clear')" placement="bottom">
        <el-button link class="clear-btn" @click="clearChat">
          <el-icon><Delete /></el-icon>
        </el-button>
      </el-tooltip>
    </div>

    <div ref="messagesRef" class="messages-container">
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-avatar">
          <el-icon size="36"><MagicStick /></el-icon>
        </div>
        <h3>{{ $t('chat.welcomeTitle') }}</h3>
        <p>{{ $t('chat.welcomeDesc') }}</p>
        <div class="quick-questions">
          <div
            v-for="q in quickQuestions"
            :key="q"
            class="quick-card"
            @click="sendQuickQuestion(q)"
          >
            <el-icon><QuestionFilled /></el-icon>
            <span>{{ q }}</span>
          </div>
        </div>
      </div>

      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['message', msg.role]"
      >
        <div class="message-avatar-wrapper">
          <div :class="['msg-avatar', msg.role]">
            <el-icon v-if="msg.role === 'user'"><UserFilled /></el-icon>
            <el-icon v-else><MagicStick /></el-icon>
          </div>
        </div>
        <div class="message-content">
          <div class="message-bubble">
            <div class="message-text" v-html="formatMessage(msg.content)"></div>
          </div>
          <div class="message-meta">
            <span v-if="msg.videoTime !== null" class="time-tag">
              <el-icon size="12"><VideoPlay /></el-icon>
              {{ formatTime(msg.videoTime) }}
            </span>
            <span class="timestamp">{{ formatTimestamp(msg.timestamp) }}</span>
          </div>
        </div>
      </div>

      <div v-if="loading" class="message assistant">
        <div class="message-avatar-wrapper">
          <div class="msg-avatar assistant">
            <el-icon><MagicStick /></el-icon>
          </div>
        </div>
        <div class="message-content">
          <div class="message-bubble">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="input-area">
      <div v-if="videoTime !== null && videoTime > 0" class="context-hint">
        <div class="context-badge">
          <el-icon size="12"><Clock /></el-icon>
          {{ $t('chat.currentTime') }} {{ formatTime(videoTime) }}
        </div>
      </div>
      <div class="input-row">
        <el-input
          v-model="inputMessage"
          :placeholder="$t('chat.inputPlaceholder')"
          class="chat-input"
          @keydown.enter.prevent="handleEnter"
        />
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!inputMessage.trim()"
          class="send-btn"
          @click="sendMessage"
        >
          <el-icon size="18"><Promotion /></el-icon>
        </el-button>
      </div>
      <div class="disclaimer">
        {{ $t('chat.disclaimer') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import { chatApi } from '../api'
import { getMessages, saveMessage, clearChat as clearLocalChat } from '../utils/chatStorage'

marked.use({
  breaks: true,
  gfm: true
})

const props = defineProps({
  videoId: { type: String, required: true },
  videoTitle: { type: String, default: '' },
  videoTime: { type: Number, default: null }
})

const { t, locale } = useI18n()
const messages = ref([])
const inputMessage = ref('')
const loading = ref(false)
const messagesRef = ref(null)

const quickQuestions = computed(() => [
  t('chat.quickQuestion1'),
  t('chat.quickQuestion2'),
  t('chat.quickQuestion3'),
  t('chat.quickQuestion4')
])

const loadMessages = () => {
  messages.value = getMessages(props.videoId)
}

const sendMessage = async () => {
  const content = inputMessage.value.trim()
  if (!content || loading.value) return

  inputMessage.value = ''
  loading.value = true

  // 保存用户消息到本地
  const userMessage = {
    role: 'user',
    content: content,
    timestamp: Date.now(),
    videoTime: props.videoTime
  }
  messages.value.push(userMessage)
  saveMessage(props.videoId, userMessage)
  scrollToBottom()

  try {
    // 调用后端 API 获取 AI 回复，带上本地完整历史
    const history = getMessages(props.videoId)
    const res = await chatApi.sendMessage(props.videoId, content, props.videoTime, locale.value, history)
    if (res.data.success) {
      const assistantMessage = res.data.data.message
      messages.value.push(assistantMessage)
      saveMessage(props.videoId, assistantMessage)
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || t('messages.sendFailed'))
    messages.value.pop()
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

const sendQuickQuestion = (question) => {
  inputMessage.value = question
  sendMessage()
}

const clearChat = async () => {
  try {
    await chatApi.clearChat(props.videoId)
    clearLocalChat(props.videoId)
    messages.value = []
    ElMessage.success(t('messages.chatCleared'))
  } catch (error) {
    ElMessage.error(t('messages.clearFailed'))
  }
}

const handleEnter = (e) => {
  if (!e.shiftKey) {
    sendMessage()
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatMessage = (content) => {
  try {
    return marked.parse(content, { async: false })
  } catch (e) {
    return content.replace(/\n/g, '<br>')
  }
}

watch(() => props.videoId, (newId) => {
  if (newId) {
    loadMessages()
  }
}, { immediate: true })

watch(() => messages.value.length, scrollToBottom)
</script>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.015);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(123, 92, 255, 0.08);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(123, 92, 255, 0.08);
  background: rgba(12, 18, 32, 0.5);
}

.header-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: linear-gradient(135deg, #7B5CFF 0%, #9F7AEA 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(123, 92, 255, 0.3);
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-name {
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #5fe3af;
  box-shadow: 0 0 6px rgba(95, 227, 175, 0.4);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.status-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
}

.clear-btn {
  color: rgba(255, 255, 255, 0.3);
  font-size: 16px;
  padding: 8px;
  border-radius: 10px;
  transition: all 0.2s;
}

.clear-btn:hover {
  color: #ff7373;
  background: rgba(255, 115, 115, 0.08);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
  min-height: 0;
}

.messages-container::-webkit-scrollbar {
  width: 4px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgba(123, 92, 255, 0.15);
  border-radius: 4px;
}

.welcome-message {
  text-align: center;
  padding: 40px 16px 20px;
}

.welcome-avatar {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(123, 92, 255, 0.15) 0%, rgba(159, 122, 234, 0.15) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a78bfa;
  margin: 0 auto 16px;
  box-shadow: 0 8px 24px rgba(123, 92, 255, 0.15);
}

.welcome-message h3 {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 6px;
}

.welcome-message p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 24px;
  line-height: 1.5;
}

.quick-questions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(123, 92, 255, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  text-align: left;
}

.quick-card:hover {
  background: rgba(123, 92, 255, 0.06);
  border-color: rgba(123, 92, 255, 0.15);
  color: #a78bfa;
  transform: translateX(4px);
}

.quick-card .el-icon {
  flex-shrink: 0;
  color: rgba(123, 92, 255, 0.3);
  transition: color 0.2s;
}

.quick-card:hover .el-icon {
  color: #a78bfa;
}

.message {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  animation: messageIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar-wrapper {
  flex-shrink: 0;
}

.msg-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.msg-avatar.assistant {
  background: linear-gradient(135deg, #7B5CFF 0%, #9F7AEA 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(123, 92, 255, 0.25);
}

.msg-avatar.user {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
}

.message-content {
  max-width: calc(100% - 55px);
  display: flex;
  flex-direction: column;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
}

.message.assistant .message-bubble {
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(123, 92, 255, 0.06);
  border-top-left-radius: 4px;
}

.message.user .message-bubble {
  background: linear-gradient(135deg, #7B5CFF 0%, #9F7AEA 100%);
  color: #fff;
  border-top-right-radius: 4px;
  box-shadow: 0 4px 15px rgba(123, 92, 255, 0.2);
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
  font-size: 11px;
}

.message.assistant .message-meta {
  color: rgba(255, 255, 255, 0.2);
}

.message.user .message-meta {
  justify-content: flex-end;
  color: rgba(255, 255, 255, 0.6);
}

.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3),
.message-text :deep(h4) {
  margin: 12px 0 8px;
  font-weight: 600;
  line-height: 1.4;
}

.message-text :deep(h1) { font-size: 18px; color: #fff; }
.message-text :deep(h2) { font-size: 16px; color: #fff; }
.message-text :deep(h3) { font-size: 15px; color: #fff; }
.message-text :deep(h4) { font-size: 14px; color: #fff; }

.message-text :deep(p) { margin: 6px 0; }
.message-text :deep(strong) { font-weight: 600; }
.message-text :deep(em) { font-style: italic; }

.message-text :deep(code) {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.85);
}

.message-text :deep(pre) {
  background: #0c1220;
  border-radius: 10px;
  padding: 12px 16px;
  margin: 8px 0;
  overflow-x: auto;
  border: 1px solid rgba(123, 92, 255, 0.06);
}

.message-text :deep(pre code) {
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  padding: 0;
  font-size: 12px;
  line-height: 1.6;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 6px 0;
  padding-left: 20px;
}

.message-text :deep(li) { margin: 3px 0; }

.message-text :deep(blockquote) {
  margin: 8px 0;
  padding: 8px 12px;
  border-left: 3px solid rgba(123, 92, 255, 0.3);
  background: rgba(255, 255, 255, 0.015);
  border-radius: 0 8px 8px 0;
  color: rgba(255, 255, 255, 0.5);
}

.message-text :deep(a) {
  color: #a78bfa;
  text-decoration: none;
}

.message-text :deep(a:hover) { text-decoration: underline; }

.message-text :deep(hr) {
  border: none;
  border-top: 1px solid rgba(123, 92, 255, 0.08);
  margin: 12px 0;
}

.message-text :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
  font-size: 13px;
}

.message-text :deep(th),
.message-text :deep(td) {
  border: 1px solid rgba(123, 92, 255, 0.08);
  padding: 6px 10px;
  text-align: left;
}

.message-text :deep(th) {
  background: rgba(255, 255, 255, 0.02);
  font-weight: 600;
  color: #fff;
}

.message-text :deep(td) {
  color: rgba(255, 255, 255, 0.7);
}

.message.user .message-text :deep(code) {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.message.user .message-text :deep(pre) {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.1);
}

.message.user .message-text :deep(pre code) { color: #fff; }

.message.user .message-text :deep(blockquote) {
  border-left-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.message.user .message-text :deep(a) { color: #c7d2fe; }

.message.user .message-text :deep(hr) {
  border-top-color: rgba(255, 255, 255, 0.2);
}

.message.user .message-text :deep(th),
.message.user .message-text :deep(td) {
  border-color: rgba(255, 255, 255, 0.2);
}

.message.user .message-text :deep(th) {
  background: rgba(255, 255, 255, 0.1);
}

.time-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  background: rgba(123, 92, 255, 0.1);
  border-radius: 6px;
  color: #a78bfa;
  font-weight: 500;
}

.typing-indicator {
  display: flex;
  gap: 5px;
  padding: 6px 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: rgba(123, 92, 255, 0.4);
  border-radius: 50%;
  animation: typingBounce 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.18s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.36s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-8px); }
}

.input-area {
  padding: 14px 16px;
  border-top: 1px solid rgba(123, 92, 255, 0.08);
  background: rgba(12, 18, 32, 0.5);
}

.context-hint {
  margin-bottom: 8px;
}

.context-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  background: rgba(123, 92, 255, 0.08);
  border-radius: 8px;
  font-size: 11px;
  color: #a78bfa;
  font-weight: 500;
  border: 1px solid rgba(123, 92, 255, 0.1);
}

.input-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.chat-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.03);
  box-shadow: 0 0 0 1px rgba(123, 92, 255, 0.1) inset;
  border-radius: 14px;
  padding: 0 16px;
  transition: all 0.3s;
}

.chat-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(123, 92, 255, 0.2) inset;
}

.chat-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px rgba(123, 92, 255, 0.4) inset, 0 0 0 3px rgba(123, 92, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}

.chat-input :deep(.el-input__inner) {
  height: 44px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
}

.chat-input :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.25);
}

.send-btn {
  height: 44px;
  width: 44px;
  padding: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #7B5CFF 0%, #9F7AEA 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(123, 92, 255, 0.3);
  transition: all 0.3s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(123, 92, 255, 0.4);
}

.send-btn:disabled {
  background: rgba(255, 255, 255, 0.04);
  box-shadow: none;
}

.disclaimer {
  margin-top: 10px;
  text-align: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.2);
  line-height: 1.5;
}

@media (max-width: 768px) {
  .chat-header {
    padding: 12px 14px;
  }

  .header-avatar {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .header-name {
    font-size: 14px;
  }

  .messages-container {
    padding: 14px;
  }

  .message {
    gap: 8px;
    margin-bottom: 16px;
  }

  .msg-avatar {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    font-size: 12px;
  }

  .message-content {
    max-width: calc(100% - 46px);
  }

  .message-bubble {
    padding: 10px 12px;
    font-size: 13px;
  }

  .welcome-message {
    padding: 24px 12px 16px;
  }

  .welcome-avatar {
    width: 52px;
    height: 52px;
    border-radius: 16px;
  }

  .quick-card {
    padding: 10px 12px;
    font-size: 12px;
  }

  .input-area {
    padding: 10px 12px;
  }

  .send-btn {
    height: 40px;
    width: 40px;
    border-radius: 12px;
  }

  .chat-input :deep(.el-input__wrapper) {
    border-radius: 12px;
    padding: 0 12px;
  }

  .chat-input :deep(.el-input__inner) {
    height: 40px;
    font-size: 13px;
  }
}
</style>