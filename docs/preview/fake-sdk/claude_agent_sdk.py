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
    name: str
    input: dict
    id: str = "t"


@dataclass
class ToolResultBlock:
    content: Any
    is_error: bool = False


@dataclass
class AssistantMessage:
    content: list
    usage: dict = field(default_factory=lambda: {"input_tokens": 61000})
    parent_tool_use_id: Any = None


@dataclass
class UserMessage:
    content: list


@dataclass
class ResultMessage:
    total_cost_usd: float
    session_id: str = "demo"


class ClaudeAgentOptions:
    def __init__(self, **kw):
        self.kw = kw


KO = os.environ.get("HIVEMUX_LANG") == "ko"
S = (lambda ko, en: ko) if KO else (lambda ko, en: en)
F = "src/lib/auth/session.ts"
SCRIPT = [
    [AssistantMessage([TextBlock(S("한도로 끊긴 곳부터 이어 갑니다. 세션 갱신을 auth 모듈로 옮기던 중이었고, 남은 일은 테스트입니다.",
                                   "Going on from the limit: the session refresh had moved into the auth module, the tests are left."))]),
     AssistantMessage([ToolUseBlock("Read", {"file_path": F})]), UserMessage([ToolResultBlock("export async function refresh(token: string) {")]),
     AssistantMessage([ToolUseBlock("Edit", {"file_path": F})]), UserMessage([ToolResultBlock(S("파일을 고쳤습니다.", "The file has been updated."))]),
     AssistantMessage([ToolUseBlock("Bash", {"command": "pnpm vitest run auth"})]), UserMessage([ToolResultBlock("Test Files  3 passed (3)")]),
     AssistantMessage([TextBlock(S("갱신 경로를 하나로 합쳤고 auth 테스트 3개 파일이 모두 통과합니다.\n  다음은 로그인 화면의 만료 처리입니다.",
                                   "One refresh path now, and all three auth test files pass.\n  Next is the expiry on the login screen."))]),
     ResultMessage(0.184)],
    [AssistantMessage([ToolUseBlock("Grep", {"pattern": "expiresAt"})], {"input_tokens": 64000}), UserMessage([ToolResultBlock("src/routes/login/+page.server.ts:31")]),
     AssistantMessage([ToolUseBlock("Read", {"file_path": "src/routes/login/+page.server.ts"})], {"input_tokens": 66000})],
]


class ClaudeSDKClient:
    def __init__(self, options=None):
        self.turns, self.q = 0, asyncio.Queue()

    async def __aenter__(self):
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
