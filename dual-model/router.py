from fastapi import FastAPI, Request
import requests

app = FastAPI()

QWEN_URL = "http://qwen36:11434/api/generate"
PHI_URL = "http://phi4mini:11434/api/generate"

@app.post("/generate")
async def generate(request: Request):
    data = await request.json()
    prompt = data.get("prompt", "")

    # Simple routing logic
    if "code" in prompt.lower() or "python" in prompt.lower() or "function" in prompt.lower():
        target_url = QWEN_URL
        model = "qwen:7b-instruct"
    else:
        target_url = PHI_URL
        model = "phi"

    # Ensure model is specified
    if "model" not in data:
        data["model"] = model

    response = requests.post(target_url, json=data)
    return response.json()

@app.get("/health")
async def health():
    return {"status": "ok", "qwen": "http://qwen36:11434", "phi": "http://phi4mini:11434"}

@app.get("/models")
async def models():
    return {
        "primary": "Qwen 3.6 (7B-instruct) - Strong coding & reasoning",
        "fallback": "Phi-4 mini - Lightweight & fast",
        "routing": "Automatic based on prompt keywords"
    }
