import { useState, useRef, useEffect } from 'react'

interface ChatInputProps {
  onSend: (content: string) => void
  onStop?: () => void
  isLoading?: boolean
}

export default function ChatInput({ onSend, onStop, isLoading = false }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 自动调整 textarea 高度
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }
  }, [value])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="w-full flex justify-center pb-4 pt-2 px-4">
      <div className="relative w-full max-w-3xl">
        <div className="flex items-end bg-[#f4f4f4] rounded-3xl border border-gray-200 shadow-sm px-4 py-3 gap-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="有问题，尽管问"
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-[15px] text-gray-900 placeholder:text-gray-400 leading-relaxed max-h-[200px]"
            disabled={isLoading}
          />

          {/* 生成中显示 Stop 按钮，否则显示 Send 按钮 */}
          {isLoading ? (
            <button
              onClick={onStop}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-black text-white hover:bg-gray-800 cursor-pointer transition-colors"
              title="停止生成"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!value.trim()}
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                value.trim()
                  ? 'bg-black text-white hover:bg-gray-800 cursor-pointer'
                  : 'bg-gray-300 text-white cursor-not-allowed'
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
