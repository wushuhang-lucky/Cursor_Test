import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'

function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <ChatWindow />
      </main>
    </div>
  )
}

export default App
