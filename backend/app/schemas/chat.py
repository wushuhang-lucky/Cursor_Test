from pydantic import BaseModel


class MessageSchema(BaseModel):
    """单条消息"""

    role: str  # "user" | "assistant" | "system"
    content: str


class ChatRequest(BaseModel):
    """聊天请求体"""

    messages: list[MessageSchema]
    enable_thinking: bool | None = None  # 是否启用思考模式，None 则使用服务端默认配置
