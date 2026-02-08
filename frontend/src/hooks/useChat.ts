import { useState, useRef, useCallback } from 'react'
import type { Message } from '../types/chat'
import { fetchChatStream } from '../services/api'
import type { SSEEvent } from '../services/api'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  /**
   * 发送消息并接收流式回复
   */
  const sendMessage = useCallback(async (content: string) => {
    setError(null)

    // 1. 追加用户消息
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      createdAt: Date.now(),
    }

    // 2. 创建空的 assistant 消息占位
    const assistantId = `assistant-${Date.now()}`
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      reasoning: '',
      createdAt: Date.now(),
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setIsLoading(true)

    // 3. 创建 AbortController 用于中断
    const controller = new AbortController()
    abortRef.current = controller

    // 构建发送给后端的完整消息历史（包含本次用户消息）
    // 使用函数获取当前最新 messages + 新的 userMsg
    const allMessages = [...messages, userMsg]

    // 4. 发起流式请求
    await fetchChatStream(
      allMessages,
      // onEvent: 逐 token 更新 assistant 消息
      (event: SSEEvent) => {
        if (event.type === 'reasoning') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, reasoning: (m.reasoning || '') + event.content }
                : m,
            ),
          )
        } else if (event.type === 'content') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + event.content }
                : m,
            ),
          )
        } else if (event.type === 'error') {
          setError(event.message)
        }
      },
      // onDone: 流结束
      () => {
        setIsLoading(false)
        abortRef.current = null
      },
      // onError: 请求出错
      (err) => {
        setError(err.message)
        setIsLoading(false)
        abortRef.current = null
        // 移除空的 assistant 消息
        setMessages((prev) =>
          prev.filter((m) => m.id !== assistantId || m.content),
        )
      },
      controller.signal,
    )
  }, [messages])

  /**
   * 中断正在生成的回复
   */
  const stopGenerating = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
      setIsLoading(false)
    }
  }, [])

  /**
   * 清空对话
   */
  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stopGenerating,
    clearMessages,
  }
}
