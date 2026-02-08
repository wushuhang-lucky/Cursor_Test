export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning?: string  // DeepSeek 思维链内容（思考模式）
  createdAt: number
}
