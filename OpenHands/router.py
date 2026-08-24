"""
Imperial Codex — Model Router
Routes prompts to Qwen (primary) or Phi-4 mini (fallback)
based on prompt keywords. Exposes OpenAI-compatible /v1/chat/completions.
"""
import os
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(title="Imperial Codex Model Router")

QWEN_BASE = os.getenv("QWEN_URL", "http://qwen36:11434")
PHI_BASE  = os.getenv("PHI_URL",  "http://phi4mini:11434")
QWEN_MODEL = os.getenv("QWEN_MODEL", "qwen2.5:7b-instruct")
PHI_MODEL  = os.getenv("PHI_MODEL",  "phi4-mini")

# Keywords that route to Qwen (coding / reasoning)
QWEN_KEYWORDS = {
    "code", "python", "javascript", "typescript", "function", "class", "debug",
    "sql", "algorithm", "implement", "refactor", "analyze", "error", "bug",
    "test", "api", "docker", "terraform", "component", "module", "import",
}

def pick_backend(prompt: str) -> tuple[str, str]:
    lower = prompt.lower()
    if any(kw in lower for kw in QWEN_KEYWORDS):
        return QWEN_BASE, QWEN_MODEL
    return PHI_BASE, PHI_MODEL


async def ollama_chat(base_url: str, model: str, payload: dict) -> dict:
    """Forward an OpenAI-style /v1/chat/completions to Ollama."""
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(f"{base_url}/v1/chat/completions", json={**payload, "model": model})
        r.raise_for_status()
        return r.json()


# ── OpenAI-compatible endpoint (used by Continue.dev & OpenHands) ──────────
@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    body = await request.json()
    prompt_text = " ".join(
        m.get("content", "") for m in body.get("messages", [])
        if isinstance(m.get("content"), str)
    )
    base_url, model = pick_backend(prompt_text)

    try:
        result = await ollama_chat(base_url, model, body)
        return JSONResponse(result)
    except Exception as primary_err:
        # Automatic fallback to the other model
        fallback_base = PHI_BASE if base_url == QWEN_BASE else QWEN_BASE
        fallback_model = PHI_MODEL if model == QWEN_MODEL else QWEN_MODEL
        try:
            result = await ollama_chat(fallback_base, fallback_model, body)
            return JSONResponse(result)
        except Exception as fallback_err:
            return JSONResponse(
                {"error": f"Both models failed. Primary: {primary_err}. Fallback: {fallback_err}"},
                status_code=502,
            )


# ── Ollama-native generate (legacy) ────────────────────────────────────────
@app.post("/api/generate")
async def generate(request: Request):
    body = await request.json()
    prompt = body.get("prompt", "")
    base_url, model = pick_backend(prompt)
    if "model" not in body:
        body = {**body, "model": model}
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(f"{base_url}/api/generate", json=body)
        r.raise_for_status()
        return JSONResponse(r.json())


# ── Health / status endpoints ───────────────────────────────────────────────
@app.get("/health")
async def health():
    statuses = {}
    async with httpx.AsyncClient(timeout=5) as client:
        for name, url in [("qwen", QWEN_BASE), ("phi", PHI_BASE)]:
            try:
                r = await client.get(f"{url}/api/tags")
                statuses[name] = "healthy" if r.status_code == 200 else "unreachable"
            except Exception:
                statuses[name] = "unreachable"
    return {"status": "ok", **statuses}


@app.get("/models")
async def models():
    return {
        "primary":  f"{QWEN_MODEL} @ {QWEN_BASE} — coding & reasoning",
        "fallback": f"{PHI_MODEL} @ {PHI_BASE} — quick & lightweight",
        "routing":  "Automatic based on prompt keywords",
    }


@app.get("/v1/models")
async def openai_models():
    """OpenAI-compatible model list so Continue.dev can discover models."""
    return {
        "object": "list",
        "data": [
            {"id": QWEN_MODEL, "object": "model", "owned_by": "ollama"},
            {"id": PHI_MODEL,  "object": "model", "owned_by": "ollama"},
        ],
    }
