<template>
  <div class="app">
    <!-- 背景网格 -->
    <div class="bg-grid"></div>
    <!-- 紫色光晕 -->
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>

    <nav class="navbar" :class="{ 'hide-on-mobile-play': isPlayPage }">
      <div class="nav-brand" @click="$router.push('/')">
        <div class="brand-icon">
          <el-icon size="20"><MagicStick /></el-icon>
        </div>
        <div class="brand-text">
          <span class="brand-title">{{ $t('nav.brand') }}</span>
        </div>
      </div>
      <div class="nav-right">
        <div class="nav-links">
          <router-link to="/" :class="{ active: $route.path === '/' }">
            <span>{{ $t('nav.home') }}</span>
          </router-link>
          <!-- <router-link to="/knowledge" :class="{ active: $route.path === '/knowledge' }">
            <span>{{ $t('nav.knowledge') }}</span>
          </router-link> -->
          <!--<router-link to="/admin" :class="{ active: $route.path === '/admin' }">
            <span>{{ $t('nav.admin') }}</span>
          </router-link> -->
        </div>
        <!-- 语言切换器 -->
        <div class="lang-switcher" @click.stop="toggleLangMenu">
          <div class="lang-current">
            <img v-if="currentLang.flagImg" class="lang-flag-img" :src="currentLang.flagImg" :alt="currentLang.code">
            <span v-else class="lang-flag-emoji">{{ currentLang.flagEmoji }}</span>
            <span class="lang-name">{{ currentLang.name }}</span>
            <el-icon class="lang-arrow" :class="{ open: langMenuOpen }"><ArrowDown /></el-icon>
          </div>
          <transition name="lang-dropdown">
            <div v-if="langMenuOpen" class="lang-dropdown">
              <div
                v-for="lang in languages"
                :key="lang.code"
                class="lang-item"
                :class="{ active: locale === lang.code }"
                @click="changeLang(lang.code)"
              >
                <img v-if="lang.flagImg" class="lang-flag-img" :src="lang.flagImg" :alt="lang.code">
                <span v-else class="lang-flag-emoji">{{ lang.flagEmoji }}</span>
                <span class="lang-name">{{ lang.name }}</span>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import zhCn from './assets/flag/CN.png'
import zhTw from './assets/flag/CN.png'
import en from './assets/flag/US.png'
import ko from './assets/flag/KR.png'
import ja from './assets/flag/JP.png'
import es from './assets/flag/ES.png'
import ar from './assets/flag/AE.png'
import de from './assets/flag/DE.png'
import fr from './assets/flag/FR.png'
import ru from './assets/flag/RU.png'
import it from './assets/flag/IT.png'
import vi from './assets/flag/VN.png'
import id from './assets/flag/ID.png'
import hi from './assets/flag/IN.png'

const route = useRoute()
const { locale, t } = useI18n()

const isPlayPage = computed(() => route.path.startsWith('/play/'))

const flagMap = {
  'zh-CN': zhCn,
  'zh-TW': zhTw,
  'en': en,
  'ko': ko,
  'ja': ja,
  'es': es,
  'ar': ar,
  'de': de,
  'fr': fr,
  'ru': ru,
  'it': it,
  'vi': vi,
  'id': id,
  'hi': hi
}

const languages = [
  { code: 'zh-CN', name: '简体中文', flagImg: flagMap['zh-CN'] },
  { code: 'zh-TW', name: '繁體中文', flagImg: flagMap['zh-TW'] },
  { code: 'en', name: 'English', flagImg: flagMap['en'] },
  { code: 'ko', name: '한국어', flagImg: flagMap['ko'] },
  { code: 'ja', name: '日本語', flagImg: flagMap['ja'] },
  { code: 'es', name: 'Español', flagImg: flagMap['es'] },
  { code: 'ar', name: 'العربية', flagImg: flagMap['ar'] },
  { code: 'de', name: 'Deutsch', flagImg: flagMap['de'] },
  { code: 'fr', name: 'Français', flagImg: flagMap['fr'] },
  { code: 'ru', name: 'Русский', flagImg: flagMap['ru'] },
  { code: 'it', name: 'Italiano', flagImg: flagMap['it'] },
  { code: 'vi', name: 'Tiếng Việt', flagImg: flagMap['vi'] },
  { code: 'id', name: 'Bahasa Indonesia', flagImg: flagMap['id'] },
  { code: 'hi', name: 'हिन्दी', flagImg: flagMap['hi'] }
]

const langMenuOpen = ref(false)

const currentLang = computed(() => {
  return languages.find(l => l.code === locale.value) || languages[0]
})

const toggleLangMenu = () => {
  langMenuOpen.value = !langMenuOpen.value
}

const changeLang = (code) => {
  locale.value = code
  localStorage.setItem('locale', code)
  langMenuOpen.value = false
}

const closeLangMenu = (e) => {
  if (!e.target.closest('.lang-switcher')) {
    langMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeLangMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeLangMenu)
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: #010510;
  position: relative;
  overflow-x: hidden;
}

/* 背景网格 */
.bg-grid {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(123, 92, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(123, 92, 255, 0.06) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
  z-index: 0;
}

/* 紫色光晕 */
.bg-glow {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  filter: blur(120px);
}

.bg-glow-1 {
  width: 600px;
  height: 600px;
  top: -150px;
  left: -150px;
  background: radial-gradient(circle, rgba(123, 92, 255, 0.35) 0%, rgba(123, 92, 255, 0.1) 40%, transparent 70%);
}

.bg-glow-2 {
  width: 500px;
  height: 500px;
  bottom: 5%;
  right: -150px;
  background: radial-gradient(circle, rgba(159, 122, 234, 0.22) 0%, rgba(159, 122, 234, 0.05) 40%, transparent 70%);
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 0 32px;
  height: 56px;
  background: rgba(20, 15, 50, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.5);
  border-radius: 100px;
  box-shadow:
    0 4px 30px rgba(0, 0, 0, 0.4),
    0 0 40px rgba(123, 92, 255, 0.25),
    0 0 80px rgba(123, 92, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 0 20px rgba(123, 92, 255, 0.15);
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  width: auto;
  min-width: 560px;
  max-width: 800px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.2s;
}

.nav-brand:hover {
  transform: scale(1.02);
}

.brand-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #7B5CFF 0%, #9F7AEA 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 15px rgba(123, 92, 255, 0.35);
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-links {
  display: flex;
  gap: 4px;
}

.nav-links a {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 100px;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.nav-links a:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(123, 92, 255, 0.1);
}

.nav-links a.active {
  color: #fff;
  background: linear-gradient(135deg, rgba(123, 92, 255, 0.3) 0%, rgba(159, 122, 234, 0.2) 100%);
  box-shadow: 0 2px 12px rgba(123, 92, 255, 0.2), inset 0 0 0 1px rgba(123, 92, 255, 0.2);
}

/* 语言切换器 */
.lang-switcher {
  position: relative;
  cursor: pointer;
}

.lang-current {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 100px;
  background: rgba(123, 92, 255, 0.1);
  border: 1px solid rgba(123, 92, 255, 0.2);
  transition: all 0.3s;
  font-size: 13px;
  color: #fff;
}

.lang-current:hover {
  background: rgba(123, 92, 255, 0.2);
  border-color: rgba(123, 92, 255, 0.35);
}

.lang-flag-img {
  width: 24px;
  height: 16px;
  border-radius: 2px;
  object-fit: cover;
  flex-shrink: 0;
}

.lang-flag-emoji {
  font-size: 16px;
  flex-shrink: 0;
}

.lang-name {
  font-weight: 500;
  white-space: nowrap;
}

.lang-arrow {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  transition: transform 0.3s;
}

.lang-arrow.open {
  transform: rotate(180deg);
}

.lang-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: rgba(18, 14, 40, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(123, 92, 255, 0.2);
  border-radius: 16px;
  padding: 8px;
  min-width: 180px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 200;
  max-height: 360px;
  overflow-y: auto;
}

.lang-dropdown::-webkit-scrollbar {
  width: 4px;
}

.lang-dropdown::-webkit-scrollbar-thumb {
  background: rgba(123, 92, 255, 0.2);
  border-radius: 4px;
}

.lang-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  transition: all 0.2s;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.lang-item:hover {
  background: rgba(123, 92, 255, 0.15);
  color: #fff;
}

.lang-item.active {
  background: rgba(123, 92, 255, 0.25);
  color: #fff;
}

.lang-dropdown-enter-active,
.lang-dropdown-leave-active {
  transition: all 0.2s ease;
}

.lang-dropdown-enter-from,
.lang-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.main-content {
  
  padding: 100px 40px 40px;
  max-width: 1440px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}
@media (min-width: 768px) {
  .main-content{
    height: 100vh;
  }
 
}

@media (max-width: 768px) {
  .navbar {
    padding: 0 16px;
    min-width: auto;
    width: calc(100% - 32px);
    top: 12px;
  }

  .brand-title {
    font-size: 14px;
  }

  .nav-links a {
    padding: 6px 12px;
    font-size: 12px;
  }

  .lang-current .lang-name {
    display: none;
  }

  .lang-current {
    padding: 6px 10px;
  }

  .main-content {
    padding: 80px 16px 16px;
  }

  .navbar.hide-on-mobile-play {
    display: none;
  }

  .navbar.hide-on-mobile-play ~ .main-content {
    padding-top: 16px;
  }
}
</style>
