<template>
  <div class="knowledge-page">
    <div class="knowledge-container">
      <div class="knowledge-header">
        <div class="header-left">
          <div class="header-icon">
            <el-icon><Collection /></el-icon>
          </div>
          <div class="header-text">
            <h2>{{ $t('knowledge.title') }}</h2>
            <p>{{ $t('knowledge.subtitle') }}</p>
          </div>
        </div>
        <div class="header-right">
          <el-button type="primary" size="large" class="upload-btn" @click="showUpload = true">
            <el-icon><Upload /></el-icon>
            {{ $t('knowledge.upload') }}
          </el-button>
        </div>
      </div>

      <!-- PC 端表格 -->
      <div class="table-wrapper desktop-only">
        <el-table
          :data="documents"
          v-loading="loading"
          class="custom-table"
          :header-cell-style="{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid rgba(123,92,255,0.08)' }"
        >
          <el-table-column type="index" width="60" align="center">
            <template #header>#</template>
          </el-table-column>
          <el-table-column :label="$t('knowledge.documentName')" min-width="200">
            <template #default="{ row }">
              <div class="doc-info-cell">
                <div class="doc-icon">
                  <el-icon size="20"><Document /></el-icon>
                </div>
                <div class="doc-text">
                  <span class="doc-name">{{ row.title }}</span>
                  <span class="doc-filename">{{ row.originalName }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('knowledge.fileSize')" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" effect="plain" class="size-tag">
                {{ formatSize(row.size) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('knowledge.chunkCount')" width="100" align="center">
            <template #default="{ row }">
              <span class="chunk-count">{{ row.chunkCount || 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('knowledge.status')" width="120" align="center">
            <template #default="{ row }">
              <el-tag
                v-if="row.status === 'completed'"
                size="small"
                type="success"
                effect="light"
                class="status-tag"
              >
                <el-icon><CircleCheck /></el-icon>
                {{ $t('knowledge.statusCompleted') }}
              </el-tag>
              <el-tag
                v-else-if="row.status === 'parsing' || row.status === 'pending'"
                size="small"
                type="warning"
                effect="light"
                class="status-tag"
              >
                <el-icon class="is-loading"><Loading /></el-icon>
                {{ row.status === 'parsing' ? $t('knowledge.statusParsing') : $t('knowledge.statusPending') }}
              </el-tag>
              <el-tag
                v-else
                size="small"
                type="danger"
                effect="light"
                class="status-tag"
              >
                <el-icon><CircleClose /></el-icon>
                {{ $t('knowledge.statusFailed') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('knowledge.action')" width="180" fixed="right" align="center">
            <template #default="{ row }">
              <div class="action-links">
                <span class="action-link" @click="viewChunks(row)">{{ $t('knowledge.view') }}</span>
                <span
                  v-if="row.status === 'failed'"
                  class="action-link"
                  @click="handleReparse(row)"
                >{{ $t('knowledge.reparse') }}</span>
                <span class="action-link delete-link" @click="handleDelete(row)">{{ $t('knowledge.delete') }}</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 移动端卡片列表 -->
      <div v-if="!loading" class="mobile-cards mobile-only">
        <div
          v-for="(row, index) in documents"
          :key="row.id"
          class="doc-card-item"
          :style="{ animationDelay: `${index * 0.06}s` }"
        >
          <div class="card-top">
            <div class="card-icon">
              <el-icon size="20"><Document /></el-icon>
            </div>
            <div class="card-info">
              <h3 class="card-title">{{ row.title }}</h3>
              <p class="card-filename">{{ row.originalName }}</p>
            </div>
          </div>
          <div class="card-tags">
            <el-tag size="small" effect="plain" class="size-tag">
              {{ formatSize(row.size) }}
            </el-tag>
            <span class="chunk-count">{{ row.chunkCount || 0 }} {{ $t('knowledge.chunkCount') }}</span>
            <el-tag
              v-if="row.status === 'completed'"
              size="small"
              type="success"
              effect="light"
              class="status-tag"
            >
              <el-icon><CircleCheck /></el-icon>
              {{ $t('knowledge.statusCompleted') }}
            </el-tag>
            <el-tag
              v-else-if="row.status === 'parsing' || row.status === 'pending'"
              size="small"
              type="warning"
              effect="light"
              class="status-tag"
            >
              <el-icon class="is-loading"><Loading /></el-icon>
              {{ row.status === 'parsing' ? $t('knowledge.statusParsing') : $t('knowledge.statusPending') }}
            </el-tag>
            <el-tag
              v-else
              size="small"
              type="danger"
              effect="light"
              class="status-tag"
            >
              <el-icon><CircleClose /></el-icon>
              {{ $t('knowledge.statusFailed') }}
            </el-tag>
          </div>
          <div class="card-actions">
            <el-button class="card-action-btn view" @click="viewChunks(row)">
              <el-icon><View /></el-icon>
              {{ $t('knowledge.view') }}
            </el-button>
            <el-button
              v-if="row.status === 'failed'"
              class="card-action-btn reparse"
              @click="handleReparse(row)"
            >
              <el-icon><Refresh /></el-icon>
              {{ $t('knowledge.reparse') }}
            </el-button>
            <el-button class="card-action-btn delete" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              {{ $t('knowledge.delete') }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && documents.length === 0" class="empty-state">
        <div class="empty-icon">
          <el-icon size="80" color="rgba(123,92,255,0.2)"><Document /></el-icon>
        </div>
        <h3>{{ $t('knowledge.noDocuments') }}</h3>
        <p>{{ $t('knowledge.uploadHint') }}</p>
      </div>
    </div>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="showUpload"
      :title="$t('knowledge.uploadDialogTitle')"
      width="600px"
      :close-on-click-modal="false"
      :append-to-body="true"
      align-center
      class="upload-dialog"
      destroy-on-close
    >
      <div class="upload-form-wrapper">
        <el-form :model="uploadForm" label-width="90px" class="upload-form">
          <el-form-item :label="$t('knowledge.documentTitle')" required>
            <el-input
              v-model="uploadForm.title"
              :placeholder="$t('knowledge.documentTitlePlaceholder')"
              size="large"
              :prefix-icon="Document"
            />
          </el-form-item>
          <el-form-item :label="$t('knowledge.documentFile')" required>
            <div class="upload-area">
              <el-upload
                ref="uploadRef"
                action="#"
                :auto-upload="false"
                :on-change="handleFileChange"
                :limit="1"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                class="custom-upload"
              >
                <div class="upload-trigger">
                  <el-icon size="32"><UploadFilled /></el-icon>
                  <span class="upload-trigger-title">{{ $t('knowledge.uploadTriggerTitle') }}</span>
                  <span class="upload-trigger-desc">{{ $t('knowledge.uploadTriggerDesc') }}</span>
                </div>
              </el-upload>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showUpload = false" size="large">{{ $t('knowledge.cancel') }}</el-button>
        <el-button type="primary" size="large" :loading="uploading" @click="handleUpload" class="confirm-btn">
          {{ $t('knowledge.startUpload') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看分块对话框 -->
    <el-dialog
      v-model="showChunks"
      :title="currentDoc?.title"
      width="700px"
      :close-on-click-modal="false"
      :append-to-body="true"
      align-center
      class="chunks-dialog"
      destroy-on-close
    >
      <div v-loading="chunksLoading" class="chunks-wrapper">
        <div v-if="chunks.length === 0" class="chunks-empty">
          {{ $t('knowledge.noChunks') }}
        </div>
        <div
          v-for="(chunk, idx) in chunks"
          :key="idx"
          class="chunk-item"
        >
          <div class="chunk-header">
            <span class="chunk-index">#{{ chunk.chunkIndex + 1 }}</span>
            <span class="chunk-count">{{ chunk.wordCount }} {{ $t('knowledge.chars') }}</span>
          </div>
          <div class="chunk-content">{{ chunk.content }}</div>
          <div v-if="chunk.keywords && chunk.keywords.length > 0" class="chunk-keywords">
            <el-tag
              v-for="kw in chunk.keywords.slice(0, 8)"
              :key="kw"
              size="small"
              effect="plain"
              class="keyword-tag"
            >
              {{ kw }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  Collection, Upload, Document, UploadFilled,
  CircleCheck, CircleClose, Loading, Delete,
  View, Refresh
} from '@element-plus/icons-vue'
import { knowledgeApi } from '../api'

const router = useRouter()
const { t } = useI18n()

const documents = ref([])
const loading = ref(false)
const showUpload = ref(false)
const uploading = ref(false)
const uploadRef = ref(null)
const uploadForm = ref({
  title: '',
  file: null
})

// 查看分块
const showChunks = ref(false)
const chunksLoading = ref(false)
const chunks = ref([])
const currentDoc = ref(null)

const loadDocuments = async () => {
  try {
    loading.value = true
    const res = await knowledgeApi.getList()
    if (res.data.success) {
      documents.value = res.data.data
    }
  } catch (error) {
    ElMessage.error(t('knowledge.getListFailed'))
  } finally {
    loading.value = false
  }
}

const handleFileChange = (file) => {
  uploadForm.value.file = file.raw
  if (!uploadForm.value.title) {
    uploadForm.value.title = file.name.replace(/\.[^/.]+$/, '')
  }
}

const handleUpload = async () => {
  if (!uploadForm.value.title.trim()) {
    ElMessage.warning(t('knowledge.inputTitleRequired'))
    return
  }
  if (!uploadForm.value.file) {
    ElMessage.warning(t('knowledge.selectFileRequired'))
    return
  }

  const formData = new FormData()
  formData.append('file', uploadForm.value.file)
  formData.append('title', uploadForm.value.title)

  try {
    uploading.value = true
    const res = await knowledgeApi.upload(formData)

    if (res.data.success) {
      ElMessage.success(t('knowledge.uploadSuccess'))
      showUpload.value = false
      uploadForm.value = { title: '', file: null }
      uploadRef.value?.clearFiles()
      loadDocuments()
      // 轮询状态
      pollParseStatus()
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || t('knowledge.uploadFailed'))
  } finally {
    uploading.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      t('knowledge.deleteConfirm', { name: row.title }),
      t('knowledge.deleteConfirmTitle'),
      {
        type: 'warning',
        confirmButtonClass: 'delete-confirm-btn'
      }
    )
    const res = await knowledgeApi.delete(row.id)
    if (res.data.success) {
      ElMessage.success(t('knowledge.deleteSuccess'))
      loadDocuments()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('knowledge.deleteFailed'))
    }
  }
}

const handleReparse = async (row) => {
  try {
    const res = await knowledgeApi.reparse(row.id)
    if (res.data.success) {
      ElMessage.success(t('knowledge.reparseSuccess'))
      pollParseStatus()
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || t('knowledge.reparseFailed'))
  }
}

const viewChunks = async (row) => {
  currentDoc.value = row
  showChunks.value = true
  chunks.value = []
  try {
    chunksLoading.value = true
    const res = await knowledgeApi.getChunks(row.id)
    if (res.data.success) {
      chunks.value = res.data.data
    }
  } catch (error) {
    ElMessage.error(t('knowledge.getChunksFailed'))
  } finally {
    chunksLoading.value = false
  }
}

// 轮询解析状态
let pollTimer = null
const pollParseStatus = () => {
  if (pollTimer) return
  pollTimer = setInterval(async () => {
    try {
      const res = await knowledgeApi.getList()
      if (res.data.success) {
        const newDocs = res.data.data
        documents.value = newDocs
        // 如果全部完成或失败，停止轮询
        const hasPending = newDocs.some(d => d.status === 'pending' || d.status === 'parsing')
        if (!hasPending) {
          clearInterval(pollTimer)
          pollTimer = null
        }
      }
    } catch (error) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }, 3000)
  // 60秒后自动停止
  setTimeout(() => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }, 60000)
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

onMounted(() => {
  loadDocuments()
  pollParseStatus()
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
  }
})
</script>

<style scoped>
.knowledge-page {
  min-height: 100vh;
  padding: 24px;
}

.knowledge-container {
  max-width: 1200px;
  margin: 0 auto;
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.015);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(123, 92, 255, 0.08);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #7B5CFF 0%, #9F7AEA 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  box-shadow: 0 4px 15px rgba(123, 92, 255, 0.3);
}

.header-text h2 {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  line-height: 1.2;
}

.header-text p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 4px;
}

.upload-btn {
  background: linear-gradient(135deg, #7B5CFF 0%, #9F7AEA 100%);
  border: none;
  padding: 12px 28px;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 15px rgba(123, 92, 255, 0.3);
  transition: all 0.3s;
}

.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(123, 92, 255, 0.4);
}

.table-wrapper {
  background: rgba(255, 255, 255, 0.015);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(123, 92, 255, 0.08);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  padding: 20px;
}

.custom-table {
  border-radius: 16px;
  overflow: hidden;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(123, 92, 255, 0.05);
}

.custom-table :deep(.el-table__row) {
  transition: background 0.2s;
  color: rgba(255, 255, 255, 0.85);
}

.custom-table :deep(.el-table__cell) {
  border-bottom: 1px solid rgba(123, 92, 255, 0.06);
}

.doc-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.doc-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(123, 92, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a78bfa;
  flex-shrink: 0;
}

.doc-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.doc-name {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-filename {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.size-tag {
  border-radius: 8px;
  font-weight: 500;
  color: #a78bfa;
  border-color: rgba(123, 92, 255, 0.2);
  background: rgba(123, 92, 255, 0.05);
}

.chunk-count {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
  font-weight: 500;
}

.action-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-wrap: wrap;
}

.action-link {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.action-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.action-link.delete-link {
  color: #ff7373;
}

.action-link.delete-link:hover {
  color: #ff9e9e;
  background: rgba(255, 115, 115, 0.1);
}

:deep(.delete-confirm-btn) {
  background: #ff7373 !important;
  border-color: #ff7373 !important;
}

/* 上传对话框 */
.upload-dialog :deep(.el-dialog) {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  overflow: hidden;
}

.upload-dialog :deep(.el-dialog__header) {
  padding: 24px 24px 0;
  margin-bottom: 0;
  flex-shrink: 0;
}

.upload-dialog :deep(.el-dialog__body) {
  max-height: calc(90vh - 140px);
  overflow-y: auto;
  padding: 20px 24px;
}

.upload-dialog :deep(.el-dialog__footer) {
  flex-shrink: 0;
  padding: 16px 24px;
  border-top: 1px solid rgba(123, 92, 255, 0.08);
}

.upload-area {
  width: 100%;
}

.custom-upload :deep(.el-upload) {
  width: 100%;
}

.upload-trigger {
  width: 100%;
  padding: 40px 24px;
  border: 2px dashed rgba(123, 92, 255, 0.15);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.015);
}

.upload-trigger:hover {
  border-color: #7B5CFF;
  background: rgba(123, 92, 255, 0.03);
  color: #a78bfa;
}

.upload-trigger-title {
  font-size: 15px;
  font-weight: 500;
}

.upload-trigger-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.2);
}

.confirm-btn {
  background: linear-gradient(135deg, #7B5CFF 0%, #9F7AEA 100%);
  border: none;
  border-radius: 10px;
}

/* 分块对话框 */
.chunks-dialog :deep(.el-dialog) {
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  overflow: hidden;
}

.chunks-dialog :deep(.el-dialog__header) {
  padding: 24px 24px 0;
  margin-bottom: 0;
  flex-shrink: 0;
}

.chunks-dialog :deep(.el-dialog__body) {
  max-height: calc(85vh - 100px);
  overflow-y: auto;
  padding: 20px 24px;
}

.chunks-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chunks-empty {
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
}

.chunk-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(123, 92, 255, 0.06);
  border-radius: 12px;
  padding: 16px;
}

.chunk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.chunk-index {
  font-size: 13px;
  font-weight: 600;
  color: #a78bfa;
  background: rgba(123, 92, 255, 0.1);
  padding: 2px 10px;
  border-radius: 6px;
}

.chunk-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
}

.chunk-content {
  font-size: 13px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.7);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}

.chunk-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(123, 92, 255, 0.06);
}

.keyword-tag {
  border-radius: 6px;
  font-size: 11px;
  color: #a78bfa;
  border-color: rgba(123, 92, 255, 0.2);
  background: rgba(123, 92, 255, 0.05);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.015);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(123, 92, 255, 0.08);
}

.empty-state h3 {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 16px 0 6px;
}

.empty-state p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
}

/* 移动端卡片 */
.mobile-cards {
  display: none;
  flex-direction: column;
  gap: 12px;
}

.doc-card-item {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(123, 92, 255, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  animation: cardSlideIn 0.4s ease forwards;
  opacity: 0;
}

@keyframes cardSlideIn {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}

.card-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(123, 92, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a78bfa;
  flex-shrink: 0;
}

.card-info {
  min-width: 0;
  flex: 1;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-filename {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.card-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.card-action-btn.view {
  background: rgba(123, 92, 255, 0.1);
  color: #a78bfa;
}

.card-action-btn.reparse {
  background: rgba(95, 227, 175, 0.1);
  color: #5fe3af;
}

.card-action-btn.delete {
  background: rgba(255, 115, 115, 0.1);
  color: #ff7373;
}

@media (max-width: 768px) {
  .knowledge-page {
    padding: 16px;
  }

  .knowledge-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px 20px;
  }

  .header-right {
    width: 100%;
  }

  .upload-btn {
    width: 100%;
    justify-content: center;
  }

  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: flex;
  }

  .upload-dialog :deep(.el-dialog) {
    width: 92vw !important;
    max-width: 600px;
  }

  .chunks-dialog :deep(.el-dialog) {
    width: 92vw !important;
  }
}

@media (min-width: 769px) {
  .mobile-only {
    display: none !important;
  }
}
</style>