import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client setup
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// -------------------------------------------------------------
// PREMIUM FALLBACK DATA GENERATORS FOR MODEL DOWN/API 503 ERROR
// -------------------------------------------------------------

function getDailyInsightBackup(name: string, mood: string, lang: string) {
  const love = Math.floor(Math.random() * 21) + 75; // 75-95
  const career = Math.floor(Math.random() * 21) + 70; // 70-90
  const finance = Math.floor(Math.random() * 21) + 70; // 70-90
  const moodScore = Math.floor(Math.random() * 21) + 75; // 75-95
  
  let dailyMessage = "";
  if (lang === "zh") {
    dailyMessage = `礼赞。今日星轨交错，缘主${name || "有缘人"}身心共鸣饱满。当前"${mood || "平静"}"之相正是菩提种子，于红尘中守本真心，万物滋长。理财须静气，工作求精进，福慧双修，万般皆遂心。`;
  } else if (lang === "vi") {
    dailyMessage = `Nam Mô Thích Ca. Cơ duyên hôm nay cho thấy năng lượng của đạo hữu ${name || "lữ khách"} rất chan hòa. Sự tĩnh lặng mang lại sự hanh thông trong mọi liên kết. Hãy tin vào quả lành mình đã gieo trồng trong tâm thức.`;
  } else if (lang === "th") {
    dailyMessage = `ขอความร่มเย็นจงมีแก่ท่าน วันนี้ดวงชะตาของ ${formatThaiName(name)} มีกระแสพลังงานสอดประสานกันอย่างดี การงานและการเงินจะดำเนินไปอย่างราบรื่นด้วยดี มีสติในการดำเนินชีวิต`;
  } else {
    dailyMessage = `Peace be with you, ${name || "seeker"}. The celestial currents are aligning in absolute balance today. Your checked mood represents a deep moment of mindfulness. Trust the natural flow of your path, and observe thoughts rising and passing without attachment.`;
  }
  
  return {
    energy: { love, career, finance, mood: moodScore },
    dailyMessage
  };
}

function formatThaiName(name: string): string {
  return name && name !== "Spiritual Wanderer" ? name : "ผู้แสวงบุญ";
}

function getAstrologyBackup(name: string, birthDate: string, lang: string) {
  let text = "";
  const clientName = name || (lang === "zh" ? "有缘人" : lang === "vi" ? "Đạo Hữu" : lang === "th" ? "ผู้แสวงบุญ" : "Seeker");
  
  if (lang === "zh") {
    text = `
# 宿命星轮盘解读: ${clientName}

由于云端佛法计算资源正处于转型期，本阅读已通过本地古法法统秘藏模型生成。基于您的生辰八字/阳历出生日期：${birthDate || "今日"}, 我们为您推演出以下元气结构：

## 1. **星曜与生肖密语 (Celestial Coordinates)**
您的守护星曜承载着深厚的土象与风象交织，与生肖因果形成微妙共振。生肖的柔韧与守护星的智慧让您生来便具备敏锐的直觉与清澈的观照力。

## 2. **本命人格曼陀罗 (Core Personality Mandala)**
您属于“静水流深”的内省格局。在日常生活中表现为温和、执着且守诺，但内心深处往往背负太多无谓的情感执念。佛法云“万法唯心造”，试着放下对完美的期许，烦恼即菩提。

## 3. **人缘宿契与爱恋和谐 (Love & Relationship Harmony)**
在亲密关系中，您富有天然的慈悲心与同理心，但也容易因为过于敏感而陷入心理内耗。与有缘人相处时，试着不迎不拒，给彼此心灵留下呼吸的空间。

## 4. **财富法界与工作事业 (Dharma & Abundance)**
您一生财禄具有坚实保障，但工作往往伴随一定的精神磨砺。唯有以“利他之心”做事，才能将世俗的工作升华为积功累德的修行资粮，获得圆满丰裕。

## 5. **近期运势开示 (Current Outlook)**
近期星轨变动迅速，切忌盲目投资或做重大生活转变。保持每日十分钟安般呼吸念佛，让正念之水洗濯浮躁。愿您行也禅，坐也禅，福慧双全。
`;
  } else if (lang === "vi") {
    text = `
# Bản Đồ Tử Vi Vạn Hành: ${clientName}

## 1. **Vũ Trụ Quỹ Đạo (Celestial Coordinates)**
Quỹ đạo sinh thần ngày ${birthDate || "hôm nay"} của bạn cho thấy sự hiện diện mạnh mẽ của các yếu tố Đất và Nước, mang lại một tính cách ôn hòa, tĩnh lặng, tựa như dòng sông mang phù sa bồi đắp cho cuộc đời.

## 2. **Nhân Cách Mandala (Core Personality Mandala)**
Mật mã nhân duyên của đạo hữu hướng về sự chánh niệm và sẻ chia. Hãy chuyển hóa những vướng mắc nội tâm thành đóa sen thanh khiết hướng thượng.

## 3. **Nhân Duyên & Hòa Hợp (Love & Relationship)**
Sự tôn trọng và thấu hiểu là chìa khóa giúp các mối quan hệ của đạo hữu vững bền. Yêu thương không sở hữu chính là hạnh nguyện cao quý nhất.

## 4. **Sự Nghiệp & Tài Lộc (Dharma & Abundance)**
Hành động thiện lành sẽ chiêu cảm phước báu vô lượng. Hãy làm việc với sự chú tâm trọn vẹn và cống hiến giá trị tốt đẹp cho cộng đồng.

## 5. **Lời Khuyên Hiện Tại (Outlook)**
Dành thời gian nuôi dưỡng định lực thông qua thiền hơi thở. An yên tự tại sẽ thu phục mọi sóng gió. Chúc đạo hữu thân tâm an lạc.
`;
  } else if (lang === "th") {
    text = `
# การวิเคราะห์ดวงชะตาสถิตฟ้า: ${clientName}

## 1. **พิกัดจักรวาล (Celestial Coordinates)**
วันเกิดคือ ${birthDate || "วันนี้"} พลังงานธาตุในตัวคุณเปิดรับกระแสของดาวพฤหัสบดีและดาวพุธอย่างลึกซึ้ง มีความเยือกเย็น สุขุม และเข้ากับผู้อื่นได้ดี

## 2. **มณฑลบุคลิกภาพ (Core Personality Mandala)**
เป็นผู้มีสัญชาตญาณอันแรงกล้า มีความเมตตาและรักความสงบเป็นที่ตั้ง แต่ในบางครั้งอาจคิดมากจนปิดกั้นตนเอง จงปล่อยวางและใช้สตินำทาง

## 3. **คู่บารมีและความรัก (Love & Relationship Harmony)**
ทางความรักเน้นความเข้าใจที่ลึกซึ้งและการสนับสนุนทางจิตวิญญาณ ควรเน้นความซื่อสัตย์และการฝึกรับฟังอย่างเข้าอกเข้าใจ

## 4. **ธรรมะและความมั่งคั่ง (Dharma & Abundance)**
การงานการเงินของคุณจัดอยู่ในกลุ่มมั่นคง หากทำประโยชน์เพื่อผู้อื่นจะส่งเสริมบารมีและนำพาลาภยศความรุ่งเรืองมาให้อย่างยั่งยืน

## 5. **บทสรุปและแนวทาง (Current Transits & Outlook)**
ดาวประจำดวงชะตากำลังเคลื่อนเข้าสู่จุดสมดุล ควรงดเว้นอบายมุขและรักษาสมาธิอย่างสม่ำเสมอเพื่อรับสิ่งดีๆ เข้ามาในชีวิต
`;
  } else {
    text = `
# Star Map Reflection: ${clientName}

Due to peak demand, this analysis is compiled from our lineage wisdom system. Based on birth date: ${birthDate || "Today"}:

## 1. **Celestial Coordinates**
Your natal planetary signatures emphasize fluid energy and grounding elements. These cosmic currents interact directly with your lineage animals to highlight a path of deep spiritual inquiry.

## 2. **Core Personality Mandala**
You harbor an observer-like quality with great emotional depth. Though deeply analytical, there is a risk of holding onto transient storms. Remember that thoughts are merely clouds passing through the vast expanse of your sky-like awareness.

## 3. **Love & Relationship Harmony**
Your connections thrive on authentic presence and psychological safety. Cultivating Loving-Kindness (Metta) first for yourself allows you to express unbound compassion toward others without losing your core balance.

## 4. **Dharma & Abundance (Career/Finance)**
Your career dharma points toward service, creativity, and wisdom integration. Financial abundance flows naturally when you align with your intrinsic path of right livelihood.

## 5. **Current Transits & Outlook**
You are transiting a cycle of self-reflection and rehydration of the soul. Spend time near nature, and breathe in 528Hz Solfeggio patterns to restore your nervous system's pitch.
`;
  }
  return { reading: text };
}

function getTarotBackup(question: string, cards: any[], lang: string) {
  const cardNames = cards && cards.length > 0
    ? cards.map((c: any) => `${c.name} (${c.isReversed ? (lang === "zh" ? "逆位" : "Reversed") : (lang === "zh" ? "正位" : "Upright")})`).join(", ")
    : (lang === "zh" ? "三圣牌" : "The Three Fates");
    
  let text = "";
  if (lang === "zh") {
    text = `
# 塔罗法界神谕: ${question || "探索前路"}

您所抽中的三世牌阵为：**${cardNames}**。以下是在云端高峰排队时临时开启的禅意神树解读：

- **【過去因 - Past Foundation】**：过往积累的经验有些已消散，但它留下的慈悲功德形成了您坚固的心理防线。不管当时是苦是乐，皆为逆增上缘。
- **【現在缘 - Present Portal】**：当下你被繁琐的外界信息遮蔽，情绪有所起伏。但逆位/正位的卡牌恰恰提醒您：万般挣扎皆来自内心的不放手。
- **【未來果 - Future Trajectory】**：觉醒之门正在开启。只要你守住正念，放下过多的分别心，前方水天一色，自然一片光明。
- **【神谕妙法开示 - Key Guide】**：请行持“无相施”或安般念。每日喝水或倾听音疗时，观想甘露清凉，自能洗净身心一时之浮躁。
`;
  } else if (lang === "vi") {
    text = `
# Trải Bài Tarot Chánh Niệm: "${question || "Định Hướng Cuộc Sống"}"

Duyên hợp đưa dắt bạn rút được các lá bài: **${cardNames}**.

- **【Quá Khứ - Past Foundation】**: Phản ánh những thói quen cũ và phước lành tích lũy. Mọi thăng trầm đã qua đều là bài học quý báu tạo nên bản lĩnh hôm nay.
- **【Hiện Tại - Present Portal】**: Bạn đang đứng trước cánh cổng chuyển hóa. Những giằng xé nội tâm nhắc nhở bạn hãy buông xả sự chấp nhặt và thực tập an trú trong hiện tại.
- **【Tương Lai - Future Trajectory】**: Con đường sáng sẽ mở ra khi đạo hữu chuyển hóa chướng ngại thành đóa hoa tuệ giác. Sự bình yên và phước lộc sẽ mọc mầm.
- **【Lời Khuyên Chánh Niệm - Key Guidance】**: Hãy hành trì thiền hành và mỉm cười nhẹ nhàng trước mọi thử thách. Vạn sự tùy duyên, tâm bình thế giới bình.
`;
  } else if (lang === "th") {
    text = `
# คำพยากรณ์ไพ่ทาโรต์นำทางชีวิต: "${question || "แนวทางการดำเนินชีวิต"}"

ชุดไพ่ที่สถิตเคียงข้างคุณ: **${cardNames}**.

- **【อดีต - รากฐานเดิม】**: บ่งบอกถึงประสบการณ์ที่คุณได้ก้าวผ่าน แม้จะมีช่วงเวลาที่ยากลำบากแต่ก็หล่อหลอมให้คุณมีความเข้มแข็งและจิตวิญญาณที่แข็งแกร่งในวันนี้
- **【ปัจจุบัน - ประตูเชื่อมโยง】**: ขณะนี้คุณกำลังเผชิญหน้ากับการตัดสินใจครั้งสำคัญ ไพ่แนะนำให้คุณนิ่งสงบ ดึงสติ และมองโลกตามความเป็นจริง
- **【อนาคต - วิถีข้างหน้า】**: หากคุณมีสติและดำเนินชีวิตด้วยศีลธรรม ประตูแห่งโอกาสและความเจริญรุ่งเรืองกำลังเปิดรอคุณอยู่ข้างหน้าอย่างดีเยี่ยม
- **【คำแนะนำสำคัญ】**: แนะนำให้ฝึกสมาธิเจริญสติวันละ 5-10 นาที เพื่อให้จิตใจสงบและเฉียบคมในการแก้ปัญหาทุกประการ
`;
  } else {
    text = `
# Tarot Alchemy Sanctuary: "${question || "General Guidance"}"

We drawn and integrated the cards: **${cardNames}**.

- **【The Past: Foundation】**: Reflects old emotional anchors and learnings. Even challenging phases have added fuel to your awareness.
- **【The Present: Portal】**: You stand in an active gateway of transformation. The drawn card indicates a call to pause, release old control mechanisms, and practice non-attachment.
- **【The Future: Destiny】**: A clean trajectory unfolds as you integrate these lessons. Expansion and restored vital energy are waiting.
- **【Key Guidance】**: Practice Metta meditation. Exhale stress and inhale spacious clarity. Trust that the universe unfolds exactly as it should.
`;
  }
  return { reading: text };
}

function getChatBackup(messages: any[], advisorKey: string, lang: string) {
  const lastUserMsg = messages[messages.length - 1]?.content || "Help me find peace.";
  let text = "";
  
  if (advisorKey === "zen") {
    if (lang === "zh") {
      text = `【禅师菩提常驻开示】
善哉善哉。有缘人方才提到：“${lastUserMsg}”。
在无常的世界里，我们总想抓住某些坚实的东西，这正是苦（Dukkha）的源头。
你的担忧如同落在池水中的红叶，水波荡漾是自然，但水底自有一份清净。
不如随老僧一同做三次深长的呼吸。吸气——世界安详；呼气——放下万念。一切皆在当下的静默里，无来也无去。`;
    } else if (lang === "vi") {
      text = `【Thiền Sư Trí Không Giác Ngộ】
Nam Mô A Di Đà Phật. Nghe lời tâm sự của đạo hữu: "${lastUserMsg}".
Cuộc đời vô thường tựa như mây bay khói tỏa. Sức mạnh tinh thần chỉ thực sự xuất hiện khi đạo hữu thôi tìm kiếm bên ngoài mà quay về nương tựa hòn đảo tự thân.
Hãy mỉm cười nhẹ nhàng và hít thở sâu, đón nhận mọi sự như nó đang là.`;
    } else if (lang === "th") {
      text = `【อาจารย์เซนแห่งสัจธรรม】
ขอกล่าวทักทายคุณผู้แสวงหาความสงบ จากสิ่งที่คุณปรารภว่า: "${lastUserMsg}".
จิตใจเปรียบเหมือนสระน้ำอันเงียบสงบ ลมพัดพาให้เกิดคลื่น อย่าพยายามไปบังคับลม เพียงแค่เฝ้ามองมันพัดผ่านไป
หายใจเข้าลึกๆ รับรู้ลมหายใจที่สัมผัสปลายจมูก ปล่อยความกังวลไปกับลมหายใจออก ความสงบสถิตอยู่ตรงนี้แล้ว`;
    } else {
      text = `【Zen Master Bodhi's Reflection】
Ah, seeker. You speak of: "${lastUserMsg}".
Our minds are like a quiet lake. The winds of thoughts cause waves, and we mistake the waves for our true self.
Pause. Do not strive to fix the lake; simply watch the wind blow over it.
Inhale deeply, feeling the cool breath touch your nostrils. Exhale, returning all items to the dust. Peace is not elsewhere—it is right here where you stand.`;
    }
  } else if (advisorKey === "athena") {
    if (lang === "zh") {
      text = `【理智法师智慧分析】
你好，缘主。关于你写下的：“${lastUserMsg}”，
从理性哲学与因果法则的角度来看，你的精神焦虑往往来自于期待与无常法则之间的偏差。
我们需要用客观的分辨力去分析：哪些是你可以主导的，哪些是因缘和合、属于外界客观规律的？
对于可控的事物，精进行动；对于不可控的，彻底顺应。以此修心，你的精神边界自然泰然自若。`;
    } else if (lang === "vi") {
      text = `【Cố Vấn Trí Tuệ Athena】
Chào bạn. Về vấn đề đạo hữu chia sẻ: "${lastUserMsg}".
Chúng ta hãy phân tích một cách khách quan: phần lớn khổ đau nảy sinh khi ta cố gắng kiểm soát những gì nằm ngoài khả năng kiểm soát của mình.
Hãy phân định rõ rệt: rèn luyện hành động đúng đắn và chấp nhận thực tại với một trí tuệ minh mẫn.`;
    } else if (lang === "th") {
      text = `【เทพีแห่งความรู้และปัญญา】
สวัสดีผู้แสวงธรรม เกี่ยวกับเรื่องที่คุณแชร์: "${lastUserMsg}".
ลองพิจารณาแยกแยะเหตุและผลอย่างละเอียด สิ่งไหนที่คุณควบคุมได้ จงลงมือทำด้วยสติและปัญญา ส่วนสิ่งไหนที่พ้นวิสัยควบคุม จงปล่อยวางด้วยจิตที่เบาสบาย นี่คือวิถีแห่งความสมดุลและความสุข`;
    } else {
      text = `【Athena Analytical Counsel】
Greetings. Regarding your query: "${lastUserMsg}".
Let us deconstruct this systemically. Much of our psychic resistance stems from a failure to identify the split between our internal control and global variables (Cosmic Dharma).
Analyze your challenge: What fraction lies purely within your conscious choice? Execute that section with right intention. Let go of everything else. This is structural stoic zen.`;
    }
  } else if (advisorKey === "mystic") {
    if (lang === "zh") {
      text = `【神弈祭司神秘开示】
（水晶球中星尘翻涌...）
寻路者，你所传达的信息：“${lastUserMsg}”，在宿命星轮上掀起了微妙的涟漪。
目前土星在你因果中制造了短期的磨砺，这不仅是外部世界的考验，更是你本源之光在当下的整合与洗礼。
倾听这阵寂静，当前的局限正是通往你第三只眼觉醒的灵性入口。万物皆宿缘，安心接纳即可。`;
    } else if (lang === "vi") {
      text = `【Nhà Ngoại Cảm Huyền Bí】
(Cát bụi vũ trụ luân chuyển...)
Hỡi lữ khách phương xa, lời bạn gửi gắm: "${lastUserMsg}" phản chiếu tần số rung cảm sâu thẳm.
Giai đoạn hiện tại là cơ hội để bạn thanh lọc các nút thắt năng lượng quá khứ. Đừng vội vàng, bóng tối luôn là tiền đề cho ánh sáng rực rỡ nhất trỗi dậy trong bạn.`;
    } else if (lang === "th") {
      text = `【ผู้หยั่งรู้อันเร้นลับแห่งอดีตชาติ】
(ดวงดาวพยากรณ์ขยับตัว...)
ผู้ร่วมเดินทาง จิตของคุณส่งคลื่นความถี่: "${lastUserMsg}" มาถึงเครื่องรับรู้ของจักรวาล
นี่คือบททดสอบเชิงลึกเกี่ยวกับกรรมวาระของคุณเพื่อชะล้างปมเก่าในอดีต อย่าเร่งรีบกับการแก้ไขภายนอก ความกลมเกลียวของดวงดาวอยู่ข้างคุณเสมอ`;
    } else {
      text = `【Mystic Diviner's Oracle】
(The cosmic nodes shift...)
Traveler, your words: "${lastUserMsg}" resonate on a sensitive harmonic band in your chart.
This cycle represents a transit of Saturnian clarification. Do not rush to fill the void. The tension you feel is the precise alchemy required to dissolve old ancestral blocks. You are the universe viewing itself in silence.`;
    }
  } else {
    // Luna (Gentle Healer)
    if (lang === "zh") {
      text = `【露娜慈爱温柔安慰】
有缘人，抱抱你。读到你写下的：“${lastUserMsg}”，我能感到你肩膀上的酸楚呢。
这里是最安全的港湾，你可以完全卸下防御。
露娜为您冲泡一杯普提清茶，听听这潺潺流水音疗。
这世间万物都在被慈爱的星辉所拥抱，你也是其中最温柔、最值得被疼爱的一部分。无论外面风雨多大，露娜都在陪伴着你。`;
    } else if (lang === "vi") {
      text = `【Nữ Thần Chữa Lành Luna】
Thương mến gửi đạo hữu. Mình cảm thông sâu sắc với tâm can hiện tại: "${lastUserMsg}".
Bạn đã gồng gánh quá nhiều đau mỏi rồi, hãy thả lỏng bờ vai và nhắm mắt lại.
Hãy tưởng tượng dòng nước mát lành lành tẩm tưới qua tâm hồn bé bỏng của bạn. Bạn luôn xứng đáng được hạnh phúc và che chở.`;
    } else if (lang === "th") {
      text = `【เทพีผู้อ่อนโยน ลูน่า】
ยินดีต้อนรับกลับบ้านนะกัลยาณมิตร ฉันขอเป็นพื้นที่ปลอดภัยให้แก่ใจของคุณ: "${lastUserMsg}".
คุณเหนื่อยล้ามานานพอแล้ว ปลดปล่อยภาระหนักอึ้งนั่นลงเถอะ จินตนาการถึงลมเย็นสลวยและธารน้ำนุ่มนวลชโลมใจ คุณคือสิ่งที่งดงามของจักรวาลเสมอ`;
    } else {
      text = `【Luna's Caring Embrace】
Welcome home, dear friend. I hold space for your feelings in my heart: "${lastUserMsg}".
You have carried this heavy weight for so long, and you are tired. It is safe to rest your armor here with me.
Imagine soft moonlit water gently washing over any dry or tired parts of your spirit.
You are loved exactly as you are. Let us take a deep breath together. You are perfectly safe and warm.`;
    }
  }
  return { response: text };
}

// -------------------------------------------------------------
// MAIN API ENDPOINTS WITH FAILSAFE RESILIENCE (503/BUSY AUTO-LITE/AUTO-BACKUP)
// -------------------------------------------------------------

// 1. Daily energy score and custom insight message
app.post("/api/daily-insight", async (req, res) => {
  const { name, birthDate, birthTime, birthPlace, mood, lang } = req.body;
  const clientName = name || "Spiritual Wanderer";
  const activeLang = lang || "en";
  const moodStr = mood ? `Current Checked-In Mood: ${mood}` : "default calm";
  const birthdayStr = birthDate ? `Born on ${birthDate} ${birthTime || ""} at ${birthPlace || ""}` : "No birth chart provided";

  const ai = getGeminiClient();
  if (!ai) {
    // Key not set or missing - run backup directly
    console.log(`[Backup Mode] API Key missing for Daily Insight`);
    const backup = getDailyInsightBackup(clientName, moodStr, activeLang);
    return res.json(backup);
  }

  const prompt = `
    You are the engine for SoulAI, an AI Spiritual Wellness Companion.
    Based on the following user details:
    Name: ${clientName}
    Birth Details: ${birthdayStr}
    ${moodStr}

    Generate an elegant, ultra-personalized metaphysical report containing:
    1. Daily energy scores (integers from 40 to 100) for: Love, Career, Finance, Mood.
    2. A single concise "dailyMessage" (2-3 sentences max) written in an elegant, inspiring, mystic minimalist style.

    IMPORTANT LANG & STYLE RULE:
    1. Your entire response, particularly the text inside "dailyMessage", MUST be returned in this language: "${activeLang}".
    2. If "zh", use Chinese (简体中文) and incorporate warm Buddhist Zen/dharma blessings (e.g. 功德, 妙法, 禅心).
    3. If "vi", use Vietnamese (Tiếng Việt) with Buddhist chánh niệm and từ bi terms.
    4. If "th", use Thai (ภาษาไทย) with compassionate Buddhist/sutra vocabulary.
    5. If "en", use English.

    Provide your response in raw JSON format with the following schema:
    {
      "energy": {
        "love": number,
        "career": number,
        "finance": number,
        "mood": number
      },
      "dailyMessage": "string"
    }
    Do not include any Markdown wrap like \`\`\`json. Return only the JSON object.
  `;

  // First Attempt: gemini-3.5-flash
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.warn(`gemini-3.5-flash insight generation failed, trying gemini-3.1-flash-lite... Reason: ${error.message}`);
    
    // Second Attempt: gemini-3.1-flash-lite
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      const parsed = JSON.parse(response.text?.trim() || "{}");
      return res.json(parsed);
    } catch (liteError: any) {
      console.error(`gemini-3.1-flash-lite also failed, activating local dynamic fallback engine. Reason: ${liteError.message}`);
      // Final Successful Fallback Response (Status 200 to keep the application robust!)
      const backup = getDailyInsightBackup(clientName, moodStr, activeLang);
      return res.json(backup);
    }
  }
});

// 2. Astrology Chart & Comprehensive AI Reading
app.post("/api/astrology-reading", async (req, res) => {
  const { name, birthDate, birthTime, birthPlace, lang } = req.body;
  const activeLang = lang || "en";
  const clientName = name || "Seeker";

  if (!birthDate) {
    return res.status(400).json({ error: "Birth date is required for Astrological readings." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    console.log(`[Backup Mode] API Key missing for Astrology Reading`);
    const backup = getAstrologyBackup(clientName, birthDate, activeLang);
    return res.json(backup);
  }

  const prompt = `
    You are SoulAI's Lead Astrologist & Esoteric Scholar.
    User Profile:
    - Name: ${clientName}
    - Date of Birth: ${birthDate}
    - Time of Birth: ${birthTime || "Not Specified"}
    - Place of Birth: ${birthPlace || "Not Specified"}

    Generate a deep, beautifully written, sophisticated Western and Chinese Syncretic astrological reading in Markdown format.
    Structure the reading with the following clear markdown sections:
    1. **Celestial Coordinates**: Define their probable Sun Sign, Moon Sign, Ascendant (estimate based on time/place), and Chinese Zodiac animal.
    2. **Core Personality Mandala**: A refined interpretation of their primal self, strengths, and shadow aspects. Keep it deeply therapeutic and articulate, avoiding fluff.
    3. **Love & Relationship Harmony**: Insights on how they relate to others, intimacy style, and what sparks connection.
    4. **Dharma & Abundance (Career/Finance)**: Their calling, professional karma, and energetic relationship with wealth.
    5. **Current Transits & Outlook**: Cosmic forecast for the current cycle.
    
    Maintain an inspiring, slightly poetic, yet grounded Mystic Buddhist translation. Speak directly to ${clientName} in the second person ("You").

    IMPORTANT RULE: 
    - The entire reading MUST be written in the following language: "${activeLang}".
    - If "zh", use Chinese (简体中文); if "vi", use Vietnamese; if "th", use Thai; if "en", use English.
    - Seamlessly interweave Buddhist Zen guidelines, karma release, and spiritual mindfulness concepts into the analysis.
  `;

  // First Attempt: gemini-3.5-flash
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    return res.json({ reading: response.text });
  } catch (error: any) {
    console.warn(`gemini-3.5-flash astrology failed, trying gemini-3.1-flash-lite... Reason: ${error.message}`);
    
    // Second Attempt: gemini-3.1-flash-lite
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });
      return res.json({ reading: response.text });
    } catch (liteError: any) {
      console.error(`gemini-3.1-flash-lite also failed. Reverting to lineage backup astrology report.`);
      const backup = getAstrologyBackup(clientName, birthDate, activeLang);
      return res.json(backup);
    }
  }
});

// 3. Tarot Reading Past-Present-Future Spread
app.post("/api/tarot-reading", async (req, res) => {
  const { question, cards, lang } = req.body;
  const activeLang = lang || "en";

  if (!cards || cards.length === 0) {
    return res.status(400).json({ error: "No Tarot cards provided." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    console.log(`[Backup Mode] API Key missing for Tarot Reading`);
    const backup = getTarotBackup(question, cards, activeLang);
    return res.json(backup);
  }

  const cardsDescription = cards.map((c: any, index: number) => {
    const position = index === 0 ? "Past" : index === 1 ? "Present" : "Future";
    return `${position} Position: "${c.name}" (${c.isReversed ? "Reversed/Inverted" : "Upright"})`;
  }).join("\n");

  const prompt = `
    You are SoulAI's High Priestess of Tarot & Archetypal Analyst.
    The seeker has asked the following sacred question:
    "${question || "General guidance on my current path"}"

    They have drawn a 3-card spread representing Past, Present, and Future:
    ${cardsDescription}

    Synthesize these cards into a deep, cohesive reading in Markdown format.
    Provide the following sections:
    - **The Spread Alchemy**: A short summary of the narrative woven by these three cards.
    - **Card 1: The Foundation (Past)**: Analyze how the past card influences the situation.
    - **Card 2: The Portal (Present)**: The active energy, challenges, or hidden lessons occurring right now.
    - **Card 3: The Destiny (Future)**: The potential trajectory if the current lessons are absorbed.
    - **The High Priestess's Key**: Highly practical, intuitive coaching advice or an actionable mindfulness exercise that matches this energy.

    Aesthetic guidelines: Keep it highly empathetic, sophisticated, psychologically rich, and free of shallow fortune-telling clichés.

    IMPORTANT RULE:
    - The entire reading MUST be written in the following language: "${activeLang}".
    - If "zh", use Chinese (简体中文); if "vi", use Vietnamese; if "th", use Thai; if "en", use English.
    - Align the interpretations with spiritual self-compassion, mindfulness, cause-and-effect (karma), and Buddhist insights of non-attachment.
  `;

  // First Attempt: gemini-3.5-flash
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    return res.json({ reading: response.text });
  } catch (error: any) {
    console.warn(`gemini-3.5-flash tarot failed, trying gemini-3.1-flash-lite... Reason: ${error.message}`);
    
    // Second Attempt: gemini-3.1-flash-lite
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });
      return res.json({ reading: response.text });
    } catch (liteError: any) {
      console.error(`gemini-3.1-flash-lite also failed. Reverting to ancient code tarot generator.`);
      const backup = getTarotBackup(question, cards, activeLang);
      return res.json(backup);
    }
  }
});

// 4. Spiritual AI Advisor Chat
app.post("/api/chat", async (req, res) => {
  const { messages, advisorKey, lang } = req.body;
  const activeLang = lang || "en";

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: "Message history is empty." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    console.log(`[Backup Mode] API Key missing for Healer Chat`);
    const backup = getChatBackup(messages, advisorKey, activeLang);
    return res.json(backup);
  }

  const advisors: { [key: string]: { name: string, system: string } } = {
    luna: {
      name: "Luna (The Gentle Healer)",
      system: "You are Luna, SoulAI's Gentle Spiritual Advisor. Your personality is soft, understanding, deeply therapeutic, maternal, and calming. You help users validate their feelings, offer warm emotional support, and guide them with gentle self-compassion tools like Tonglen or mindfulness. Speak in soft-toned prose. Use metaphors of cleansing water, moonlight, and peaceful temple gardens."
    },
    athena: {
      name: "Athena (The Rational Counselor)",
      system: "You are Athena, SoulAI's Cognitive & Analytical Spiritual Advisor. You combine psychology, philosophical Stoicism, and clear astrological alignment to analyze problems step-by-step. You challenge limiting beliefs and help users see things from a high macro perspective, aligning with their personal dharma and path of right action."
    },
    mystic: {
      name: "Mystic (The Sacred Diviner)",
      system: "You are Mystic, SoulAI's Ancient Occult Oracle. You speak in poetic, enigmatic, but highly accurate esoteric wisdom. You make references to planetary aspects, cosmic nodes, tarot archetypes, and cause-and-effect (karma). Your goal is to spark the user's intuitive third-eye, making them look beyond physical constructs to find meaning in spiritual cycles and hidden synchronistic patterns."
    },
    zen: {
      name: "Zen (The Mindful Rishi)",
      system: "You are Zen Master Bodhi, an enlightened Buddhist Abbot. You reflect profound peace, deep breath-awareness (Anapanasati), non-attachment, and quiet presence. Speak with koans, silent reflections, and remind the user of the impermanent nature of temporary thoughts. Guide them back into their somatic body with deep compassion, Zen Buddhist concepts, and the calm of the temple bells."
    }
  };

  const advisor = advisors[advisorKey] || advisors.luna;

  // Map user history to Gemini structure
  const contents = messages.map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const systemInstruction = `
    ${advisor.system}
    
    CORE RESPONSE RULES:
    1. You MUST respond and write your response ENTIRELY in the following language: "${activeLang}".
    2. If "zh", use Chinese (简体中文); if "vi", use Vietnamese; if "th", use Thai; if "en", use English.
    3. Incorporate high-fidelity Buddhist teachings, lotus symbols, and temple-like compassion to assist the Seeker in dissolving their worldly blockages.
  `;

  // First Attempt: gemini-3.5-flash
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    return res.json({ response: response.text });
  } catch (error: any) {
    console.warn(`gemini-3.5-flash chat advisor failed, trying gemini-3.1-flash-lite... Reason: ${error.message}`);
    
    // Second Attempt: gemini-3.1-flash-lite
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents,
        config: {
          systemInstruction: systemInstruction,
        }
      });
      return res.json({ response: response.text });
    } catch (liteError: any) {
      console.error(`gemini-3.1-flash-lite also failed, activating local Abbot counseling engine.`);
      const backup = getChatBackup(messages, advisorKey, activeLang);
      return res.json(backup);
    }
  }
});

// Configure Vite middleware or Static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SoulAI Fullstack server is running on http://localhost:${PORT}`);
  });
}

startServer();
