from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

router = APIRouter()


class ZiWeiRequest(BaseModel):
    name: str
    birth_date: str  # YYYY-MM-DD
    birth_time: str  # HH:MM
    gender: str  # male or female


class ZiWeiResponse(BaseModel):
    palaces: Dict[str, Any]
    stars: Dict[str, Any]
    reading: str


@router.post("/calculate", response_model=ZiWeiResponse)
async def calculate_ziwei(request: ZiWeiRequest):
    """
    Calculate Zi Wei Dou Shu (Purple Star Astrology) chart
    """
    try:
        # Parse birth data
        birth_datetime = datetime.strptime(
            f"{request.birth_date} {request.birth_time}",
            "%Y-%m-%d %H:%M"
        )

        # For MVP, return mock data
        # In production, use iztro library
        palaces = {
            "life": {
                "name": "命宫",
                "stars": ["紫微", "左辅"],
                "description": "代表核心性格、外貌、人生大方向",
                "rating": "大吉"
            },
            "siblings": {
                "name": "兄弟宫",
                "stars": ["天机", "天梁"],
                "description": "代表兄弟姐妹、朋友关系",
                "rating": "吉"
            },
            "spouse": {
                "name": "夫妻宫",
                "stars": ["太阳", "太阴"],
                "description": "代表婚姻、感情、伴侣关系",
                "rating": "中吉"
            },
            "children": {
                "name": "子女宫",
                "stars": ["武曲", "天相"],
                "description": "代表子女、创造力、投资",
                "rating": "吉"
            },
            "wealth": {
                "name": "财帛宫",
                "stars": ["天府", "禄存"],
                "description": "代表财运、收入、理财能力",
                "rating": "大吉"
            },
            "health": {
                "name": "疾厄宫",
                "stars": ["天同", "巨门"],
                "description": "代表健康、疾病、意外",
                "rating": "平"
            },
            "travel": {
                "name": "迁移宫",
                "stars": ["七杀", "破军"],
                "description": "代表外出、旅行、迁移",
                "rating": "小凶"
            },
            "friends": {
                "name": "交友宫",
                "stars": ["天梁", "天同"],
                "description": "代表朋友、同事、社交",
                "rating": "吉"
            },
            "career": {
                "name": "官禄宫",
                "stars": ["紫微", "天府"],
                "description": "代表事业、工作、名声",
                "rating": "大吉"
            },
            "property": {
                "name": "田宅宫",
                "stars": ["太阴", "天机"],
                "description": "代表房产、家庭、根基",
                "rating": "中吉"
            },
            "fortune": {
                "name": "福德宫",
                "stars": ["天同", "太阴"],
                "description": "代表精神生活、兴趣、享受",
                "rating": "吉"
            },
            "parents": {
                "name": "父母宫",
                "stars": ["武曲", "七杀"],
                "description": "代表父母、长辈、上司",
                "rating": "平"
            }
        }

        stars = {
            "ziwei": {"name": "紫微星", "meaning": "帝王星，主贵气、领导力"},
            "tianji": {"name": "天机星", "meaning": "智慧星，主聪明、变通"},
            "taiyang": {"name": "太阳星", "meaning": "光明星，主热情、博爱"},
            "wuqu": {"name": "武曲星", "meaning": "财星，主财富、果断"},
            "tiantong": {"name": "天同星", "meaning": "福星，主享受、安逸"},
            "lianzhen": {"name": "廉贞星", "meaning": "次桃花星，主人缘、情绪"},
            "tianfu": {"name": "天府星", "meaning": "库星，主稳定、收藏"},
            "taiyin": {"name": "太阴星", "meaning": "月亮星，主温柔、细腻"},
            "tanlang": {"name": "贪狼星", "meaning": "桃花星，主欲望、才艺"},
            "jumen": {"name": "巨门星", "meaning": "口舌星，主口才、是非"},
            "tianxiang": {"name": "天相星", "meaning": "印星，主服务、辅佐"},
            "tianliang": {"name": "天梁星", "meaning": "荫星，主荫庇、逢凶化吉"},
            "qisha": {"name": "七杀星", "meaning": "将星，主冲劲、开创"},
            "pojun": {"name": "破军星", "meaning": "耗星，主变动、破旧立新"}
        }

        reading = generate_ziwei_reading(palaces, stars, request.gender)

        return ZiWeiResponse(
            palaces=palaces,
            stars=stars,
            reading=reading
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def generate_ziwei_reading(palaces: Dict, stars: Dict, gender: str) -> str:
    """
    Generate a Zi Wei Dou Shu reading
    """
    life_palace = palaces.get("life", {})
    career_palace = palaces.get("career", {})
    wealth_palace = palaces.get("wealth", {})
    spouse_palace = palaces.get("spouse", {})

    reading = f"""
## 紫微斗数命盘解读

### 命宫主星：{', '.join(life_palace.get('stars', []))}
{life_palace.get('description', '')}

### 性格特点
根据命宫星曜配置，您具有以下特质：
- 领导能力强，有主见
- 聪明机智，善于变通
- 有贵人相助，人缘好

### 事业运势
官禄宫显示：{career_palace.get('description', '')}
事业宫评级：{career_palace.get('rating', '平')}
- 适合从事管理、策划、咨询等工作
- 有创业潜力，但需谨慎决策

### 财运分析
财帛宫显示：{wealth_palace.get('description', '')}
财运评级：{wealth_palace.get('rating', '平')}
- 财运稳定，善于理财
- 适合长期投资，避免投机

### 感情婚姻
夫妻宫显示：{spouse_palace.get('description', '')}
感情评级：{spouse_palace.get('rating', '平')}
- 感情丰富，重视精神交流
- 婚姻美满，但需注意沟通

### 健康提醒
注意心脏、眼睛方面的保健
保持规律作息，避免过度劳累

---
*此解读仅供参考，具体运势需结合大运、流年综合分析。*
"""
    return reading
