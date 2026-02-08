"""
DeepSeek API 流式输出测试脚本

测试目标：
1. 测试 deepseek-chat (V3) 模型的普通流式输出
2. 测试 deepseek-chat + thinking 模式的流式输出（思维链）
3. 记录每个 chunk 的详细字段结构，用于前端接口对接

使用方法：
    python test_deepseek.py
"""

import json
from openai import OpenAI

API_KEY = "sk-459d03d474284a65909a46ae924bbcbf"
BASE_URL = "https://api.deepseek.com"

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)


def print_separator(title: str):
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")


def dump_chunk(chunk, index: int):
    """详细打印单个 chunk 的所有字段"""
    print(f"--- Chunk #{index} ---")
    # 打印原始对象的字典表示
    chunk_dict = chunk.model_dump()
    print(json.dumps(chunk_dict, ensure_ascii=False, indent=2, default=str))
    print()


# =============================================================================
#  测试 1: deepseek-chat 普通流式输出（不开启思考模式）
# =============================================================================
def test_stream_basic():
    print_separator("测试 1: deepseek-chat 普通流式输出")

    messages = [{"role": "user", "content": "请用一句话介绍你自己"}]

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True,
        max_tokens=256,
    )

    content = ""
    chunk_count = 0

    print("[详细 chunk 结构] 打印前 5 个 chunk：\n")

    for chunk in response:
        chunk_count += 1
        # 前 5 个 chunk 打印完整结构
        if chunk_count <= 5:
            dump_chunk(chunk, chunk_count)

        # 收集 content
        if chunk.choices and chunk.choices[0].delta:
            delta = chunk.choices[0].delta
            if hasattr(delta, "content") and delta.content:
                content += delta.content

    print(f"\n[统计] 共收到 {chunk_count} 个 chunk")
    print(f"[最终 content] {content}")

    # 打印最后一个 chunk（通常包含 finish_reason 和 usage）
    print(f"\n[最后一个 chunk 完整结构]:")
    dump_chunk(chunk, chunk_count)


# =============================================================================
#  测试 2: deepseek-chat + thinking 模式流式输出
# =============================================================================
def test_stream_thinking():
    print_separator("测试 2: deepseek-chat + thinking 思考模式流式输出")

    messages = [{"role": "user", "content": "9.11 和 9.8 哪个更大？"}]

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True,
        max_tokens=4096,
        extra_body={"thinking": {"type": "enabled"}},
    )

    reasoning_content = ""
    content = ""
    chunk_count = 0
    reasoning_chunks = 0
    content_chunks = 0

    print("[详细 chunk 结构] 打印前 5 个 chunk：\n")

    for chunk in response:
        chunk_count += 1
        # 前 5 个 chunk 打印完整结构
        if chunk_count <= 5:
            dump_chunk(chunk, chunk_count)

        if chunk.choices and chunk.choices[0].delta:
            delta = chunk.choices[0].delta

            # 检查 reasoning_content 字段
            rc = getattr(delta, "reasoning_content", None)
            if rc:
                reasoning_content += rc
                reasoning_chunks += 1

            # 检查 content 字段
            if hasattr(delta, "content") and delta.content:
                content += delta.content
                content_chunks += 1

    print(f"\n[统计] 共收到 {chunk_count} 个 chunk")
    print(f"  - reasoning_content chunk 数: {reasoning_chunks}")
    print(f"  - content chunk 数: {content_chunks}")
    print(f"\n[reasoning_content 思维链] ({len(reasoning_content)} 字符):")
    print(reasoning_content[:500] + ("..." if len(reasoning_content) > 500 else ""))
    print(f"\n[content 最终回答] ({len(content)} 字符):")
    print(content)

    # 打印最后一个 chunk
    print(f"\n[最后一个 chunk 完整结构]:")
    dump_chunk(chunk, chunk_count)


# =============================================================================
#  测试 3: 多轮对话流式输出（验证上下文保持）
# =============================================================================
def test_stream_multi_turn():
    print_separator("测试 3: 多轮对话流式输出")

    # Turn 1
    messages = [{"role": "user", "content": "我的名字叫小明，请记住它"}]

    print("[Turn 1] 发送: 我的名字叫小明，请记住它")
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True,
        max_tokens=256,
    )

    turn1_content = ""
    for chunk in response:
        if chunk.choices and chunk.choices[0].delta:
            delta = chunk.choices[0].delta
            if hasattr(delta, "content") and delta.content:
                turn1_content += delta.content

    print(f"[Turn 1 回复] {turn1_content}")

    # Turn 2
    messages.append({"role": "assistant", "content": turn1_content})
    messages.append({"role": "user", "content": "我的名字是什么？"})

    print("\n[Turn 2] 发送: 我的名字是什么？")
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True,
        max_tokens=256,
    )

    turn2_content = ""
    turn2_chunk_count = 0
    for chunk in response:
        turn2_chunk_count += 1
        if chunk.choices and chunk.choices[0].delta:
            delta = chunk.choices[0].delta
            if hasattr(delta, "content") and delta.content:
                turn2_content += delta.content

    print(f"[Turn 2 回复] {turn2_content}")
    print(f"[Turn 2 chunk 数] {turn2_chunk_count}")


# =============================================================================
#  运行所有测试
# =============================================================================
if __name__ == "__main__":
    print("DeepSeek API 流式输出测试")
    print(f"Base URL: {BASE_URL}")
    print(f"API Key: {API_KEY[:8]}...{API_KEY[-4:]}")

    test_stream_basic()
    test_stream_thinking()
    test_stream_multi_turn()

    print_separator("所有测试完成")
