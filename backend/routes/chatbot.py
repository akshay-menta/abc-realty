import re
from flask import Blueprint, request, jsonify
from models import Property
from services.llm_service import LLMService

chatbot_bp = Blueprint("chatbot", __name__)
llm = LLMService()

SYSTEM_PROMPT = """You are a friendly and knowledgeable real estate assistant for ABC Realty.
Help users find properties and answer listing questions using ONLY the inventory data provided below.

Rules:
- Use ONLY properties listed in the inventory. Never invent listings, prices, or bedroom counts.
- If MATCHING PROPERTIES is present, answer ONLY from that list for the user's criteria.
- If MATCHING PROPERTIES is empty or says none, say you don't have listings that match and optionally suggest browsing all inventory.
- Keep answers concise (2-4 sentences) unless listing multiple homes.
- When listing homes, include: name, beds/baths, price, city, and whether it is Open or Closed.
- End with an offer to help further.
"""


@chatbot_bp.route("", methods=["POST"])
def chat():
    data = request.get_json()
    if not data or not data.get("message"):
        return jsonify({"error": "Message is required"}), 400

    user_message = data["message"]
    conversation_history = data.get("history", [])

    filters = _extract_filters(user_message)
    has_criteria = bool(filters)
    matching = _query_properties(filters, limit=15) if has_criteria else []
    inventory = _query_properties({}, limit=25)

    if has_criteria:
        if matching:
            matching_block = _format_properties(
                matching,
                "MATCHING PROPERTIES (answer ONLY from these for the user's criteria)",
            )
        else:
            matching_block = (
                "MATCHING PROPERTIES: none — no listings match the user's criteria."
            )
    else:
        matching_block = ""

    inventory_block = _format_properties(inventory, "FULL INVENTORY (for general questions only)")

    context = "\n\n".join(block for block in (matching_block, inventory_block) if block)
    if not context:
        context = "CURRENT INVENTORY: No published or closed listings are available right now."

    messages = []
    for turn in conversation_history[-8:]:
        if turn.get("role") in ("user", "assistant"):
            messages.append({"role": turn["role"], "content": turn["content"]})

    if has_criteria:
        instruction = (
            "The user asked with specific criteria. "
            "Answer using MATCHING PROPERTIES only. Do not list unrelated homes from FULL INVENTORY."
        )
    else:
        instruction = "Answer using FULL INVENTORY."

    enriched_user = (
        f"{context}\n\n"
        f"User question: {user_message}\n\n"
        f"{instruction}"
    )
    messages.append({"role": "user", "content": enriched_user})

    response = llm.chat(messages, system_prompt=SYSTEM_PROMPT)

    offline_markers = (
        "offline",
        "API key is missing",
        "not configured",
        "Groq error",
        "Gemini error",
        "OpenAI error",
        "Anthropic error",
    )
    if any(m.lower() in response.lower() for m in offline_markers):
        response = _fallback_answer(filters, matching, inventory)

    return jsonify({
        "response": response,
        "matches": len(matching),
        "filters": filters,
    }), 200


def _fallback_answer(filters: dict, matching, inventory) -> str:
    has_criteria = bool(filters)
    if has_criteria and not matching:
        bits = []
        if filters.get("bedrooms") is not None:
            bits.append(f"{filters['bedrooms']}-bedroom")
        if filters.get("listing_type"):
            bits.append(f"for {filters['listing_type']}")
        if filters.get("city"):
            bits.append(f"in {filters['city']}")
        label = " ".join(bits) or "that"
        return (
            f"I don't currently have any {label} listings in our open/closed inventory. "
            "Want me to show other bedroom counts, or filter by city or Open vs Closed?"
        )

    source = matching if has_criteria else inventory[:6]
    if not source:
        return (
            "I don't see any open or closed listings in inventory right now. "
            "Please check back soon or contact ABC Realty directly."
        )

    lines = []
    if has_criteria:
        lines.append("Here's what matches your request:")
    else:
        lines.append("Here are some current listings:")

    for p in source[:8]:
        status = "Closed" if p.status == "closed" else "Open"
        price = f"${p.price:,.0f}{p.price_period or ''}"
        lines.append(
            f"• {p.title} — {p.bedrooms} bed / {p.bathrooms} bath — {price} — "
            f"{p.city}, {p.state} ({status}, for {p.listing_type})"
        )
    lines.append("Want me to narrow by city, price, or Open vs Closed?")
    return "\n".join(lines)


def _extract_filters(message: str) -> dict:
    """Pull structured search hints from natural language."""
    text = message.lower()
    filters = {}

    # Matches: "3 bedroom", "3-bedroom", "3 bed", "3br", "3 BR homes"
    beds = re.search(r"(\d+)\s*-?\s*(?:bed(?:room)?s?|br)\b", text)
    if beds:
        filters["bedrooms"] = int(beds.group(1))
    else:
        beds_word = re.search(
            r"\b(one|two|three|four|five)\s*-?\s*(?:bed(?:room)?s?|br)\b",
            text,
        )
        word_map = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5}
        if beds_word:
            filters["bedrooms"] = word_map[beds_word.group(1)]

    baths = re.search(r"(\d+(?:\.\d+)?)\s*-?\s*(?:bath(?:room)?s?|ba)\b", text)
    if baths:
        filters["bathrooms"] = float(baths.group(1))

    if re.search(r"\b(for\s+sale|buy|buying|purchase)\b", text):
        filters["listing_type"] = "sale"
    elif re.search(r"\b(for\s+lease|lease|rent|rental|renting)\b", text):
        filters["listing_type"] = "lease"

    if re.search(r"\b(open|available|active|listed)\b", text):
        filters["status"] = "published"
    elif re.search(r"\b(closed|sold)\b", text):
        filters["status"] = "closed"

    city_match = re.search(
        r"\bin\s+([A-Za-z][A-Za-z\s]{1,30}?)(?:\s*,|\s+tx\b|\s+texas\b|[?.!]|$)",
        message,
        re.I,
    )
    if city_match:
        city = city_match.group(1).strip()
        if city.lower() not in {"sale", "lease", "the", "a", "an", "our", "your", "any"}:
            filters["city"] = city

    price = re.search(r"under\s*\$?\s*([\d,]+)", text)
    if price:
        filters["price_max"] = float(price.group(1).replace(",", ""))

    return filters


def _query_properties(filters: dict, limit: int = 20):
    """Query public inventory (published/open + closed). Never return drafts."""
    try:
        query = Property.query.filter(
            Property.status.in_(["published", "closed", "under_contract"])
        )

        if filters.get("listing_type"):
            query = query.filter_by(listing_type=filters["listing_type"])

        if filters.get("status") == "published":
            query = query.filter(Property.status.in_(["published", "under_contract"]))
        elif filters.get("status") == "closed":
            query = query.filter_by(status="closed")

        if filters.get("bathrooms") is not None:
            query = query.filter(Property.bathrooms >= filters["bathrooms"])

        if filters.get("city"):
            query = query.filter(Property.city.ilike(f"%{filters['city']}%"))

        if filters.get("price_max") is not None:
            query = query.filter(Property.price <= filters["price_max"])

        if filters.get("bedrooms") is not None:
            beds = filters["bedrooms"]
            exact = (
                query.filter(Property.bedrooms == beds)
                .order_by(Property.created_at.desc())
                .limit(limit)
                .all()
            )
            if exact:
                return exact
            # No exact match — do not broaden to other bedroom counts for chat answers
            return []

        return query.order_by(Property.created_at.desc()).limit(limit).all()
    except Exception:
        return []


def _format_properties(props, heading: str) -> str:
    if not props:
        return ""

    lines = [f"{heading}:"]
    for p in props:
        public_status = "Closed" if p.status == "closed" else "Open"
        price_str = f"${p.price:,.0f}{p.price_period or ''}"
        lines.append(
            f"- {p.title} | For {p.listing_type} | {p.bedrooms} bed / {p.bathrooms} bath | "
            f"{p.sqft:,} sqft | {price_str} | {p.city}, {p.state} {p.zip_code} | "
            f"Type: {p.property_type} | Status: {public_status}"
        )
    return "\n".join(lines)
