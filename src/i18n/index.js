import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'
import en from './locales/en.json'
import ko from './locales/ko.json'
import ja from './locales/ja.json'
import es from './locales/es.json'
import ar from './locales/ar.json'
import de from './locales/de.json'
import fr from './locales/fr.json'
import ru from './locales/ru.json'
import it from './locales/it.json'
import vi from './locales/vi.json'
import id from './locales/id.json'
import hi from './locales/hi.json'

const messages = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  en,
  ko,
  ja,
  es,
  ar,
  de,
  fr,
  ru,
  it,
  vi,
  id,
  hi
}

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'zh-CN',
  fallbackLocale: 'en',
  messages
})

export { messages }
export default i18n
