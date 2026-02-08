export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#171717] text-white flex flex-col h-full shrink-0">
      {/* 顶部新建对话按钮 */}
      <div className="p-3">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm cursor-pointer">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
          </svg>
          <span>新聊天</span>
        </button>
      </div>

      {/* 对话列表区域 */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="text-xs text-white/40 px-3 py-2 mt-2">你的聊天</div>
      </div>

      {/* 底部信息 */}
      <div className="p-3 border-t border-white/10">
        <div className="text-xs text-white/30 text-center">
          Powered by DeepSeek V3
        </div>
      </div>
    </aside>
  )
}
