import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Message } from '../types/chat'

interface MessageItemProps {
  message: Message
  isStreaming?: boolean
}

/** 代码块组件：带语言标签和复制按钮 */
function CodeBlock({ language, children }: { language: string; children: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-gray-200">
      {/* 顶部栏：语言标签 + 复制按钮 */}
      <div className="flex items-center justify-between bg-[#f6f6f6] px-4 py-1.5 text-xs text-gray-500">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-gray-700 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              已复制
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              复制代码
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneLight}
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '13px',
          lineHeight: '1.6',
          background: '#fafafa',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}

/** 流式输出时的闪烁光标 */
function StreamingCursor() {
  return (
    <span className="inline-block w-[3px] h-[1.1em] bg-gray-400 ml-0.5 align-text-bottom animate-pulse" />
  )
}

export default function MessageItem({ message, isStreaming = false }: MessageItemProps) {
  const isUser = message.role === 'user'
  const showCursor = isStreaming && !isUser && !message.content

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-5`}>
      {/* AI 头像 */}
      {!isUser && (
        <div className="shrink-0 w-7 h-7 rounded-full bg-[#4f46e5] flex items-center justify-center mr-3 mt-0.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
      )}

      <div
        className={`${
          isUser
            ? 'max-w-[70%] bg-[#f4f4f4] text-gray-900 rounded-3xl px-5 py-3'
            : 'max-w-[85%] text-gray-800'
        }`}
      >
        {/* 思维链（折叠，流式时自动展开） */}
        {!isUser && message.reasoning && (
          <details className="mb-3" open={isStreaming && !message.content}>
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors select-none flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              已深度思考
            </summary>
            <div className="mt-2 text-xs text-gray-400 leading-relaxed border-l-2 border-gray-200 pl-3 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {message.reasoning}
              {isStreaming && !message.content && <StreamingCursor />}
            </div>
          </details>
        )}

        {/* Typing indicator: 正在等待首个 token */}
        {showCursor && !message.reasoning && (
          <div className="flex items-center gap-1.5 py-1">
            <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        )}

        {/* 消息正文 */}
        {message.content && (
          isUser ? (
            <div className="leading-relaxed whitespace-pre-wrap text-[15px]">
              {message.content}
            </div>
          ) : (
            <div className="prose prose-sm prose-gray max-w-none text-[15px] leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_pre]:my-0 [&_pre]:p-0 [&_pre]:bg-transparent [&_code:not(pre_code)]:bg-[#f0f0f0] [&_code:not(pre_code)]:px-1.5 [&_code:not(pre_code)]:py-0.5 [&_code:not(pre_code)]:rounded-md [&_code:not(pre_code)]:text-[13px] [&_code:not(pre_code)]:font-mono [&_a]:text-[#4f46e5] [&_table]:text-sm [&_th]:bg-gray-50 [&_blockquote]:border-gray-300 [&_blockquote]:text-gray-600">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const codeStr = String(children).replace(/\n$/, '')
                    if (match) {
                      return <CodeBlock language={match[1]}>{codeStr}</CodeBlock>
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                  // 移除 pre 的默认包裹，因为 CodeBlock 自己处理
                  pre({ children }) {
                    return <>{children}</>
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && <StreamingCursor />}
            </div>
          )
        )}
      </div>
    </div>
  )
}
