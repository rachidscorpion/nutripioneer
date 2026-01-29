# NutriPioneer - AI Context Documentation

## Project Overview

NutriPioneer is a personalized nutrition and meal planning platform designed for users with complex health conditions (CKD, Diabetes, Hypertension, PCOS, High Cholesterol). The system uses AI and multiple nutrition APIs to generate personalized meal plans that respect medical constraints, dietary preferences, and nutritional requirements.

**Core Value Proposition:** AI-powered dietary management that considers medical conditions, medication interactions, and personal preferences to create safe, personalized meal recommendations.

---

## Architecture

### Tech Stack

#### Backend (`/backend`)
- **Runtime:** Bun (fast JavaScript runtime)
- **Framework:** Hono (lightweight web framework)
- **Database:** SQLite with Prisma ORM
- **Authentication:** Better Auth (email/password + OAuth) + Polar.sh for subscriptions
- **AI:** OpenAI (GPT-4o, GPT-5-nano)
- **External APIs:** FatSecret, Edamam, USDA, Open Food Facts, TheMealDB, ICD-11 (WHO)

#### Frontend (`/nutripioneer`)
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19 with Framer Motion for animations
- **State:** Zustand
- **HTTP:** Axios
- **Styling:** CSS Modules with custom components
- **Icons:** Lucide React

---

## Directory Structure

```
nutripioneer/
├── backend/                           # Backend API (Hono + Bun)
│   ├── prisma/
│   │   ├── schema.prisma              # Database schema definitions
│   │   ├── dev.db                     # SQLite database
│   │   └── seed.ts                    # Database seed script
│   ├── src/
│   │   ├── controllers/               # Request handlers
│   │   │   ├── conditions.controller.ts
│   │   │   ├── food.controller.ts
│   │   │   ├── grocery.controller.ts
│   │   │   ├── menu.controller.ts
│   │   │   ├── metrics.controller.ts
│   │   │   ├── plans.controller.ts
│   │   │   ├── recipes.controller.ts
│   │   │   └── users.controller.ts
│   │   ├── db/
│   │   │   └── client.ts              # Prisma client singleton
│   │   ├── integrations/              # External API services
│   │   │   ├── edamam/
│   │   │   │   └── edamam.service.ts
│   │   │   ├── fatsecret/
│   │   │   │   └── fatsecret.service.ts
│   │   │   ├── mealdb/
│   │   │   │   └── mealdb.service.ts
│   │   │   ├── off/
│   │   │   │   └── off.service.ts     # Open Food Facts
│   │   │   ├── openai/
│   │   │   │   └── openai.service.ts
│   │   │   ├── usda/
│   │   │   │   └── usda.service.ts
│   │   │   └── index.ts               # Barrel export
│   │   ├── lib/
│   │   │   └── auth.ts                # Better Auth configuration
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts     # Session verification
│   │   │   ├── errorHandler.ts        # Global error handling
│   │   │   └── validation.ts          # Request validation
│   │   ├── routes/                    # API route definitions
│   │   │   ├── index.ts               # Main API router
│   │   │   ├── auth.ts                # Authentication routes
│   │   │   ├── conditions.ts
│   │   │   ├── drugs.ts
│   │   │   ├── food.ts
│   │   │   ├── grocery.ts
│   │   │   ├── menu.ts
│   │   │   ├── metrics.ts
│   │   │   ├── plans.ts
│   │   │   ├── products.ts
│   │   │   ├── recipes.ts
│   │   │   └── users.ts
│   │   ├── schemas/                   # TypeScript validation schemas
│   │   ├── services/                  # Business logic
│   │   │   ├── conditions.service.ts
│   │   │   ├── drugApi.ts
│   │   │   ├── food.service.ts
│   │   │   ├── grocery.service.ts
│   │   │   ├── menu.service.ts
│   │   │   ├── metrics.service.ts
│   │   │   ├── plans.service.ts
│   │   │   ├── recipes.service.ts
│   │   │   └── users.service.ts
│   │   ├── types/
│   │   │   └── index.ts               # Type definitions
│   │   └── index.ts                   # App entry point
│   ├── scripts/                       # Utility scripts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
└── nutripioneer/                       # Frontend (Next.js)
    ├── src/
    │   ├── actions/
    │   │   └── unsplash-actions.ts    # Unsplash image actions
    │   ├── app/
    │   │   ├── (dashboard)/           # Protected dashboard pages
    │   │   │   ├── grocery/
    │   │   │   │   └── page.tsx        # Grocery list page
    │   │   │   ├── home/
    │   │   │   │   ├── TimelineFeed.tsx
    │   │   │   │   └── page.tsx        # Dashboard home
    │   │   │   ├── plan/
    │   │   │   │   └── page.tsx        # Meal plan view
    │   │   │   ├── profile/
    │   │   │   │   └── page.tsx        # User profile
    │   │   │   ├── restaurant-rescue/
    │   │   │   │   └── page.tsx        # Restaurant menu scanner
    │   │   │   ├── subscription/
    │   │   │   │   └── page.tsx        # Subscription management
    │   │   │   └── layout.tsx         # Dashboard layout
    │   │   ├── api/
    │   │   │   └── recipe/
    │   │   │       └── route.ts        # Recipe API routes
    │   │   ├── onboarding/            # Onboarding flow
    │   │   │   ├── steps/
    │   │   │   │   ├── 1-Welcome.tsx
    │   │   │   │   ├── 2-Conditions.tsx
    │   │   │   │   ├── 3-Biometrics.tsx
    │   │   │   │   ├── 4-Medical.tsx
    │   │   │   │   ├── 5-Dietary.tsx
    │   │   │   │   └── 6-Synthesizing.tsx
    │   │   │   ├── layout.tsx
    │   │   │   └── page.tsx
    │   │   ├── layout.tsx              # Root layout
    │   │   └── page.tsx                # Landing page
    │   ├── components/
    │   │   ├── buttons/
    │   │   ├── cards/
    │   │   ├── dashboard/
    │   │   ├── grocery/
    │   │   ├── loader/
    │   │   ├── menu/
    │   │   ├── modals/
    │   │   ├── plan/
    │   │   ├── profile/
    │   │   └── ui/
    │   ├── context/
    │   │   └── ThemeContext.tsx        # Dark/light theme provider
    │   ├── lib/
    │   │   ├── dietary/
    │   │   │   ├── additives.ts        # Red flag additive patterns
    │   │   │   ├── conflictEngine.ts   # Core dietary conflict logic
    │   │   │   └── toxicity.ts         # Ingredient toxicity analysis
    │   │   ├── fatsecret/
    │   │   ├── mealDBAPI/
    │   │   ├── off/                    # Open Food Facts
    │   │   ├── usda/
    │   │   ├── api-client.ts           # Axios API client
    │   │   ├── auth-actions.ts
    │   │   ├── mealUtils.ts
    │   │   ├── server-auth.ts
    │   │   └── unsplash.ts
    │   ├── scripts/
    │   ├── store/
    │   │   └── useOnboardingStore.ts   # Zustand onboarding state
    │   ├── styles/                     # CSS modules
    │   └── types/
    │       └── user.ts
    ├── public/
    ├── Dockerfile
    ├── package.json
    └── tsconfig.json
```

---

## Database Schema (Prisma)

### Core Models

#### User
```typescript
{
  id: string (cuid)
  name: string
  email: string (unique)
  emailVerified: boolean
  image: string?
  createdAt: DateTime
  updatedAt: DateTime

  // Onboarding Data
  age: int?
  conditions: string?                 // JSON: ["ckd-3b", "t2dm"]
  primaryAnchor: string?
  onboardingData: string?             // JSON blob
  nutritionLimits: string?            // JSON: { min: 1800, max: 2200, label: "Calories" }
  preferences: string?                // JSON: { theme: 'light' | 'light-sea' | 'dark' | 'dark-dracula' ... }

  // Subscription (Polar.sh)
  polarCustomerId: string? (unique)
  polarSubscriptionId: string? (unique)
  subscriptionStatus: string?

  // Relations
  metricLogs: MetricLog[]
  sessions: Session[]
  accounts: Account[]
  savedRecipes: Recipe[]
  groceryItems: GroceryItem[]
}
```

#### Recipe
```typescript
{
  id: string (cuid)
  externalId: string? (unique)        // TheMealDB ID
  sourceAPI: string?                   // "TheMealDB", "FatSecret", "Edamam"
  name: string
  description: string?
  instructions: string                 // Markdown
  prepTime: int?
  category: string?
  image: string?

  // Nutrition (optional, populated later)
  calories: int?
  protein: int?
  carbs: int?
  fat: int?
  sodium: int?
  sugar: int?
  fiber: int?

  servingSize: float?
  servingSizeUnit: string?

  tags: string                         // JSON: ["Breakfast", "High-Protein"]
  ingredients: string                  // JSON: [{item, measure}]

  // Relations
  users: User[]
  plansAsBreakfast: Plan[]
  plansAsLunch: Plan[]
  plansAsDinner: Plan[]
}
```

#### Plan
```typescript
{
  id: string (cuid)
  userId: string
  date: DateTime

  // Adherence Status
  breakfastStatus: string              // PENDING, COMPLETED, SKIPPED, SWAPPED
  lunchStatus: string
  dinnerStatus: string

  // Timing
  breakfastTime: string                // "08:00"
  lunchTime: string                    // "13:00"
  dinnerTime: string                   // "18:00"
  workoutTime: string                  // "10:00"

  // Meal References
  breakfastId: string?
  lunchId: string?
  dinnerId: string?
  restaurantId: string?

  // Relations
  breakfast: Recipe? (relation: Breakfast)
  lunch: Recipe? (relation: Lunch)
  dinner: Recipe? (relation: Dinner)
  restaurant: RestaurantItem?

  isCompleted: boolean

  @@unique([userId, date])
}
```

#### GroceryItem
```typescript
{
  id: string (cuid)
  userId: string
  user: User
  name: string
  isChecked: boolean
  category: string?
  createdAt: DateTime
}
```

#### MetricLog
```typescript
{
  id: string (cuid)
  userId: string
  user: User
  createdAt: DateTime

  type: string                         // "GLUCOSE", "BP", "WEIGHT", "WATER"
  value1: int?                         // Systolic or Glucose
  value2: int?                         // Diastolic
  tag: string?                         // "Fasting", "Post-Meal", "Stress"
}
```

#### Condition
```typescript
{
  id: string (cuid)
  slug: string (unique)                // e.g., 'diabetes'
  label: string                        // e.g., 'Glucose Control (Diabetes T2)'
  description: string
  icon: string                         // lucide icon name
  color: string                        // hex color
  
  // ICD-11 Mapping (JIT Onboarding)
  icdCode: string? (unique)         // e.g., "5A11" from WHO ICD-11
  icdUri: string?                     // Foundation URI from WHO
  
  nutritionalFocus: string?            // JSON blob
  allowedIngredients: string?           // JSON: string[]
  excludedIngredients: string?          // JSON: string[]
  
  // Relations
  nutrientLimits: NutrientLimit[]
  ingredientExclusions: IngredientExclusion[]
}
```

#### NutrientLimit
```typescript
{
  id: string (cuid)
  conditionId: string
  condition: Condition

  nutrient: string                     // "Sodium", "Potassium", "Phosphorus"
  limitType: string                    // "MAX", "MIN", "RANGE", "TEXT"
  limitValue: string                   // "2300", "3500-5000", "Minimize"
  unit: string?                        // "mg", "g", "% Cal"
  notes: string?
}
```

#### IngredientExclusion
```typescript
{
  id: string (cuid)
  conditionId: string
  condition: Condition

  additiveCategory: string             // "Phosphate Additives"
  ingredientRegex: string              // "phosphoric acid|sodium phosphate..."
  riskCategory: string                 // "Rapid K+ absorption; arrhythmia risk"
  severity: string                     // "CRITICAL_AVOID", "LIMIT"
  source: string?                      // Citation
}
```

#### Session, Account, Verification (Better Auth)
```typescript
// Standard Better Auth tables for OAuth, email/password auth
```

---

## API Endpoints

### Base URL: `http://localhost:3001/api`

### Authentication
```
POST   /api/auth/login                 # Email/password login
POST   /api/auth/register              # Email/password registration
POST   /api/auth/sign-in/social        # OAuth redirect
GET    /api/auth/callback/:provider    # OAuth callback
POST   /api/auth/sign-out              # Logout
GET    /api/auth/session               # Get current session
```

### Users
```
GET    /api/users/profile              # Get user profile
PATCH  /api/users/profile             # Update user profile
DELETE /api/users/test-account         # Delete test user
GET    /api/users/profile/nutrition-limits      # Get nutrition limits
PUT    /api/users/profile/nutrition-limits      # Update nutrition limits
POST   /api/users/profile/generate-limits       # Generate AI nutrition limits (60s timeout)
```

### Plans (Meal Planning)
```
GET    /api/plans/daily?date=          # Get plan for specific date
POST   /api/plans/generate             # Generate plan for date
PATCH  /api/plans/:id/status           # Update meal status
DELETE /api/plans/daily?date=          # Delete plan by date
POST   /api/plans/external-meal        # Add external/restaurant meal
POST   /api/plans/:id/meals/:type/swap # Swap meal (type: breakfast|lunch|dinner)
DELETE /api/plans/:id/meals/:type      # Remove meal
PATCH  /api/plans/:id                  # Update plan
```

### Food Analysis
```
GET    /api/food/analyze?q=           # Analyze food by search query
GET    /api/food/search?q=&type=       # Search foods (Brand|Generic)
GET    /api/food/barcode/:code         # Analyze food by barcode
```

### Menu Scanning
```
POST   /api/menu/scan                  # Upload menu image for AI analysis
```

### Grocery
```
GET    /api/grocery                    # Get grocery list
POST   /api/grocery                    # Add item
PATCH  /api/grocery/:id/toggle        # Toggle item check
DELETE /api/grocery/:id               # Remove item
DELETE /api/grocery/all               # Clear list
POST   /api/grocery/seed              # Seed sample items
POST   /api/grocery/ingredients       # Add ingredients from plan
POST   /api/grocery/generate          # Generate shopping list
```

### Conditions
```
GET    /api/conditions                 # List available conditions
GET    /api/conditions/search?q=       # Search ICD-11 for medical conditions (JIT onboarding)
POST   /api/conditions/onboard          # Onboard new condition from ICD-11 with AI-generated nutrition rules
```

### Metrics
```
POST   /api/metrics                    # Log health metric
GET    /api/metrics                    # Get metric history
```

### Drugs/Medications
```
GET    /api/drugs/search?q=           # Search drugs (FDA API)
GET    /api/drugs/details?name=&rxcui= # Get drug details
```

### Products
```
GET    /api/products                   # List products
GET    /api/products/:id              # Get product details
```

---

## Core Features & Workflows

### 1. Onboarding Flow (6 Steps)

**Location:** `/nutripioneer/src/app/onboarding/`

**State Management:** Zustand (`useOnboardingStore`)

**Steps:**

1. **Welcome (1-Welcome.tsx)**
   - User enters name and email
   - Initial account creation

2. **Conditions (2-Conditions.tsx)**
    - Select from pre-defined conditions OR search ICD-11 database for any medical condition
    - Just-in-Time (JIT) onboarding: Search → AI generates nutrition rules → Save to database
    - Each condition has icon, color, description (auto-generated for JIT conditions)
    - Multi-select allowed

3. **Biometrics (3-Biometrics.tsx)**
   - Height, weight, age, gender, waist measurement
   - Unit toggle (metric/imperial)

4. **Medical (4-Medical.tsx)**
   - Insulin usage checkbox
   - Search and add medications via FDA RxNorm API
   - Each medication includes:
     - Name
     - RxNorm RxCUI
     - Ingredients
     - Interactions
     - Pharmaceutical classes
     - Warnings

5. **Dietary (5-Dietary.tsx)**
   - Favorite foods (multi-select)
   - Disliked foods (multi-select)
   - Favorite cuisines
   - Disliked cuisines

6. **Synthesizing (6-Synthesizing.tsx)**
   - Real-time log display showing:
     - Biometric analysis
     - Medical constraint application
     - Dietary filter configuration
     - Recipe matching
     - AI nutrition limit generation
   - **Optimization:** Simulation runs in parallel with the backend API submission to reduce perceived wait time.
   - Saves profile to database
   - Generates AI nutrition limits via OpenAI
   - Creates initial meal plan
   - Redirects to dashboard

**Data Flow:**
```
Onboarding Form → Zustand Store → API Client → Backend → Database
                                            ↓
                                      OpenAI (nutrition limits)
                                            ↓
                                      Meal Plan Generation
```

---

### 9. Just-in-Time (JIT) Disease Onboarding

**Service:** `backend/src/integrations/icd/icd.service.ts`

**Controller:** `backend/src/controllers/conditions.controller.ts`

**AI Service:** `backend/src/integrations/openai/openai.service.ts`

**Overview:**
Expands condition support from 5 hardcoded conditions to the entire WHO ICD-11 database (55,000+ conditions). When users select a condition not yet onboarded, OpenAI automatically generates clinical nutrition rules.

**Workflow:**
```
1. User searches for condition (e.g., "Type 2 Diabetes")
   ↓
2. Frontend calls GET /api/conditions/search?q=Type 2 Diabetes
   ↓
3. Backend proxies to WHO ICD-11 API
   ↓
4. Displays results: code (5A11), title, description
   ↓
5. User clicks "Add Condition"
   ↓
6. Frontend calls POST /api/conditions/onboard
   {
     icdCode: "5A11",
     title: "Type 2 diabetes mellitus",
     uri: "http://id.who.int/icd/entity/5A11",
     description: "..."
   }
   ↓
7. Backend checks if condition exists (by icdCode)
   ↓
8a. If exists: Returns existing Condition ID (isNew: false)
   ↓
8b. If new:
   - Calls OpenAI generateConditionProfile(title, description)
   - Generates: label, description, icon, color, nutrientLimits, ingredientExclusions
   - Creates Condition record + nested NutrientLimit records + IngredientExclusion records
   - All in single Prisma transaction
   - Returns new Condition ID (isNew: true)
   ↓
9. Frontend associates condition ID with user profile
   ↓
10. Condition now works with existing conflict engine and meal planning system
```

**ICD-11 API Integration:**
```typescript
// OAuth2 Client Credentials Flow
- Token endpoint: https://icdaccessmanagement.who.int/connect/token
- Token cached in memory (valid ~1 hour)
- Auto-refresh on expiry

// Search endpoint
GET https://id.who.int/icd/release/11/2024-01/mms/search
Headers: {
  "API-Version": "v2",
  "Accept-Language": "en",
  "Authorization": "Bearer {token}"
}
Params: {
  q: "{search query}",
  useFlexisearch: "true",
  includeKeywordResult: "true"
}
```

**AI Generation Quality Controls:**
- Strict JSON output enforced
- Clinical dietitian system prompt
- Lucide icon validation (limited to icon set)
- Color coding based on severity (red=crucial, yellow=moderate, green=safe)
- Regex pattern validation for ingredient exclusions
- Limit type validation (MAX/MIN/RANGE/TEXT)
- Severity level validation (CRITICAL_AVOID/LIMIT)

**Example Generated Profile:**
```json
{
  "label": "Type 2 Diabetes Mellitus Nutrition Profile",
  "description": "Type 2 diabetes mellitus is a metabolic disorder...",
  "icon": "leaf",
  "color": "#10b981",
  "nutrientLimits": [
    {
      "nutrient": "Sodium",
      "limitType": "MAX",
      "limitValue": "2300",
      "unit": "mg",
      "notes": "Excess sodium intake can lead to hypertension..."
    }
  ],
  "ingredientExclusions": [
    {
      "additiveCategory": "Phosphate Additives",
      "ingredientRegex": "phosphoric acid|sodium phosphate|calcium phosphate",
      "riskCategory": "Rapid absorption; can cause spikes in blood sugar...",
      "severity": "CRITICAL_AVOID"
    }
  ]
}
```

**Technical Details:**
- Idempotent: Same ICD code always returns existing condition on subsequent requests
- Transaction-based: All data saved atomically (no partial records)
- Error handling: Returns meaningful errors for WHO API failures, OpenAI timeouts, DB errors
- Rate limiting: Consider adding for production (recommended: 10 requests/minute)

---

### 2. Meal Planning System

**Service:** `backend/src/services/plans.service.ts`

**Recipe Sources:**
- **FatSecret:** Primary source with OAuth2 authentication
- **TheMealDB:** Secondary source for recipes
- **Edamam:** Recipe search with nutritional filters

**Plan Generation Algorithm:**

```typescript
// For each meal type (Breakfast, Lunch, Dinner):
1. Get user profile (conditions, preferences, nutrition limits)
2. **Prioritize Source:** Try Edamam first (better nutritional data).
   - *Retry Strategy:* If Edamam search fails (e.g. invalid cuisine), retry without strict filters.
3. Fallback: If Edamam yields no results, use FatSecret.
4. Search recipes with filters:
   - Condition-specific constraints (e.g., CKD: low potassium, low phosphorus)
   - Calorie limits
   - Nutrient limits (sodium, sugar, etc.)
5. Check if recipe already exists (by externalId)
6. If not, create new recipe in database
7. Assign to plan day

// Fallback Chain:
Edamam (Primary) → FatSecret (Secondary) → Local Random (Final Fallback)
```

**Meal Status States:**
- `PENDING`: Not yet eaten
- `COMPLETED`: User marked as eaten
- `SKIPPED`: User removed from plan
- `SWAPPED`: User swapped for different recipe

**Swap Meal Flow:**
```
User clicks swap → API call → Get current recipe →
Search for alternative (exclude current) → Update plan → Return new meal
```

**Timing Customization:**
- Users can set custom meal times
- Default: Breakfast 08:00, Lunch 13:00, Dinner 18:00, Workout 10:00

---

### 3. Food Analysis & Conflict Engine

**Frontend Engine:** `/nutripioneer/src/lib/dietary/conflictEngine.ts`

**Backend Service:** `backend/src/services/food.service.ts`

**External APIs (Fallback Chain):**
1. FatSecret (food search + details)
2. USDA FoodData Central
3. Open Food Facts (barcodes)

**Conflict Analysis Logic:**

#### Phase 1: Ingredient Safety Scan
```typescript
// Regex-based ingredient analysis

// CKD: Hidden Killers
if (/(phos)/i.test(ingredients)) → AVOID (inorganic phosphates, 100% absorption)
if (/(potassium chloride|potassium lactate)/i.test(ingredients)) → AVOID

// All users: Trans Fats
if (/(partially hydrogenated)/i.test(ingredients)) → AVOID

// T2D/PCOS: Hidden Sugars
if (/(dextrose|maltodextrin|corn syrup|high fructose)/i.test(ingredients)) → CAUTION
```

#### Phase 2: Dynamic Threshold Calculation
```typescript
// Sodium Limits
Default: 766mg per meal (2300mg daily / 3)
Hypertension: 750mg
CKD + Hypertension: 500mg

// Carb Limits
Default: 60g per meal
Female (weight loss): 45g
Male (maintenance): 75g
```

#### Phase 3: Nutrition Evaluation Matrix

**Status Determination:**
```typescript
status = 'Safe' | 'Caution' | 'Avoid'

// Sodium Check
if (sodium > sodiumLimit) → Avoid
  message: "Sodium (Xmg) exceeds meal limit of Ymg"
  modifications: "Avoid adding salt", "Drink water"

// Diabetes Logic
if (t2d) {
  if (carbs > carbLimit) {
    if (fiber > 10) → Caution (buffered by fiber)
    else → Avoid
  }
}

// CKD Logic
if (ckd) {
  if (potassium > 200mg) → Caution
  if (potassium > 350mg) → Avoid
}

// Hypertension (without CKD)
if (hypertension && !ckd && potassium > 300 && sodium < 400) → Green flag (DASH diet)
```

#### Bioavailability Color Coding
- **Green (score 85-100):** Safe, fits all constraints
- **Yellow (score 51-84):** Caution, eat with modifications
- **Red (score 0-50):** Avoid, violates critical constraints

---

### 4. Additive Scanning System

**Location:** `/nutripioneer/src/lib/dietary/toxicity.ts`, `additives.ts`

**Red Flag Additives:**

#### Phosphate Additives (CKD - Critical)
```
/phosphoric/i
/phosphate/i
/sodium\s?prep/i
/calcium\s?diphosphate/i
/hexametaphosphate/i
/tripolyphosphate/i
/monocalcium\s?phosphate/i
/dicalcium\s?phosphate/i
/sodium\s?polyphosphate/i
```
**Why:** 90-100% absorption rate, dangerous for CKD patients

#### Potassium Additives (CKD - Lethal Risk)
```
/potassium\s?chloride/i
/potassium\s?lactate/i
/potassium\s?sorbate/i
/potassium\s?citrate/i
/potassium\s?benzoate/i
/acesulfame\s?potassium/i
```
**Why:** Can cause arrhythmia in CKD patients

#### Hidden Sugars (T2D/PCOS)
```
/cane\s?juice/i
/cane\s?sugar/i
/maltodextrin/i
/rice\s?syrup/i
/corn\s?syrup/i
/high\s?fructose\s?corn\s?syrup/i
/dextrose/i
/fructose/i
```
**Why:** High glycemic index, spikes insulin

#### Sodium Additives (HTN/CVD)
```
/monosodium\s?glutamate/i
/sodium\s?benzoate/i
/sodium\s?nitrite/i
/sodium\s?bi\s?carbonate/i
/disodium\s?guanylate/i
```

**Scanning Function:**
```typescript
scanForAdditives(ingredientText, userConditions) → {
  hasAdditives: boolean
  dangerousIngredients: string[]
  safetyMessage: string
}
```

---

### 5. AI-Powered Nutrition Limits

**Service:** `backend/src/integrations/openai/openai.service.ts`

**Function:** `calculateMedicalLimits(profile)`

**Input Profile:**
```typescript
{
  conditions: string[]          // ["ckd-3b-5", "htn", "t2dm"]
  medications: any[]
  biometrics: {
    weight: number
    height: number
    age: number
    gender: string
  }
}
```

**Output Structure:**
```typescript
{
  daily_calories: { min: number, max: number, label: "Calories" }
  nutrients: {
    NA: { max: number, label: "Sodium", unit: "mg" }
    K: { max: number, label: "Potassium", unit: "mg" }
    P: { max: number, label: "Phosphorus", unit: "mg" }
    PROCNT: { min: number, max: number, label: "Protein", unit: "g" }
    CHOCDF: { min: number, max: number, label: "Carbohydrates", unit: "g" }
    SUGAR: { max: number, label: "Sugars", unit: "g" }
    FIBTG: { min: number, label: "Fiber", unit: "g" }
    CHOLE: { max: number, label: "Cholesterol", unit: "mg" }
  }
  avoid_ingredients: string[]
  reasoning: string
}
```

**Prompt Strategy:**
- System prompt with clinical dietitian persona
- Uses GPT-5-nano model (fast, cost-effective)
- Returns structured JSON only
- 60-second timeout for generation

---

### 6. Menu Scanning (Restaurant Rescue)

**Component:** `/nutripioneer/src/components/menu/MenuScanner.tsx`

**Backend Controller:** `backend/src/controllers/menu.controller.ts`

**AI Service:** `backend/src/integrations/openai/openai.service.ts`

**Function:** `analyzeMenuImage(imageBase64, profile)`

**Workflow:**
```
User uploads menu image → Send to GPT-4o Vision →
Analyze each dish → Categorize as SAFE/CAUTION/AVOID →
Return with reasoning and modifications
```

**Safety Criteria:**
- **SAFE:** Fits dietary restrictions with minimal/no modifications
- **CAUTION:** Can be eaten with simple modifications (e.g., "sauce on side", "no salt")
- **AVOID:** Contains harmful ingredients that cannot be modified

**Condition-Specific Considerations:**
```typescript
// CKD Patients
- High potassium: bananas, potatoes, tomatoes
- Phosphorus additives: processed foods, cheese
- High sodium

// HTN Patients
- Salty dishes, processed meats, fried foods, sodium-heavy sauces

// T2DM Patients
- High-carb items, sugary beverages, desserts, white rice/bread

// PCOS Patients
- High-sugar items, inflammatory oils, processed foods
```

**Output Format:**
```typescript
{
  items: [{
    name: string
    description: string
    status: "SAFE" | "CAUTION" | "AVOID"
    reasoning: string
    modification: string  // For CAUTION items
  }]
  summary: string
}
```

---

### 7. Grocery List Management

**Service:** `backend/src/services/grocery.service.ts`

**Component:** `/nutripioneer/src/components/grocery/GroceryListClient.tsx`

**Features:**
- Manual item addition
- Auto-generate from meal plan (extract ingredients)
- Check/uncheck items
- Delete items
- Clear entire list
- Category organization

**Seed Data:**
- Pre-loaded with common grocery items
- Categorized by food groups

**Generate from Plan:**
```typescript
// Extracts ingredients from today's plan
plan.recipes.forEach(recipe => {
  const ingredients = JSON.parse(recipe.ingredients)
  ingredients.forEach(item => {
    groceryService.add(item.item, item.category)
  })
})
```

---

### 8. Health Metrics Tracking

**Model:** `MetricLog`

**Metric Types:**
- `GLUCOSE` - Blood sugar (mg/dL)
- `BP` - Blood pressure (systolic/diastolic)
- `WEIGHT` - Weight (kg/lbs)
- `WATER` - Water intake (ml/oz)

**Logging:**
```typescript
POST /api/metrics {
  type: "GLUCOSE"
  value1: 120  // or 120/80 for BP
  value2: 80   // optional
  tag: "Fasting" | "Post-Meal" | "Stress"
}
```

**Tags:**
- "Fasting" - Before eating
- "Post-Meal" - After eating (e.g., 2 hours)
- "Stress" - High stress situation
- Custom tags allowed

---

## External Integrations

### 1. FatSecret API
**Service:** `backend/src/integrations/fatsecret/fatsecret.service.ts`

**Authentication:** OAuth2 (client credentials)

**Capabilities:**
- Food search with brand/generic filtering
- Recipe search with nutrient filtering
- Detailed nutrition information
- Recipe instructions and ingredients

**Key Methods:**
```typescript
searchFoods(query, page, maxResults, foodType?)
searchRecipes(query, page, maxResults)
searchNutrientLimitedRecipes(options: {
  query?, calories?, carbsPercentage?,
  proteinPercentage?, fatPercentage?,
  recipeTypes?, mustHaveImages?
})
getFoodDetails(foodId)
getRecipeDetails(recipeId)
```

**Nutrient Filtering:**
- Calories (min/max)
- Carb percentage (min/max)
- Protein percentage (min/max)
- Fat percentage (min/max)
- Recipe types (breakfast, lunch, dinner, etc.)
- Image requirement

---

### 2. TheMealDB API
**Service:** `backend/src/integrations/mealdb/mealdb.service.ts`

**Capabilities:**
- Recipe by ID
- Search by name
- Search by first letter
- List categories
- Random meal

**Key Methods:**
```typescript
getMealById(id)
searchMealByName(name)
getCategories()
filterByCategory(category)
getRandomMeal()
```

---

### 3. Edamam API
**Service:** `backend/src/integrations/edamam/edamam.service.ts`

**Capabilities:**
- Food database search
- Recipe search
- Natural language parser

**Key Methods:**
```typescript
parseIngredients(text) - "1 cup rice, 2 oz chicken"
searchRecipes(query, filters)
```

---

### 4. Open Food Facts (OFF)
**Service:** `backend/src/integrations/off/off.service.ts`

**Capabilities:**
- Product lookup by barcode
- Nutritional information
- Ingredients list
- Nutri-Score grading

**Key Methods:**
```typescript
getProductByBarcode(code)
searchProducts(query)
```

**Use Case:**
- Primary for barcode scanning
- Fallback for food search if FatSecret fails

---

### 5. USDA FoodData Central
**Service:** `backend/src/integrations/usda/usda.service.ts`

**Capabilities:**
- Official US government food database
- Detailed nutritional data
- Foundation foods and branded foods

**Key Methods:**
```typescript
searchFoods(query, filters)
getFoodDetails(fdcId)
getNormalizedNutrition(food) - Standardizes nutrient names
```

**Use Case:**
- Fallback for food search
- Authoritative nutrition data
- GTIN/barcode search

---

### 6. OpenAI API
**Service:** `backend/src/integrations/openai/openai.service.ts`
 
**Models Used:**
- **GPT-4o:** Menu image analysis (vision)
- **GPT-4o-mini:** Condition profile generation for JIT onboarding (text)
 
**Key Methods:**
```typescript
calculateMedicalLimits(profile) → ComputedLimits
analyzeMenuImage(imageBase64, profile) → MenuAnalysisResult
generateConditionProfile(conditionName: icdDescription) → ConditionProfile  // JIT onboarding
```
 
**Response Format:**
- JSON mode enforced
- Structured output with types
- Timeout: 60 seconds for limits, 4096 tokens for menu

---

### 7. WHO ICD-11 API
**Service:** `backend/src/integrations/icd/icd.service.ts`

**Authentication:** OAuth2 Client Credentials

**Capabilities:**
- Search entire ICD-11 medical classification database (55,000+ conditions)
- Get detailed condition information by URI
- Multilingual support (English, Spanish, French, etc.)

**Key Methods:**
```typescript
getToken() → string  // Cached OAuth2 token (1hr validity)
searchConditions(query: string) → ICDDiseaseResult[]
getConditionByUri(uri: string) → Record<string, unknown>
```

**Use Case:**
- Just-in-Time disease onboarding for any medical condition
- Supports conditions beyond the 5 pre-defined ones
- AI-generated nutrition rules for clinical accuracy

---

### 8. FDA RxNorm API
**Service:** `backend/src/services/drugApi.ts`

**Capabilities:**
- Drug search by name
- Drug details by RxNorm ID
- Ingredient information
- Drug interactions
- Warnings and contraindications

**Use Case:**
- Medication lookup during onboarding
- Drug-food interaction analysis

---

### 9. Polar.sh (Payments)
**Integration:** Better Auth plugin

**Capabilities:**
- Subscription management
- Checkout flow
- Webhook handling
- Customer synchronization

**Subscription Fields in User:**
- `polarCustomerId`
- `polarSubscriptionId`
- `subscriptionStatus` (default: "inactive")

---

## Authentication System

**Library:** Better Auth (`backend/src/lib/auth.ts`)

**Configuration:**
```typescript
betterAuth({
  database: prismaAdapter(prisma, { provider: 'sqlite' })
  plugins: [
    polar({
      client: new Polar({...}),
      use: [checkout(), webhooks({...})]
    })
  ]

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8
  }

  socialProviders: {
    google: {...}
  }

  session: {
    expiresIn: 60 * 60 * 24 * 7  // 7 days
    updateAge: 60 * 60 * 24       // Update every 24h
  }

  baseURL: 'http://localhost:3000'
  secret: process.env.BETTER_AUTH_SECRET
})
```

**Session Management:**
- HTTP-only cookies
- 7-day session expiry
- Automatic refresh every 24h
- CORS enabled for localhost:3000, 3001

**Middleware:** `backend/src/middleware/auth.middleware.ts`
```typescript
authMiddleware(c) {
  const session = await auth.api.getSession({ headers: c.req.header })
  if (!session) throw new ApiError(401, 'Unauthorized')
  c.set('user', session.user)
  c.set('session', session.session)
}
```

---

## Frontend Architecture

### State Management

**Zustand Store:** `/nutripioneer/src/store/useOnboardingStore.ts`

**Store Structure:**
```typescript
{
  step: number                    // Current onboarding step (1-6)
  name: string
  email: string
  conditions: string[]            // Selected conditions
  biometrics: {
    height: number
    weight: number
    waist: number
    age: number
    gender: string
    unit: 'metric' | 'imperial'
  }
  medical: {
    insulin: boolean
    medications: Array<{
      name: string
      openfda_rxcui: string[]
      rxnorm_rxcui: string
      ingredients: string[]
      interactions: string
      pharm_class: string[]
      warnings?: string[]
      purpose?: string[]
    }>
  }
  dietary: {
    favorites: string[]
    dislikes: string[]
    favCuisines: string[]
    dislikeCuisines: string[]
  }
}
```

**Actions:**
```typescript
nextStep()
prevStep()
setStep(step)
updateData(section, data)
```

---

### API Client

**Location:** `/nutripioneer/src/lib/api-client.ts`

**Configuration:**
```typescript
axios.create({
  baseURL: 'http://localhost:3001/api'
  headers: { 'Content-Type': 'application/json' }
  withCredentials: true  // Send auth cookies
})
```

**Structured API Calls:**
```typescript
api.auth.login(credentials)
api.auth.register(data)
api.auth.logout()

api.user.getProfile()
api.user.updateProfile(data)
api.user.getNutritionLimits()
api.user.updateNutritionLimits(data)
api.user.generateNutritionLimits()  // 60s timeout

api.plans.getDaily(date)
api.plans.generate(date)
api.plans.updateStatus(id, type, status)
api.plans.deleteDaily(date)
api.plans.addExternalMeal(data)
api.plans.swapMeal(planId, type)
api.plans.removeMeal(planId, type)

api.food.analyze(query, type?)
api.food.search(query, type?)
api.food.analyzeBarcode(code)

api.menu.scan(imageFile)

api.grocery.list()
api.grocery.add(name)
api.grocery.toggle(id, isChecked)
api.grocery.remove(id)
api.grocery.clear()
api.grocery.seed()
api.grocery.addIngredients(ingredients)
api.grocery.generateShoppingList(entries)

api.conditions.list()

api.conditions.search(query)
api.conditions.onboard(icdData)

api.metrics.log(data)
api.metrics.history()

api.drugs.search(query)
api.drugs.details(name, rxcui)

api.products.list()
api.products.get(id)
```

---

### Component Architecture

**Reusable Components:**
- `buttons/LoginButton` - Google OAuth
- `cards/MealCard` - Recipe display card
- `cards/WorkoutCard` - Exercise tracking
- `dashboard/DashboardHeader` - Header with navigation
- `grocery/GroceryListClient` - Grocery list with checkboxes
- `menu/MenuResults` - AI menu scan results
- `menu/MenuScanner` - Camera upload for menu scanning
- `modals/ConfirmationModal` - Generic confirmation dialog
- `modals/FoodCheckModal` - Food safety check modal
- `modals/RecipeDetailsModal` - Recipe details with nutrition
- `modals/StoreListModal` - Store selection modal
- `plan/ManagePlanControls` - Plan management controls
- `plan/PlanView` - Daily meal plan view
- `profile/LogoutButton` - User logout
- `profile/ProfileActions` - Profile edit actions
- `profile/ProfileEditor` - Profile editing form
- `ui/FloatingDock` - Bottom navigation dock
- `ui/InteractiveBackground` - Animated background
- `ui/OnboardingMorph` - Onboarding transitions
- `ui/TimePicker` - Time selection component
- `loader/Loader2` - Loading spinner

---

### Styling

**Approach:** CSS Modules

**Styles Location:** `/nutripioneer/src/styles/`

**Available Style Files:**
- `Components.module.css`
- `ConfirmationModal.module.css`
- `Dashboard.module.css`
- `FoodCheckModal.module.css`
- `GroceryList.module.css`
- `MenuResults.module.css`
- `MenuScanner.module.css`
- `Onboarding.module.css`
- `PlanView.module.css`
- `Profile.module.css`
- `StoreListModal.module.css`
- `Subscription.module.css`
- `TimePicker.module.css`
- `Timeline.module.css`

**Typography:**
- Geist Sans (variable)
- Geist Mono (variable)
- Outfit (headings)
- Inter (body)
- Outfit (headings)

### Theming System

**Implementation:**
- **Context:** `ThemeContext.tsx` handles state and persistence (localStorage + User Profile).
- **CSS Variables:** Defined in `globals.css` with wildcard selectors `[data-theme^='dark']` for broad compatibility.
- **Themes:** 10 curated palettes available.

**Available Themes:**
| Category | Themes |
| :--- | :--- |
| **Light** | `light` (Default), `light-sea`, `light-rose`, `light-lavender`, `light-mint` |
| **Dark** | `dark` (Default), `dark-dracula`, `dark-nord`, `dark-forest`, `dark-sunset` |

**Persistence Strategy:**
1. **Local:** Instant load via `localStorage.getItem('theme')`.
2. **Cloud:** Synced to `User.preferences` JSON field for cross-device consistency.
3. **System:** Fallback to system preference (`prefers-color-scheme`) if no setting exists.

---

## Data Flow Examples

### Complete Onboarding Flow

```
1. User lands on /onboarding
   ↓
2. Step 1: Enter name, email
   ↓
3. Zustand store: { name, email, step: 2 }
   ↓
4. Step 2: Select conditions
   ↓
5. Store: { conditions: ["ckd-3b", "t2dm"], step: 3 }
   ↓
6. Step 3: Enter biometrics
   ↓
7. Store: { biometrics: {...}, step: 4 }
   ↓
8. Step 4: Search medications (FDA API)
   ↓
9. Store: { medical: { medications: [...] }, step: 5 }
   ↓
10. Step 5: Select dietary preferences
    ↓
11. Store: { dietary: { favorites: [...], dislikes: [...] }, step: 6 }
    ↓
12. Step 6: Synthesizing
    ↓
13. Save profile to backend:
    POST /api/users/profile {
      name, email, conditions,
      biometrics, medical, dietary
    }
    ↓
14. Generate AI nutrition limits:
    POST /api/users/profile/generate-limits
    → OpenAI GPT-5-nano
    → Returns personalized limits
    ↓
15. Save nutrition limits:
    PUT /api/users/profile/nutrition-limits
    ↓
16. Generate initial meal plan:
    POST /api/plans/generate { date: today }
    → Fetches recipes from FatSecret/Edamam
    → Filters by nutrition limits
    → Creates Plan record
    ↓
17. Redirect to /home
```

---

### Meal Generation Flow

```
User requests plan for date:
POST /api/plans/generate { date: "2024-01-15" }

Backend (plans.service.ts):
1. Check if plan exists for userId + date
2. Get user profile with nutrition limits
3. For each meal (breakfast, lunch, dinner):
   a. Randomly select source (FatSecret or Edamam)
   b. Search recipes with filters:
      - Calories within range
      - Sodium < daily limit / 3
      - Other nutrients within limits
   c. Get recipe details
   d. Check if recipe exists (by externalId)
   e. If not, create in database
   f. Assign to plan
4. Save plan to database
5. Return plan with recipe details

Response:
{
  id: "plan123"
  date: "2024-01-15"
  breakfast: { id, name, image, calories, category, ... }
  lunch: { ... }
  dinner: { ... }
  breakfastStatus: "PENDING"
  lunchStatus: "PENDING"
  dinnerStatus: "PENDING"
}
```

---

### Food Analysis Flow

```
User searches food:
GET /api/food/analyze?q="chicken breast"&type="Generic"

Backend (food.service.ts):
1. Try FatSecret search
   GET fatsecret/foods/search?v4?q="chicken breast"
2. If results, get details:
   GET fatsecret/food/v5?food_id=123
3. Normalize nutrition:
   - Extract calories, protein, fat, carbs, etc.
   - Standardize units
4. If user has nutrition limits:
   - Run conflict engine checkConflicts()
   - Calculate bioavailability score
   - Return color (Green/Yellow/Red) + reasoning
5. If FatSecret fails, fallback to USDA
6. Return food object

Response:
{
  source: "FatSecret"
  name: "Chicken Breast"
  brand: null
  image: "https://..."
  nutrition: {
    calories: 165
    protein: 31
    fat: 3.6
    carbs: 0
    sodium: 74
    ...
  }
  bioavailability: {
    score: 95
    color: "Green"
    reasoning: "Fits within your nutrition limits."
  }
}
```

---

### Menu Scanning Flow

```
User uploads menu image:
POST /api/menu/scan { image: File }

Backend (menu.controller.ts):
1. Receive multipart form data
2. Convert image to base64
3. Get user profile (conditions, medications, biometrics)
4. Call OpenAI GPT-4o Vision:
   analyzeMenuImage(imageBase64, profile)
5. AI analyzes image:
   - Identifies dishes
   - Checks against conditions
   - Categorizes each dish
   - Provides reasoning and modifications
6. Return structured analysis

Response:
{
  items: [
    {
      name: "Grilled Salmon"
      description: "Fresh salmon with herbs"
      status: "SAFE"
      reasoning: "Low sodium, high protein, fits renal diet"
    },
    {
      name: "French Fries"
      description: "Deep-fried potatoes"
      status: "AVOID"
      reasoning: "High sodium and potassium, dangerous for CKD"
    },
    {
      name: "Caesar Salad"
      description: "Romaine lettuce with dressing"
      status: "CAUTION"
      reasoning: "High sodium in dressing"
      modification: "Ask for dressing on the side"
    }
  ]
  summary: "2 safe items, 1 to avoid, 1 with modifications"
}
```

---

## Environment Variables

### Backend (`.env`)
```bash
# Database
DATABASE_URL="file:./dev.db"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth
GOOGLE_CLIENT_ID="google-client-id"
GOOGLE_CLIENT_SECRET="google-client-secret"

# Polar.sh Payments
POLAR_ACCESS_TOKEN="polar-token"
POLAR_ENV="sandbox"  # or "production"
POLAR_WEBHOOK_SECRET="webhook-secret"

# FatSecret
FATSECRET_CLIENT_ID="client-id"
FATSECRET_CLIENT_SECRET="client-secret"

# OpenAI
OPENAI_API_KEY="sk-..."

# WHO ICD-11 API (JIT Disease Onboarding)
ICD_CLIENT_ID="your-icd-client-id"
ICD_CLIENT_SECRET="your-icd-client-secret"

# Optional: Other APIs
USDA_API_KEY="..."
EDAMAM_APP_ID="..."
EDAMAM_APP_KEY="..."
```

### Frontend (`.env.local`)
```bash
# Backend API URL
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Optional: Unsplash for images
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY="..."
```

---

## Medical Guidelines & Constraints

### CKD (Chronic Kidney Disease)
**Critical Constraints:**
- **Phosphorus:** < 800-1000mg/day (Stage 3-5)
- **Potassium:** < 2000-3000mg/day (Stage 3b-5)
- **Sodium:** < 2000mg/day (with hypertension)
- **Protein:** 0.6-0.8g/kg body weight (Stage 3-5)

**Foods to Avoid:**
- Phosphate additives (100% absorption)
- Potassium additives (hidden sources)
- Starfruit (neurotoxic for CKD)
- High-potassium foods (bananas, potatoes, tomatoes)
- Processed meats, cheeses

**Phosphorus Bioavailability Tiers:**
1. **Optimal (Tier 1):** Bulgur, barley, buckwheat, millet (40-50% absorption)
2. **Moderate (Tier 2):** Brown rice, quinoa, steel-cut oats
3. **Conditional (Tier 3):** White rice, white bread (low phos, but high GI)
4. **Avoid:** Processed foods with inorganic phosphates

---

### T2DM (Type 2 Diabetes)
**Critical Constraints:**
- **Carbs:** 45-75g per meal (varies by gender, goals)
- **Sugar:** < 25g/day (women), < 36g/day (men)
- **Fiber:** > 25g/day

**Foods to Avoid:**
- High GI carbs (white rice, white bread)
- Sugary beverages, desserts
- Hidden sugars (maltodextrin, corn syrup)

**Carb Logic:**
- High carb (> limit) + High fiber (> 10g) → Caution (buffered)
- High carb + Low fiber → Avoid

---

### Hypertension (HTN)
**Critical Constraints:**
- **Sodium:** < 2300mg/day (1500mg ideal with CKD)
- **Potassium:** Increase (3500-5000mg/day) - DASH diet

**Foods to Avoid:**
- High sodium foods, processed foods
- Salty sauces, dressings
- Fried foods

**DASH Diet Benefits (without CKD):**
- High potassium sources help lower BP
- Low sodium + high potassium = Green flag

---

### PCOS (Polycystic Ovary Syndrome)
**Critical Constraints:**
- **Sugar:** Minimize added sugars
- **Inflammatory foods:** Avoid processed foods, inflammatory oils
- **Nitrites/Nitrates:** Avoid

**Foods to Avoid:**
- High sugar items
- Processed meats (nitrates)
- Refined carbs
- Inflammatory oils

---

### High Cholesterol
**Critical Constraints:**
- **Saturated Fat:** < 13g/day (5-6% of calories)
- **Trans Fat:** 0g (strictly avoid)
- **Cholesterol:** < 200mg/day
- **Fiber:** > 25g/day

**Foods to Avoid:**
- Trans fats (partially hydrogenated oils)
- High saturated fat foods
- Fried foods
- Processed meats

---

## Key Algorithms

### Conflict Engine (Frontend)
**Location:** `/nutripioneer/src/lib/dietary/conflictEngine.ts`

**Function:** `runConflictEngine(food, user) → AnalysisResult`

**Algorithm:**
```typescript
function runConflictEngine(food, user) {
  let status = 'Safe'
  let reasons = []
  let mods = []

  // Phase 1: Ingredient Safety
  if (CKD && containsPhosphate(food)) → status = 'Avoid'
  if (CKD && containsPotassiumAdditive(food)) → status = 'Avoid'
  if (transFats(food)) → status = 'Avoid'
  if ((T2D || PCOS) && hiddenSugars(food)) → status = 'Caution'

  // Phase 2: Dynamic Thresholds
  sodiumLimit = calcSodiumLimit(conditions)
  carbLimit = calcCarbLimit(gender, goal)

  // Phase 3: Nutrition Evaluation
  if (food.sodium > sodiumLimit) → status = 'Avoid'
  if (T2D && food.carbs > carbLimit) {
    if (food.fiber > 10) → status = 'Caution'
    else → status = 'Avoid'
  }
  if (CKD && food.potassium > 200) → status = 'Caution'
  if (CKD && food.potassium > 350) → status = 'Avoid'

  // Phase 4: Conditional Logic
  if (HTN && !CKD && highPotassium && lowSodium) → Green flag
  if (PCOS && (highSugar || nitrates)) → status = 'Avoid'

  return { status, reason, modification, nutrition }
}
```

---

### Recipe Matching Algorithm (Backend)
**Location:** `backend/src/services/plans.service.ts`

**Function:** `generatePlan(userId, date) → Plan`

**Algorithm:**
```typescript
async function generatePlan(userId, date) {
  const user = await getUser(userId)
  const limits = parseNutritionLimits(user.nutritionLimits)

  async function getMeal(mealType) {
    // Random source selection
    const useFatSecret = Math.random() > 0.5

    if (useFatSecret) {
      recipe = await searchFatSecret({
        query: mealType,
        calories: { max: limits.daily_calories.max / 3 },
        sodium: { max: limits.nutrients.NA.max / 3 }
        // ... other nutrient limits
      })
    } else {
      recipe = await searchEdamam({
        query: mealType,
        calories: { max: limits.daily_calories.max / 3 }
      })
    }

    // Create recipe in DB if new
    return await findOrCreate(recipe)
  }

  const breakfast = await getMeal('Breakfast')
  const lunch = await getMeal('Lunch')
  const dinner = await getMeal('Dinner')

  return await createPlan({
    userId,
    date,
    breakfastId: breakfast.id,
    lunchId: lunch.id,
    dinnerId: dinner.id
  })
}
```

---

### Additive Scanning (Frontend)
**Location:** `/nutripioneer/src/lib/dietary/toxicity.ts`

**Function:** `scanForAdditives(ingredientText, userConditions) → ScannerResult`

**Algorithm:**
```typescript
function scanForAdditives(text, conditions) {
  let found = []
  let message = "Safe"

  // Phosphate scan
  const phosphates = findMatches(text, PHOSPHATE_ADDITIVES)
  if (phosphates.length > 0) {
    found.push(...phosphates)
    if (conditions.includes('ckd')) {
      message = "CRITICAL ALERT: Phosphate additives"
    }
  }

  // Potassium scan
  const potassiums = findMatches(text, POTASSIUM_ADDITIVES)
  if (potassiums.length > 0) {
    found.push(...potassiums)
    if (conditions.includes('ckd')) {
      message = "LETHAL RISK: Potassium additives"
    }
  }

  // Sugar scan
  const sugars = findMatches(text, HIDDEN_SUGARS)
  if (sugars.length > 0) {
    found.push(...sugars)
    if (conditions.includes('t2d')) {
      message += " Hidden sugars detected"
    }
  }

  return {
    hasAdditives: found.length > 0,
    dangerousIngredients: found,
    safetyMessage: message
  }
}
```

---

## Error Handling

### Backend Middleware
**Location:** `backend/src/middleware/errorHandler.ts`

**Error Types:**
```typescript
class ApiError extends Error {
  statusCode: number
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
  }
}
```

**Response Format:**
```typescript
{
  success: false
  error: string        // Error type
  message: string      // Human-readable message
  details?: any        // Additional context
}
```

**Common Errors:**
- 400: Bad Request (validation failed)
- 401: Unauthorized (no session)
- 404: Not Found (resource doesn't exist)
- 409: Conflict (plan already exists for date)
- 500: Internal Server Error

---

## Deployment

### Backend (Docker)
```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
RUN bun run db:generate
RUN bun run db:push
EXPOSE 3001
CMD ["bun", "run", "index.ts"]
```

### Frontend (Docker)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Development Commands

### Backend
```bash
# Install dependencies
bun install

# Database
bun run db:generate     # Generate Prisma client
bun run db:push        # Push schema to DB
bun run db:seed        # Seed database
bun run db:studio      # Open Prisma Studio

# Run
bun run dev            # Development with hot reload
bun run start          # Production
```

### Frontend
```bash
# Install dependencies
npm install

# Run
npm run dev            # Development (port 3000)
npm run build          # Production build
npm run start          # Production server
npm run lint           # ESLint
```

---

## Important Files Reference

### Backend
- **Entry Point:** `backend/src/index.ts`
- **Routes:** `backend/src/routes/index.ts`
- **Auth Config:** `backend/src/lib/auth.ts`
- **DB Schema:** `backend/prisma/schema.prisma`
- **Food Service:** `backend/src/services/food.service.ts`
- **Plan Service:** `backend/src/services/plans.service.ts`
- **Recipe Service:** `backend/src/services/recipes.service.ts`
- **OpenAI Integration:** `backend/src/integrations/openai/openai.service.ts`
- **ICD-11 Integration:** `backend/src/integrations/icd/icd.service.ts`
- **Conditions Controller:** `backend/src/controllers/conditions.controller.ts`

### Frontend
- **Entry Point:** `nutripioneer/src/app/layout.tsx`
- **API Client:** `nutripioneer/src/lib/api-client.ts`
- **Onboarding Store:** `nutripioneer/src/store/useOnboardingStore.ts`
- **Conflict Engine:** `nutripioneer/src/lib/dietary/conflictEngine.ts`
- **Additive Patterns:** `nutripioneer/src/lib/dietary/additives.ts`
- **Toxicity Logic:** `nutripioneer/src/lib/dietary/toxicity.ts`
- **Synthesizing Step:** `nutripioneer/src/app/onboarding/steps/6-Synthesizing.tsx`

---

## Testing Notes

### Database Seed
Run: `bun run db:seed`

### Verify Integrations
- **FatSecret:** `backend/scripts/verify-fatsecret.ts`
- **Menu Vision:** `backend/scripts/test-menu-vision.ts`
- **Food Verification:** `backend/scripts/verify-food.ts`

### Frontend Scripts
- **FatSecret Verify:** `nutripioneer/scripts/verify-fatsecret.ts`
- **Conflict Verify:** `nutripioneer/src/lib/scripts/verify_conflict.ts`

---

## Known Limitations & Considerations

1. **Recipe Nutrition Gaps:** TheMealDB recipes often lack nutrition data; needs fallback to other APIs or manual input
2. **API Rate Limits:** External APIs may have rate limits; implement caching strategy (ICD-11 token already cached)
3. **AI Timeout:** OpenAI calls can take up to 60s; UI shows loading state (especially for JIT onboarding)
4. **Session Expiry:** 7-day session expiry; user may need to re-login
5. **Barcode Scanning:** Open Food Facts has incomplete coverage; fallback to USDA needed
6. **Medication Interactions:** FDA API provides basic interactions; comprehensive drug-food interaction engine needed
7. **Nutrition Calculation:** Serving sizes vary across APIs; normalization required
8. **Multi-Condition Logic:** Complex when user has multiple conditions; priority system needed
9. **ICD-11 Availability:** WHO API may have downtime; implement retry logic and fallback UI messaging
10. **AI Hallucinations:** OpenAI-generated nutrition rules should be reviewed by clinical professionals; consider "verified" flag

---

## Future Enhancements

1. **Nutrition AI:** More sophisticated meal planning considering entire day's nutrition
2. **Drug Interactions:** Enhanced drug-food/nutrient interaction database
3. **Symptom Tracking:** Track symptoms and correlate with diet
4. **Recipe Generation:** AI-generated custom recipes based on user profile
5. **Social Features:** Share recipes, meal plans, community support
6. **Integration:** Connect with fitness trackers (Apple Health, Google Fit)
7. **Meal Prep:** Generate weekly meal prep plans with grocery lists
8. **Restaurant Database:** Expand restaurant menu database beyond scanning
9. **Reminders:** Push notifications for meal times, medication reminders
10. **Export Features:** PDF meal plans, share with dietitian/doctor
11. **Condition Verification:** Add workflow for dietitian/doctor verification of AI-generated nutrition rules
12. **Batch Onboarding:** Allow users to select multiple conditions and onboard them in parallel
13. **Condition History:** Track user's condition additions/removals over time

---

## Medical Disclaimer

**This system provides general nutrition guidance based on medical conditions. Always consult with a healthcare professional or registered dietitian before making significant dietary changes, especially for complex medical conditions like CKD, diabetes, or hypertension. Individual needs may vary based on lab values, medications, and other factors.**

---

## Contact & Support

- **Backend Port:** 3001
- **Frontend Port:** 3000
- **Database:** SQLite (dev.db)
- **API Documentation:** This document
- **Issue Tracking:** GitHub Issues

---

**Document Version:** 2.0
**Last Updated:** January 2026
**Project:** NutriPioneer

**Version 2.0 Changes (January 2026):**
- Added Just-in-Time Disease Onboarding system
- Integrated WHO ICD-11 API for condition search
- Added AI-generated nutrition profiles for new conditions
- Updated Condition schema with ICD-11 mapping (icdCode, icdUri)
- Added new endpoints: GET /api/conditions/search, POST /api/conditions/onboard
- Expanded condition support from 5 to 55,000+ medical conditions
- **UI/UX:** Added Multi-Theme System with 10 custom color palettes (5 Light, 5 Dark) and cloud persistence.
