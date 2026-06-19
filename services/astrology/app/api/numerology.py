from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class NumerologyRequest(BaseModel):
    name: str
    birth_date: str  # YYYY-MM-DD


class NumerologyResponse(BaseModel):
    life_path_number: int
    destiny_number: int
    soul_number: int
    personality_number: int
    reading: str


@router.post("/calculate", response_model=NumerologyResponse)
async def calculate_numerology(request: NumerologyRequest):
    """
    Calculate numerology numbers based on name and birth date
    """
    try:
        # Parse birth date
        birth_date = datetime.strptime(request.birth_date, "%Y-%m-%d")

        # Calculate Life Path Number
        life_path_number = calculate_life_path_number(birth_date)

        # Calculate Destiny Number (from full name)
        destiny_number = calculate_destiny_number(request.name)

        # Calculate Soul Number (from vowels)
        soul_number = calculate_soul_number(request.name)

        # Calculate Personality Number (from consonants)
        personality_number = calculate_personality_number(request.name)

        # Generate reading
        reading = generate_numerology_reading(
            request.name,
            life_path_number,
            destiny_number,
            soul_number,
            personality_number
        )

        return NumerologyResponse(
            life_path_number=life_path_number,
            destiny_number=destiny_number,
            soul_number=soul_number,
            personality_number=personality_number,
            reading=reading,
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def reduce_to_single_digit(number: int) -> int:
    """
    Reduce a number to a single digit (except master numbers 11, 22, 33)
    """
    while number > 9 and number not in [11, 22, 33]:
        number = sum(int(d) for d in str(number))
    return number


def calculate_life_path_number(birth_date: datetime) -> int:
    """
    Calculate Life Path Number from birth date
    """
    # Sum all digits of the birth date
    date_str = birth_date.strftime("%Y%m%d")
    total = sum(int(d) for d in date_str)
    return reduce_to_single_digit(total)


def calculate_destiny_number(name: str) -> int:
    """
    Calculate Destiny Number from full name
    """
    # Pythagorean numerology values
    values = {
        'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9,
        'j': 1, 'k': 2, 'l': 3, 'm': 4, 'n': 5, 'o': 6, 'p': 7, 'q': 8, 'r': 9,
        's': 1, 't': 2, 'u': 3, 'v': 4, 'w': 5, 'x': 6, 'y': 7, 'z': 8
    }
    
    total = sum(values.get(c, 0) for c in name.lower() if c.isalpha())
    return reduce_to_single_digit(total)


def calculate_soul_number(name: str) -> int:
    """
    Calculate Soul Number (from vowels in name)
    """
    vowels = 'aeiou'
    values = {'a': 1, 'e': 5, 'i': 9, 'o': 6, 'u': 3}
    
    total = sum(values.get(c, 0) for c in name.lower() if c in vowels)
    return reduce_to_single_digit(total)


def calculate_personality_number(name: str) -> int:
    """
    Calculate Personality Number (from consonants in name)
    """
    vowels = 'aeiou'
    values = {
        'b': 2, 'c': 3, 'd': 4, 'f': 6, 'g': 7, 'h': 8, 'j': 1, 'k': 2,
        'l': 3, 'm': 4, 'n': 5, 'p': 7, 'q': 8, 'r': 9, 's': 1, 't': 2,
        'v': 4, 'w': 5, 'x': 6, 'y': 7, 'z': 8
    }
    
    total = sum(values.get(c, 0) for c in name.lower() if c.isalpha() and c not in vowels)
    return reduce_to_single_digit(total)


def generate_numerology_reading(
    name: str,
    life_path: int,
    destiny: int,
    soul: int,
    personality: int
) -> str:
    """
    Generate a numerology reading
    """
    reading = f"""
## Numerology Analysis for {name}

### Your Core Numbers

#### Life Path Number: {life_path}
{get_life_path_meaning(life_path)}

#### Destiny Number: {destiny}
{get_destiny_meaning(destiny)}

#### Soul Number: {soul}
{get_soul_meaning(soul)}

#### Personality Number: {personality}
{get_personality_meaning(personality)}

### Summary
Your numerology profile shows a combination of {life_path}, {destiny}, {soul}, and {personality} energies.
This unique combination shapes your life purpose, talents, and how you interact with the world.
"""
    return reading


def get_life_path_meaning(number: int) -> str:
    meanings = {
        1: "The Leader - Independent, ambitious, and pioneering",
        2: "The Diplomat - Cooperative, sensitive, and peace-loving",
        3: "The Creative - Expressive, artistic, and social",
        4: "The Builder - Practical, organized, and hardworking",
        5: "The Freedom Seeker - Adventurous, versatile, and freedom-loving",
        6: "The Nurturer - Responsible, caring, and family-oriented",
        7: "The Seeker - Analytical, spiritual, and introspective",
        8: "The Powerhouse - Ambitious, successful, and material-focused",
        9: "The Humanitarian - Compassionate, idealistic, and generous",
        11: "The Intuitive Master - Highly intuitive, inspirational, and visionary",
        22: "The Master Builder - Powerful manifestor, practical idealist",
        33: "The Master Teacher - Spiritual teacher, healer, and inspirer",
    }
    return meanings.get(number, "Unique and special energy")


def get_destiny_meaning(number: int) -> str:
    meanings = {
        1: "Your destiny is to lead and innovate",
        2: "Your destiny is to cooperate and bring harmony",
        3: "Your destiny is to create and inspire",
        4: "Your destiny is to build and organize",
        5: "Your destiny is to explore and experience freedom",
        6: "Your destiny is to nurture and serve",
        7: "Your destiny is to seek truth and wisdom",
        8: "Your destiny is to achieve material success",
        9: "Your destiny is to serve humanity",
        11: "Your destiny is to inspire and illuminate",
        22: "Your destiny is to build great things",
        33: "Your destiny is to teach and heal",
    }
    return meanings.get(number, "A unique and special destiny")


def get_soul_meaning(number: int) -> str:
    meanings = {
        1: "Your soul desires independence and leadership",
        2: "Your soul desires peace and partnership",
        3: "Your soul desires creative expression",
        4: "Your soul desires stability and order",
        5: "Your soul desires freedom and adventure",
        6: "Your soul desires love and family",
        7: "Your soul desires knowledge and spirituality",
        8: "Your soul desires power and success",
        9: "Your soul desires to help others",
        11: "Your soul desires spiritual enlightenment",
        22: "Your soul desires to build lasting legacy",
        33: "Your soul desires to teach and uplift",
    }
    return meanings.get(number, "Unique soul desires")


def get_personality_meaning(number: int) -> str:
    meanings = {
        1: "You appear confident and independent",
        2: "You appear cooperative and diplomatic",
        3: "You appear creative and expressive",
        4: "You appear practical and reliable",
        5: "You appear adventurous and dynamic",
        6: "You appear caring and responsible",
        7: "You appear analytical and mysterious",
        8: "You appear successful and powerful",
        9: "You appear compassionate and wise",
        11: "You appear intuitive and inspiring",
        22: "You appear capable and visionary",
        33: "You appear wise and nurturing",
    }
    return meanings.get(number, "Unique personality expression")
