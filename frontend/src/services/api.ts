import type { Message } from '../types/chat'

/**
 * SSE 事件类型（与后端 routers/chat.py 的输出格式对应）
 */
export type SSEEvent =
  | { type: 'reasoning'; content: string }
  | { type: 'content'; content: string }
  | { type: 'finish'; reason: string; usage: Record<string, number> | null }
  | { type: 'error'; message: string }

/**
 * 发起流式聊天请求
 *
 * 使用 Fetch API + ReadableStream 读取后端 SSE 流，
 * 通过回调函数逐事件通知调用方。
 *
 * @param messages    消息历史
 * @param onEvent     每收到一个 SSE 事件时的回调
 * @param onDone      流结束时的回调
 * @param onError     出错时的回调
 * @param signal      AbortController.signal，用于中断请求
 */
export async function fetchChatStream(
  messages: Message[],
  onEvent: (event: SSEEvent) => void,
  onDone: () => void,
  onError: (error: Error) => void,
  signal?: AbortSignal,
) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
      signal,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`请求失败 (${response.status}): ${text}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // SSE 格式：每条事件以 \n\n 分隔
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 最后一个可能不完整，保留到下次

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith(':')) continue // 跳过空行和注释

        if (trimmed.startsWith('data:')) {
          const data = trimmed.slice(5).trim()

          // [DONE] 标记表示流结束
          if (data === '[DONE]') {
            onDone()
            return
          }

          // 解析 JSON 事件
          try {
            const event = JSON.parse(data) as SSEEvent
            onEvent(event)
          } catch {
            // 忽略无法解析的行
            console.warn('[SSE] 无法解析:', data)
          }
        }
      }
    }

    // reader.read() 返回 done 但没收到 [DONE]，也视为结束
    onDone()
  } catch (err) {
    // AbortError 是用户主动取消，不视为错误
    if (err instanceof DOMException && err.name === 'AbortError') {
      onDone()
      return
    }
    onError(err instanceof Error ? err : new Error(String(err)))
  }
}
