# سِبَار (Sebar) — Mobile App UI Description (for Google Stitch)

## App Overview

**Visual Design Concepts (Textual Reference for Generation):**

* **Patient Dashboard Concept:** A bright, highly legible layout. The top header is a clean white section with a subtle greeting. Below are overlapping pure white cards over a warm pearl-white background. The prominent medical summary card uses extremely soft, expansive drop shadows (no hard borders). Chips for diseases and allergies are distinct, pastel-colored soft pills (light red, light yellow) with deeply colored text. The "AI Health Guide" CTA is prominently separated, utilizing a subtle teal gradient with a clean, 1.8px stroke outlined icon. No heavy dark elements or frosted glass blurs are present.
* **AI Diagnostic Models Hub Concept:** A sleek vertical list of feature cards. Each card is pure #ffffff white with a faint 0 4px 24px rgba(0,0,0,0.07) shadow. Left side has a clean, teal outlined icon; right side has the title and a short grey subtitle. In the top corner of each AI card sits a delicate, tiny teal pill badge stating the AI accuracy (e.g., "دقة 99.39%"). The header of the screen uses a bold, large typography with a soft organic teal shape or gradient sweeping beautifully in the background behind the text. The overall vibe is highly clinical, airy, and trustworthy.
* **Master App Logo Concept:** A highly related, premium health-tech emblem placed on a pure white background. The logo abstractly combines a medical motif (like a stethoscope or cross) seamlessly integrated with a digital AI neural node. Rendered in Deep Medical Teal (#0d9488) with a tiny, precise accent of Warm Coral (#f43f5e). No heavy text, just the striking, minimalist icon accompanied by clean typography (Plus Jakarta Sans).

**App Name:** سِبَار (Sebar) — جاية من مصطلح "سبر الأغوار" وهو الفحص العميق واكتشاف المجهول، وهو الوصف الحرفي والعميق لما تقوم به أشعة المخ والتحاليل المتقدمة بالذكاء الاصطناعي.
**Platform:** Mobile (iOS & Android)
**Language:** Bilingual — Arabic (RTL, primary) and English (LTR)
**Theme:** Light mode by default with a clean, clinical-white feel. Dark mode available via toggle.
**Design Inspiration:** Modern health apps (Ada Health, Apple Health, Babylon) — clean, airy, trustworthy, not dark or moody.
**Primary Color:** Deep Medical Teal `#0d9488` with cyan shift `#0891b2` for gradients
**Accent / CTA Color:** Warm Coral `#f43f5e` — used for primary action buttons and highlights
**Background:** Warm pearl white `#f9fafb` (light) / Slate `#0f172a` (dark)
**Card Style:** Pure white `#ffffff` cards with soft multi-layer box shadows — NO glassmorphism, NO frosted blur
**Typography:** **Plus Jakarta Sans** (English) / **IBM Plex Sans Arabic** (Arabic) — clean, modern, highly legible at all sizes
**Corner Radius:** 20px for cards, 12px for inputs, 100px for pill buttons
**Icon Style:** Rounded outlined icons (Phosphor Icons or Lucide) — NOT emoji-heavy in the UI itself

**App Purpose:** سِبَار (Sebar) is a smart medical center mobile application that connects patients with specialist doctors across multiple departments. It features AI-powered diagnostic tools (Brain Tumor detection via Xception CNN 99.39%, Breast Cancer screening via DenseNet121 97.15%, Skin Disease classification via ViT-Base/16 97.93% across 16 DermNet classes, Chest X-Ray analysis via EfficientNetV2-L 96.46%), an intelligent medical chatbot (CRAG-inspired hybrid BM25+FAISS RAG with Tavily web fallback via LangGraph ReAct agent), automated bilingual medical report generation (Doctor = Clinical English / Patient = Egyptian Arabic), Not Allowed Medicines report, Lab Report OCR analysis (EasyOCR + Tesseract), appointment booking, and a dedicated children's health tracking section. The app supports Doctor, Patient, and Admin roles with distinct dashboards.

**Global UI Elements (present on every screen):**

- **Fixed Top Bar (Sticky Header):** A clean white bar that remains FIXED at the top of the screen during scrolling. The **سِبَار (Sebar) Logo** (Teal/Coral abstract medical-AI emblem) is constantly visible on the top-right (in RTL). The top-left contains the icon row (🔔 notification bell with badge, 🌐 language toggle AR/EN, ☀️/🌙 theme toggle).
- **Bottom navigation bar:** White bar with 5 tabs for patients, 3 for doctors — active tab shows filled teal icon + label, inactive tabs show grey outlined icon
- **Cards:** Pure white, rounded-20px, shadow: `0 4px 24px rgba(0,0,0,0.07)` — feel elevated but light
- **RTL/LTR:** Full layout mirror when switching Arabic ↔ English
- **Pull-to-refresh:** Teal spinner animation
- **Haptic feedback:** Light tap on buttons, medium on confirmations
- **Empty states:** Friendly illustrated SVG (not emoji) with a short message and a CTA button

---

## SECTION 1: ONBOARDING & AUTH SCREENS

---

### Screen 1.1: Splash Screen

A pristine, pure white background. Centered is the highly detailed **سِبَار (Sebar) Logo** (abstract teal/coral stethoscope + AI neural node). Below the logo, the prominent tagline in Arabic: "سبر الأغوار.. صحتك بقوة الذكاء الاصطناعي" with a subtle pulse/breathe animation on the logo icon. A thin teal progress bar at the bottom loads briefly before transitioning to the Landing screen.

---

### Screen 1.2: Landing / Onboarding (Swipeable Carousel — 4 slides)

**Slide 1 — Welcome:**
Full-screen hero illustration of a doctor holding a tablet with AI brain visualization. Large Arabic heading: "صحتك، بقوة الذكاء الاصطناعي". Subtitle: "احصل على رؤى صحية مخصصة، تحدث مع الذكاء الاصطناعي حول أعراضك، واحجز مواعيد مع أطباء متخصصين — كل ذلك في مكان واحد." Two buttons at bottom: "ابدأ الآن" (filled purple gradient) and "تعرف علينا" (outlined).

**Slide 2 — About Us:**
Clean card layout showing the medical center info. Heading: "من نحن". Description of the medical center with multiple specialties. Three small icon cards showing: "🏥 مركز طبي متكامل", "👨‍⚕️ أطباء متخصصين", "🤖 ذكاء اصطناعي متقدم". Dot indicators at bottom showing slide 2 of 4.

**Slide 3 — AI Features:**
Four pure white cards in a 2×2 grid, each showing an AI capability:

- 🧠 "كشف أورام المخ" — Brain Tumor Detection
- 🫁 "تحليل أشعة الصدر" — Chest X-Ray Analysis
- 🔬 "تشخيص الأمراض الجلدية" — Skin Disease Diagnosis
- 💬 "المساعد الصحي الذكي" — Smart Health Assistant
  Each card has a soft shadow and a teal icon.

**Slide 4 — Testimonials & Ratings:**
Star rating display (4.8/5) with user review cards. Each review card shows avatar, name, rating stars, and short review text in Arabic. "سجل الآن" (Register Now) prominent CTA button at the bottom.

**Navigation:** Swipe left/right between slides. Skip button top-right. Dot indicators at bottom.

---

### Screen 1.3: Login Page

Dark navy background. MediScan AI logo centered at top. Below it:

- Email input field with mail icon (placeholder: "البريد الإلكتروني")
- Password input field with lock icon and show/hide eye toggle (placeholder: "كلمة المرور")
- "تذكرني" (Remember me) checkbox on the left
- "هل نسيت كلمة المرور؟" (Forgot password?) link on the right, teal colored
- Large "تسجيل الدخول" (Login) button — full-width purple gradient with rounded corners
- Divider line with "أو" (or) text centered
- Social login buttons row: Google, Apple
- Bottom text: "ليس لديك حساب؟ سجل الآن" with "سجل الآن" as a teal link navigating to Sign Up

---

### Screen 1.4: Sign Up Page

Same dark background styling. MediScan AI logo at top. Scrollable form with fields:

- Full Name input (icon: person) — "الاسم الكامل"
- Email input (icon: mail) — "البريد الإلكتروني"
- Phone Number input (icon: phone) — "رقم الهاتف"
- Password input (icon: lock, eye toggle) — "كلمة المرور"
- Confirm Password input — "تأكيد كلمة المرور"
- Gender selector: Male/Female toggle buttons — "الجنس"
- Date of Birth picker — "تاريخ الميلاد"
- "إنشاء حساب" (Create Account) full-width purple gradient button
- Bottom text: "لديك حساب بالفعل؟ سجل الدخول" with link to Login

---

### Screen 1.5: Forgot Password Page

Minimal layout. Back arrow top-left. Lock icon illustration centered. Heading: "نسيت كلمة المرور؟". Subtitle: "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور". Email input field. "إرسال رابط الاستعادة" purple gradient button. Below: "تذكرت كلمة المرور؟ سجل الدخول" link.

---

## SECTION 2: PATIENT SCREENS

---

### Screen 2.1: Patient Dashboard (Home Panel)

**Top bar:** "مرحبًا بودنك، [اسم المريض]" greeting with wave emoji. Subtitle: "كيف يمكننا مساعدتك اليوم؟". Notification bell icon (top-left with red badge), language toggle (AR/EN), and theme toggle (🌙/☀️) on top-right. Logout button.

**Quick Action Cards (3 cards in a horizontal row):**

1. 📅 "مواعيدي" — My Appointments: "عرض مواعيدك القادمة والسابقة"
2. 🗓️ "حجز موعد" — Book Appointment: "حدد موعدًا لزيارة أطبائنا"
3. 🤖 "دليلك الصحي الذكي" — AI Health Guide: "تحدث عن أعراضك واحصل على توصيات"

**Medical Summary Section** with heading "ملخص ملفك الطبي":

Two glassmorphism cards side by side:

- **Left card — "المعلومات الشخصية"** (Personal Info): Shows name, email, phone with person icon
- **Right card — "المعلومات الطبية"** (Medical Info): Shows disease tags (red), allergy tags (yellow), medicine tags (blue) as colored pill badges. Edit button at bottom: "✏️ تعديل المعلومات"

**Medical Reports Section** with heading "تقاريري الطبية":
A list of past AI-generated medical report cards. Each card shows: date, report type icon, short summary preview text in Egyptian Arabic. Tapping a card opens the full report (Screen 2.9).

**Bottom Navigation Bar (5 tabs):**
🏠 الرئيسية | 📅 المواعيد | 🤖 الذكاء الاصطناعي | 👶 الأطفال | 👤 حسابي

---

### Screen 2.2: My Appointments

**Top:** Back arrow, heading "مواعيدي"
**Tab switcher:** Two tabs — "القادمة" (Upcoming) and "السابقة" (Past), with active tab having purple underline

**Appointment Cards (vertical list):**
Each card is a glassmorphism card showing:

- Doctor name and specialty (e.g., "د. أحمد — أخصائي أعصاب")
- Date and time with calendar and clock icons
- Status badge: "مؤكد" (green), "في الانتظار" (yellow), "ملغي" (red)
- "إلغاء الموعد" (Cancel) button for upcoming appointments

**Empty state:** If no appointments, show illustration of empty calendar with text: "لا توجد مواعيد حاليًا" and "حجز موعد جديد" button.

---

### Screen 2.3: Book Appointment

**Top:** Back arrow, heading "حجز موعد"

**Step 1 — Choose Specialty:**
Grid of specialty cards (3 columns): أعصاب (Neurology), جلدية (Dermatology), صدر (Pulmonology), أورام (Oncology), قلب (Cardiology), عظام (Orthopedics), etc. Each card has a medical icon and specialty name.

**Step 2 — Choose Doctor:**
After selecting specialty, a list of available doctors appears. Each doctor card shows: profile photo (circular), doctor name, specialty, rating (stars), available slots count badge. Tap to select.

**Step 3 — Choose Date & Time:**
Calendar date picker (horizontal scrollable week view). Below it, available time slots displayed as pill-shaped buttons (e.g., "09:00 AM", "10:30 AM", "02:00 PM"). Available = purple outline, selected = filled purple, unavailable = greyed out.

**Step 4 — Confirm:**
Summary card showing: Doctor name, specialty, date, time. "تأكيد الحجز" (Confirm Booking) large purple gradient button. Success animation (checkmark with confetti) on confirmation.

---

### Screen 2.4: AI Models Hub

**Top:** Back arrow, heading "مركز نماذج الذكاء الاصطناعي", subtitle "اختر أداة التحليل التي تحتاجها"

**Featured Card (large, top):**
💬 "المساعد الصحي الذكي" — Smart Health Assistant. Gradient teal card. Subtitle: "للاستشارات الأولية الذكية". "ابدأ محادثة الآن ←" button.

**Subtitle:** "🔬 أدوات التحليل الطبي المتخصصة"

**Analysis Model Cards (vertical stack):**

1. 🧠 "كشف أورام المخ" — Brain Tumor Detection: "تحليل صور الرنين المغناطيسي واكتشاف الأورام المحتملة". Accuracy badge: **99.39%**. "فتح النموذج" button
2. 🫁 "تحليل أشعة الصدر" — Chest X-Ray Analysis: "يساعد في تحليل الأشعة السينية لصور الصدر واكتشاف الأمراض الصدرية المحتملة". Accuracy badge: **96.46%**. "فتح النموذج" button
3. 🔬 "تشخيص الأمراض الجلدية" — Skin Disease Diagnosis: "فحص تشخيصي للأمراض الجلدية باستخدام تقنية الذكاء الاصطناعي المتقدمة (16 فئة)". Accuracy badge: **97.93%**. "فتح النموذج" button
4. 🎀 "تحليل سرطان الثدي" — Breast Cancer Analysis: "تحليل صور الماموجرام للكشف المبكر عن أورام الثدي". Accuracy badge: **97.15%**. *Visible only for female users.* "فتح النموذج" button
5. 🧪 "تحليل نتائج المختبر" — Lab Report OCR: "استخرج وحلل نتائج تحاليلك من صورة التقرير المختبري بالعربي أو الإنجليزي". "رفع التقرير" button
6. 💊 "تقرير الأدوية الممنوعة" — NAM-RPT: "قائمة بالأدوية غير المسموح بها بناءً على أمراضك وحساسيتك الحالية". "عرض التقرير" button

Each card shows: icon, title, one-line description, a small teal accuracy badge (for AI model cards), pure white background, and soft shadow.

---

### Screen 2.5: AI Chatbot (CRAG RAG)

**Top bar:** Back arrow, heading "مساعد الدردشة الطبية", subtitle "أنا هنا لمساعدتك اليوم!"

**Agent Capabilities Info Bar (collapsible, teal strip below top bar):**
A small collapsible banner showing the 5 tools the agent has access to, displayed as small pill badges:

- 🔍 "بحث طبي" (retriever_tool — Hybrid BM25+FAISS medical KB)
- 🌐 "بحث ويب" (websearch_tool — Tavily)
- 🖼️ "تحليل صور" (image — AI image analysis)
- 📅 "حجز مواعيد" (booking — appointment system)
- 🕐 "التاريخ والوقت" (datetime)
  Tapping the bar collapses/expands it.

**Chat Area (scrollable):**

- Bot welcome message in a rounded bubble (left-aligned): "مرحبًا! أنا مساعدك الذكي، كيف يمكنني مساعدتك اليوم؟"
- User messages appear in purple bubbles (right-aligned, immediately visible)
- Bot responses use **token-by-token streaming rendering** — text appears word by word in real time, exactly like ChatGPT / Claude / Gemini, NOT all at once after loading
- Messages support inline markdown formatting (bold medical terms, bullet lists for recommendations)
- Bot responses are in Egyptian Arabic for patients
- **⚡ Semantic Cache indicator:** When a response is served from semantic cache (previously answered similar query), a small teal badge appears on the bot bubble: "⚡ استجابة سريعة" — signaling instant reply without new LLM call
- **Web search indicator:** When the CRAG pipeline falls back to Tavily web search, a small badge appears: "🌐 تم البحث على الويب" — showing the answer was supplemented with live web data

**Streaming Response Behavior (while bot is generating):**

- A new empty bot bubble appears immediately after the user sends a message
- Text streams in token by token with a **blinking cursor `|`** at the end of the last word, identical to ChatGPT's response animation
- Markdown renders progressively as tokens arrive: bold text, bullet points, and numbered lists appear formatted in real time — not as raw asterisks
- The chat screen **auto-scrolls down** to follow the streaming text, keeping the latest token always visible
- A **"⏹ إيقاف" (Stop) button** appears in the input bar while streaming is active, replacing the send button — tapping it immediately halts the stream and shows the partial response as final
- While streaming, the input field is **disabled** (greyed out, non-interactive) to prevent sending another message mid-stream
- Once streaming completes, the blinking cursor disappears, the Stop button is replaced by the Send button again, and the input field becomes active
- If the response is from semantic cache (instant), the text appears all at once with no cursor — visually distinguishable from a streamed response
- If the backend connection drops mid-stream, the partial response bubble shows a small red banner: "⚠️ انقطع الاتصال — اضغط لإعادة المحاولة"

**Input Bar (bottom, fixed):**
Rounded text input field with placeholder "اكتب سؤالك الصحي..." and a purple send button (↑ arrow icon) on the left side (RTL layout). Microphone icon for voice input. While streaming: send button becomes red "⏹ إيقاف" stop button.

---

### Screen 2.6: Brain Tumor Model

**Top:** Back arrow, breadcrumb: "← العودة إلى مركز النماذج"
**Heading:** 🧠 "Brain Tumor Analysis" with subtitle "Advanced AI analysis for MRI scans to detect potential anomalies"
**Accuracy badge (top-right of heading):** Green pill badge — "دقة النموذج: 99.39%" (Xception CNN)

**Upload Area:**
Large dashed-border rectangle with cloud upload icon centered. Text: "اسحب الصورة هنا أو انقر للتصفح" (Drag image here or tap to browse). Supported formats note: "JPG, PNG, DICOM". Tap to open phone camera or gallery picker.

**After Upload:** Image thumbnail preview with X button to remove. "بدء التحليل" (Start Analysis) full-width blue gradient button.

**Results Section (appears after analysis):**

- Prediction result card with large text: e.g., "Glioma — احتمالية 94.3%"
- Top-3 predictions list with confidence bars (horizontal progress bars with percentages)
- AI Clinical interpretation text in a separate card (in Egyptian Arabic for patients, in clinical English for doctors)
- "حفظ في ملفي الطبي" (Save to my medical file) button
- "تحميل التقرير PDF" (Download PDF Report) button

---

### Screen 2.7: X-Ray Model

Same layout structure as Brain Tumor Model (Screen 2.6) but with:

- Heading: 🫁 "Chest X-Ray Analysis" and subtitle "AI-powered chest X-ray pathology detection"
- Accuracy badge: **"دقة النموذج: 96.46%"** (EfficientNetV2-L)
- Upload accepts chest X-ray images (JPG, PNG, DICOM)
- Results show detected pathologies (e.g., Pneumonia, Cardiomegaly, Normal) with confidence percentages
- Same save-to-profile and PDF download options

---

### Screen 2.8: Dermatology / Skin Disease Model

Same layout structure as Brain Tumor Model (Screen 2.6) but with:

- Heading: 🔬 "Skin Disease Analysis" and subtitle "ViT-Base/16 classification across 16 DermNet skin conditions"
- Accuracy badge: **"دقة النموذج: 97.93%"** (ViT-Base/16)
- Upload accepts skin lesion photos (JPG, PNG). Option to use phone camera directly
- Results show top-3 skin condition predictions with confidence bars
- Clinical description of the detected condition
- Same save-to-profile and PDF download options

---

### Screen 2.8b: Breast Cancer Model (Female users only)

Same layout structure as Brain Tumor Model (Screen 2.6) but with:

- Heading: 🎀 "Breast Cancer Analysis" and subtitle "DenseNet121-powered mammogram screening"
- Accuracy badge: **"دقة النموذج: 97.15%"** (DenseNet121)
- Upload accepts mammogram images
- Results show BI-RADS style classification with confidence
- Same save-to-profile and PDF download options

---

### Screen 2.8c: Lab Report OCR Analysis

**Top:** Back arrow, breadcrumb: "← العودة إلى مركز النماذج"
**Heading:** 🧪 "تحليل نتائج المختبر" with subtitle "استخرج وحلل نتائج تحاليلك من صورة التقرير"

**Info banner (blue):** "يدعم النص العربي والإنجليزي — EasyOCR + Tesseract"

**Upload Area:**
Large dashed-border area. Text: "ارفع صورة تقرير المختبر" (Upload lab report image). Supports JPG, PNG. Tip text: "تأكد أن الصورة واضحة وغير مائلة للحصول على أفضل نتيجة."

**After Upload:** Image preview. "استخرج النص" (Extract Text) button.

**Results Section:**

- **Extracted Text Card:** Raw OCR output shown in a scrollable text box with copy button
- **AI Interpretation Card:** LLM analysis of extracted lab values — highlights abnormal values in red, normal values in green
- Language of interpretation: Egyptian Arabic for patients, Clinical English for doctors
- "حفظ في ملفي الطبي" (Save to medical file) button

---

### Screen 2.9: Medical Report Viewer

**Top:** Back arrow, heading "التقرير الطبي"
**Report metadata bar:** Date, report type, model used

**Report Body:**
Full-screen scrollable card showing the AI-generated medical report in Egyptian Arabic (for patient role). The report includes sections:

- ملخص الحالة (Case Summary)
- النتائج (Findings)
- التوصيات (Recommendations)
- تحذيرات دوائية (Drug Warnings) — highlighted in red/orange cards
- الخطوات القادمة (Next Steps)

**Bottom actions:** "تحميل PDF" (Download PDF) button and "مشاركة" (Share) button.

---

### Screen 2.10: Profile / Update Profile

**Top:** Back arrow, heading "الملف الشخصي"

**Profile Header:** Circular avatar (with camera icon overlay to change photo), name, and email below

**Editable Fields (form):**

- Full Name — "الاسم الكامل"
- Email — "البريد الإلكتروني"
- Phone — "رقم الهاتف"
- Date of Birth — "تاريخ الميلاد"
- Gender — "الجنس"

**Medical Info Section:**

- Diseases list with colored tags (red) and "➕ إضافة" button
- Allergies list with colored tags (yellow) and "➕ إضافة" button
- Current Medicines list with colored tags (blue) and "➕ إضافة" button

Tapping "➕ إضافة" opens Screen 2.11.

**"حفظ التعديلات"** (Save Changes) purple gradient button at bottom.

**Medical Reports History Section:**
Scrollable list of past report cards (same as in dashboard). Each card shows date, type, and preview. Tap to open full report (Screen 2.9) in Egyptian Arabic.

---

### Screen 2.11: Add Disease / Allergy / Medication (Bottom Sheet Modal)

Slides up from bottom as a modal sheet. Three tab pills at top: "مرض" (Disease), "حساسية" (Allergy), "دواء" (Medicine). Active tab is purple filled.

Input field with search/autocomplete for medical terms. "إضافة" (Add) button. Shows existing items as removable pill tags below the input.

---

### Screen 2.12: Not Allowed Medicines Report (NAM-RPT)

**Access:** From AI Models Hub card "تقرير الأدوية الممنوعة" or from Profile screen

**Top:** Back arrow, heading "💊 تقرير الأدوية الممنوعة", subtitle "بناءً على أمراضك وحساسيتك المسجلة في ملفك الطبي"

**Patient Context Summary Bar (top card):**
A compact card showing the patient's current profile inputs used to generate the report:

- Diseases tags (red pills)
- Allergies tags (yellow pills)
- Current medicines tags (blue pills)
- "تحديث بياناتي" (Update my data) link → opens Screen 2.10

**"إنشاء التقرير" (Generate Report) button** — triggers LLM call with role-based prompt (Patient AR / Doctor EN)

**Report Result (appears after generation):**

Three sections displayed as color-coded expandable cards:

1. 🔴 **أدوية ممنوعة** (Forbidden Medicines):

   - List of medicine names with reason (e.g., "Ibuprofen — ممنوع بسبب حساسية مسجلة" or "ممنوع مع مرض القلب")
   - Each item has a red warning icon and a short explanation
2. ⚠️ **أدوية تحتاج حذر** (Use With Caution):

   - Medicines that interact with current conditions but are not fully forbidden
   - Amber warning icons with short note
3. 💊 **تفاعلات دوائية** (Drug Interactions):

   - Detected interactions between the patient's current medicines
   - e.g., "[Medicine A] — قد يتفاعل مع [Medicine B] ويسبب [effect]"

**Disclaimer banner (bottom, grey):** "هذا التقرير للاسترشاد فقط ولا يغني عن استشارة الطبيب أو الصيدلاني."

**Action Buttons:**

- "تحميل PDF" (Download PDF) — generates bilingual PDF (Arabic for patient / English for doctor)
- "مشاركة مع طبيبي" (Share with my doctor) — sends report to treating doctor

---

## SECTION 3: EXAMINATION SCREENS

---

### Screen 3.1: Brain Tumor Examination (Step-by-Step Wizard)

**Access:** From notifications (monthly reminder) or from a menu item in the AI Models Hub.

**Layout:** NOT a scrollable page. This is a wizard-style step-by-step flow. Only one step is visible at a time. User taps "التالي" (Next) to proceed to the next step, and "السابق" (Previous) to go back.

**Progress:** Horizontal step indicator at top showing 5 circles connected by lines (Step 1, 2, 3, 4, 5). Current step is filled purple, completed steps have checkmarks, upcoming steps are grey outlined.

**Step 1 of 5 — اختبار التوازن (Balance — Romberg Test):**

- Step title: "1. اختبار التوازن (Romberg Test)"
- Illustration: Simple animated figure standing with feet together and arms at sides
- Instructions card (Arabic): "لو سمحت، اقف واضم رجليك الاتنين لبعض على الآخر، ونزل دراعاتك جنبك. دلوقتي عايزك تغمض عينيك وتخليك ثابت في مكانك كده لمدة 30 ثانية من غير ما تتحرك."
- Observation note (in a yellow info card): "⚠️ الملاحظة: لو المريض بدأ يترنح أو يتهز يمين وشمال، أو فقد توازنه أول ما غمض عينه، دي إشارة لمشكلة في التوازن الحسي أو العصبي."
- Timer button: "ابدأ العد (30 ثانية)" that starts a 30-second countdown
- Bottom: "التالي ←" button (right side)

**Step 2 of 5 — التنسيق الحركي (Coordination — Finger-to-Nose):**

- Step title: "2. التنسيق الحركي (Finger-to-Nose)"
- Illustration: Animated figure touching nose with index finger
- Instructions card: "افرد دراعك لقدام على الآخر.. دلوقتي عايزك تلمس أرنبة مناخيرك بصباعك السبابة بسرعة وبدقة، وبعدين ترجع تلمس صباعي.. كرر الحركة دي كذا مرة، ودلوقتي جرب تعملها وأنت مغمض عينيك."
- Observation note: "⚠️ الملاحظة: وجود رعشة (Tremor) في الإيد وهي بتقرب من الوش، أو إن المريض مايقدرش يحدد مكان مناخيره بدقة، ده مؤشر مهم لمشكلة في التوافق العضلي."
- Bottom: "← السابق" (left) and "التالي ←" (right)

**Step 3 of 5 — حركة العين والرؤية (Cranial Nerves — H-Pattern):**

- Step title: "3. اختبار حركة العين (H-Pattern)"
- Illustration: Face with arrows showing H-pattern eye movement directions
- Instructions card: "خلي راسك ثابتة خالص وماتحركهاش.. وبعينيك بس، تابع حركة صباعي ده. هحركه يمين وشمال وفوق وتحت، خليك باصص عليه من غير ما تلف رقبتك."
- Observation note: "⚠️ الملاحظة: لو المريض اشتكى من زغللة أو شاف الحاجة اتنين، أو لو عينه مش قادرة تروح للأطراف، أو لو حصلت حركة اهتزازية سريعة للعين (رأرأة — Nystagmus) وهو بيبص للجنب."
- Bottom: "← السابق" and "التالي ←"

**Step 4 of 5 — القوة العضلية (Motor Strength — Pronator Drift):**

- Step title: "4. اختبار القوة العضلية (Pronator Drift)"
- Illustration: Figure with arms extended forward, palms up
- Instructions card: "اقعد مستريح وارفع دراعاتك الاتنين مفرودين قدامك، وخلي كف إيدك باصص لفوق كأنك شايل صينية. دلوقتي غمض عينيك وخليك رافع إيدك كده وثابت لمدة 20 ثانية."
- Timer button: "ابدأ العد (20 ثانية)"
- Observation note: "⚠️ الملاحظة: لو في إيد بدأت تلف لجوه (كف الإيد يبص للأرض) أو تنزل لتحت ببطء لوحدها، ده معناه وجود ضعف عصبي خفي في الجنب ده من الجسم."
- Bottom: "← السابق" and "التالي ←"

**Step 5 of 5 — القدرات المعرفية والكلام (Cognitive & Speech):**

- Step title: "5. القدرات المعرفية والكلام"
- Illustration: Speech bubble icons with brain
- Instructions card: "اسأل المريض في شكل دردشة: أخبارك إيه النهاردة؟ حاسس بوجع أو صداع بيجيلك أول ما تصحى من النوم؟ طيب فاكر اسم [شخص مقرب أو مكان بيحبه]؟"
- Observation note: "⚠️ الملاحظة: ملاحظة أي تقل في اللسان (Slurred Speech) أو إنه بيعاني عشان يفتكر كلمات بسيطة. كمان التغيير المفاجئ في الشخصية (زي العصبية الزايدة) أو نوبات الصداع اللي بتبقى قوية الصبح وتقل على مدار اليوم، دي كلها مؤشرات قوية جداً."
- Bottom: "← السابق" and "إنهاء الفحص ✓" (green completion button)

**Completion Screen:** Checkmark animation, "تم إنهاء الفحص بنجاح!", summary of all observations, and "العودة للرئيسية" button. Next examination reminder note: "سيتم تذكيرك بالفحص القادم بعد شهر."

---

### Screen 3.2: Breast Cancer Self-Examination (Step-by-Step Wizard — Female only)

**Access:** From notifications (monthly reminder) or from AI Models Hub. Only shown to users with gender set to Female.

**Same wizard layout as Brain Tumor Examination.** Progress bar at top showing 6 circles.

**Step 1 of 6 — Stand and Raise Arms:**

- Step title: "1. قفي أمام المرآة وارفعي ذراعيكِ"
- Illustration: Female figure silhouette standing in front of mirror with raised arms
- Instructions: "قفي مواجهة لمرآة وارفعي ذراعيكِ لأعلى. لاحظي أي تغييرات في شكل أو حجم الثديين."
- Bottom: "التالي ←"

**Step 2 of 6 — Lower Arms, Press Hips:**

- Step title: "2. أنزلي ذراعيكِ واضغطي على وركيكِ"
- Illustration: Figure with hands firmly on hips
- Instructions: "أنزلي ذراعيكِ واضغطي بقوة على وركيكِ. لاحظي أي تغييرات في الشكل."
- Bottom: "← السابق" and "التالي ←"

**Step 3 of 6 — Turn Side to Side:**

- Step title: "3. تحركي ببطء من جانب لآخر"
- Illustration: Figure turning slowly
- Instructions: "تحركي ببطء من جانب لآخر ولاحظي أي تغييرات في:"
- Checklist items: "• شكل وحجم الثديين" / "• شكل وحجم الحلمتين" / "• مظهر الجلد (تجعد، انكماش، احمرار)"
- Bottom: "← السابق" and "التالي ←"

**Step 4 of 6 — Feel for Lumps:**

- Step title: "4. تحسسي الثديين والمنطقة المحيطة"
- Illustration: Diagram showing circular motion pattern for self-exam
- Instructions: "باستخدام أطراف أصابعك الثلاثة الوسطى، تحسسي الثديين والمنطقة المحيطة بهما بحركات دائرية للبحث عن أي كتل أو تغييرات."
- Bottom: "← السابق" and "التالي ←"

**Step 5 of 6 — Check Nipples:**

- Step title: "5. افحصي الحلمتين"
- Illustration: Simple instructional diagram
- Instructions: "اضغطي برفق على كل حلمة للتأكد من عدم وجود أي إفرازات غير طبيعية."
- Bottom: "← السابق" and "التالي ←"

**Step 6 of 6 — Lie Down and Repeat:**

- Step title: "6. استلقي وكرري الخطوات 4-5"
- Illustration: Figure lying down performing exam
- Instructions: "استلقي على ظهرك وكرري خطوات التحسس وفحص الحلمتين. هذا الوضع يساعد على انبساط أنسجة الثدي."
- Bottom: "← السابق" and "إنهاء الفحص ✓"

**Completion Screen:** Same as Brain Tumor completion. Next reminder in one month.

---

## SECTION 4: CHILDREN'S HEALTH SECTION

---

### Screen 4.1: Children Section Hub

**Access:** From bottom navigation tab "👶 الأطفال" or from patient dashboard

**Top:** Heading "👶 صحة طفلك" with subtitle "أدوات ذكية لمتابعة نمو وصحة طفلك"

**Feature Cards (scrollable vertical list, each card has icon, title, description, and "افتح" button):**

1. 📊 **مخطط متابعة النمو** (Growth Tracker): "تتبعي نمو طفلك بناءً على معايير منظمة الصحة العالمية (WHO)"
2. 🧒 **اختبار تطور المهارات** (Developmental Milestones): "اختبار بسيط لتقييم مهارات طفلك الحركية واللغوية والاجتماعية"
3. 💊 **حاسبة جرعات خافض الحرارة** (Fever Medicine Dosage Calculator): "احسبي الجرعة المناسبة حسب وزن طفلك"
4. 💉 **جدول التطعيمات الذكي** (Smart Vaccination Tracker): "مواعيد التطعيمات الإجبارية والاختيارية حسب عمر طفلك"
5. 🔍 **أعراض تستوجب القلق** (Symptom Checker Lite): "هل الحالة تستدعي طوارئ؟"
6. 🍎 **دليل التغذية حسب العمر** (Solid Food Guide): "الأكل المسموح والممنوع لكل مرحلة عمرية"
7. ⚖️ **مؤشر كتلة الجسم للأطفال** (BMI-for-Age): "هل وزن طفلك مثالي؟"
8. 🩹 **الإسعافات الأولية** (First Aid Quick Access): "تعاملي مع الحالات الطارئة بسرعة"

---

### Screen 4.2: Growth Tracker (WHO Standards)

**Top:** Back arrow, heading "📊 مخطط متابعة النمو"

**Input Form:**

- Child's age (months/years selector with scrollable picker)
- Weight in kg (numeric input)
- Height in cm (numeric input)
- Gender toggle (Male/Female)

**"احسب" (Calculate) button**

**Results:**
A growth curve chart (line graph) showing the child's position relative to WHO percentile curves (3rd, 15th, 50th, 85th, 97th percentiles). The child's data point is highlighted with a large dot. Color-coded status:

- 🟢 Green zone: Normal growth
- 🟡 Yellow zone: Monitor — consult pediatrician
- 🔴 Red zone: Needs medical attention

Text interpretation below: e.g., "نمو طفلك طبيعي بالنسبة لسنه ✓" or warning message.

---

### Screen 4.3: Developmental Milestones Test

**Top:** Back arrow, heading "🧒 اختبار تطور المهارات"

**Age Selector:** Horizontal scrollable pills for age ranges: "0-3 شهور", "4-6 شهور", "7-9 شهور", "10-12 شهر", "12-18 شهر", "18-24 شهر"

**Questions (Yes/No format, one at a time):**
Based on selected age, display milestone questions. Example for 4-6 months:

- "هل بدأ الطفل يبتسم عند رؤيتك؟" — نعم / لا
- "هل يمسك الأشياء بيده؟" — نعم / لا
- "هل بدأ في الزحف؟" — نعم / لا
- "هل يصدر أصوات مناغاة؟" — نعم / لا

Each question appears in a card with large Yes (green ✓) and No (red ✗) buttons.

**Results Screen:**
Summary showing which milestones are achieved (✅) and which may need attention (⚠️). Categories: حركي (Motor), لغوي (Language), اجتماعي (Social). Recommendation text and "استشيري طبيب أطفال" button if any red flags detected.

---

### Screen 4.4: Fever Medicine Dosage Calculator

**Top:** Back arrow, heading "💊 حاسبة جرعات خافض الحرارة"

**⚠️ Disclaimer banner (top, yellow):** "هذه أداة مساعدة ولا تغني عن استشارة الطبيب"

**Input:**

- Medicine type dropdown: "باراسيتامول (Paracetamol)" / "ايبوبروفين (Ibuprofen)"
- Child's weight in kg (numeric input with stepper +/-)
- Medicine concentration dropdown: e.g., "120mg/5ml" or "250mg/5ml"

**"احسب الجرعة" button**

**Result Card:**
Large display: "الجرعة المناسبة: X.X مل (ml)" with a measuring cup illustration. Frequency note: "كل 6-8 ساعات حسب الحاجة". Maximum daily doses warning.

---

### Screen 4.5: Smart Vaccination Tracker

**Top:** Back arrow, heading "💉 جدول التطعيمات الذكي"

**Input:** Child's date of birth (date picker)

**Output:** Timeline/calendar view showing:

- ✅ Past due vaccinations (green checked if completed, red alert if missed)
- 📅 Next upcoming vaccination highlighted in purple with date and name
- 🔮 Future vaccinations greyed out

Each vaccination entry shows:

- Vaccination name in Arabic and English
- Recommended age
- Status badge (completed/upcoming/overdue)
- Tap to expand → shows detailed info: description, expected side effects (e.g., "سخونية خفيفة"), and tips from medical dictionary

**Notification toggle:** "تفعيل التنبيهات" — sends push notification before each vaccination date.

---

### Screen 4.6: Symptom Checker Lite

**Top:** Back arrow, heading "🔍 أعراض تستوجب القلق"

**Step-by-step Yes/No questions:**

- "هل درجة الحرارة أعلى من 39؟"
- "هل يوجد طفح جلدي؟"
- "هل الطفل يرفض الأكل والشرب؟"
- "هل يوجد صعوبة في التنفس؟"
- "هل الطفل خامل بشكل غير طبيعي؟"

**Result — Color-coded severity card:**

- 🟢 **أخضر** "راقبي الطفل" — Watch and monitor at home. Tips provided.
- 🟡 **أصفر** "استشيري طبيب في أقرب وقت" — See a doctor soon. Book appointment button.
- 🔴 **أحمر** "توجهي للطوارئ فوراً!" — Emergency. Call button and nearest hospital map.

---

### Screen 4.7: Solid Food Guide

**Top:** Back arrow, heading "🍎 دليل التغذية حسب العمر"

**Age Selector:** Horizontal scrollable pills: "4-6 شهور", "6-8 شهور", "8-10 شهور", "10-12 شهر", "12+ شهر"

**Two columns:**

- ✅ **مسموح** (Allowed) — Green bordered list of allowed foods with icons
- ❌ **ممنوع** (Forbidden) — Red bordered list (e.g., "عسل قبل السنة ❌", "ملح ❌", "سكر ❌")

**Bonus section:** "🍽️ وصفات صحية" — Simple healthy recipe cards for the selected age range, each with ingredients and preparation steps.

---

### Screen 4.8: BMI-for-Age Calculator

**Top:** Back arrow, heading "⚖️ مؤشر كتلة الجسم للأطفال"

**Input:** Age, Weight (kg), Height (cm), Gender

**Result:** Percentile-based gauge/meter showing:

- نحافة (Underweight) — below 5th percentile
- وزن مثالي (Healthy) — 5th to 85th percentile
- زيادة وزن (Overweight) — 85th to 95th percentile
- سمنة (Obese) — above 95th percentile

Nutritional advice text and "استشيري أخصائي تغذية" button if outside healthy range.

---

### Screen 4.9: First Aid Quick Access

**Top:** Back arrow, heading "🩹 الإسعافات الأولية"

**Grid of emergency scenario cards (2 columns):**

- 🫁 الشرقة / الاختناق (Choking)
- 🔥 الحروق البسيطة (Minor Burns)
- 🤕 وقوع الطفل على رأسه (Head Injury)
- 🩸 الجروح والنزيف (Cuts & Bleeding)
- 🤒 ارتفاع الحرارة الشديد (High Fever)
- 🐝 لدغات الحشرات (Insect Bites)

Each card opens a detailed screen with:

- Step-by-step first aid instructions with numbered steps
- Animated GIF illustrations showing the action
- "اتصل بالطوارئ" (Call Emergency) red button if situation escalates

---

## SECTION 5: DOCTOR SCREENS

---

### Screen 5.1: Doctor Dashboard

**Top bar:** "مرحبًا، د. [اسم الطبيب]" with greeting. Subtitle: "هؤلاء هم مرضاك اليوم". Logout button (top-left).

**Today's Stats Cards (horizontal row, 3 cards):**

- 📅 "مواعيد اليوم" — Count badge (e.g., "5")
- ✅ "تم الفحص" — Count badge (e.g., "2")
- ⏳ "في الانتظار" — Count badge (e.g., "3")

**Section: "مواعيد اليوم" with today's date**

**Appointment List (vertical cards):**
Each appointment card shows:

- Patient name (bold)
- Appointment time (green badge, e.g., "04:54 PM")
- "عرض التفاصيل" (View Details) button
- 📄 **Medical Report icon** — A small document icon beside each patient name. Tapping it opens the AI-generated Medical Text Report for that patient (in clinical English for the doctor). If no report exists, the icon is greyed out with tooltip "لا يوجد تقرير".

**Bottom Navigation Bar (3 tabs):**
🏠 الرئيسية | 📅 المواعيد | 👤 حسابي

---

### Screen 5.2: Patient Details (Doctor View)

**Access:** Doctor taps "عرض التفاصيل" on an appointment card

**Patient Info Card:**

- Patient photo (circular avatar)
- Name, age, gender
- Phone number and email
- Diseases tags (red pills), Allergies tags (yellow pills), Medicines tags (blue pills)

**Medical History Section — "السجل الطبي":**
Scrollable list of past AI-generated medical reports for this patient. Each report card shows:

- Date and report type
- Short preview of the report content
- Tap to expand → Full Medical Report displayed in clinical English (for doctor role)

**Action Buttons:**

- "بدء الفحص" (Start Examination) — Links to AI Models
- "إنشاء تقرير" (Generate Report) — Triggers LLM report generation

---

### Screen 5.3: Full Medical Report View (Doctor)

**Top:** Back arrow, heading "تقرير طبي — [Patient Name]"
The full AI-generated medical report displayed in clinical English:

- Clinical Overview
- Findings & Diagnosis
- Drug Interaction Warnings (highlighted in orange/red card)
- Recommended Investigations
- Action Items Table
- "تحميل PDF" (Download PDF) button

---

## SECTION 6: ADMIN SCREENS

---

### Screen 6.1: Admin Dashboard

**Top bar:** "لوحة تحكم المدير" with subtitle "نظرة عامة على النظام والإجراءات السريعة". Logout button.

**Stats Cards (horizontal scrollable, 3 cards):**

- 👨‍⚕️ "الأطباء النشطين" — Count (e.g., "5") with green trend arrow icon
- 📅 "مواعيد اليوم" — Count (e.g., "1")
- 👥 "الأطباء المسجلين" — Count (e.g., "8")

**Section: "مواعيد اليوم"** — Today's appointment cards (same style as doctor view)

**Quick Action Cards (2×2 grid):**

1. ➕ "إضافة طبيب جديد" — Add New Doctor → Screen 6.4
2. ➕ "إنشاء مشرف جديد" — Add New Admin → Screen 6.5
3. 📅 "حجز موعد" — Book for walk-in patient → Screen 6.6
4. 📋 "إدارة الأطباء" — Manage Doctors → Screen 6.2

---

### Screen 6.2: List All Doctors

**Top:** Back arrow, heading "جميع الأطباء"
**Search bar** at top with filter icon

**Doctor Cards (vertical list):**
Each card shows:

- Doctor photo (circular)
- Name and specialty
- Status badge: "نشط" (green) or "غير نشط" (grey)
- Star rating
- "عرض" (View), "تعديل" (Edit), "حذف" (Delete — with confirmation dialog) action buttons

---

### Screen 6.3: List Active Doctors

Same as Screen 6.2 but filtered to show only active doctors. Tab switcher at top: "الكل" | "النشطين" | "غير النشطين"

---

### Screen 6.4: Add New Doctor (Form)

**Top:** Back arrow, heading "إضافة طبيب جديد"

**Form fields:**

- Full Name — "الاسم الكامل"
- Email — "البريد الإلكتروني"
- Phone — "رقم الهاتف"
- Specialty dropdown — "التخصص"
- Password — "كلمة المرور"
- Profile photo upload
- Bio / Description textarea — "نبذة عن الطبيب"

"إضافة الطبيب" purple gradient button. Success toast notification on completion.

---

### Screen 6.5: Add New Admin (Form)

**Top:** Back arrow, heading "إنشاء مشرف جديد"

**Form fields:**

- Full Name — "الاسم الكامل"
- Email — "البريد الإلكتروني"
- Password — "كلمة المرور"
- Phone — "رقم الهاتف"
- Role permissions checkboxes

"إنشاء المشرف" purple gradient button.

---

### Screen 6.6: Book Appointment for Walk-in Patient (Admin)

Same flow as patient booking (Screen 2.3) but with an additional field at the start to search/select the patient by name or phone number, or create a new patient record inline.

---

## SECTION 7: NOTIFICATIONS

---

### Screen 7.1: Notifications Center

**Access:** Tap notification bell icon from any screen

**Top:** Heading "الإشعارات" with "مسح الكل" (Clear All) link

**Notification Cards (vertical list, newest first):**
Each notification card shows:

- Icon (type-based: 📅 appointment, 🧠 examination reminder, 💉 vaccination, 📄 report ready, 🔔 general)
- Title text (bold)
- Description text (1-2 lines)
- Timestamp (relative: "منذ 5 دقائق", "أمس")
- Unread indicator (purple dot on left edge)

**Notification Types:**

- Monthly Brain Tumor Examination reminder: "🧠 حان موعد فحص أورام المخ الشهري"
- Monthly Breast Cancer Examination reminder (female only): "🎀 حان موعد الفحص الذاتي الشهري لسرطان الثدي"
- Vaccination due reminder: "💉 موعد تطعيم طفلك [اسم التطعيم] بعد 3 أيام"
- Appointment reminder: "📅 موعدك مع د. [اسم] غدًا الساعة [وقت]"
- Report ready: "📄 تقريرك الطبي جاهز للعرض"
- NAM-RPT update: "💊 تم تحديث تقرير الأدوية الممنوعة بناءً على تغيير بياناتك الطبية"
- Weekly child development tip: "👶 معلومة أسبوعية عن تطور طفلك"

---

## SECTION 8: SETTINGS & GLOBAL

---

### Screen 8.1: Settings

**Access:** From profile tab or gear icon

**Settings list items:**

- 🌍 "اللغة" (Language) — Toggle between العربية and English
- 🌙 "الوضع الداكن" (Dark Mode) — Toggle switch (on by default)
- 🔔 "الإشعارات" (Notifications) — Toggle switch + sub-settings for each notification type
- 🔒 "تغيير كلمة المرور" (Change Password)
- 📋 "سياسة الخصوصية" (Privacy Policy)
- ℹ️ "عن التطبيق" (About App) — Version, credits
- 🚪 "تسجيل الخروج" (Logout) — Red text with confirmation dialog

---

## DESIGN SYSTEM NOTES

### Color Palette

| Role            | Color                | Hex         |
| --------------- | -------------------- | ----------- |
| Primary (Teal)  | Deep medical teal    | `#0d9488` |
| Primary Light   | Teal gradient end    | `#0891b2` |
| Primary Surface | Teal tint background | `#f0fdfa` |
| CTA / Action    | Warm coral           | `#f43f5e` |
| CTA Hover       | Coral dark           | `#e11d48` |
| Background      | Warm pearl white     | `#f9fafb` |
| Card Surface    | Pure white           | `#ffffff` |
| Border          | Soft grey            | `#e5e7eb` |
| Text Primary    | Near black           | `#111827` |
| Text Secondary  | Medium grey          | `#6b7280` |
| Text Muted      | Light grey           | `#9ca3af` |
| Success         | Emerald              | `#10b981` |
| Warning         | Amber                | `#f59e0b` |
| Danger          | Rose red             | `#f43f5e` |
| Info            | Sky blue             | `#0ea5e9` |
| Dark Background | Deep slate           | `#0f172a` |
| Dark Card       | Dark card            | `#1e293b` |

### Typography

| Element         | Font                                     | Weight        | Size |
| --------------- | ---------------------------------------- | ------------- | ---- |
| Screen Title    | Plus Jakarta Sans / IBM Plex Sans Arabic | 800 ExtraBold | 26px |
| Section Heading | Plus Jakarta Sans / IBM Plex Sans Arabic | 700 Bold      | 20px |
| Card Title      | Plus Jakarta Sans / IBM Plex Sans Arabic | 600 SemiBold  | 16px |
| Body Text       | Plus Jakarta Sans / IBM Plex Sans Arabic | 400 Regular   | 15px |
| Caption / Label | Plus Jakarta Sans / IBM Plex Sans Arabic | 400 Regular   | 12px |
| Button          | Plus Jakarta Sans / IBM Plex Sans Arabic | 700 Bold      | 15px |

### Spacing & Shape

- **Card border-radius:** 20px
- **Button border-radius:** 100px (pill) for primary CTAs, 12px for secondary
- **Input border-radius:** 12px
- **Card padding:** 20px
- **Screen horizontal padding:** 20px
- **Section gap:** 24px
- **Card shadow:** `0 4px 24px rgba(0, 0, 0, 0.07)` — soft, not harsh
- **Pressed shadow:** `0 1px 4px rgba(0, 0, 0, 0.08)` — flattens on tap

### Card Design (NOT Glassmorphism)

```
Background:  #ffffff (pure white)
Border:      1px solid #f3f4f6 (barely visible)
Shadow:      0 4px 24px rgba(0,0,0,0.07)
Radius:      20px
Padding:     20px
```

No blur, no transparency, no frosted glass. Clean and clinical.

### Primary Button

```
Background:  linear-gradient(135deg, #f43f5e, #fb7185)  ← Coral gradient
Text:        #ffffff, Bold 15px
Radius:      100px
Padding:     14px 28px
Shadow:      0 4px 16px rgba(244, 63, 94, 0.35)
```

### Secondary Button

```
Background:  #f0fdfa  ← Teal tint
Border:      1.5px solid #0d9488
Text:        #0d9488, SemiBold 15px
Radius:      12px
```

### Teal Accent Gradient (headers, active states)

```
linear-gradient(135deg, #0d9488 0%, #0891b2 100%)
```

### Status / Tag Pills

| Type        | Background  | Text               |
| ----------- | ----------- | ------------------ |
| Disease     | `#fee2e2` | `#991b1b`        |
| Allergy     | `#fef3c7` | `#92400e`        |
| Medicine    | `#dbeafe` | `#1e40af`        |
| Confirmed   | `#dcfce7` | `#166534`        |
| Pending     | `#fef9c3` | `#854d0e`        |
| Cancelled   | `#fee2e2` | `#991b1b`        |
| AI Accuracy | `#f0fdfa` | `#0d9488` (teal) |

### Micro-Animations

- **Screen transitions:** Shared element tran sition — cards expand into next screen (300ms spring curve)
- **Button press:** Scale `0.96` + shadow flattens (120ms ease)
- **List items load:** Staggered fade-up — each item slides up 8px with 40ms delay between items
- **Skeleton loading:** Warm grey shimmer `#e5e7eb → #f3f4f6` left-to-right
- **Success:** Green checkmark draws itself (SVG stroke animation, 400ms) + subtle scale bounce
- **Streaming cursor:** Blinking `|` at 530ms interval, teal colored `#0d9488`
- **Tab switch:** Icon morphs from outlined to filled with a teal dot indicator underneath
- **Notification badge:** Bounces once on appearance

### Icon System

- **Library:** Phosphor Icons (rounded style) or Lucide — consistent stroke width 1.8px
- **Size:** 24px standard, 20px in navigation, 32px in feature cards
- **Color:** Teal `#0d9488` for active, grey `#9ca3af` for inactive, coral `#f43f5e` for danger/alert
- **NO emoji icons in UI components** — emojis only in notification text and examination screens

### Screen Header Pattern

Every screen has a consistent header:

```
[Back Arrow Icon]    [Screen Title — Bold 22px]    [Optional action icon]
Subtitle text — Regular 14px, grey #6b7280
Thin teal divider line at bottom of header
```

### AI Model Result Cards

Each AI result card follows this structure:

```
╔══════════════════════════════╗
║  [Model Icon]  [Model Name]  ║  ← teal header strip
║  دقة النموذج: XX.XX%  ✓     ║  ← accuracy badge in teal pill
╠══════════════════════════════╣
║  RESULT: Glioma              ║  ← large bold prediction
║  ████████████░░  94.3%       ║  ← coral progress bar
║  ██████░░░░░░░░  3.2%        ║
║  █░░░░░░░░░░░░░  2.1%        ║
╠══════════════════════════════╣
║  AI Interpretation text...   ║  ← scrollable, 15px body
╠══════════════════════════════╣
║  [💾 Save]    [📄 PDF]       ║  ← action row
╚══════════════════════════════╝
```

### Accessibility

- Minimum touch target: 48×48px
- Text contrast ratio: ≥ 4.5:1 (WCAG AA)
- Dynamic type support (iOS) / font scaling (Android)
- All icons have accessible labels
- VoiceOver (iOS) / TalkBack (Android) compatible
- Reduced motion: all animations respect system preference
