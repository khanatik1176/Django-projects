import json
import re
import urllib.error
import urllib.request
from typing import Iterable

from django.conf import settings

SYSTEM_PROMPT = (
    "You are Bhandar Assistant, a helpful support bot for Bhandar — an inventory "
    "management platform for Bangladesh retailers and distributors. Answer briefly "
    "and clearly about inventory, warehouses, purchase orders, sales orders, stock "
    "movements, and how to use the product. If unsure, suggest signing up or "
    "contacting support at support@bhandar.app."
)

FAQ_RESPONSES: list[tuple[Iterable[str], str]] = [
    (
        ("what is bhandar", "about bhandar", "what do you do"),
        "Bhandar is an inventory management system built for Bangladesh businesses. "
        "It helps you track stock across warehouses, manage purchase and sales orders, "
        "and keep a full audit trail of every stock movement.",
    ),
    (
        ("purchase order", "po ", "procurement", "receive stock"),
        "Purchase orders let you order stock from suppliers. Create a PO in draft, add "
        "line items, submit it, then receive stock into your chosen warehouse. Received "
        "quantities update on-hand inventory automatically.",
    ),
    (
        ("sales order", "so ", "fulfill", "customer order"),
        "Sales orders track outbound customer orders. After creating a draft SO, confirm "
        "it to reserve stock, then fulfill line items to issue inventory from the warehouse.",
    ),
    (
        ("warehouse", "multi-warehouse", "location"),
        "You can manage multiple warehouses — for example Dhaka hub, Chattogram branch, "
        "or retail stores. Stock levels, transfers, and movements are tracked per warehouse.",
    ),
    (
        ("low stock", "reorder", "out of stock"),
        "Bhandar flags products below their reorder level on the dashboard. Check the "
        "Low Stock report and create a purchase order to replenish.",
    ),
    (
        ("price", "pricing", "cost", "free", "plan"),
        "You can start free with core inventory features. Sign up from the landing page "
        "to create your account and explore the dashboard — no credit card required.",
    ),
    (
        ("login", "sign in", "register", "sign up", "account"),
        "Use Sign up to create an account, or Sign in if you already have one. After "
        "login you'll reach the dashboard with stock, orders, and reports.",
    ),
    (
        ("movement", "transfer", "audit", "history"),
        "Every receipt, issue, adjustment, and transfer is logged as a stock movement "
        "with before/after quantities so your team can audit inventory changes.",
    ),
    (
        ("bangladesh", "bdt", "taka", "local"),
        "Bhandar is designed for Bangladesh: BDT pricing, local supplier workflows, "
        "and multi-city warehouse operations from Motijheel to Chattogram.",
    ),
    (
        ("hello", "hi", "hey", "salam", "assalam"),
        "Hello! I'm the Bhandar assistant. Ask me about inventory, purchase orders, "
        "sales orders, warehouses, or how to get started.",
    ),
    (
        ("help", "support", "contact"),
        "I can explain how Bhandar works. For account issues email support@bhandar.app "
        "or use Sign up / Sign in links on this page.",
    ),
]


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _faq_reply(message: str) -> str | None:
    normalized = _normalize(message)
    for keywords, reply in FAQ_RESPONSES:
        if any(keyword in normalized for keyword in keywords):
            return reply
    return None


def _call_groq(message: str, history: list[dict]) -> str | None:
    api_key = getattr(settings, "GROQ_API_KEY", "") or ""
    if not api_key:
        return None

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for item in history[-8:]:
        role = item.get("role")
        content = item.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": message})

    payload = json.dumps(
        {
            "model": "llama-3.1-8b-instant",
            "messages": messages,
            "max_tokens": 400,
            "temperature": 0.6,
        }
    ).encode()

    request = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            data = json.loads(response.read().decode())
        return data["choices"][0]["message"]["content"].strip()
    except (urllib.error.URLError, urllib.error.HTTPError, KeyError, IndexError, json.JSONDecodeError):
        return None


def _call_huggingface(message: str) -> str | None:
    api_key = getattr(settings, "HF_API_TOKEN", "") or ""
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    prompt = f"{SYSTEM_PROMPT}\n\nUser: {message}\nAssistant:"
    payload = json.dumps(
        {
            "inputs": prompt,
            "parameters": {"max_new_tokens": 250, "return_full_text": False},
        }
    ).encode()

    request = urllib.request.Request(
        "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
        data=payload,
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            data = json.loads(response.read().decode())
        if isinstance(data, list) and data:
            text = data[0].get("generated_text", "")
            return text.strip() if text else None
        if isinstance(data, dict) and data.get("generated_text"):
            return str(data["generated_text"]).strip()
    except (urllib.error.URLError, urllib.error.HTTPError, KeyError, json.JSONDecodeError):
        return None
    return None


def get_chat_reply(*, message: str, history: list[dict] | None = None) -> dict:
    history = history or []
    cleaned = message.strip()
    if not cleaned:
        return {
            "reply": "Please type a message so I can help you.",
            "source": "local",
        }

    faq = _faq_reply(cleaned)
    if faq:
        return {"reply": faq, "source": "local"}

    ai_reply = _call_groq(cleaned, history) or _call_huggingface(cleaned)
    if ai_reply:
        return {"reply": ai_reply, "source": "ai"}

    return {
        "reply": (
            "I'm not sure about that yet. Try asking about purchase orders, sales orders, "
            "warehouses, stock movements, or how to sign up. You can also email "
            "support@bhandar.app for help."
        ),
        "source": "local",
    }
