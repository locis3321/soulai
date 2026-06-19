from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class BirthData(BaseModel):
    name: str
    birth_date: str  # YYYY-MM-DD
    birth_time: str  # HH:MM
    birth_place: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class AstrologyResponse(BaseModel):
    sun_sign: str
    moon_sign: str
    rising_sign: str
    planets: dict
    houses: dict
    aspects: list
    reading: str


@router.post("/natal-chart", response_model=AstrologyResponse)
async def calculate_natal_chart(birth_data: BirthData):
    """
    Calculate natal chart based on birth data
    """
    try:
        # Parse birth data
        birth_datetime = datetime.strptime(
            f"{birth_data.birth_date} {birth_data.birth_time}",
            "%Y-%m-%d %H:%M"
        )

        # Use Kerykeion for calculation
        from kerykeion import KrInstance
        
        # Create person instance
        person = KrInstance(
            name=birth_data.name,
            year=birth_datetime.year,
            month=birth_datetime.month,
            day=birth_datetime.day,
            hour=birth_datetime.hour,
            minute=birth_datetime.minute,
            city=birth_data.birth_place,
            nation="TH",  # Default to Thailand
        )

        # Extract planetary positions
        planets = {
            "sun": person.sun.sign,
            "moon": person.moon.sign,
            "mercury": person.mercury.sign,
            "venus": person.venus.sign,
            "mars": person.mars.sign,
            "jupiter": person.jupiter.sign,
            "saturn": person.saturn.sign,
            "uranus": person.uranus.sign,
            "neptune": person.neptune.sign,
            "pluto": person.pluto.sign,
        }

        # Extract house positions
        houses = {
            "house_1": person.first_house.sign,
            "house_2": person.second_house.sign,
            "house_3": person.third_house.sign,
            "house_4": person.fourth_house.sign,
            "house_5": person.fifth_house.sign,
            "house_6": person.sixth_house.sign,
            "house_7": person.seventh_house.sign,
            "house_8": person.eighth_house.sign,
            "house_9": person.ninth_house.sign,
            "house_10": person.tenth_house.sign,
            "house_11": person.eleventh_house.sign,
            "house_12": person.twelfth_house.sign,
        }

        # Extract aspects
        aspects = []
        # Kerykeion provides aspects, we'll extract them
        # This is a simplified version

        # Generate reading
        reading = generate_reading(planets, houses)

        return AstrologyResponse(
            sun_sign=person.sun.sign,
            moon_sign=person.moon.sign,
            rising_sign=person.first_house.sign,
            planets=planets,
            houses=houses,
            aspects=aspects,
            reading=reading,
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def generate_reading(planets: dict, houses: dict) -> str:
    """
    Generate a reading based on planetary positions
    """
    sun_sign = planets.get("sun", "Unknown")
    moon_sign = planets.get("moon", "Unknown")
    rising_sign = houses.get("house_1", "Unknown")

    reading = f"""
## Your Natal Chart Analysis

### Sun in {sun_sign}
Your core identity and life purpose are influenced by {sun_sign} energy. 
This represents your fundamental nature and how you express yourself.

### Moon in {moon_sign}
Your emotional inner world is shaped by {moon_sign} energy.
This reflects your instincts, habits, and emotional needs.

### Rising Sign: {rising_sign}
Your outer persona and how others perceive you is influenced by {rising_sign}.
This is the mask you wear and how you approach new situations.

### Key Themes
- Self-expression through {sun_sign} qualities
- Emotional security through {moon_sign} characteristics
- First impressions shaped by {rising_sign} energy

This is a basic interpretation. A full reading would include detailed analysis of all planetary positions, houses, and aspects.
"""
    return reading


@router.post("/compatibility")
async def calculate_compatibility(person1: BirthData, person2: BirthData):
    """
    Calculate compatibility between two people
    """
    # TODO: Implement compatibility calculation
    return {"message": "Compatibility calculation - TODO"}
