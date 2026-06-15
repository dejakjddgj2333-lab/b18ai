<template>
  <div class="admin">
    <div class="admin-header">
      <div class="header-left">
        <div class="header-icon">
          <el-icon><Setting /></el-icon>
        </div>
        <div class="header-text">
          <h2>{{ $t('admin.title') }}</h2>
          <p>{{ $t('admin.subtitle') }}</p>
        </div>
      </div>
      <div class="header-right">
        <el-button size="large" class="category-manage-btn" @click="openCategoryManage">
          <el-icon><Folder /></el-icon>
          {{ $t('admin.categoryManage') }}
        </el-button>
        <el-button type="primary" size="large" class="upload-btn" @click="showUpload = true">
          <el-icon><Upload /></el-icon>
          {{ $t('admin.upload') }}
        </el-button>
      </div>
    </div>

    <!-- PC 端表格 -->
    <div class="table-wrapper desktop-only">
      <el-table
        :data="videos"
        v-loading="loading"
        class="custom-table"
        :header-cell-style="{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid rgba(123,92,255,0.08)' }"
      >
        <el-table-column type="index" width="60" align="center">
          <template #header>#</template>
        </el-table-column>
        <el-table-column :label="$t('admin.videoInfo')" min-width="200">
          <template #default="{ row }">
            <div class="video-info-cell">
              <img
                v-if="row.thumbnail"
                :src="`${row.thumbnail}`"
                class="video-thumb-img"
                alt="cover"
              />
              <div v-else class="video-thumb-mini">
                <el-icon><VideoPlay /></el-icon>
              </div>
              <div class="video-text">
                <span class="video-name">{{ row.title }}</span>
                <span class="video-desc-small">{{ row.description || $t('admin.noDesc') }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.category')" width="160" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.categoryName"
              size="small"
              effect="plain"
              class="category-tag-display"
            >
              {{ row.categoryName }}
            </el-tag>
            <span v-else class="no-category-text">{{ $t('admin.noCategory') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.fileSize')" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" class="size-tag">
              {{ formatSize(row.size) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.aiAnalysis')" width="120" align="center">
          <template #default="{ row }">
            <div class="analysis-status">
              <el-tag
                v-if="row.aiAnalysis?.status === 'completed'"
                size="small"
                type="success"
                effect="light"
                class="analysis-tag"
              >
                <el-icon><CircleCheck /></el-icon>
                {{ $t('admin.statusCompleted') }}
              </el-tag>
              <el-tag
                v-else-if="row.aiAnalysis?.status === 'analyzing'"
                size="small"
                type="warning"
                effect="light"
                class="analysis-tag"
              >
                <el-icon class="is-loading"><Loading /></el-icon>
                {{ $t('admin.statusAnalyzing') }}
              </el-tag>
              <el-tag
                v-else-if="row.aiAnalysis?.status === 'failed'"
                size="small"
                type="danger"
                effect="light"
                class="analysis-tag"
              >
                <el-icon><CircleClose /></el-icon>
                {{ $t('admin.statusFailed') }}
              </el-tag>
              <el-tag
                v-else
                size="small"
                type="info"
                effect="light"
                class="analysis-tag"
              >
                <el-icon><Clock /></el-icon>
                {{ $t('admin.statusPending') }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('admin.action')" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-links">
              <span class="action-link play-link" @click="goToPlay(row.id)">{{ $t('admin.play') }}</span>
              <span class="action-link" @click="openVideoEdit(row)">{{ $t('admin.edit') }}</span>
              <span
                v-if="row.aiAnalysis?.status === 'completed'"
                class="action-link generate-link"
                @click="handleGenerateMetadata(row)"
              >{{ $t('admin.generate') }}</span>
              <span
                class="action-link"
                :class="{ disabled: row.aiAnalysis?.status === 'analyzing' }"
                @click="row.aiAnalysis?.status !== 'analyzing' && handleAnalyze(row)"
              >{{ $t('admin.analyze') }}</span>
              <span class="action-link delete-link" @click="handleDelete(row)">{{ $t('admin.delete') }}</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 移动端卡片列表 -->
    <div v-if="!loading" class="mobile-cards mobile-only">
      <div
        v-for="(row, index) in videos"
        :key="row.id"
        class="video-card-item"
        :style="{ animationDelay: `${index * 0.06}s` }"
      >
        <div class="card-top">
          <img
            v-if="row.thumbnail"
            :src="`${row.thumbnail}`"
            class="card-thumb-img"
            alt="cover"
          />
          <div v-else class="card-thumb">
            <el-icon size="24"><VideoPlay /></el-icon>
          </div>
          <div class="card-info">
            <h3 class="card-title">{{ row.title }}</h3>
            <p class="card-desc">{{ row.description || $t('admin.noDesc') }}</p>
          </div>
        </div>
        <div class="card-tags">
          <el-tag
            v-if="row.categoryName"
            size="small"
            effect="plain"
            class="category-tag-display"
          >
            {{ row.categoryName }}
          </el-tag>
          <el-tag size="small" effect="plain" class="size-tag">
            {{ formatSize(row.size) }}
          </el-tag>
          <el-tag
            v-if="row.aiAnalysis?.status === 'completed'"
            size="small"
            type="success"
            effect="light"
            class="analysis-tag"
          >
            <el-icon><CircleCheck /></el-icon>
            {{ $t('admin.statusCompleted') }}
          </el-tag>
          <el-tag
            v-else-if="row.aiAnalysis?.status === 'analyzing'"
            size="small"
            type="warning"
            effect="light"
            class="analysis-tag"
          >
            <el-icon class="is-loading"><Loading /></el-icon>
            {{ $t('admin.statusAnalyzing') }}
          </el-tag>
          <el-tag
            v-else-if="row.aiAnalysis?.status === 'failed'"
            size="small"
            type="danger"
            effect="light"
            class="analysis-tag"
          >
            <el-icon><CircleClose /></el-icon>
            {{ $t('admin.statusFailed') }}
          </el-tag>
          <el-tag
            v-else
            size="small"
            type="info"
            effect="light"
            class="analysis-tag"
          >
            <el-icon><Clock /></el-icon>
            {{ $t('admin.statusPending') }}
          </el-tag>
        </div>
        <div class="card-actions">
          <el-button class="card-action-btn play" @click="goToPlay(row.id)">
            <el-icon><VideoPlay /></el-icon>
            {{ $t('admin.play') }}
          </el-button>
          <el-button class="card-action-btn edit" @click="openVideoEdit(row)">
            <el-icon><EditPen /></el-icon>
            {{ $t('admin.edit') }}
          </el-button>
          <el-button
            v-if="row.aiAnalysis?.status === 'completed'"
            class="card-action-btn generate"
            @click="handleGenerateMetadata(row)"
          >
            <el-icon><MagicStick /></el-icon>
            {{ $t('admin.generate') }}
          </el-button>
          <el-button
            class="card-action-btn analyze"
            :disabled="row.aiAnalysis?.status === 'analyzing'"
            @click="handleAnalyze(row)"
          >
            <el-icon><Aim /></el-icon>
            {{ $t('admin.analyze') }}
          </el-button>
          <el-button class="card-action-btn delete" @click="handleDelete(row)">
            <el-icon><Delete /></el-icon>
            {{ $t('admin.delete') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="showUpload"
      :title="$t('admin.uploadDialogTitle')"
      width="600px"
      :close-on-click-modal="false"
      :append-to-body="true"
      align-center
      class="upload-dialog"
      destroy-on-close
    >
      <div class="upload-form-wrapper">
        <el-form :model="uploadForm" label-width="90px" class="upload-form">
          <el-form-item :label="$t('admin.videoTitle')" required>
            <el-input
              v-model="uploadForm.title"
              :placeholder="$t('admin.videoTitlePlaceholder')"
              size="large"
              :prefix-icon="Document"
            />
          </el-form-item>
          <el-form-item :label="$t('admin.videoDesc')">
            <el-input
              v-model="uploadForm.description"
              type="textarea"
              :rows="3"
              :placeholder="$t('admin.videoDescPlaceholder')"
            />
          </el-form-item>
          <el-form-item :label="$t('admin.category')">
            <el-select
              v-model="uploadForm.categoryId"
              :placeholder="$t('admin.selectCategory')"
              size="large"
              style="width: 100%"
              clearable
            >
              <el-option
                v-for="cat in categories"
                :key="cat.id"
                :label="cat.name"
                :value="cat.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('admin.videoFile')" required>
            <div class="upload-area">
              <el-upload
                ref="uploadRef"
                action="#"
                :auto-upload="false"
                :on-change="handleFileChange"
                :limit="1"
                accept="video/*"
                class="custom-upload"
              >
                <div class="upload-trigger">
                  <el-icon size="32"><UploadFilled /></el-icon>
                  <span class="upload-trigger-title">{{ $t('admin.uploadTriggerTitle') }}</span>
                  <span class="upload-trigger-desc">{{ $t('admin.uploadTriggerDesc') }}</span>
                </div>
              </el-upload>
            </div>
          </el-form-item>
        </el-form>

        <div v-if="uploadProgress > 0" class="upload-progress-wrapper">
          <div class="progress-header">
            <span>{{ $t('admin.uploading') }}</span>
            <span class="progress-percent">{{ uploadProgress }}%</span>
          </div>
          <el-progress
            :percentage="uploadProgress"
            :stroke-width="8"
            :show-text="false"
            class="custom-progress"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="showUpload = false" size="large">{{ $t('admin.cancel') }}</el-button>
        <el-button type="primary" size="large" :loading="uploading" @click="handleUpload" class="confirm-btn">
          {{ $t('admin.startUpload') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 分类管理对话框 -->
    <el-dialog
      v-model="showCategoryManage"
      :title="$t('admin.categoryManage')"
      width="700px"
      :close-on-click-modal="false"
      :append-to-body="true"
      align-center
      class="category-dialog"
      destroy-on-close
    >
      <div class="category-manage-wrapper">
        <div class="category-toolbar">
          <el-button type="primary" size="default" @click="openCategoryForm()">
            <el-icon><Plus /></el-icon>
            {{ $t('admin.addCategory') }}
          </el-button>
        </div>
        <el-table
          :data="categories"
          v-loading="categoryLoading"
          class="category-table"
          :header-cell-style="{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid rgba(123,92,255,0.08)' }"
        >
          <el-table-column type="index" width="50" align="center">
            <template #header>#</template>
          </el-table-column>
          <el-table-column :label="$t('admin.categoryName')" min-width="140">
            <template #default="{ row }">
              <span class="category-table-name">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('admin.categoryDesc')" min-width="160">
            <template #default="{ row }">
              <span class="category-table-desc">{{ row.description || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('admin.categorySort')" width="80" align="center">
            <template #default="{ row }">
              <span class="category-table-sort">{{ row.sortOrder }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('admin.action')" width="140" align="center">
            <template #default="{ row }">
              <div class="category-action-btns">
                <el-button size="small" text @click="openCategoryForm(row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button size="small" type="danger" text @click="handleDeleteCategory(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 分类表单对话框 -->
    <el-dialog
      v-model="showCategoryForm"
      :title="categoryForm.id ? $t('admin.editCategory') : $t('admin.addCategory')"
      width="480px"
      :close-on-click-modal="false"
      :append-to-body="true"
      align-center
      class="category-form-dialog"
      destroy-on-close
    >
      <div class="category-form-wrapper">
        <!-- 语言切换 -->
        <div class="locale-tabs">
          <div
            v-for="lang in availableLocales"
            :key="lang.code"
            class="locale-tab"
            :class="{ active: categoryEditLocale === lang.code, filled: categoryLocalizedNames[lang.code] }"
            @click="onCategoryEditLocaleChange(lang.code)"
          >
            {{ lang.name }}
          </div>
        </div>
        <el-form :model="categoryForm" label-width="100px" class="category-form">
          <el-form-item :label="$t('admin.categoryName')" required>
            <el-input
              v-model="categoryForm.name"
              :placeholder="$t('admin.categoryName')"
              size="large"
            />
          </el-form-item>
          <el-form-item :label="$t('admin.categoryDesc')">
            <el-input
              v-model="categoryForm.description"
              type="textarea"
              :rows="3"
              :placeholder="$t('admin.categoryDesc')"
            />
          </el-form-item>
          <el-form-item :label="$t('admin.categorySort')">
            <el-input-number
              v-model="categoryForm.sortOrder"
              :min="0"
              :max="999"
              size="large"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showCategoryForm = false" size="large">{{ $t('admin.cancel') }}</el-button>
        <el-button
          v-if="categoryForm.id"
          size="large"
          :loading="categoryTranslating"
          :disabled="!categoryForm.name.trim()"
          class="translate-btn"
          @click="handleAutoTranslateCategory"
        >
          <el-icon><MagicStick /></el-icon>
          {{ $t('admin.autoTranslate') }}
        </el-button>
        <el-button type="primary" size="large" :loading="categoryFormLoading" @click="handleSaveCategory" class="confirm-btn">
          {{ categoryForm.id ? $t('admin.editCategory') : $t('admin.addCategory') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 视频编辑对话框 -->
    <el-dialog
      v-model="showVideoEdit"
      :title="$t('admin.editVideo')"
      width="560px"
      :close-on-click-modal="false"
      :append-to-body="true"
      align-center
      class="video-edit-dialog"
      destroy-on-close
    >
      <div class="video-edit-form-wrapper">
        <!-- 语言切换 -->
        <div class="locale-tabs">
          <div
            v-for="lang in availableLocales"
            :key="lang.code"
            class="locale-tab"
            :class="{ active: editLocale === lang.code, filled: localizedTitles[lang.code] }"
            @click="onEditLocaleChange(lang.code)"
          >
            {{ lang.name }}
          </div>
        </div>
        <el-form :model="videoEditForm" label-width="90px" class="video-edit-form">
          <el-form-item :label="$t('admin.videoTitle')" required>
            <el-input
              v-model="videoEditForm.title"
              :placeholder="$t('admin.videoTitlePlaceholder')"
              size="large"
            />
          </el-form-item>
          <el-form-item :label="$t('admin.videoDesc')">
            <el-input
              v-model="videoEditForm.description"
              type="textarea"
              :rows="3"
              :placeholder="$t('admin.videoDescPlaceholder')"
            />
          </el-form-item>
          <el-form-item :label="$t('admin.category')">
            <el-select
              v-model="videoEditForm.categoryId"
              :placeholder="$t('admin.selectCategory')"
              size="large"
              style="width: 100%"
              clearable
            >
              <el-option
                v-for="cat in categories"
                :key="cat.id"
                :label="cat.name"
                :value="cat.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showVideoEdit = false" size="large">{{ $t('admin.cancel') }}</el-button>
        <el-button
          size="large"
          :loading="translating"
          :disabled="!videoEditForm.title.trim()"
          class="translate-btn"
          @click="handleAutoTranslate"
        >
          <el-icon><MagicStick /></el-icon>
          {{ $t('admin.autoTranslate') }}
        </el-button>
        <el-button type="primary" size="large" :loading="videoEditLoading" @click="handleSaveVideoEdit" class="confirm-btn">
          {{ $t('admin.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  Document, UploadFilled, CircleCheck, CircleClose, Aim,
  Folder, Plus, Edit, Delete, Setting, Upload, VideoPlay, Loading, Clock, EditPen, MagicStick
} from '@element-plus/icons-vue'
import { videoApi, categoryApi } from '../api'
import { messages } from '../i18n'

const router = useRouter()
const { t, locale } = useI18n()
const videos = ref([])
const categories = ref([])
const loading = ref(false)
const showUpload = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadRef = ref(null)
const uploadForm = ref({
  title: '',
  description: '',
  categoryId: '',
  file: null
})

// 视频编辑
const showVideoEdit = ref(false)
const videoEditLoading = ref(false)
const translating = ref(false)
const videoEditForm = ref({
  id: '',
  title: '',
  description: '',
  categoryId: ''
})
const editLocale = ref('zh-CN')
const localizedTitles = ref({})
const localizedDescriptions = ref({})

// 前端编辑界面只显示3种语言
const availableLocales = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'en', name: 'English' }
]

// 所有支持翻译的目标语言（从 i18n locales 目录动态读取）
const allLocales = computed(() => {
  return Object.keys(messages)
})

// 切换编辑语言时，同步当前编辑内容到对应语言
const onEditLocaleChange = (newLocale) => {
  // 保存当前语言的内容
  localizedTitles.value[editLocale.value] = videoEditForm.value.title
  localizedDescriptions.value[editLocale.value] = videoEditForm.value.description
  // 切换到新语言的内容
  videoEditForm.value.title = localizedTitles.value[newLocale] || ''
  videoEditForm.value.description = localizedDescriptions.value[newLocale] || ''
  editLocale.value = newLocale
}

// 分类管理
const showCategoryManage = ref(false)
const categoryLoading = ref(false)
const showCategoryForm = ref(false)
const categoryFormLoading = ref(false)
const categoryTranslating = ref(false)
const categoryForm = ref({
  id: '',
  name: '',
  description: '',
  sortOrder: 0
})
const categoryEditLocale = ref('zh-CN')
const categoryLocalizedNames = ref({})

// 切换分类编辑语言
const onCategoryEditLocaleChange = (newLocale) => {
  categoryLocalizedNames.value[categoryEditLocale.value] = categoryForm.value.name
  categoryForm.value.name = categoryLocalizedNames.value[newLocale] || ''
  categoryEditLocale.value = newLocale
}

const loadCategories = async () => {
  try {
    categoryLoading.value = true
    const res = await categoryApi.getList(locale.value)
    if (res.data.success) {
      categories.value = res.data.data
    }
  } catch (error) {
    ElMessage.error(t('messages.getCategoriesFailed'))
  } finally {
    categoryLoading.value = false
  }
}

const loadVideos = async () => {
  try {
    loading.value = true
    const res = await videoApi.getList(null, null, 8, locale.value)
    if (res.data.success) {
      videos.value = res.data.data
    }
  } catch (error) {
    ElMessage.error(t('messages.getListFailed'))
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
    ElMessage.warning(t('messages.inputTitleRequired'))
    return
  }
  if (!uploadForm.value.file) {
    ElMessage.warning(t('messages.selectFileRequired'))
    return
  }

  const formData = new FormData()
  formData.append('video', uploadForm.value.file)
  formData.append('title', uploadForm.value.title)
  formData.append('description', uploadForm.value.description)
  if (uploadForm.value.categoryId) {
    formData.append('categoryId', uploadForm.value.categoryId)
  }

  try {
    uploading.value = true
    const res = await videoApi.upload(formData, (progress) => {
      uploadProgress.value = Math.round((progress.loaded / progress.total) * 100)
    })

    if (res.data.success) {
      ElMessage.success(t('messages.uploadSuccess'))
      showUpload.value = false
      uploadForm.value = { title: '', description: '', categoryId: '', file: null }
      uploadProgress.value = 0
      uploadRef.value?.clearFiles()
      loadVideos()
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || t('messages.uploadFailed'))
  } finally {
    uploading.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      t('messages.deleteConfirm', { name: row.title }),
      t('messages.deleteConfirmTitle'),
      {
        type: 'warning',
        confirmButtonClass: 'delete-confirm-btn'
      }
    )
    const res = await videoApi.delete(row.id)
    if (res.data.success) {
      ElMessage.success(t('messages.deleteSuccess'))
      loadVideos()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('messages.deleteFailed'))
    }
  }
}

const handleAnalyze = async (row) => {
  try {
    ElMessage.info(t('messages.analyzeStart', { name: row.title }))
    const res = await videoApi.analyze(row.id)
    if (res.data.success) {
      ElMessage.success(res.data.message)
      pollAnalysisStatus(row.id)
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || t('messages.analyzeFailed'))
  }
}

const handleGenerateMetadata = async (row) => {
  try {
    ElMessage.info(t('messages.generateMetadataStart', { name: row.title }))
    const res = await videoApi.generateMetadata(row.id)
    if (res.data.success) {
      const { title, description } = res.data.data
      videoEditForm.value = {
        id: row.id,
        title: title || row.title,
        description: description || row.description || '',
        categoryId: row.categoryId || ''
      }
      showVideoEdit.value = true
      ElMessage.success(t('messages.generateMetadataSuccess'))
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || t('messages.generateMetadataFailed'))
  }
}

const pollAnalysisStatus = (videoId) => {
  const interval = setInterval(async () => {
    try {
      const res = await videoApi.getById(videoId)
      if (res.data.success) {
        const video = res.data.data
        const status = video.aiAnalysis?.status
        const idx = videos.value.findIndex(v => v.id === videoId)
        if (idx !== -1) {
          videos.value[idx] = video
        }
        if (status === 'completed' || status === 'failed') {
          clearInterval(interval)
          if (status === 'completed') {
            ElMessage.success(t('messages.analyzeComplete'))
          }
        }
      }
    } catch (error) {
      clearInterval(interval)
    }
  }, 3000)
  setTimeout(() => clearInterval(interval), 60000)
}

// 分类管理
const openCategoryManage = () => {
  showCategoryManage.value = true
  loadCategories()
}

const openCategoryForm = (row = null) => {
  // 提取多语言分类名
  const extract = (obj) => {
    if (!obj) return {}
    if (obj instanceof Map) {
      const result = {}
      obj.forEach((v, k) => { result[k] = v })
      return result
    }
    return typeof obj === 'object' ? obj : {}
  }

  if (row) {
    categoryLocalizedNames.value = extract(row.localizedName)
    categoryEditLocale.value = locale.value
    categoryForm.value = {
      id: row.id,
      name: categoryLocalizedNames.value[locale.value] || row.name || '',
      description: row.description,
      sortOrder: row.sortOrder
    }
  } else {
    categoryLocalizedNames.value = {}
    categoryEditLocale.value = locale.value
    categoryForm.value = {
      id: '',
      name: '',
      description: '',
      sortOrder: 0
    }
  }
  showCategoryForm.value = true
}

const handleSaveCategory = async () => {
  if (!categoryForm.value.name.trim()) {
    ElMessage.warning(t('messages.inputCategoryNameRequired'))
    return
  }

  // 保存当前语言的内容
  categoryLocalizedNames.value[categoryEditLocale.value] = categoryForm.value.name.trim()

  const data = {
    name: categoryForm.value.name.trim(),
    description: categoryForm.value.description,
    sortOrder: categoryForm.value.sortOrder,
    localizedName: categoryLocalizedNames.value
  }

  try {
    categoryFormLoading.value = true
    let res
    if (categoryForm.value.id) {
      res = await categoryApi.update(categoryForm.value.id, data)
      if (res.data.success) {
        ElMessage.success(t('messages.categoryUpdateSuccess'))
      }
    } else {
      res = await categoryApi.create(data)
      if (res.data.success) {
        ElMessage.success(t('messages.categoryCreateSuccess'))
      }
    }
    showCategoryForm.value = false
    loadCategories()
    loadVideos() // 刷新视频列表以更新分类名称
  } catch (error) {
    const msg = error.response?.data?.message || ''
    if (categoryForm.value.id) {
      ElMessage.error(msg || t('messages.categoryUpdateFailed'))
    } else {
      ElMessage.error(msg || t('messages.categoryCreateFailed'))
    }
  } finally {
    categoryFormLoading.value = false
  }
}

const handleAutoTranslateCategory = async () => {
  if (!categoryForm.value.name.trim()) {
    ElMessage.warning(t('messages.inputCategoryNameRequired'))
    return
  }

  categoryLocalizedNames.value[categoryEditLocale.value] = categoryForm.value.name.trim()

  const targetLocales = allLocales.value.filter(code => code !== categoryEditLocale.value)
  if (targetLocales.length === 0) {
    ElMessage.warning('没有其他语言需要翻译')
    return
  }

  try {
    categoryTranslating.value = true
    ElMessage.info(t('admin.translating'))

    const res = await categoryApi.autoTranslate(
      categoryForm.value.id || 'new',
      categoryEditLocale.value,
      targetLocales
    )

    if (res.data.success) {
      const data = res.data.data
      for (const targetLocale of targetLocales) {
        if (data[targetLocale]?.name) {
          categoryLocalizedNames.value[targetLocale] = data[targetLocale].name
        }
      }
      ElMessage.success(t('admin.translateSuccess'))
      categoryForm.value.name = categoryLocalizedNames.value[categoryEditLocale.value] || categoryForm.value.name
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || t('admin.translateFailed'))
  } finally {
    categoryTranslating.value = false
  }
}

const handleDeleteCategory = async (row) => {
  try {
    await ElMessageBox.confirm(
      t('messages.deleteCategoryConfirm', { name: row.name }),
      t('messages.deleteConfirmTitle'),
      {
        type: 'warning',
        confirmButtonClass: 'delete-confirm-btn'
      }
    )
    const res = await categoryApi.delete(row.id)
    if (res.data.success) {
      ElMessage.success(t('messages.categoryDeleteSuccess'))
      loadCategories()
      loadVideos()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || t('messages.categoryDeleteFailed'))
    }
  }
}

// 视频编辑
const openVideoEdit = (row) => {
  // 从 localizedTitle / localizedDescription Map 中提取各语言内容
  const lt = row.localizedTitle || {}
  const ld = row.localizedDescription || {}
  // Map 在 JSON 序列化后变成对象，或保持 Map 形式
  const extract = (obj) => {
    if (!obj) return {}
    if (obj instanceof Map) {
      const result = {}
      obj.forEach((v, k) => { result[k] = v })
      return result
    }
    return typeof obj === 'object' ? obj : {}
  }
  localizedTitles.value = extract(lt)
  localizedDescriptions.value = extract(ld)
  editLocale.value = locale.value

  videoEditForm.value = {
    id: row.id,
    title: localizedTitles.value[locale.value] || row.title || '',
    description: localizedDescriptions.value[locale.value] || row.description || '',
    categoryId: row.categoryId || ''
  }
  showVideoEdit.value = true
}

const handleAutoTranslate = async () => {
  if (!videoEditForm.value.title.trim()) {
    ElMessage.warning(t('messages.inputTitleRequired'))
    return
  }

  // 先保存当前语言的内容到对应语言
  localizedTitles.value[editLocale.value] = videoEditForm.value.title.trim()
  localizedDescriptions.value[editLocale.value] = videoEditForm.value.description

  // 确定需要翻译的目标语言：所有 i18n 语言（排除当前源语言）
  const targetLocales = allLocales.value.filter(code => code !== editLocale.value)

  if (targetLocales.length === 0) {
    ElMessage.warning('没有其他语言需要翻译')
    return
  }

  try {
    translating.value = true
    ElMessage.info(t('admin.translating'))

    const res = await videoApi.autoTranslate(
      videoEditForm.value.id,
      editLocale.value,
      targetLocales
    )

    if (res.data.success) {
      const data = res.data.data
      // 将翻译结果合并到本地化数据中
      for (const targetLocale of targetLocales) {
        if (data[targetLocale]?.title) {
          localizedTitles.value[targetLocale] = data[targetLocale].title
        }
        if (data[targetLocale]?.description) {
          localizedDescriptions.value[targetLocale] = data[targetLocale].description
        }
      }
      ElMessage.success(t('admin.translateSuccess'))
      // 刷新当前显示
      videoEditForm.value.title = localizedTitles.value[editLocale.value] || videoEditForm.value.title
      videoEditForm.value.description = localizedDescriptions.value[editLocale.value] || videoEditForm.value.description
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || t('admin.translateFailed'))
  } finally {
    translating.value = false
  }
}

const handleSaveVideoEdit = async () => {
  if (!videoEditForm.value.title.trim()) {
    ElMessage.warning(t('messages.inputTitleRequired'))
    return
  }

  // 先保存当前编辑语言的内容
  localizedTitles.value[editLocale.value] = videoEditForm.value.title.trim()
  localizedDescriptions.value[editLocale.value] = videoEditForm.value.description

  const data = {
    title: videoEditForm.value.title.trim(),
    description: videoEditForm.value.description,
    categoryId: videoEditForm.value.categoryId,
    locale: editLocale.value,
    localizedTitles: localizedTitles.value,
    localizedDescriptions: localizedDescriptions.value
  }

  try {
    videoEditLoading.value = true
    const res = await videoApi.update(videoEditForm.value.id, data)
    if (res.data.success) {
      ElMessage.success(t('messages.videoUpdateSuccess'))
      showVideoEdit.value = false
      loadVideos()
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || t('messages.videoUpdateFailed'))
  } finally {
    videoEditLoading.value = false
  }
}

const goToPlay = (id) => {
  window.open(`/play/${id}`, '_blank')
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

onMounted(() => {
  loadVideos()
  loadCategories()
})
</script>

<style scoped>
.admin {
  background: rgba(255, 255, 255, 0.015);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px;
  border: 1px solid rgba(123, 92, 255, 0.08);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(123, 92, 255, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
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
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  line-height: 1.2;
}

.header-text p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 2px;
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

.category-manage-btn {
  background: rgba(123, 92, 255, 0.1);
  border: 1px solid rgba(123, 92, 255, 0.2);
  color: #a78bfa;
  padding: 12px 24px;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.category-manage-btn:hover {
  background: rgba(123, 92, 255, 0.2);
  border-color: rgba(123, 92, 255, 0.35);
  color: #c4b5fd;
}

.table-wrapper {
  border-radius: 16px;
  overflow: hidden;
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

.video-info-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}

.video-thumb-mini {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(123, 92, 255, 0.1) 0%, rgba(159, 122, 234, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a78bfa;
  font-size: 18px;
  flex-shrink: 0;
}

.video-thumb-img {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
}

.video-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.video-name {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-desc-small {
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

.category-tag-display {
  border-radius: 8px;
  font-weight: 500;
  color: #a78bfa;
  border-color: rgba(123, 92, 255, 0.2);
  background: rgba(123, 92, 255, 0.05);
}

.no-category-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.25);
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

.action-link.play-link {
  color: #a78bfa;
}

.action-link.play-link:hover {
  color: #c4b5fd;
  background: rgba(123, 92, 255, 0.1);
}

.action-link.generate-link {
  color: #d4a0ff;
}

.action-link.generate-link:hover {
  color: #e8c8ff;
  background: rgba(212, 160, 255, 0.1);
}

.action-link.delete-link {
  color: #ff7373;
}

.action-link.delete-link:hover {
  color: #ff9e9e;
  background: rgba(255, 115, 115, 0.1);
}

.action-link.disabled {
  color: rgba(255, 255, 255, 0.15);
  cursor: not-allowed;
  pointer-events: none;
}

:deep(.delete-confirm-btn) {
  background: #ff7373 !important;
  border-color: #ff7373 !important;
}

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

.upload-form-wrapper {
  padding: 0;
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

.upload-progress-wrapper {
  margin-top: 20px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.015);
  border-radius: 12px;
  border: 1px solid rgba(123, 92, 255, 0.06);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.progress-percent {
  font-weight: 600;
  color: #a78bfa;
}

.custom-progress :deep(.el-progress-bar__outer) {
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.04);
}

.custom-progress :deep(.el-progress-bar__inner) {
  border-radius: 100px;
  background: linear-gradient(90deg, #7B5CFF 0%, #9F7AEA 100%);
}

.confirm-btn {
  background: linear-gradient(135deg, #7B5CFF 0%, #9F7AEA 100%);
  border: none;
  border-radius: 10px;
}

.analysis-status {
  display: flex;
  justify-content: center;
}

.analysis-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
  font-weight: 500;
}

/* 分类管理对话框 */
.category-dialog :deep(.el-dialog) {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  overflow: hidden;
}

.category-dialog :deep(.el-dialog__header) {
  padding: 24px 24px 0;
  margin-bottom: 0;
  flex-shrink: 0;
}

.category-dialog :deep(.el-dialog__body) {
  max-height: calc(90vh - 100px);
  overflow-y: auto;
  padding: 20px 24px;
}

.category-manage-wrapper {
  padding: 0;
}

.category-toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}

.category-table {
  border-radius: 16px;
  overflow: hidden;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(123, 92, 255, 0.05);
}

.category-table :deep(.el-table__row) {
  transition: background 0.2s;
  color: rgba(255, 255, 255, 0.85);
}

.category-table :deep(.el-table__cell) {
  border-bottom: 1px solid rgba(123, 92, 255, 0.06);
}

.category-table-name {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.category-table-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
}

.category-table-sort {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.category-action-btns {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* 分类表单对话框 */
.category-form-dialog :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
}

.category-form-dialog :deep(.el-dialog__header) {
  padding: 24px 24px 0;
  margin-bottom: 0;
}

.category-form-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
}

.category-form-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid rgba(123, 92, 255, 0.08);
}

.category-form-wrapper {
  padding: 0;
}

/* 视频编辑对话框 */
.video-edit-dialog :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
}

.video-edit-dialog :deep(.el-dialog__header) {
  padding: 24px 24px 0;
  margin-bottom: 0;
}

.video-edit-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
}

.video-edit-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid rgba(123, 92, 255, 0.08);
}

.video-edit-form-wrapper {
  padding: 0;
}

/* 移动端卡片列表 */
.mobile-cards {
  display: none;
  flex-direction: column;
  gap: 12px;
}

.video-card-item {
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
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.card-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.card-thumb {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(123, 92, 255, 0.1) 0%, rgba(159, 122, 234, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a78bfa;
  font-size: 18px;
  flex-shrink: 0;
}

.card-thumb-img {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: cover;
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

.card-desc {
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

.card-action-btn.play {
  background: rgba(123, 92, 255, 0.1);
  color: #a78bfa;
}

.card-action-btn.play:active {
  background: rgba(123, 92, 255, 0.2);
}

.card-action-btn.edit {
  background: rgba(123, 160, 255, 0.1);
  color: #7ba0ff;
}

.card-action-btn.edit:active {
  background: rgba(123, 160, 255, 0.2);
}

.card-action-btn.generate {
  background: rgba(212, 160, 255, 0.1);
  color: #d4a0ff;
}

.card-action-btn.generate:active {
  background: rgba(212, 160, 255, 0.2);
}

.card-action-btn.analyze {
  background: rgba(95, 227, 175, 0.1);
  color: #5fe3af;
}

.card-action-btn.analyze:disabled {
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.2);
  cursor: not-allowed;
}

.card-action-btn.delete {
  background: rgba(255, 115, 115, 0.1);
  color: #ff7373;
}

.card-action-btn.delete:active {
  background: rgba(255, 115, 115, 0.2);
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  .admin {
    padding: 16px;
    border-radius: 16px;
  }

  .admin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 20px;
    padding-bottom: 16px;
  }

  .header-right {
    width: 100%;
    flex-direction: column;
  }

  .header-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .header-text h2 {
    font-size: 16px;
  }

  .upload-btn,
  .category-manage-btn {
    width: 100%;
    justify-content: center;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .custom-table {
    min-width: 700px;
  }

  .upload-dialog :deep(.el-dialog) {
    width: 92vw !important;
    max-width: 600px;
  }

/* 自动翻译按钮 */
.translate-btn {
  background: rgba(212, 160, 255, 0.1);
  border: 1px solid rgba(212, 160, 255, 0.2);
  color: #d4a0ff;
  transition: all 0.3s;
}

.translate-btn:hover:not(:disabled) {
  background: rgba(212, 160, 255, 0.2);
  border-color: rgba(212, 160, 255, 0.35);
  color: #e8c8ff;
}

.translate-btn:disabled {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.15);
}

  .mobile-cards {
    display: flex;
  }

  .category-dialog :deep(.el-dialog) {
    width: 92vw !important;
  }
}

/* 多语言编辑标签 */
.locale-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(123, 92, 255, 0.08);
}

.locale-tab {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(123, 92, 255, 0.08);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.locale-tab:hover {
  color: rgba(255, 255, 255, 0.7);
  border-color: rgba(123, 92, 255, 0.2);
}

.locale-tab.active {
  color: #a78bfa;
  background: rgba(123, 92, 255, 0.08);
  border-color: rgba(123, 92, 255, 0.3);
}

.locale-tab.filled::after {
  content: '';
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #5fe3af;
}
</style>