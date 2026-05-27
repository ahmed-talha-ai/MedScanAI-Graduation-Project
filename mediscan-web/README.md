# MediScan AI Web Client

This is the Next.js frontend for **MediScan AI**, a comprehensive medical platform that integrates multiple AI diagnostic models (Brain Tumor, X-Ray, Breast Cancer, Dermatology, and Lab Results) along with an interactive conversational AI Chatbot. 

## Final Route Table

| Route | Role | Purpose |
|-------|------|---------|
| `/login` | Public | Authentication |
| `/register` | Public | New account registration |
| `/dashboard` | Patient | Main patient dashboard |
| `/dashboard/appointments` | Patient | View and manage appointments |
| `/dashboard/reports` | Patient | View generated medical reports |
| `/dashboard/ai-tools` | Patient/Doctor | Hub for all AI diagnostic models |
| `/dashboard/ai-tools/[tool]` | Patient/Doctor | Specific AI tool view (e.g. skin, brain) |
| `/dashboard/profile` | Patient/Doctor | User profile |
| `/doctor` | Doctor | Doctor's main dashboard |
| `/doctor/appointments` | Doctor | View doctor's appointments |
| `/doctor/patients/[patientId]`| Doctor | Detailed patient clinical profile & warnings |
| `/examinations` | Patient/Doctor | Self-examination & diagnostic hub |
| `/admin` | Admin | Main admin dashboard |
| `/admin/doctors` | Admin | View doctor list |
| `/admin/add-doctor` | Admin | Form to register a new doctor |
| `/admin/add-admin` | Admin | Form to register a new admin |
| `/admin/settings` | Admin | Persistent system & integration settings |

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS v4 + Material Symbols (Google Fonts)
- **State Management:** Zustand
- **Internationalization:** `next-intl` (English & Arabic RTL support)
- **HTTP Client:** Axios

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.
