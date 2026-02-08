import MessageList from './MessageList'
import ChatInput from './ChatInput'
import WelcomeScreen from './WelcomeScreen'
import { useChat } from '../hooks/useChat'

export default function ChatWindow() {
  const { messages, isLoading, error, sendMessage, stopGenerating, clearMessages } = useChat()

  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 顶部标题栏 */}
      <header className="shrink-0 h-12 flex items-center justify-between px-4 border-b border-gray-100">
        <div className="w-20" />
        <span className="text-sm font-medium text-gray-700">DeepSeek Chat</span>
        {hasMessages ? (
          <button
            onClick={clearMessages}
            className="w-20 text-xs text-gray-400 hover:text-gray-600 transition-colors text-right cursor-pointer"
          >
            清空对话
          </button>
        ) : (
          <div className="w-20" />
        )}
      </header>

      {/* 消息区域 / 欢迎页 */}
      {hasMessages ? (
        <MessageList messages={messages} isLoading={isLoading} />
      ) : (
        <WelcomeScreen />
      )}

      {/* 错误提示 */}
      {error && (
        <div className="flex justify-center px-4 pb-2">
          <div className="max-w-3xl w-full flex items-center justify-between bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">
            <span>{error}</span>
            <button
              onClick={() => {
                // 重试：取最后一条用户消息重新发送
                const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
                if (lastUserMsg) {
                  sendMessage(lastUserMsg.content)
                }
              }}
              className="ml-3 text-red-500 hover:text-red-700 text-xs font-medium underline cursor-pointer"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {/* 输入框 */}
      <ChatInput
        onSend={sendMessage}
        onStop={stopGenerating}
        isLoading={isLoading}
      />
    </div>
  )
}
