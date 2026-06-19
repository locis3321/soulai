from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class BaZiRequest(BaseModel):
    name: str
    birth_date: str  # YYYY-MM-DD
    birth_time: str  # HH:MM
    gender: str  # male or female


class BaZiResponse(BaseModel):
    year_pillar: dict
    month_pillar: dict
    day_pillar: dict
    hour_pillar: dict
    five_elements: dict
    reading: str


@router.post("/calculate", response_model=BaZiResponse)
async def calculate_bazi(request: BaZiRequest):
    """
    Calculate BaZi (Eight Characters) based on birth data
    """
    try:
        # Parse birth data
        birth_datetime = datetime.strptime(
            f"{request.birth_date} {request.birth_time}",
            "%Y-%m-%d %H:%M"
        )

        # Use lunar-python for calculation
        from lunar_python import Lunar, Solar
        
        # Convert to lunar calendar
        solar = Solar.fromYmdHms(
            birth_datetime.year,
            birth_datetime.month,
            birth_datetime.day,
            birth_datetime.hour,
            birth_datetime.minute,
            0
        )
        lunar = solar.getLunar()

        # Get BaZi (Eight Characters)
        year_pillar = {
            "stem": lunar.getYearGan(),
            "branch": lunar.getYearZhi(),
            "element": get_element(lunar.getYearGan()),
        }

        month_pillar = {
            "stem": lunar.getMonthGan(),
            "branch": lunar.getMonthZhi(),
            "element": get_element(lunar.getMonthGan()),
        }

        day_pillar = {
            "stem": lunar.getDayGan(),
            "branch": lunar.getDayZhi(),
            "element": get_element(lunar.getDayGan()),
        }

        hour_pillar = {
            "stem": lunar.getTimeGan(),
            "branch": lunar.getTimeZhi(),
            "element": get_element(lunar.getTimeGan()),
        }

        # Calculate five elements distribution
        five_elements = calculate_five_elements(
            year_pillar, month_pillar, day_pillar, hour_pillar
        )

        # Generate reading
        reading = generate_bazi_reading(
            year_pillar, month_pillar, day_pillar, hour_pillar,
            five_elements, request.gender
        )

        return BaZiResponse(
            year_pillar=year_pillar,
            month_pillar=month_pillar,
            day_pillar=day_pillar,
            hour_pillar=hour_pillar,
            five_elements=five_elements,
            reading=reading,
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def get_element(stem: str) -> str:
    """
    Get the element of a Heavenly Stem
    """
    elements = {
        "甲": "Wood", "乙": "Wood",
        "丙": "Fire", "丁": "Fire",
        "戊": "Earth", "己": "Earth",
        "庚": "Metal", "辛": "Metal",
        "壬": "Water", "癸": "Water",
    }
    return elements.get(stem, "Unknown")


def calculate_five_elements(year, month, day, hour) -> dict:
    """
    Calculate the distribution of five elements
    """
    elements = {"Wood": 0, "Fire": 0, "Earth": 0, "Metal": 0, "Water": 0}
    
    for pillar in [year, month, day, hour]:
        element = pillar["element"]
        if element in elements:
            elements[element] += 1

    # Calculate percentages
    total = sum(elements.values())
    percentages = {k: round(v / total * 100) for k, v in elements.items()}
    
    return {
        "counts": elements,
        "percentages": percentages,
    }


def generate_bazi_reading(year, month, day, hour, five_elements, gender) -> str:
    """
    Generate a BaZi reading
    """
    day_master = day["element"]
    
    reading = f"""
## BaZi (Four Pillars of Destiny) Analysis

### Your Four Pillars

| Pillar | Heavenly Stem | Earthly Branch | Element |
|--------|---------------|----------------|---------|
| Year   | {year['stem']} | {year['branch']} | {year['element']} |
| Month  | {month['stem']} | {month['branch']} | {month['element']} |
| Day    | {day['stem']} | {day['branch']} | {day['element']} |
| Hour   | {hour['stem']} | {hour['branch']} | {hour['element']} |

### Day Master: {day_master}
Your Day Master represents your core self. As a {day_master} Day Master, you have the characteristics of {day_master} energy.

### Five Elements Distribution
- Wood: {five_elements['percentages']['Wood']}%
- Fire: {five_elements['percentages']['Fire']}%
- Earth: {five_elements['percentages']['Earth']}%
- Metal: {five_elements['percentages']['Metal']}%
- Water: {five_elements['percentages']['Water']}%

### Personality Traits
Based on your Day Master ({day_master}), you tend to be:
- {get_personality_traits(day_master)}

### Recommendations
- Strengthen your weak elements through colors, food, and activities
- Balance your strong elements to maintain harmony
"""
    return reading


def get_personality_traits(element: str) -> str:
    """
    Get personality traits based on element
    """
    traits = {
        "Wood": "Growth-oriented, creative, flexible, and compassionate",
        "Fire": "Passionate, enthusiastic, charismatic, and dynamic",
        "Earth": "Stable, reliable, practical, and nurturing",
        "Metal": "Disciplined, organized, focused, and determined",
        "Water": "Intuitive, adaptable, wise, and flowing",
    }
    return traits.get(element, "Balanced and versatile")
