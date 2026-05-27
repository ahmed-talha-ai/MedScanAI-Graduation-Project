# SEBAR / MEDISCAN AI
### Master Production & Architectural System Specifications Document *(Version 2 - Refined)*

This updated technical specifications document establishes the revised baseline for the **Sebar / MediScan AI** software ecosystem. It includes the highly requested user-friendly empathetic terminal instructions framework that gently guides patients to medical support if anomalies are spotted, eliminating clinical anxiety while securing patient safety parameters.

---

## 🎨 1. GLOBAL DESIGN SYSTEM & THEME TOKENS (Tailwind CSS)

### A. Light Mode *(Clinical, Crisp, & Ergonomic Layout)*

- **Main Structural Background:** `bg-[#F4F7F6]` — Soft medical tint tailored to replace stark, high-fatigue pure white viewports.
- **Dynamic Surface Cards:** `bg-[#FFFFFF]` — Pure clean white layers accentuated with a subtle, ultra-soft drop ambient shadow matrix: `shadow-[0_4px_20px_rgba(0,0,0,0.03)]`.
- **Primary Branding Core Elements:** Deep Clinical Teal `bg-[#006666]` or high-energy Electric Blue `bg-[#007BFF]`.
- **Accent Profiles & Kids Portal Interfaces:** Lavender Pastel Purple `text-[#6366F1]` and vibrant Mint Green `text-[#10B981]`.

### B. Dark Mode *(Premium Cinematic & High-Tech AI Workspace)*

- **Main Structural Background:** `bg-[#0A0F1D]` — Deep galactic midnight canvas designed to completely phase out uninspired, muddy pure black layouts.
- **Dynamic Surface Cards:** `bg-[#1E293B]/40` — Semi-translucent glassmorphism panels operating with structural background diffusion blurring `backdrop-blur-md` and a light-receptive border trim `border-white/10`.
- **Neon Energy Accents:** Active Scanning Cyan `text-[#00F2FE]` (allocated for tissue scanners and general clinical tools) and Diagnostic Neon Purple `text-[#9D4EDD]` (allocated for deep learning networks and neurological views).

---

## ⚡ 2. SYSTEM-WIDE ANIMATIONS & INTERACTIVE STATES (Framer Motion)

### A. The Opening Laser-Scan Pre-loader

Upon initialization of the ecosystem landing viewport, a full-screen masking view matching the active theme color intercepts the frame stack. In the dead center, the logo undergoes a linear light-shimmer iteration (simulating an active medical laser horizontal pass). Once completed, the container fades out smoothly (`opacity: 0` over 400ms), letting child components glide up along the vertical Y-axis.

### B. Tab Selection Active-State Fluid Indicator

Throughout all internal Dashboard layouts, switching between sidebar tabs drops rigid on/off styles. The highlighting anchor box which marks the active item slides fluidly along the structural axis using a shared layout context token powered by Framer Motion's native `layoutId="activeIndicator"` properties.

### C. Global Interactive Elastic-Bounce Layer

Every diagnostic selection card mounted within the dark mode dashboard workspace must inherently leverage an elastic physical response matrix and a light-emission shadow aura on cursor interception:

```jsx
className="transition-all duration-500 hover:-translate-y-2 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(0,242,254,0.15)]"
```

---

## 🔧 3. DETAILED FRAME-BY-FRAME UI/UX SPECIFICATIONS

### A. Landing Page & Authentication Portals

- **Hero Interface Column:** Displays a slowly moving **CSS Mesh Gradient grid canvas** blending dark blue, deep teal, and violet. Floating in the center is a **3D Holographic Transparent Human Body Model** with 7 floating glowing nodes linked directly to deep learning automated model sub-routes. Hovering over a diagnostic card on the left instantly triggers a radiant neon pulse on the corresponding body node.
- **Bento Grid Layout:** Re-arrange standard flat rows into an asymmetric bento grid. Boxes utilize variable vertical and horizontal spanning factors matching statistical tool priority, encapsulated entirely within glowing glass frames.
- **Registration Stepper Layout:** Wrap onboarding forms completely in an `<AnimatePresence>` context layer to smoothly transition current steps leftward out of view while sliding the next data collection matrix in from the right viewport threshold.

### B. Interactive Diagnostics Architecture *(The Accordion Focus Framework)*

To support pre-rendered, standalone instructional videos (2D MP4/WebM files) paired with explicit textual explanations without triggering performance degradation or multi-file tracking errors, the **Brain Examination** and **Breast Self-Check** interfaces must be built strictly under the **Accordion Focus Frame Pattern**:

> **📋 Structural Layout Definition per Step Card**
>
> Each clinical sub-step must map to a single unified accordion card component. When a step card expands, its internal components must adhere to a strict linear vertical flow: **The Video Player occupies the upper half, and the complete text-based instruction block is positioned directly underneath it.**

- **The Accordion Interactive State Flow:** All steps are displayed vertically under each other as an interconnected stack. Non-active step rows are closed, displaying only their title strings, and are visually dimmed via an opacity layer (`opacity-40`) to remove clutter. Clicking an element or tapping "Next Step" triggers a smooth height expansion powered by Framer Motion (`animate: "height"` over 350ms). The targeted card expands down, bringing the specific step video and text instructions into crisp focal view.

- **Upper Video Container Matrix:** The video component features smooth top corner clipping (`rounded-t-2xl overflow-hidden`). It embeds an ambient backend shadow aura matching the diagnostic channel (Neon Purple for Brain, Pastel Rose for Breast) to blend the pre-recorded video window into the dark mode dashboard layout.

- **Lower Instructional Typography Block:** Positioned directly underneath the video frame (`rounded-b-2xl bg-slate-900/40 p-5`). It features high-legibility tracking, clear line-height scaling, and integrates localized action boxes like a 30-second circular SVG progress timer for balance verification, or a micro-checklist of sub-tasks the user checks off while applying the physical steps shown in the video.

### C. Translucent Gentle & Friendly Terminal Advice Panels

Upon completing the final step of either manual screening assessment, all active accordion cards collapse smoothly. The interface transitions into a high-visibility, translucent full-width summary pane displaying an empathetic, comforting, yet precise clinical warning framework that tells the user what to do in an extremely reassuring tone:

---

> #### 🧠 FRIENDLY TERMINAL ADVICE: BRAIN EXAMINATION COMPLETION
>
> **English Version:**
>
> **Your brain health check is complete! Thank you for taking care of yourself today 🌟**
>
> If everything felt smooth and your balance was perfectly on track, that's amazing and you are good to go! However, if you noticed any slight difficulty or anything unfamiliar during the steps, there's absolutely no need to worry—simply consult a specialist to be 100% sure. Your peace of mind is our priority!
>
> ---
>
> **Arabic Version (العربية):**
>
> <div dir="rtl" align="right">
>
> **فحصك اكتمل بنجاح! نورتنا بـ اهتمامك بصحتك اليوم 🌟**
>
> لو لقيت كل الخطوات اللي فاتت سهلة وتوازنك وحركتك تمام.. فـ ده خبر يفرح وكله تمام! أما لو حسيت بـ أي حاجة غريبة أو صعبة عليك وأنت بتطبق الفيديو، فـ الموضوع مش محتاج قلق خالص، كل اللي عليك إنك تحجز استشارة بسيطة مع طبيب مختص عشان تتطمن أكتر. صحتكم تهمنا!
>
> </div>

---

> #### 🌸 FRIENDLY TERMINAL ADVICE: BREAST SELF-EXAMINATION COMPLETION
>
> **English Version:**
>
> **Great job completing your monthly check today! 🌸**
>
> If everything felt completely normal and you didn't notice any lumps or changes, that is wonderful and you are all set until next month! But remember, if you ever spot or feel anything different or unusual while following the video guide, stay calm—it is simply a sign to gently reach out to your doctor for a quick clinical check to stay completely reassured. Taking care of yourself is your superpower!
>
> ---
>
> **Arabic Version (العربية):**
>
> <div dir="rtl" align="right">
>
> **برافو عليكي، اكتمل فحصك الدوري اليوم! 🌸**
>
> طالما ملمس وشكل الجلد طبيعي ومفيش أي تكتلات، فـ أنتِ كدة في أمان وكله تمام، ونشوفك الشهر الجاي! أما لو لاحظتِ أي حاجة جديدة أو غريبة عليكِ وأنتِ بتطالعي الفيديو، فـ خليكِ دايماً مطمئنة وبدون أي قلق، كل اللي هتعمليه إنك هتروحي للدكتورة المختصة عشان تعملي فحص بسيط وتتطمني على نفسك. الكشف الدوري هو قوتك!
>
> </div>

---

### 3-D. SPECIAL ADDENDUM: COMPLETE CHILDREN'S HEALTH SUITE SPECIFICATIONS 🧒

This section outlines the layout rules and programmatic parameters required to upgrade the Children's Health Suite into a high-fidelity, gamified pediatric monitoring portal tailored for maternal analytics and safety tracking.

- **The Portal Hero Frame & The Automated Mascot:** Displays a wide glassmorphism dashboard title banner reading **"Sebar's Kids Portal"**. Pinned onto the right edge is a high-contrast **3D Robotic Mascot** executing an automated idle floating translation loop. Directly below the title string, a clinical security badge is mounted: `"Privacy First — 8 Local Offline Tools — System Secure"`.

- **The Elastic Pastel Bento Grid Layout:** Restructure the 8 core child tracking modules into an interconnected bento grid composed of **8 Pastel Glossy Dynamic Cards**. Each card contains a dedicated 3D alpha-rendered child-friendly visual asset. Hovering over a card triggers an elastic spring transition (`hover:scale-[1.03] hover:-translate-y-3` over a 500ms spring configuration) while projecting a localized neon ambient drop shadow matching the tool's color profile:

  1. **Growth Tracker Card:** Soft sky-blue layout canvas. Features an active, animated 3D cartoon giraffe standing adjacent to a glowing blue clinical bar chart layout.
  2. **BMI Calculator Card:** Crisp mint-green layout canvas. Features a smiling 3D avocado cartoon lifting miniature dumbbells while standing on a glossy digital scale.
  3. **Symptom Checker Card:** Gentle rose-pink layout canvas. Features a friendly, expressive 3D cartoon medical thermometer showing a dynamic smiling face icon.
  4. **Developmental Milestones Card:** Deep cyan-blue layout canvas. Features a set of glossy 3D alphabet blocks embossed with glowing sub-icons (a brain vector, a book, a clinical medal).
  5. **Dosage Calculator Card:** Pastel orange layout canvas. Features a high-gloss 3D medicine dropper asset releasing a colorful liquid drop into a matching medical spoon.
  6. **Vaccination Tracker Card:** Vibrant light-green layout canvas. Features a non-threatening cartoon syringe asset winking next to an illuminated, interactive medical checklist board.
  7. **Food Guide Card:** Warm sun-yellow layout canvas. Features an interactive solar system orbital track where the planets are replaced by floating, stylized 3D foods (broccoli, strawberry, salmon).
  8. **First Aid Hub Card:** Crimson pastel layout canvas. Features a high-gloss 3D first-aid emergency response kit embossed with a glowing heart asset pulsing slowly at a resting respiratory rate.

- **Pediatric Operational Metrics Viewports:** Metric inputs utilize large rounded input fields with inner shadows. Historical logging graphs are replaced by a **Luminescent Line Chart Engine** powered by Recharts, plotting height and weight pathways via bright neon curves over standardized World Health Organization (WHO) baseline paths.

- **Developmental Milestone Adventure Viewport:** Questionnaires are styled as an active adventure pathway map where step milestones are linked by a pulsing tracking line. Selection pills (Yes / No) trigger immediate, elastic full-color injection fills (Mint green for Yes, Coral red for No) to minimize user data-entry fatigue.

- **Pediatric Diagnostic Lab Parsing Workstation:** Features a dual-pane layout. The left column holds data guidelines, while the right side handles file ingest. Dragging an analytical report or a chest X-ray over the dropzone fires a scrolling teal scanline. Upon drop, a central neural core icon pulses while running trailing loading dots (`"Analyzing clinical metrics..."`). Parsed outputs split into a **Data Extraction Token Grid** displaying flagged anomalies, a **Natural Language Explanation Panel** converting complex clinical metrics into highly readable English/Arabic for parents, and an urgent **Precautionary Callout Box** displaying home care workflows or direct links to medical specialist lookup routes.

---

## 🗄️ 4. CORE SYSTEM DATA ARCHITECTURE & RELATION-MAPPED BACKEND LOGIC

To establish absolute operational security and satisfy technical assessment parameters regarding systemic coherence, the data routing flow handled by the backend layer splits processing algorithms across two independent, isolated architectural tracks:

### Track 1: Relational Data-Driven Logic *(High-Performance Local Calculations)*

> **📋 Pediatric Mathematical Integration Formula**
>
> Body Mass Index (BMI) calculations are executed server-side inside the backend routing layer upon structural parameter updates, utilizing the standardized metric ratio:
>
> ```
> BMI = Weight (kg) / [Height (m)]²
> ```
>
> The resulting scalar value is cross-checked against birth-date records to classify structural percentiles automatically.

- **Cross-Relational Dosage Sync Matrix:** The pediatric dosage engine binds variables directly to a centralized `Child_Profile` relational data entity. When a new weight verification entry is committed to the database inside the *Growth Tracker* table, a post-save database trigger automatically passes the new scalar weight value into the internal `DosageCalculatorController` logic. This pipeline updates liquid volume thresholds (*ml*) across all available pediatric consumer drug records (e.g., Paracetamol, Ibuprofen) dynamically. The user never has to type metrics into detached independent pages twice.

- **Automated Immunization Schedule Generator:** Upon the creation of a child account data profile, the system intercepts the submitted `Birth_Date` token and executes an immediate date-offset algorithm loop mapping out standard clinical age milestones (e.g., 2 Months, 4 Months, 18 Months). These dates populate a dedicated `Vaccination_Schedule` relational table, setting specific data flags to `Status.Pending`. Changing account fields automatically updates immunization date horizons in real-time.

- **Allergen-Isolation Recipe Filtration Engine:** Queries targeting the pediatric nutritional database are piped through an automated pre-execution execution interceptor. The engine reads the specific user's `Allergic_Manifestations` data array inside the application profile context. If an allergen flag is active (e.g., `Allergy.Celiac_Disease`), the query applies a server-side LINQ filtration layer that explicitly screens out and strips any food records carrying a matching composition tag (e.g., `Tag.Gluten`) before returning payloads to the client.

### Track 2: Neural-Network Inference Interface Logic *(AI Integrations)*

- **Predictive Symptom Triage Network:** Front-end checklist symptom selections are aggregated into structured JSON arrays by the client and sent to the core endpoint. The backend processing controller deserializes the payload, validates structural formats, and dispatches an optimized gRPC / HTTP payload loop to the dedicated Python/Flask Diagnostic Classifier Node. The deep model processes the inputs against trained weights to generate clinical class probabilities and returns a structured Triage Categorization token:

  - `Triage.Red` **(Critical Threat Status)** → Routes immediate emergency care blueprints to the frontend.
  - `Triage.Yellow` **(Specialist Consultation Required)** → Automatically invokes the scheduler lookup engine.
  - `Triage.Green` **(Safe Home Isolation Management)** → Pulls corresponding localized care scripts from data tables.

---

## 📲 5. PRODUCTION WHATSAPP BUSINESS API INTEGRATION SPECIFICATIONS

This section provides the absolute technical specification blueprint for the implementation of autonomous, cross-relational automated communications channels linked to the official Meta WhatsApp Business Cloud API. This prompt block is structured for direct consumption by the **Antigravity Agent** to safely alter backend source code directories.

```
==========================================================================================
📣 PRODUCTION CODE GENERATION PROMPT FOR ANTIGRAVITY AGENT: .NET C# WHATSAPP INTEGRATION
==========================================================================================
```

**Context:**

We are constructing the production-grade .NET Web API backend architecture for our medical diagnostic platform named Sebar. We need to integrate the official WhatsApp Business Cloud API to handle two decoupled messaging pipelines: immediate event-driven appointment booking confirmations and automated, monthly recurring diagnostic self-check reminders using pre-approved Meta templates.

**Meta API Provisioning & Global Credentials Configuration:**

| Parameter | Value |
|---|---|
| WhatsApp Business Account ID | `1491617992527796` |
| Registered Phone Number ID | `1065453269974512` |
| Base Gateway Request API URL | `https://graph.facebook.com/v25.0/` |
| Permanent Infrastructure Token | `EAF5KBhbrzbgBQZCEMXKYnd2t2AUVa7lJkqymxAyDGbfK5ED0VV6zFTQ550LKy8Q5smeLSbWYfTnZBiW3XYaupfXmuekWun8FF6gNkqfXB` |

---

### Step 1: Application Key-Value Configuration Injection

Directly mount the global credentials parameters within the project's `appsettings.json` file, adhering exactly to the schema structured below:

```json
{
  "WhatsAppSettings": {
    "ApiUrl": "https://graph.facebook.com/v25.0/",
    "PhoneNumberId": "1065453269974512",
    "AccessToken": "EAF5KBhbrzbgBQZCEMXKYnd2t2AUVa7lJkqymxAyDGbfK5ED0VV6zFTQ550LKy8Q5smeLSbWYfTnZBiW3XYaupfXmuekWun8FF6gNkqfXB"
  }
}
```

---

### Step 2: Core WhatsApp Infrastructure Service Generation

Generate an abstract interface named `IWhatsAppService` and its concrete operational runtime class named `WhatsAppService`. Inject the configuration via `IOptions` or `IConfiguration`, and leverage a cleanly managed typed `HttpClient` pattern.

- **Explicit Meta API POST Endpoint Address:** `https://graph.facebook.com/v25.0/1065453269974512/messages`
- **Error Handling Directives:** Enclose internal tasks inside rigorous `try-catch` boundaries. If the returned HTTP status code indicates a failure (`!IsSuccessStatusCode`), explicitly read the full error JSON payload string emitted from Meta's edge server, intercept tokens, and dump it directly into a structured `ILogger` block at `LogError` level.

**Implement the following two operational asynchronous contracts:**

#### Method A: Breast Self-Check Campaign *(Template Identification: `"breast_self_check"`)*

```
- Template Structural Mechanics: Body block contains exactly one variable mapping parameter
  ({{1}} allocated for the Patient's Name). The interactive interface features exactly one
  dynamic URL call button, appending a custom text parameter string tracking the localized
  diagnostic sub-page slug.
- Native Language Target: "ar" (Arabic)
```

```csharp
Task SendBreastCheckReminderAsync(string patientPhone, string patientName, string examinationSlug);
```

#### Method B: Clinical Appointment Confirmation *(Template Identification: `"appointment_reminder"`)*

```
- Template Structural Mechanics: Pure text layout containing exactly three sequential parameter
  variables within the body block text: {{1}} allocated for Patient Name, {{2}} for Target
  Appointment Date string, and {{3}} for Target Appointment Time string.
- Native Language Target: "ar" (Arabic)
```

```csharp
Task SendAppointmentReminderAsync(string patientPhone, string patientName, string appointmentDate, string appointmentTime);
```

---

### Step 3: Framework Dependency Inversion Lifecycle Registration

Locate the primary application entry pipeline inside `Program.cs` and append the proper scoped typed `HttpClient` registration to ensure universal dependency accessibility:

```csharp
builder.Services.AddHttpClient<IWhatsAppService, WhatsAppService>();
```

---

### Step 4: End-To-End Cross-Relational Backend Integration Pipelines

#### A. Immediate Event-Driven Booking Notification Path

- **Target Location:** Intercept the system controller or handler responsible for persisting clinical reservations (e.g., `AppointmentsController.cs` or `CreateAppointmentCommandHandler.cs`).
- **Logical Stream Flow:** Immediately upon the successful execution of the Entity Framework Core persistence transaction (`context.SaveChangesAsync()` returning a success integer), extract the user's explicit profile entity data.
- **Runtime Execution:** Leverage the interface `IWhatsAppService`, parse the destination phone string into international E.164 standardization (e.g., verifying or prepending `'2'` country prefix values for Egypt), and invoke `SendAppointmentReminderAsync`. Return a combined API envelope validating database save states and dispatch confirmations.

#### B. Monthly Recurring Self-Check Campaigns *(Automated Background Scheduler Process)*

To maintain strict clinical safety standards and system pipeline efficiency, this process must run completely decoupled from web request contexts, target female accounts exclusively, and operate via background tracking tasks.

- **SQL Filtering Matrix Optimization:** The active `User` database entity tracks identity records via a clean `Gender` property (backed by a strict system string or Enum schema enforcing `Gender.Female`).

- **Automated Scheduler Inversion:** Construct an asynchronous background service extending `BackgroundService` or implementing `IHostedService`, naming the structural file `BreastCheckCampaignScheduler.cs`.

- **Time Loop Execution:** Program the background loop to check system clocks daily precisely at **09:00 AM UTC**.

- **Processing Loop Flow:** Initialize a clean isolated Dependency Injection Scope, pull the database context instance, and execute an explicit, high-performance database-side query returning only the target user pool:

```csharp
context.Users.Where(u => u.Gender == Gender.Female && u.PhoneNumber != null).ToListAsync();
```

- **Micro-Task Dispatch:** Iterate through the targeted list dataset, compile parameters dynamically, and call `SendBreastCheckReminderAsync`, passing the designated static token string `'breast-examination-hub'` as the core dynamic button slug. Enclose the loop iteration inside isolated local `try-catch` handlers; a failed network pass due to an obsolete or inactive telephone string must under no circumstances crash the background loop task, allowing adjacent maternal records to process without system interruptions.

---

**Task Directive for Agent:** Analyze project trees, map domain models, generate clean complete C# interfaces, classes, schedules, and controller extensions. Adhere strictly to the JSON layouts dictated by Meta Business Cloud schemas. Write and refactor the files.

```
==========================================================================================
```
