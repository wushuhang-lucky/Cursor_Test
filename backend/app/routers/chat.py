import json

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.config import settings
from app.schemas.chat import ChatRequest
from app.services.openai_service import stream_chat

router = APIRouter()


async def _chat_event_generator(request: ChatRequest):
    """
    SSE 事件生成器，将 DeepSeek 流式输出转为 SSE 事件。

    SSE 事件格式（前端通过 data 字段解析）：
    - 思维链 token:  data: {"type": "reasoning", "content": "..."}
    - 回答 token:    data: {"type": "content", "content": "..."}
    - 流结束:        data: {"type": "finish", "reason": "stop", "usage": {...}}
    - 错误:          data: {"type": "error", "message": "..."}
    - 结束标记:      data: [DONE]
    """
    # 决定是否启用思考模式：请求中指定 > 服务端默认配置
    enable_thinking = (
        request.enable_thinking
        if request.enable_thinking is not None
        else settings.ENABLE_THINKING
    )

    try:
        async for event in stream_chat(request.messages, enable_thinking):
            yield {"data": json.dumps(event, ensure_ascii=False)}
        # 流结束，发送 [DONE] 信号
        yield {"data": "[DONE]"}
    except Exception as e:
        yield {
            "data": json.dumps(
                {"type": "error", "message": str(e)},
                ensure_ascii=False,
            )
        }


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    流式对话接口

    接收消息历史，返回 SSE 流式响应。

    SSE data 字段说明：
    - type="reasoning": 思维链内容（思考模式开启时）
    - type="content": 最终回答内容
    - type="finish": 流结束，含 usage 统计
    - type="error": 错误信息
    - [DONE]: SSE 流结束标记
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="messages 不能为空")

    return EventSourceResponse(_chat_event_generator(request))
