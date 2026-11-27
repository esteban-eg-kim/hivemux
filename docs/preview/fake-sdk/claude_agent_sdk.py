"""A stand-in for claude-agent-sdk that answers from a script, for the docs' pictures (no API call, no key).
문서 그림용으로 각본대로 답하는 claude-agent-sdk 대역 (API 호출도 키도 없음)."""
import asyncio, os
from dataclasses import dataclass, field
from typing import Any


@dataclass
class TextBlock:
    text: str


@dataclass
class ToolUseBlock:
    id: str
    name: str
    input: dict


@dataclass
class ToolResultBlock:
    tool_use_id: str
    content: Any
    is_error: bool = False


@dataclass
class AssistantMessage:
    content: list
    usage: dict = field(default_factory=lambda: {"input_tokens": 61000, "output_tokens": 900})
    parent_tool_use_id: Any = None
    message_id: Any = None


@dataclass
class UserMessage:
    content: list
    tool_use_result: Any = None
    parent_tool_use_id: Any = None


@dataclass
class SystemMessage:
    subtype: str
    data: dict


@dataclass
class ResultMessage:
    total_cost_usd: float
    session_id: str = "demo"
    is_error: bool = False
    subtype: str = "success"
    result: str = ""


class ClaudeAgentOptions:
    def __init__(self, **kw):
        self.kw = kw


KO = os.environ.get("HIVEMUX_LANG") == "ko"
S = (lambda ko, en: ko) if KO else (lambda ko, en: en)
F = "src/lib/auth/session.ts"
SCRIPT = [
    [AssistantMessage([TextBlock(S("한도로 끊긴 곳부터 이어 갑니다. 세션 갱신을 auth 모듈로 옮기던 중이었고, 남은 일은 테스트입니다.",
                                   "Going on from the limit: the session refresh had moved into the auth module, the tests are left."))]),
     AssistantMessage([ToolUseBlock("t1", "Read", {"file_path": F})]), UserMessage([ToolResultBlock("t1", "export async function refresh(token: string) {")]),
     AssistantMessage([ToolUseBlock("t2", "Bash", {"command": "pnpm vitest run auth"})]), UserMessage([ToolResultBlock("t2", "Test Files  2 failed | 1 passed (3)")]),
     AssistantMessage([ToolUseBlock("t3", "Edit", {"file_path": F})]),
     UserMessage([ToolResultBlock("t3", S("파일을 고쳤습니다.", "The file has been updated."))], {"structuredPatch": [
         {"oldStart": 18, "newStart": 18, "lines": [
             "   const res = await fetch(`/auth/refresh`, { method: \"POST\", body: token });",
             "-  if (!res.ok) return null;",
             "+  if (res.status === 401) throw new SessionExpired();",
             "+  if (!res.ok) return null;",
             "   return res.json();"]}]}),
     AssistantMessage([ToolUseBlock("t4", "Bash", {"command": "pnpm vitest run auth"})]), UserMessage([ToolResultBlock("t4", "Test Files  3 passed (3)")]),
     AssistantMessage([TextBlock(S("갱신 경로를 하나로 합쳤고 `auth` 테스트 3개 파일이 모두 **통과**합니다. 다음은 로그인 화면의 만료 처리입니다.",
                                   "One refresh path now, and all three `auth` test files **pass**. Next is the expiry on the login screen."))]),
     ResultMessage(0.184)],
    [AssistantMessage([ToolUseBlock("t5", "Grep", {"pattern": "expiresAt"})], {"input_tokens": 64000, "output_tokens": 1200}),
     UserMessage([ToolResultBlock("t5", "src/routes/login/+page.server.ts:31")]),
     AssistantMessage([ToolUseBlock("t6", "Read", {"file_path": "src/routes/login/+page.server.ts"})], {"input_tokens": 66000, "output_tokens": 1500})],
]


class ClaudeSDKClient:
    def __init__(self, options=None):
        self.turns, self.q = 0, asyncio.Queue()

    async def __aenter__(self):
        await self.q.put(SystemMessage("init", {"model": "claude-opus-5-5", "session_id": "demo"}))
        return self

    async def __aexit__(self, *a):
        return False

    async def get_server_info(self):
        return {"commands": []}

    async def query(self, prompt):
        for m in SCRIPT[min(self.turns, len(SCRIPT) - 1)]:
            await self.q.put(m)
        self.turns += 1

    async def receive_messages(self):
        while True:
            await asyncio.sleep(.25)
            yield await self.q.get()

    async def interrupt(self):
        pass

    async def set_model(self, m):
        pass
