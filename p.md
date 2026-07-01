# Morx AI Team Operating System - New Features Report

This report outlines the implementation, functional workflow, and mathematical calculations for all 10 phases built to transform the Morx platform into the world's first AI Team Operating System for students.

---

## Part 1: English Version

### 🧠 Phase 1: AI Team Member (Marlin)
- **What it is**: Marlin acts as a virtual teammate integrated into the project workspace, providing proactive task assistance, roadblock detection, and action planning.
- **How it works**: Accessible via the project details page sidebar. Users can request Marlin to automatically split tasks, generate milestones, scan for active blockers, or summarize meeting notes.
- **Calculations/Logic**:
  - **Task Splitting & Milestones**: Sends task metadata to the LLM (Gemini/OpenRouter) with strict JSON output schemas.
  - **Blocker Radar & Recommendations**: Fetches all tasks and comments for the project, detects keywords indicating delays, and returns categorized risk indicators.

### 🧬 Phase 2: AI Team DNA
- **What it is**: A dynamic, evolving professional DNA profile computed from the student's behavior and project history.
- **How it works**: Loaded inside the Settings/Profile page. It shows metrics like Preferred Working Hours, Collaboration Score, Deadline Reliability, and preferred roles.
- **Calculations/Logic**:
  - **Preferred Working Hours**: Peaks are determined by aggregating the hours of all task actions and comments.
    $$\text{Peak Hour} = \text{mode}(\text{Hour of } c.created\_at \cup \text{Hour of } t.created\_at)$$
  - **Deadline Reliability**: Matches completed tasks against their due dates.
    $$\text{Reliability} = \left( \frac{\text{Tasks Completed On Time}}{\text{Total Assigned Tasks}} \right) \times 100$$
  - **Collaboration Score**: Proportional to comments written and team projects participated in.
    $$\text{Collaboration} = \min\left(100, \text{Comments Count} \times 5 + \text{Teams Joined} \times 10\right)$$
  - **Consistency**: Measures the variance in task completion speed.
    $$\text{Consistency} = \max\left(0, 100 - \text{standard deviation}(\text{days to complete tasks})\right)$$

### 🤝 Phase 3: Smart Team Matching
- **What it is**: A matching system that computes compatibility between project needs and candidate student profiles.
- **How it works**: Displayed inline on the Talent directory page, allowing project owners to find optimal candidates.
- **Calculations/Logic**:
  - **Compatibility Score**:
    $$\text{Compatibility} = \text{round}\left( 0.4 \times \text{Skills Match} + 0.3 \times \text{Reliability} + 0.3 \times \text{Collaboration} \right)$$
    - **Skills Match**: Ratio of matching candidate skills to project required skills.
    - **Reliability & Collaboration**: Imported directly from the candidate's DNA profile.

### 🏥 Phase 4: Team Health Engine
- **What it is**: Continuous diagnostic analytics evaluating workload balance, conflict risks, and burnout probability.
- **How it works**: Visualized in AreaCharts on the Team Reports dashboard page.
- **Calculations/Logic**:
  - **Burnout Risk**: Ratio of tasks in progress or overdue to historical throughput. High task load + late hours increases risk.
  - **Conflict Risk**: Detected by running sentiment checks on comments and assessing communication style discrepancies.
  - **Workload Balance**: Standard deviation of task assignments among active members.
    $$\text{Imbalance} = \sigma(\text{Tasks per Member})$$
    If $\sigma > 2$, the dashboard flags a "High Imbalance" warning.

### 🏆 Phase 5: AI Scrum Master
- **What it is**: Automated sprint planner, daily standup compiler, and release notes generator.
- **How it works**: Built into the Marlin Drawer under the "Scrum Master" tab.
- **Calculations/Logic**:
  - Summarizes current active/finished tasks and recent developer comments to generate formatted sprint summaries.

### 🌳 Phase 6: Skill Tree
- **What it is**: Dynamic progression of student skills based automatically on completed task keywords.
- **How it works**: Visualized on the Settings page using an interactive node map linked with SVG lines.
- **Calculations/Logic**:
  - Upon task completion, task titles and descriptions are parsed. Keywords like "design" award UI/UX XP, "database" awards Backend XP, etc.
  - **Level Up**:
    $$\text{Level} = \left\lfloor \frac{\text{Total XP}}{300} \right\rfloor + 1$$
  - **Confidence Score**: Combines current skill level and DNA reliability:
    $$\text{Confidence} = \max\left(30, \min\left(100, 45 + 0.5 \times (\text{Reliability} - 50) + \text{Level} \times 5\right)\right)$$

### 🎮 Phase 7: Gamification
- **What it is**: Global student levels, badges (Rare/Legendary), streaks, and leaderboard.
- **How it works**: Rendered on the Settings page next to the Skill Tree.
- **Calculations/Logic**:
  - Users earn global XP on task actions.
  - **Project Streak**: Tracks consecutive days with task activity.
  - **Leaderboard**: Ranks students globally sorted by accumulated XP.

### 🌟 Phase 8: Team Reputation
- **What it is**: Peer-to-peer verified ratings for completed projects.
- **How it works**: Teammates can rate each other (1-5 stars) on Leadership, Communication, Reliability, Quality, Problem Solving, and Teamwork.
- **Calculations/Logic**:
  - Ratings are processed, converted to a 0-100 scale, and factored into the reviewee's DNA using a weighted moving average (70% existing DNA, 30% new rating).
    $$\text{New DNA Score} = \text{round}\left( 0.7 \times \text{Existing Score} + 0.3 \times (\text{Peer Rating} \times 20) \right)$$

### 📐 Phase 9: Project Generator
- **What it is**: Generates complete roadmaps, architecture, entity-relations, milestones, task backlogs, and READMEs.
- **How it works**: Accessed on the templates page. Generates blueprints which can be instantly deployed to teams.
- **Calculations/Logic**:
  - The LLM synthesizes structured blueprints which are parsed and inserted into the Postgres DB schema.

### 🎙️ Phase 10: Voice AI Assistant & Memory
- **What it is**: Speech-to-text / text-to-speech assistant with semantic memory.
- **How it works**: Floating mic widget in the bottom-right corner of all pages. Supports voice commands and speaks replies.
- **Calculations/Logic**:
  - **Speech-to-Text**: Browser's webkitSpeechRecognition API (zero-latency, local, free).
  - **Text-to-Speech**: Browser's SpeechSynthesis API (zero cost).
  - **Semantic Memory**: Calculates vector embeddings for conversation summaries and searches database using pgvector cosine distance:
    $$\text{Distance} = 1 - \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|}$$
    If pgvector is unavailable, falls back to fuzzy text search.

---

## الجزء الثاني: النسخة العربية (Arabic Version)

### 🧠 المرحلة 1: عضو الفريق الذكي (Marlin)
- **ما هي**: Marlin يعمل كزميل افتراضي داخل مساحة عمل المشروع لمساعدة الطلاب في تقسيم المهام، ورصد المعوقات، والتخطيط للخطوات القادمة.
- **كيفية العمل**: متاح من خلال لوحة جانبية في صفحة تفاصيل المشروع. يمكن للطلاب طلب تقسيم المهام تلقائياً أو توليد معالم المشروع (Milestones).
- **العمليات الحسابية/المنطقية**:
  - **تقسيم المهام**: إرسال تفاصيل المهمة للذكاء الاصطناعي مع فرض صيغة JSON مهيكلة.
  - **رادار المعوقات**: قراءة المهام والتعليقات الحالية وتصنيف المخاطر والمعوقات بناءً على معدلات التأخير.

### 🧬 المرحلة 2: الحمض النووي للفريق (AI Team DNA)
- **ما هي**: ملف تعريفي مهني وسلوكي يتطور تلقائياً بناءً على تاريخ وإنجازات الطالب في المشروع.
- **كيفية العمل**: يعرض في صفحة الإعدادات والمستندات السلوكية، ويشمل: ساعات العمل المفضلة، ونسبة الالتزام، ومستوى التعاون.
- **العمليات الحسابية**:
  - **ساعات العمل المفضلة**: يتم جمع الساعات الأكثر نشاطاً في إضافة التعليقات وإتمام المهام.
  - **نسبة الالتزام بالوقت (Reliability)**:
    $$\text{نسبة الالتزام} = \left( \frac{\text{المهام المنجزة في الوقت المحدد}}{\text{إجمالي المهام المسندة}} \right) \times 100$$
  - **مستوى التعاون (Collaboration)**:
    $$\text{مستوى التعاون} = \min\left(100, \text{عدد التعليقات} \times 5 + \text{الفرق المنضم إليها} \times 10\right)$$
  - **الاتساق (Consistency)**: حساب الانحراف المعياري للوقت المستغرق لإتمام المهام.

### 🤝 المرحلة 3: مطابقة الفرق الذكية (Smart Team Matching)
- **ما هي**: نظام لاحتساب مدى توافق المهارات والسمات الشخصية للطلاب مع متطلبات المشروع.
- **كيفية العمل**: يعرض في صفحة التوظيف والمهارات (Talent) لمساعدة أصحاب المشاريع في العثور على أفضل المرشحين.
- **العمليات الحسابية**:
  - **معامل التوافق (Compatibility Score)**:
    $$\text{معامل التوافق} = \text{round}\left( 0.4 \times \text{تطابق المهارات} + 0.3 \times \text{الالتزام بالوقت} + 0.3 \times \text{مستوى التعاون} \right)$$

### 🏥 المرحلة 4: محرك صحة الفريق (Team Health Engine)
- **ما هي**: تحليلات مستمرة لتقييم توزيع أعباء العمل ومخاطر الاحتراق المهني والخلافات داخل الفريق.
- **كيفية العمل**: يعرض على شكل رسوم بيانية تفاعلية (AreaCharts) في صفحة تقارير الفريق.
- **العمليات الحسابية**:
  - **مخاطر الاحتراق المهني**: النسبة بين المهام المتأخرة والمهام قيد التنفيذ إلى الكفاءة التاريخية للعضو.
  - **مخاطر الخلافات**: تحليل نبرة وسلوك التعليقات وتقدير الفروق في أساليب التواصل.
  - **عدم توازن المهام**: الانحراف المعياري لعدد المهام المسندة بين الأعضاء.
    $$\text{عدم التوازن} = \sigma(\text{عدد المهام لكل عضو})$$

### 🏆 المرحلة 5: قائد السكروم الذكي (AI Scrum Master)
- **ما هي**: أداة لتوليد خطط العمل الأسبوعية، ملخصات الوقوف اليومي (Daily Standup)، وملاحظات الإصدار (Release Notes).
- **كيفية العمل**: مدمج في لوحة Marlin الجانبية تحت تبويب "Scrum Master".

### 🌳 المرحلة 6: شجرة المهارات (Skill Tree)
- **ما هي**: تطوير ديناميكي لمهارات الطالب وتجميع نقاط الخبرة (XP) تلقائياً عند إتمام المهام.
- **كيفية العمل**: خريطة تفاعلية في صفحة الإعدادات مبنية بخطوط متصلة عبر الـ SVG.
- **العمليات الحسابية**:
  - عند إتمام مهمة، يتم البحث عن كلمات مفتاحية (مثل "UI" لإضافة خبرة في التصميم، أو "API" للخبرة البرمجية الخلفية).
  - **الترقية للمستوى التالي**:
    $$\text{المستوى} = \left\lfloor \frac{\text{نقاط الخبرة الكلية}}{300} \right\rfloor + 1$$
  - **معدل الثقة بالمهارة (Confidence Score)**:
    $$\text{معدل الثقة} = \max\left(30, \min\left(100, 45 + 0.5 \times (\text{نسبة الالتزام} - 50) + \text{المستوى} \times 5\right)\right)$$

### 🎮 المرحلة 7: الألعاب والتحفيز (Gamification)
- **ما هي**: نظام المكافآت والشارات (Badges) والمستويات الكلية ولوحة الصدارة العالمية للطلاب.
- **كيفية العمل**: تظهر لوحة الصدارة لترتيب الطلاب حسب إجمالي نقاط الخبرة (XP) المتراكمة.

### 🌟 المرحلة 8: سمعة الفريق والتقييمات (Team Reputation)
- **ما هي**: تقييمات موثقة من الزملاء المشتركين في نفس المشروع.
- **كيفية العمل**: يمنح الأعضاء تقييمات (1-5 نجوم) في مجالات: القيادة، التواصل، الالتزام، الجودة، حل المشكلات، والعمل الجماعي.
- **العمليات الحسابية**:
  - دمج التقييمات في الحمض النووي (DNA) للعضو باستخدام المتوسط المتحرك الموزون (70% للحمض الحالي و 30% للتقييم الجديد):
    $$\text{الدرجة الجديدة} = \text{round}\left( 0.7 \times \text{الدرجة الحالية} + 0.3 \times (\text{تقييم الزملاء} \times 20) \right)$$

### 📐 المرحلة 9: مولد المشاريع (Project Generator)
- **ما هي**: توليد هيكل برمجيات وقاعدة بيانات ومهام متكاملة بناءً على وصف فكرة المشروع.
- **كيفية العمل**: متاح في صفحة القوالب (Templates) مع إمكانية النشر الفوري للمشاريع إلى الفرق.

### 🎙️ المرحلة 10: المساعد الصوتي والذاكرة (Voice Assistant & Memory)
- **ما هي**: مساعد صوتي تفاعلي يدعم الاستماع والرد الفوري مع ذاكرة سحابية طويلة المدى.
- **كيفية العمل**: أيقونة ميكروفون عائمة أسفل الشاشة.
- **العمليات الحسابية**:
  - **تحويل الصوت إلى نص**: استخدام Web Speech API المجاني بالمتصفح لمنع تأخير الشبكة.
  - **تحويل النص إلى صوت**: استخدام SpeechSynthesis بالمتصفح.
  - **الذاكرة الدلالية (Semantic Memory)**: توليد تمثيلات متجهة (Embeddings) والبحث عنها في قاعدة البيانات باستخدام المسافة الجيبية (Cosine Distance) عبر pgvector:
    $$\text{المسافة الجيبية} = 1 - \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|}$$
