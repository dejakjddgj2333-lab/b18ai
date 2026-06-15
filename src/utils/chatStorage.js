const STORAGE_KEY = 'ai_chat_messages'

// 获取所有聊天记录
const getAllChats = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

// 保存所有聊天记录
const saveAllChats = (chats) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
}

// 获取指定视频的消息列表
export const getMessages = (videoId) => {
  const chats = getAllChats()
  return chats[videoId] || []
}

// 保存一条消息到指定视频
export const saveMessage = (videoId, message) => {
  const chats = getAllChats()
  if (!chats[videoId]) {
    chats[videoId] = []
  }
  chats[videoId].push(message)
  saveAllChats(chats)
}

// 清空指定视频的聊天记录
export const clearChat = (videoId) => {
  const chats = getAllChats()
  delete chats[videoId]
  saveAllChats(chats)
}

// 清理不存在视频的缓存
export const cleanupInvalidChats = (validVideoIds) => {
  const chats = getAllChats()
  const validSet = new Set(validVideoIds)
  let changed = false

  for (const videoId of Object.keys(chats)) {
    if (!validSet.has(videoId)) {
      delete chats[videoId]
      changed = true
    }
  }

  if (changed) {
    saveAllChats(chats)
  }
}
