# Familily - Open Source Self-Hosted Familienkalender

## Projekt Vision

Familily ist ein **Open Source, Self-Hosted Familienkalender** für die gemeinsame Terminplanung. Einfach zu installieren (Docker), ohne Cloud-Abhängigkeit, mit Fokus auf Privatsphäre und Benutzerfreundlichkeit.

---

## Tech Stack

| Bereich | Technologie |
|---------|-------------|
| **Framework** | Next.js 14+ (App Router) |
| **Sprache** | TypeScript (strict mode) |
| **Datenbank** | SQLite mit Prisma ORM |
| **Styling** | Tailwind CSS |
| **UI Components** | shadcn/ui |
| **Auth** | NextAuth.js (Credentials Provider) |
| **Kalender** | FullCalendar oder Custom |
| **Icons** | Lucide Icons |
| **Forms** | React Hook Form + Zod |
| **Testing** | Vitest, React Testing Library |
| **Deployment** | Docker (Single Container) |

---

## Feature Roadmap

### MVP (Version 1.0)

#### F01: Onboarding & Setup
- [ ] Erster Start erkennt leere Datenbank
- [ ] Wizard: Admin-Name, Email, Passwort
- [ ] Wizard: Familienname eingeben
- [ ] Admin wird als erstes Familienmitglied erstellt
- [ ] Nach Setup: Redirect zum Dashboard

#### F02: Authentifizierung
- [ ] Login-Seite mit Email/Passwort
- [ ] Session-Management (NextAuth.js)
- [ ] Logout-Funktion
- [ ] Passwort ändern
- [ ] "Angemeldet bleiben" Option

#### F03: Familienmitglieder verwalten
- [ ] Liste aller Familienmitglieder
- [ ] Mitglied hinzufügen (Name, Geburtsdatum, Farbe)
- [ ] Optional: Login-Daten für Mitglied erstellen
- [ ] Mitglied bearbeiten
- [ ] Mitglied löschen (mit Bestätigung)
- [ ] Avatar/Bild Upload (optional)
- [ ] Rollen: Admin, Erwachsener, Kind

#### F04: Kalender Ansichten
- [ ] Monatsansicht (Default)
- [ ] Wochenansicht
- [ ] Tagesansicht
- [ ] Heute-Button (schnelle Navigation)
- [ ] Navigation: Vor/Zurück, Datum-Picker
- [ ] Filter: Nach Familienmitglied, Kategorie

#### F05: Termine erstellen & verwalten
- [ ] Termin erstellen Modal/Seite
- [ ] Felder:
  - Titel (Pflicht)
  - Datum & Uhrzeit Start
  - Datum & Uhrzeit Ende (oder "Ganztägig")
  - Beschreibung (optional)
  - Kategorie (Arzt, Schule, Sport, Arbeit, Freizeit, Sonstiges)
  - Teilnehmer (Familienmitglieder auswählen)
  - Begleiter (Wer fährt mit / begleitet)
  - Ort (Freitext + optional Koordinaten)
  - Geschätzte Fahrzeit
- [ ] Termin bearbeiten
- [ ] Termin löschen
- [ ] Termin duplizieren

#### F06: Wiederkehrende Termine
- [ ] Wiederholungsoptionen:
  - Täglich
  - Wöchentlich (an bestimmten Tagen)
  - Monatlich (am X. Tag)
  - Jährlich
- [ ] Ende der Wiederholung: Datum oder Anzahl
- [ ] Einzelne Instanz bearbeiten vs. alle
- [ ] Ausnahmen: Einzelne Termine überspringen

#### F07: Farbcodierung & Kategorien
- [ ] Jedes Familienmitglied hat eigene Farbe
- [ ] Kategorien haben Icons
- [ ] Termine zeigen Farben der Teilnehmer
- [ ] Legende/Filter im Kalender

#### F08: Dashboard
- [ ] Übersicht: Heutige Termine
- [ ] Nächste 7 Tage Preview
- [ ] Schnellzugriff: Neuer Termin
- [ ] Geburtstage diese Woche/Monat

---

### Phase 2 (Version 1.1)

#### F09: Erinnerungen & Benachrichtigungen
- [ ] Erinnerung pro Termin konfigurierbar
- [ ] Zeitpunkte: 15min, 1h, 1 Tag, 1 Woche vorher
- [ ] Browser Push Notifications
- [ ] Email-Benachrichtigungen (optional, SMTP config)

#### F10: Konflikt-Erkennung
- [ ] Warnung bei überschneidenden Terminen
- [ ] Anzeige welche Termine sich überschneiden
- [ ] Trotzdem speichern möglich

#### F11: To-Do Listen
- [ ] Gemeinsame Listen (Einkauf, Haushalt)
- [ ] Items abhaken
- [ ] Zuweisung an Familienmitglied
- [ ] Fälligkeitsdatum optional

#### F12: Kontaktliste
- [ ] Kontakte anlegen (Name, Telefon, Email, Adresse)
- [ ] Kategorien: Arzt, Schule, Verein, Notfall, Sonstige
- [ ] Schnellwahl aus Termin verlinken

#### F13: iCal Export/Import
- [ ] Export: Gesamter Kalender als .ics
- [ ] Export: Einzelne Termine
- [ ] Import: .ics Dateien hochladen
- [ ] Sync-URL für externe Kalender (Read-Only)

#### F14: PWA Support
- [ ] Service Worker für Offline-Nutzung
- [ ] Manifest.json für Installation
- [ ] App-Icon für Homescreen

#### F15: Dark Mode
- [ ] System-Präferenz erkennen
- [ ] Manueller Toggle
- [ ] Konsistentes Dark Theme

---

### Phase 3 (Version 1.2+)

#### F16: Meal Planning
- [ ] Wochenplan für Mahlzeiten
- [ ] Rezept-Verlinkung
- [ ] Einkaufsliste generieren

#### F17: Dokumenten-Ablage
- [ ] Dateien hochladen (PDF, Bilder)
- [ ] Kategorien: Gesundheit, Schule, Verträge
- [ ] Pro Familienmitglied oder Familie

#### F18: CalDAV Server
- [ ] Standard CalDAV Protokoll
- [ ] Sync mit nativen Kalender-Apps

#### F19: Mehrsprachigkeit
- [ ] Deutsch (Default)
- [ ] Englisch
- [ ] Weitere Sprachen via Community

#### F20: Wetter-Integration
- [ ] Wettervorhersage für Termine mit Ort
- [ ] OpenWeatherMap API

---

## Datenmodell (Prisma Schema Entwurf)

```prisma
model Family {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  members   FamilyMember[]
  events    Event[]
}

model FamilyMember {
  id        String   @id @default(cuid())
  name      String
  email     String?  @unique
  password  String?  // Hashed, optional
  birthdate DateTime?
  color     String   @default("#3B82F6")
  role      Role     @default(MEMBER)
  avatarUrl String?
  familyId  String
  family    Family   @relation(fields: [familyId], references: [id])
  createdAt DateTime @default(now())

  // Relations
  participatingIn  EventParticipant[]
  accompanyingIn   EventParticipant[] @relation("Accompanist")
  createdEvents    Event[]
}

enum Role {
  ADMIN
  ADULT
  CHILD
}

model Event {
  id          String   @id @default(cuid())
  title       String
  description String?
  startTime   DateTime
  endTime     DateTime?
  allDay      Boolean  @default(false)
  location    String?
  latitude    Float?
  longitude   Float?
  travelTime  Int?     // Minutes
  category    Category @default(OTHER)

  // Recurrence
  isRecurring Boolean  @default(false)
  recurrence  Recurrence?
  parentEventId String?
  parentEvent   Event?  @relation("RecurringEvents", fields: [parentEventId], references: [id])
  childEvents   Event[] @relation("RecurringEvents")

  familyId    String
  family      Family   @relation(fields: [familyId], references: [id])
  createdById String
  createdBy   FamilyMember @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  participants EventParticipant[]
}

model EventParticipant {
  id            String       @id @default(cuid())
  eventId       String
  event         Event        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  memberId      String
  member        FamilyMember @relation(fields: [memberId], references: [id])
  isAccompanist Boolean      @default(false)
  accompanistId String?
  accompanist   FamilyMember? @relation("Accompanist", fields: [accompanistId], references: [id])

  @@unique([eventId, memberId])
}

model Recurrence {
  id        String   @id @default(cuid())
  eventId   String   @unique
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  frequency Frequency
  interval  Int      @default(1)
  daysOfWeek String? // JSON array: ["MO", "WE", "FR"]
  dayOfMonth Int?
  endDate   DateTime?
  count     Int?
}

enum Frequency {
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}

enum Category {
  DOCTOR
  SCHOOL
  SPORT
  WORK
  LEISURE
  BIRTHDAY
  HOLIDAY
  OTHER
}
```

---

## Projektstruktur

```
familily/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth-geschützte Routes
│   │   │   ├── dashboard/
│   │   │   ├── calendar/
│   │   │   ├── family/
│   │   │   └── settings/
│   │   ├── (public)/          # Öffentliche Routes
│   │   │   ├── login/
│   │   │   └── setup/         # Onboarding
│   │   ├── api/               # API Routes
│   │   │   ├── auth/
│   │   │   ├── events/
│   │   │   ├── family/
│   │   │   └── members/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/                # shadcn/ui Components
│   │   ├── calendar/          # Kalender Components
│   │   ├── events/            # Termin Components
│   │   ├── family/            # Familien Components
│   │   └── layout/            # Layout Components
│   │
│   ├── lib/
│   │   ├── prisma.ts          # Prisma Client
│   │   ├── auth.ts            # NextAuth Config
│   │   └── utils.ts           # Helper Functions
│   │
│   ├── hooks/                 # Custom React Hooks
│   ├── types/                 # TypeScript Types
│   └── styles/                # Global Styles
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│   └── icons/
│
├── tests/
│
├── docker/
│   └── Dockerfile
│
├── .claude/
│   └── agents/
│
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── CLAUDE.md
```

---

## Multi-Agent Workflow

### Verfügbare Agents

```bash
# Feature planen
Use planner agent to plan [Feature-ID, z.B. F01]

# Code implementieren
Use code-writer agent to implement [Feature-ID]

# Testen
Use qa-tester agent to test [Feature-ID]
```

### Beispiel Workflow

```bash
# 1. Onboarding Feature planen
> Use planner agent to plan F01 Onboarding & Setup

# 2. Implementieren lassen
> Use code-writer agent to implement the onboarding feature

# 3. Testen
> Use qa-tester agent to test the onboarding flow
```

---

## Coding Standards

### TypeScript
- Strict mode aktiviert
- Keine `any` Types - immer spezifische Types
- Zod für Runtime-Validierung
- Interfaces für alle Datenstrukturen

### Naming Conventions
| Typ | Konvention | Beispiel |
|-----|------------|----------|
| Dateien | kebab-case | `event-form.tsx` |
| Komponenten | PascalCase | `EventForm` |
| Funktionen | camelCase | `createEvent` |
| Konstanten | UPPER_SNAKE | `MAX_TITLE_LENGTH` |
| Types/Interfaces | PascalCase | `EventFormData` |

### API Routes
- RESTful Design
- Konsistente Error Responses
- Zod Validation für alle Inputs
- Proper HTTP Status Codes

### Components
- Server Components als Default
- Client Components nur wenn nötig ("use client")
- Props mit Interface definieren
- Error Boundaries für kritische Bereiche

---

## Befehle

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm run start

# Database
npx prisma generate
npx prisma db push
npx prisma studio

# Tests
npm run test
npm run test:watch

# Linting
npm run lint
npm run lint:fix

# Type Check
npm run typecheck

# Docker
docker build -t familily .
docker run -p 3000:3000 -v familily-data:/app/data familily
```

---

## Umgebungsvariablen

```env
# .env.local
DATABASE_URL="file:./data/familily.db"
NEXTAUTH_SECRET="generate-a-secure-secret"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Email (Phase 2)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
```

---

## Design Prinzipien

1. **Privacy First**: Alle Daten lokal, keine externe Abhängigkeit
2. **Simple Setup**: Ein Docker-Befehl zum Starten
3. **Mobile First**: Responsive Design für alle Geräte
4. **Accessibility**: WCAG 2.1 AA konform
5. **Performance**: Schnelle Ladezeiten, optimistische Updates
6. **Offline Capable**: Grundfunktionen auch ohne Internet (Phase 2)

---

## Lizenz

MIT License - Open Source, frei nutzbar und erweiterbar.
