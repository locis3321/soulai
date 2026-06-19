import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Star, 
  Crown, 
  History, 
  FileText, 
  CheckCircle2, 
  Globe, 
  Shield, 
  Info, 
  LogOut, 
  LogIn, 
  ChevronDown, 
  ChevronRight,
  Sparkles
} from "lucide-react";
import { UserProfile, TarotCardSpread } from "../types";
import { TRANSLATIONS, LanguageKey, LANGUAGES } from "../lib/translations";

interface ProfileViewProps {
  profile: UserProfile;
  onChangeProfile: (updated: UserProfile) => void;
  isPremium: boolean;
  onTogglePremium: () => void;
  tarotReadingsHistory: TarotCardSpread[];
  lang: LanguageKey;
  onChangeLanguage: (newLang: LanguageKey) => void;
  onRestartOnboarding?: () => void;
  largeTextMode?: boolean;
}

const LOCAL_TX = {
  en: {
    title: "Soul Profile & Settings",
    subtitle: "Configure language, synchronization, and spiritual coordinates",
    logout: "Log Out Account",
    login: "Log In Soul Sync",
    activeAccount: "Active Soul Sync Account",
    guestMode: "Guest Pilgrim Mode",
    connectEmail: "Connected Soul Email",
    loginDesc: "Sync your karma points, wooden fish taps, and tarot history across devices.",
    privacyTitle: "System Privacy & Security Agreement",
    privacyText: "Your birth metrics, chakra journals, and tarot inquiries represent sacred personal fields. In compliance with strict native guidelines (APK/IPA terms), all reports generated are processed with secure end-to-end cloud encryption. No advertisement telemetry or secular behavioral data tracking is ever used inside this application.",
    aboutTitle: "About SoulAI Sanctuary",
    aboutText: "Developed as a synchronized Western Astrological and Eastern Zen Buddhist companion. Running on secure server-side Gemini engines, we provide high-vibrational guidance to quieten thoughts.",
    appModel: "SoulAI Native Shell V1.0.4",
    platformSpec: "Fully Optimized for APK & IPA Packaging",
    calibrateLabel: "Calibrate Birth Coordinates",
    selectLang: "Change System Language",
    activeLangLabel: "Active Language",
    logoutSuccess: "✓ Successfully disconnected. Log back in to sync.",
    loginSuccess: "✓ Soul Sync established. Welcome back, pilgrim!",
    secLogin: "Secret Passcode",
    unlockedRecords: "Calculated Natal Charts",
    enterAny: "Enter any email to simulate local-native profile sync."
  },
  zh: {
    title: "主页命盘与设置",
    subtitle: "切换语言、管理账户同步以及校准出生三昧参数",
    logout: "退出当前账户",
    login: "登录灵修同步",
    activeAccount: "已激活的账户",
    guestMode: "未登录信士（游客）",
    connectEmail: "绑定的因果邮箱",
    loginDesc: "将您的功德值、木鱼敲击数和历史占卜记录安全搬迁至云端高阶数据库中。",
    privacyTitle: "隐私与算法安全协议及其申明",
    privacyText: "信士的出生年月、八字命理、观心日记及历史问卜信息均属于个人最私密法界范畴。我们严苛遵守苹果App Store (IPA)及谷歌Play (APK) 移动端应用隐私安全条例。所有生成式人工智慧计算皆通过高级服务器端端加密传输。系统内绝不植入任何世俗广告、数据行为跟踪或将隐私泄露给第三方，请各位同修大德安心修持身心。",
    aboutTitle: "关于灵格AI圣坛与产品描述",
    aboutText: "灵格AI集西方巨集星图宿命、东方八字五行生克、以及空门禅宗止观方法于一体。依托安全的谷歌Gemini模型及科学数字疗愈背景，致力于以精深正念拨开俗尘干扰，滋养您的自性光明状态。",
    appModel: "灵格AI 移动端 V1.0.4",
    platformSpec: "专为 Android (APK) 与 iOS (IPA) 原生移动包体定制优化",
    calibrateLabel: "校准出生三昧参数 (生辰八字)",
    selectLang: "语言切换 / language settings",
    activeLangLabel: "当前系统语言",
    logoutSuccess: "✓ 已安全断开云端，数据目前被本命安全离线沙盒所锁死。",
    loginSuccess: "✓ 灵格云端灵网连接成功！欢迎归来修行。",
    secLogin: "大德六位密语",
    unlockedRecords: "黄道天干精算图",
    enterAny: "您可以通过输入任意账号密码，以便测试移动应用的数据多包同步机制。"
  },
  vi: {
    title: "Mạo Bản & Hệ Thống Cài Đặt",
    subtitle: "Hiệu chỉnh ngôn ngữ, đồng bộ hóa và quản lý pháp môn chiêm tinh",
    logout: "Đăng xuất tài khoản",
    login: "Đăng nhập đồng bộ",
    activeAccount: "Tài Khoản Đồng Bộ Hoạt Động",
    guestMode: "Chế Độ Tín Chủ Vãng Lai (Guest)",
    connectEmail: "Email Liên Kết Tâm Linh",
    loginDesc: "Đồng bộ hóa tích lũy phúc đức, lịch sử gõ mõ và quẻ bài tarot lên đám mây.",
    privacyTitle: "Thỏa Thuận Bảo Mật Quyền Riêng Tư",
    privacyText: "Mọi dữ liệu sinh thần bát tự, nhật ký thiền và các câu vấn pháp đều là linh thiêng và riêng tư tuyệt đối. Tuân thủ nghiêm ngặt điều khoản cửa hàng ứng dụng di động (APK / IPA), toàn bộ thông tin được bảo mật mã hóa đầu cuối. Không chứa phần mềm quảng cáo hay theo dõi hành vi thế tục nào.",
    aboutTitle: "Giới Thiệu Về SoulAI",
    aboutText: "Hệ thống bổ trợ kết hợp Chiêm tinh phương Tây và thiền môn phương Đông. Chạy trên lõi trí tuệ nhân tạo Gemini bảo mật phía máy chủ để mang lại sự tĩnh tại, an lạc vô ưu.",
    appModel: "SoulAI Ấn Bản Di Động V1.0.4",
    platformSpec: "Tối ưu hóa tuyệt hảo cho đóng gói APK & IPA native shell",
    calibrateLabel: "Hiệu Chỉnh Tham Số Sinh Bản",
    selectLang: "Ngôn Ngữ Hệ Thống (Language)",
    activeLangLabel: "Ngôn Ngữ Kích Hoạt",
    logoutSuccess: "✓ Đã đăng xuất thành công. Dữ liệu tạm thời được lưu cục bộ.",
    loginSuccess: "✓ Đồng bộ hóa mầm mạch tâm linh hoàn tất!",
    secLogin: "Mật khẩu an sinh",
    unlockedRecords: "Bổ trợ các chòm sao mặt trời",
    enterAny: "Nhập một email bất kỳ để kiểm tra bộ lưu trữ đồng bộ."
  },
  th: {
    title: "ข้อมูลชะตาชีวิตและตั้งค่าระบบ",
    subtitle: "สลับภาษา จัดการซิงค์บัญชี และปรับเทียบพิกัดชะตากำเนิด",
    logout: "ออกจากระบบบัญชีธรรม",
    login: "เข้าสู่ระบบซิงค์",
    activeAccount: "บัญชีซิงค์พลังงานปัจจุบัน",
    guestMode: "โหมดนักแสวงบุญพเนจร",
    connectEmail: "อีเมลเชื่อมโยงกุศล",
    loginDesc: "ซิงค์ส่วนบุญกุศล คะแนนเคาะไม้ธรรม และประวัติไพ่ยิปซีครอบจักรวาลสลับกับอุปกรณ์อื่นๆ",
    privacyTitle: "นโยบายความเป็นส่วนตัวของแอปพลิเคชัน",
    privacyText: "วันเดือนปีเกิด บันทึกบำบัดจิต และการปรึกษายิปซีของคุณ ถือเป็นมณฑลพลังงานส่วนตัวอันบริสุทธิ์ยิ่ง ข้อมูลทั้งหมดจะถูกส่งผ่านช่องทางเข้ารหัสชั้นสูงและจัดทำขึ้นเพื่อการวิเคราะห์ทางจิตวิญญาณเท่านั้น ไม่มีการสอดแทรกเชิงพาณิชย์หรือโฆษณาตามเงื่อนไขความปลอดภัย Store ของแพลตฟอร์ม (APK/IPA)",
    aboutTitle: "เกี่ยวกับอารามอัจฉริยะ SoulAI",
    aboutText: "มรดกทางโหราศาสตร์สากลบวกวิปัสสนากรรมฐานยุคใหม่ รันบนระบบคลาวด์ปัญญาประดิษฐ์ Gemini คอยขจัดอุปสรรคและประโลมจิตใจให้แก่คุณ",
    appModel: "แอปพลิเคชัน SoulAI เวอร์ชัน V1.0.4",
    platformSpec: "ออกแบบสำหรับพอร์ตลงระบบมือถือ APK & IPA อย่างแจ่มแจ้ง",
    calibrateLabel: "ปรับตำแหน่งพิกัดธาตุนิมิตกำเนิด",
    selectLang: "สลับภาษาประทีปในแอป",
    activeLangLabel: "ภาษาดั้งเดิมสถิต",
    logoutSuccess: "✓ ขัดถูดวงตาตัดช่องเชื่อมโยงเรียบร้อย ข้อมูลถูกเก็บในเครื่อง",
    loginSuccess: "✓ ประสานพลังบัญชีลิขิตฟ้าสำเร็จ ยินดีต้อนรับกลับมา!",
    secLogin: "รหัสผ่านลับ",
    unlockedRecords: "พิกัดโหราศาสตร์ดาวหลัก",
    enterAny: "กรอกอีเมลใดก็ได้เพื่อทดสอบสัญชาตญาณของการบันทึกความจำอุปกรณ์"
  }
};

export default function ProfileView({
  profile,
  onChangeProfile,
  isPremium,
  onTogglePremium,
  tarotReadingsHistory,
  lang,
  onChangeLanguage,
  onRestartOnboarding,
  largeTextMode = false
}: ProfileViewProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const lt = LOCAL_TX[lang] || LOCAL_TX.en;

  // Form states
  const [name, setName] = useState(profile.name);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [birthTime, setBirthTime] = useState(profile.birthTime);
  const [birthPlace, setBirthPlace] = useState(profile.birthPlace);
  const [calibrateMsg, setCalibrateMsg] = useState<string | null>(null);

  // Layout Accordion state triggers
  const [showLanguageCollapse, setShowLanguageCollapse] = useState(false);
  const [showCalibrateCollapse, setShowCalibrateCollapse] = useState(false);
  const [showHistoryCollapse, setShowHistoryCollapse] = useState(false);
  const [showPrivacyCollapse, setShowPrivacyCollapse] = useState(false);
  const [showAboutCollapse, setShowAboutCollapse] = useState(false);

  // Authentication simulation
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem("soul_auth_email") || "housmanthay@gmail.com";
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("soul_is_logged_in") !== "false"; // default to true to reflect active user mail
  });

  // Login inputs
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [authMsg, setAuthMsg] = useState<string | null>(null);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChangeProfile({ name, birthDate, birthTime, birthPlace });
    setCalibrateMsg("✓ Calibrated! Western and Eastern Natal coordinates updated beautifully.");
    setTimeout(() => setCalibrateMsg(null), 4000);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem("soul_is_logged_in", "false");
    setAuthMsg(lt.logoutSuccess);
    setTimeout(() => setAuthMsg(null), 4000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const targetedEmail = inputEmail.trim() || "housmanthay@gmail.com";
    setUserEmail(targetedEmail);
    localStorage.setItem("soul_auth_email", targetedEmail);
    setIsLoggedIn(true);
    localStorage.setItem("soul_is_logged_in", "true");
    setAuthMsg(lt.loginSuccess);
    setInputEmail("");
    setInputPassword("");
    setTimeout(() => setAuthMsg(null), 4000);
  };

  // Helper dynamic western astrology calculation
  const getSunSignInfo = (dateStr: string) => {
    if (!dateStr) return { sign: "Unknown Sign", symbol: "✦", trait: "Input birthdate below." };
    const parts = dateStr.split("-");
    if (parts.length < 3) return { sign: "Unknown", symbol: "✦", trait: "" };
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);

    if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return { sign: "Aries", symbol: "♈", trait: "Governed by Martian initiation." };
    if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return { sign: "Taurus", symbol: "♉", trait: "Abundant grower of sensory stillness." };
    if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return { sign: "Gemini", symbol: "♊", trait: "Mercury duality intellectual traveler." };
    if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return { sign: "Cancer", symbol: "♋", trait: "Lunar intuitive emotional sanctuary." };
    if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return { sign: "Leo", symbol: "♌", trait: "Radiant solar creative leader." };
    if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return { sign: "Virgo", symbol: "♍", trait: "Sacred meticulous Earth healer." };
    if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return { sign: "Libra", symbol: "♎", tracking: "Harmonic spiritual balancing." };
    if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return { sign: "Scorpio", symbol: "♏", trait: "Transmuter of dense mysteries." };
    if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return { sign: "Sagittarius", symbol: "♐", trait: "Philosophical cosmic voyager." };
    if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return { sign: "Capricorn", symbol: "♑", trait: "Architect of sovereign Earth cycles." };
    if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return { sign: "Aquarius", symbol: "♒", trait: "Altruistic visionary sky dweller." };
    return { sign: "Pisces", symbol: "♓", trait: "Somatic integration with the ocean mind." };
  };

  const getChineseZodiacInfo = (dateStr: string) => {
    if (!dateStr) return { sign: "Unknown Animal", symbol: "🐉" };
    const parts = dateStr.split("-");
    const year = parseInt(parts[0], 10);
    if (isNaN(year)) return { sign: "Unknown", symbol: "🐉" };

    const animals = [
      { name: "Rat", emoji: "🐭" },
      { name: "Ox", emoji: "🐮" },
      { name: "Tiger", emoji: "🐯" },
      { name: "Rabbit", emoji: "🐰" },
      { name: "Dragon", emoji: "🐉" },
      { name: "Snake", emoji: "🐍" },
      { name: "Horse", emoji: "🐴" },
      { name: "Goat", emoji: "🐐" },
      { name: "Monkey", emoji: "🐵" },
      { name: "Rooster", emoji: "🐔" },
      { name: "Dog", emoji: "🐶" },
      { name: "Pig", emoji: "🐷" }
    ];

    const offset = (year - 1900) % 12;
    const index = offset < 0 ? (offset + 12) % 12 : offset;
    return {
      sign: animals[index].name,
      symbol: animals[index].emoji
    };
  };

  const sunSign = getSunSignInfo(birthDate);
  const chineseZodiac = getChineseZodiacInfo(birthDate);

  return (
    <div className="space-y-6" id="optimized-profile-screen">
      
      {/* 2. CONCISE BRIEF USER PROFILE CARD (简洁的用户信息) */}
      <div 
        className="relative bg-gradient-to-br from-[#121633] to-[#0A0D21] border border-white/5 rounded-3xl p-5 overflow-hidden shadow-2xl"
        id="concise-mobile-profile-card"
      >
        <div className="absolute top-[-40px] right-[-40px] w-28 h-28 bg-[#7C5CFF]/15 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-4">
          {/* Glowing Natal Crest Avatar */}
          <div className="relative flex items-center justify-center shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#7C5CFF] via-[#A78BFA] to-[#FFD166] p-[2.5px] shadow-[0_0_15px_rgba(124,92,255,0.35)]">
              <div className="w-full h-full rounded-full bg-[#090C1F] flex items-center justify-center text-3xl">
                {sunSign.symbol}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-glow rounded-full text-slate-900 font-bold border-2 border-[#090C1F] text-[10px] flex items-center justify-center">
              {chineseZodiac.symbol}
            </div>
          </div>

          {/* User descriptions name & sync level */}
          <div className="space-y-1">
            <span className="font-mono text-[8px] uppercase tracking-widest text-glow font-bold">
              {isPremium ? t.levelPremium : t.levelNovice}
            </span>
            <h2 className="font-display font-black text-slate-100 text-lg flex items-center gap-1.5 leading-none">
              {profile.name || "Mia"}
              {isPremium && <Crown className="h-4 w-4 text-glow" />}
            </h2>
            <p className="text-[10px] font-mono text-slate-400">
              {isLoggedIn ? `${lt.connectEmail}: ${userEmail}` : lt.guestMode}
            </p>
          </div>
        </div>

        {/* Horizontal micro-chips showing coordinates calculated */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-white/[0.04]">
          <div className="bg-white/[0.012] border border-white/5 p-2 rounded-xl text-left">
            <span className="block font-mono text-[7px] text-slate-500 uppercase tracking-widest leading-none mb-1">{t.sunSignLabel}</span>
            <span className="font-display font-medium text-xs text-slate-300">{sunSign.sign} {sunSign.symbol}</span>
          </div>
          <div className="bg-white/[0.012] border border-white/5 p-2 rounded-xl text-left">
            <span className="block font-mono text-[7px] text-slate-500 uppercase tracking-widest leading-none mb-1">{t.yearBranchLabel}</span>
            <span className="font-display font-medium text-xs text-slate-300">{chineseZodiac.sign} {chineseZodiac.symbol}</span>
          </div>
        </div>

        {/* Fast Premium Simulated switch */}
        <div className="mt-4 flex items-center justify-between bg-white/[0.02] border border-white/5 p-2 px-3 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-300">{t.upgradeNovice.slice(0, 39)}...</span>
          <button
            type="button"
            onClick={onTogglePremium}
            className="px-2.5 py-1 rounded-lg bg-glow text-slate-950 font-mono text-[9px] font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            {isPremium ? "REVERT" : "PREMIUM"}
          </button>
        </div>
      </div>

      {authMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-950/40 border border-[#7C5CFF]/30 text-slate-200 text-[10px] py-2 px-3 rounded-xl font-mono text-center flex items-center justify-center gap-1.5"
        >
          <Sparkles className="h-3 w-3 text-glow" /> {authMsg}
        </motion.div>
      )}

      {/* 3. SETTINGS CELLS / OPTION ACCORDIONS (必要的系统控制按钮) */}
      <div className="space-y-2.5" id="native-app-settings-menu">
        
        {/* 3.1 LANGUAGE SWITCH CELL */}
        <div className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setShowLanguageCollapse(!showLanguageCollapse)}
            className="w-full flex items-center justify-between p-4 outline-none cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#7C5CFF]/15 flex items-center justify-center text-[#7C5CFF]">
                <Globe className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="block text-slate-200 text-xs font-semibold leading-tight">{lt.selectLang}</span>
                <span className="font-mono text-[9px] text-slate-400 capitalize">{lt.activeLangLabel}: {LANGUAGES.find(l => l.key === lang)?.label}</span>
              </div>
            </div>
            {showLanguageCollapse ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          </button>

          <AnimatePresence>
            {showLanguageCollapse && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-[#0A0D22] border-t border-white/[0.03] px-3 py-2"
              >
                <div className="grid grid-cols-2 gap-2 p-1">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.key}
                      type="button"
                      onClick={() => {
                        onChangeLanguage(l.key as LanguageKey);
                        setShowLanguageCollapse(false);
                      }}
                      className={`cursor-pointer w-full p-2.5 rounded-xl text-left flex items-center justify-between border transition-all ${
                        lang === l.key 
                          ? "bg-[#7C5CFF]/20 text-[#FFD166] border-[#7C5CFF]/45 shadow-sm" 
                          : "bg-white/[0.01] text-slate-400 border-transparent hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{l.flag}</span>
                        <span className="font-mono text-xs font-medium">{l.label}</span>
                      </div>
                      {lang === l.key && <CheckCircle2 className="h-3.5 w-3.5 text-[#FFD166] shrink-0" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3.2 LOGIN / LOGOUT ACCOUNT SYNCHRONIZATION */}
        <div className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => {
              // Toggle accordion
              setIsLoggedIn(prev => {
                if (prev) {
                  // If logged in, let clicking expand options instead of immediate logouts
                  return prev;
                }
                return prev;
              });
              // Always toggle view
              setShowHistoryCollapse(false); // keep other shut
              setShowCalibrateCollapse(false);
              setShowAboutCollapse(false);
              setShowPrivacyCollapse(false);
            }}
            className="w-full flex items-center justify-between p-4 outline-none"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLoggedIn ? "bg-teal-500/15 text-teal-400" : "bg-red-500/10 text-red-400"}`}>
                {isLoggedIn ? <CheckCircle2 className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
              </div>
              <div className="text-left">
                <span className="block text-slate-200 text-xs font-semibold leading-tight">
                  {isLoggedIn ? lt.activeAccount : lt.guestMode}
                </span>
                <span className="font-mono text-[9px] text-slate-500 leading-none">
                  {isLoggedIn ? userEmail : lt.loginDesc.slice(0, 48) + "..."}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="cursor-pointer px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-mono rounded-lg border border-red-500/20 transition-all font-semibold"
                >
                  {lt.logout}
                </button>
              ) : (
                <span className="text-xs text-[#7C5CFF] font-semibold font-mono uppercase">{lt.login.split(" ")[0]}</span>
              )}
            </div>
          </button>

          {/* Interactive Login UI if not logged in */}
          {!isLoggedIn && (
            <div className="bg-[#0A0D22] border-t border-white/[0.03] p-4 font-sans space-y-3">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {lt.loginDesc} <span className="text-glow">{lt.enterAny}</span>
              </p>
              
              <form onSubmit={handleLogin} className="space-y-2.5">
                <div>
                  <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">{t.fullNameLabel} Email</label>
                  <input
                    type="email"
                    required
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder="e.g. pilgrim-sync@soul.ai"
                    className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-star"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">{lt.secLogin}</label>
                  <input
                    type="password"
                    required
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="cursor-pointer w-full bg-[#7C5CFF]/30 hover:bg-[#7C5CFF]/50 text-slate-100 font-mono text-[10px] font-bold py-1.5 rounded-xl border border-[#7C5CFF]/30 transition"
                >
                  🔑 {lt.login}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* 3.3 COLLAPSIBLE CALIBRATE METRICS (校准出生三昧参数) */}
        <div className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setShowCalibrateCollapse(!showCalibrateCollapse)}
            className="w-full flex items-center justify-between p-4 outline-none cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-[#FFD166]">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="block text-slate-200 text-xs font-semibold leading-tight">{lt.calibrateLabel}</span>
                <span className="font-mono text-[9px] text-slate-400 truncate max-w-[200px] block">
                  {profile.birthDate} • {profile.birthPlace || "No Coordinates"}
                </span>
              </div>
            </div>
            {showCalibrateCollapse ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          </button>

          <AnimatePresence>
            {showCalibrateCollapse && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-[#0A0D22] border-t border-white/[0.03] p-4"
              >
                {calibrateMsg && (
                  <div className="bg-teal-500/15 text-teal-300 text-[10px] rounded-lg p-2.5 mb-3 font-mono border border-teal-500/20">
                    {calibrateMsg}
                  </div>
                )}
                <form onSubmit={handleProfileSubmit} className="space-y-3 font-sans">
                  <div>
                    <label className="text-slate-400 font-mono text-[8.5px] uppercase tracking-wider block mb-1">
                      {t.fullNameLabel}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Mia"
                      className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-glow"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 font-mono text-[8.5px] uppercase tracking-wider block mb-1">
                        {t.birthDateLabel}
                      </label>
                      <input
                        type="date"
                        required
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-3 py-1 px-1.5 text-slate-200 text-[10px] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-mono text-[8.5px] uppercase tracking-wider block mb-1">
                        {t.birthTimeLabel}
                      </label>
                      <input
                        type="time"
                        value={birthTime}
                        onChange={(e) => setBirthTime(e.target.value)}
                        className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-3 py-1 px-1.5 text-slate-200 text-[10px] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-mono text-[8.5px] uppercase tracking-wider block mb-1">
                      {t.birthTownLabel}
                    </label>
                    <input
                      type="text"
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      placeholder="e.g. Bangkok, Thailand"
                      className="w-full bg-[#090C1F] border border-[#1E2342] rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="cursor-pointer w-full mt-2 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-slate-100 font-mono text-[10.5px] py-1.5 rounded-xl transition duration-200"
                  >
                    {t.calibrateButtonText}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={onRestartOnboarding}
                  className="w-full mt-3 py-1.5 rounded-xl text-[9px] font-mono bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition cursor-pointer"
                >
                  🔄 {lt.title.startsWith("Soul") ? "Restart Sacred Journey" : "重置心灵入门旅程"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3.4 COLLAPSIBLE NATIVE HISTORY LOG (因果问卜历史记录) */}
        <div className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setShowHistoryCollapse(!showHistoryCollapse)}
            className="w-full flex items-center justify-between p-4 outline-none cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                <History className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="block text-slate-200 text-xs font-semibold leading-tight">{t.myDivinaryRecords}</span>
                <span className="font-mono text-[9px] text-slate-400">
                  {tarotReadingsHistory.length} readings archived
                </span>
              </div>
            </div>
            {showHistoryCollapse ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          </button>

          <AnimatePresence>
            {showHistoryCollapse && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-[#0A0D22] border-t border-white/[0.03] p-4 space-y-3"
              >
                {tarotReadingsHistory.length === 0 ? (
                  <div className="py-8 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                    <FileText className="h-4 w-4 text-slate-400 mb-1" />
                    {t.noReadingsCompleted}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tarotReadingsHistory.map((rep, idx) => (
                      <div
                        key={idx}
                        className="bg-[#090D1C] border border-white/5 p-3 rounded-xl space-y-1.5"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-[8px] text-[#A78BFA] uppercase">
                              {rep.timestamp}
                            </span>
                            <h4 className="font-display font-semibold text-slate-200 text-xs truncate max-w-[210px]">
                              &ldquo;{rep.question}&rdquo;
                            </h4>
                          </div>
                          <div className="flex gap-0.5">
                            {rep.cards.map((c, cIdx) => (
                              <span key={cIdx} className="text-xs bg-white/5 px-1 py-0.5 rounded" title={c.name}>
                                {c.imageSymbol}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-2.5 bg-[#11162E]/25 border border-white/[0.02] rounded-lg max-h-36 overflow-y-auto text-slate-300 text-[10px] leading-relaxed font-sans">
                          {rep.readingText.split("\n").map((line, lIdx) => {
                            if (line.startsWith("###")) {
                              return <h4 key={lIdx} className="font-display text-[10px] text-glow font-bold mt-1 mb-0.5">{line.replace("###", "")}</h4>;
                            }
                            if (line.startsWith("##")) {
                              return <h3 key={lIdx} className="font-display text-[10.5px] text-star font-bold mt-2 mb-1">{line.replace("##", "")}</h3>;
                            }
                            return <p key={lIdx} className="mb-0.5">{line}</p>;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3.5 NATIVE COMPLIANT PRIVACY POLICY (隐私协议) */}
        <div className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setShowPrivacyCollapse(!showPrivacyCollapse)}
            className="w-full flex items-center justify-between p-4 outline-none cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
                <Shield className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="block text-slate-200 text-xs font-semibold leading-tight">{lt.privacyTitle}</span>
                <span className="font-mono text-[9px] text-slate-500">Security & GDPR compliant terms</span>
              </div>
            </div>
            {showPrivacyCollapse ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          </button>

          <AnimatePresence>
            {showPrivacyCollapse && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-[#0A0D22] border-t border-white/[0.03] p-4 text-left font-sans text-[10.5px] text-slate-400 leading-relaxed space-y-2 select-all"
              >
                <p className="font-bold text-slate-300">🔐 {lt.privacyTitle}</p>
                <p>{lt.privacyText}</p>
                <p className="border-t border-white/5 pt-2 text-[9.5px] text-slate-500 font-mono">
                  Encryption Layer: SHA-256 Local Encrypted Client Shell Storage.<br />
                  Data Server: Private Cloud Run Ingress Tunnel.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3.6 ABOUT SANCTUARY & VERSION (关于我们以及版本) */}
        <div className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setShowAboutCollapse(!showAboutCollapse)}
            className="w-full flex items-center justify-between p-4 outline-none cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Info className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="block text-slate-200 text-xs font-semibold leading-tight">{lt.aboutTitle}</span>
                <span className="font-mono text-[9px] text-slate-500">{lt.appModel} • Details</span>
              </div>
            </div>
            {showAboutCollapse ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          </button>

          <AnimatePresence>
            {showAboutCollapse && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-[#0A0D22] border-t border-white/[0.03] p-4 font-sans text-[10.5px] text-slate-400 leading-relaxed space-y-2 select-all"
              >
                <div className="flex items-center gap-2 text-[#FFD166] font-bold">
                  <span>🕉️</span>
                  <span>{lt.appModel}</span>
                </div>
                <p>{lt.aboutText}</p>
                <p className="bg-[#11162E]/20 p-2.5 rounded-lg border border-white/5 text-[9.5px] font-mono text-[#7C5CFF]">
                  🎮 {lt.platformSpec}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
