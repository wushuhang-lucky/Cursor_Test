from collections.abc import AsyncGenerator
from typing import Any

from openai import AsyncOpenAI

from app.config import settings
from app.schemas.chat import MessageSchema

# 初始化异步 OpenAI 客户端（兼容 DeepSeek API）
client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_BASE_URL,
)


async def stream_chat(
    messages: list[MessageSchema],
    enable_thinking: bool = False,
) -> AsyncGenerator[dict[str, Any], None]:
    """
    调用 DeepSeek ChatCompletion API（流式模式），逐 token 生成内容。

    Args:
        messages: 用户传入的消息历史列表
        enable_thinking: 是否启用思考模式

    Yields:
        字典，包含以下可能的字段：
        - {"type": "reasoning", "content": "思维链token"}
        - {"type": "content", "content": "回答token"}
        - {"type": "finish", "reason": "stop", "usage": {...}}
    """
    # 构建完整的 messages 数组，加入 system prompt
    full_messages: list[dict[str, str]] = [
        {"role": "system", "content": settings.SYSTEM_PROMPT},
    ]
    for msg in messages:
        full_messages.append({"role": msg.role, "content": msg.content})

    # 构建请求参数
    create_params: dict[str, Any] = {
        "model": settings.OPENAI_MODEL,
        "messages": full_messages,
        "stream": True,
        "max_tokens": 8192,
    }

    # 如果启用思考模式，通过 extra_body 传入 thinking 参数
    if enable_thinking:
        create_params["extra_body"] = {"thinking": {"type": "enabled"}}

    # 调用 DeepSeek 流式 API
    stream = await client.chat.completions.create(**create_params)

    async for chunk in stream:
        if not chunk.choices:
            continue

        choice = chunk.choices[0]
        delta = choice.delta

        # 检查是否为流结束 chunk（含 finish_reason）
        if choice.finish_reason:
            usage_data = None
            if chunk.usage:
                usage_data = {
                    "prompt_tokens": chunk.usage.prompt_tokens,
                    "completion_tokens": chunk.usage.completion_tokens,
                    "total_tokens": chunk.usage.total_tokens,
                }
            yield {
                "type": "finish",
                "reason": choice.finish_reason,
                "usage": usage_data,
            }
            continue

        # 思考模式下的 reasoning_content（思维链）
        reasoning = getattr(delta, "reasoning_content", None)
        if reasoning:
            yield {"type": "reasoning", "content": reasoning}

        # 正常 content（最终回答）
        if delta.content:
            yield {"type": "content", "content": delta.content}
