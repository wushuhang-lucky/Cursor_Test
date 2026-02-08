import { useRef, useEffect } from 'react'
import type { Message } from '../types/chat'
import MessageItem from './MessageItem'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
}

export default function MessageList({ messages, isLoading = false }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)

  // 检测用户是否手动上滑（距底部 > 100px 时暂停自动滚动）
  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    shouldAutoScroll.current = distanceFromBottom < 100
  }

  // 消息更新时自动滚动到底部
  useEffect(() => {
    if (shouldAutoScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto"
    >
      <div className="max-w-3xl mx-auto px-4 py-6">
        {messages.map((msg, idx) => {
          // 最后一条 assistant 消息 + 正在加载 = 流式中
          const isLastAssistant =
            isLoading &&
            msg.role === 'assistant' &&
            idx === messages.length - 1
          return (
            <MessageItem
              key={msg.id}
              message={msg}
              isStreaming={isLastAssistant}
            />
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
