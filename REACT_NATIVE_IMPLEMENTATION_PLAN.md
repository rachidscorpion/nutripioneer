# NutriPioneer React Native Implementation Plan

## Executive Summary

Build a React Native mobile app that mirrors the existing web frontend while leveraging native capabilities for enhanced user experience. The app will use the existing backend API with no modifications required.

---

## 1. Technology Stack

### Core Framework
- **React Native 0.74+** - Latest stable version
- **Expo SDK 52** - For streamlined development and deployment
- **TypeScript** - Type safety

### Navigation
- **React Navigation 6** - Screen and tab navigation
  - Stack Navigator
  - Tab Navigator
  - Bottom Tab Navigator

### State Management
- **Zustand** - Global state (matching web frontend)
- **AsyncStorage** - Local data persistence
- **React Query (TanStack Query)** - API caching and synchronization

### HTTP & API
- **Axios** - API client (matching web frontend)
- **Cookie Storage** - Session management

### UI Components
- **React Native Paper** - Material Design components
- **React Native Reanimated** - Smooth animations
- **React Native Gesture Handler** - Advanced gestures
- **React Native Vector Icons** - Icons (matching Lucide icons from web)

### Native Modules
- **expo-camera** - Menu scanning (restaurant rescue)
- **expo-image-picker** - Image upload
- **expo-barcode-scanner** - Barcode scanning for food products
- **expo-haptics** - Haptic feedback
- **expo-notifications** - Push notifications for meal reminders
- **expo-local-authentication** - Biometric authentication
- **expo-secure-store** - Secure token storage

### Styling
- **NativeWind** - Tailwind CSS for React Native
- **React Native Stylesheet** - Platform-specific styles

### Additional Libraries
- **expo-linking** - Deep linking
- **expo-constants** - App constants
- **expo-device** - Device info
- **expo-file-system** - File management
- **react-native-chart-kit** - Health metrics visualization
- **react-native-modal** - Custom modals

---

## 2. Directory Structure

```
nutripioneer-mobile/
├── app.json                          # Expo config
├── package.json
├── tsconfig.json
├── App.tsx                           # Root entry
├── eas.json                          # Expo Application Services
├── metro.config.js
└── src/
    ├── api/                          # API client (mirrors web)
    │   ├── client.ts                 # Axios instance
    │   ├── auth.api.ts
    │   ├── users.api.ts
    │   ├── plans.api.ts
    │   ├── food.api.ts
    │   ├── menu.api.ts
    │   ├── grocery.api.ts
    │   ├── conditions.api.ts
    │   ├── metrics.api.ts
    │   └── drugs.api.ts
    ├── components/                   # Reusable components
    │   ├── common/
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── Input.tsx
    │   │   ├── Loader.tsx
    │   │   ├── Modal.tsx
    │   │   └── Avatar.tsx
    │   ├── auth/
    │   │   ├── LoginButton.tsx
    │   │   └── LogoutButton.tsx
    │   ├── onboarding/
    │   │   ├── WelcomeStep.tsx
    │   │   ├── ConditionsStep.tsx
    │   │   ├── BiometricsStep.tsx
    │   │   ├── MedicalStep.tsx
    │   │   ├── DietaryStep.tsx
    │   │   └── SynthesizingStep.tsx
    │   ├── dashboard/
    │   │   ├── DashboardHeader.tsx
    │   │   ├── TimelineFeed.tsx
    │   │   ├── FloatingDock.tsx
    │   │   └── StatsCard.tsx
    │   ├── plan/
    │   │   ├── MealCard.tsx
    │   │   ├── PlanView.tsx
    │   │   └── ManagePlanControls.tsx
    │   ├── food/
    │   │   ├── FoodAnalysisCard.tsx
    │   │   ├── NutritionBadge.tsx
    │   │   └── ConflictIndicator.tsx
    │   ├── menu/
    │   │   ├── MenuScanner.tsx
    │   │   ├── MenuResults.tsx
    │   │   └── CameraView.tsx
    │   ├── grocery/
    │   │   ├── GroceryList.tsx
    │   │   ├── GroceryItem.tsx
    │   │   └── AddItemModal.tsx
    │   ├── metrics/
    │   │   ├── MetricLogger.tsx
    │   │   ├── MetricChart.tsx
    │   │   └── MetricHistory.tsx
    │   ├── profile/
    │   │   ├── ProfileHeader.tsx
    │   │   ├── ProfileEditor.tsx
    │   │   └── SettingsList.tsx
    │   └── ui/
    │       ├── SearchBar.tsx
    │       ├── TimePicker.tsx
    │       └── StatusBadge.tsx
    ├── store/                        # Zustand stores
    │   ├── useOnboardingStore.ts     # Onboarding state
    │   ├── useAuthStore.ts           # Auth state
    │   ├── useUserStore.ts           # User profile state
    │   └── useAppStore.ts            # App-wide state
    ├── navigation/                   # Navigation setup
    │   ├── RootNavigator.tsx
    │   ├── AuthNavigator.tsx
    │   ├── DashboardNavigator.tsx
    │   ├── TabNavigator.tsx
    │   └── linking.ts
    ├── screens/                      # Screen components
    │   ├── auth/
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   └── ForgotPasswordScreen.tsx
    │   ├── onboarding/
    │   │   └── OnboardingScreen.tsx
    │   ├── dashboard/
    │   │   ├── HomeScreen.tsx
    │   │   ├── PlanScreen.tsx
    │   │   ├── GroceryScreen.tsx
    │   │   ├── MenuScanScreen.tsx
    │   │   ├── MetricsScreen.tsx
    │   │   └── ProfileScreen.tsx
    │   └── subscription/
    │       └── SubscriptionScreen.tsx
    ├── lib/                          # Utilities & logic
    │   ├── dietary/
    │   │   ├── conflictEngine.ts     # Reuse from web
    │   │   ├── additives.ts          # Reuse from web
    │   │   └── toxicity.ts           # Reuse from web
    │   ├── auth-actions.ts
    │   ├── mealUtils.ts
    │   └── constants.ts
    ├── hooks/                        # Custom hooks
    │   ├── useAuth.ts
    │   ├── usePlans.ts
    │   ├── useFoodAnalysis.ts
    │   ├── useMetrics.ts
    │   └── useCamera.ts
    ├── services/                     # Native services
    │   ├── notificationService.ts    # Push notifications
    │   ├── biometricService.ts       # Face ID / Touch ID
    │   ├── deepLinkService.ts        # Deep linking
    │   └── offlineService.ts         # Offline support
    ├── types/                        # TypeScript types
    │   ├── auth.ts
    │   ├── user.ts
    │   ├── plan.ts
    │   ├── food.ts
    │   └── index.ts
    ├── theme/                        # Theme configuration
    │   ├── colors.ts
    │   ├── typography.ts
    │   └── spacing.ts
    └── utils/                        # Helper functions
        ├── formatters.ts
        ├── validators.ts
        └── dateHelpers.ts
```

---

## 3. Feature Implementation Tasks

### Phase 1: Foundation & Setup (Week 1-2)

#### Task 1.1: Project Initialization
- [ ] Initialize Expo project with TypeScript
- [ ] Configure package.json with all dependencies
- [ ] Set up tsconfig.json
- [ ] Configure metro.config.js
- [ ] Set up EAS for deployment
- [ ] Create directory structure
- [ ] Configure environment variables (.env file)

#### Task 1.2: Navigation Setup
- [ ] Install React Navigation packages
- [ ] Create RootNavigator with authentication flow
- [ ] Implement AuthNavigator (login, register, forgot password)
- [ ] Implement DashboardNavigator (tab-based navigation)
- [ ] Configure linking for deep links
- [ ] Test navigation transitions

#### Task 1.3: API Client Setup
- [ ] Create Axios instance with base URL
- [ ] Configure request/response interceptors
- [ ] Implement session management (cookies)
- [ ] Create API client modules matching web frontend
- [ ] Set up error handling
- [ ] Test API connectivity with backend

#### Task 1.4: State Management Setup
- [ ] Install and configure Zustand
- [ ] Create useAuthStore for authentication state
- [ ] Create useOnboardingStore (reuse web logic)
- [ ] Create useUserStore for user profile
- [ ] Create useAppStore for app-wide state
- [ ] Test state persistence with AsyncStorage

#### Task 1.5: Theme & UI Foundation
- [ ] Create color palette (matching web design)
- [ ] Set up typography system
- [ ] Configure NativeWind for Tailwind styling
- [ ] Create base components (Button, Card, Input, Modal)
- [ ] Set up animation library (Reanimated)
- [ ] Design bottom navigation dock component

---

### Phase 2: Authentication (Week 3)

#### Task 2.1: Login Flow
- [ ] Create LoginScreen with email/password inputs
- [ ] Implement form validation
- [ ] Integrate with API client (POST /api/auth/login)
- [ ] Handle successful authentication and store session
- [ ] Add error handling and display error messages
- [ ] Implement "Remember Me" functionality

#### Task 2.2: Registration Flow
- [ ] Create RegisterScreen with email/password fields
- [ ] Implement password strength validation
- [ ] Add confirm password field
- [ ] Integrate with API client (POST /api/auth/register)
- [ ] Handle registration success and auto-login
- [ ] Add terms of service checkbox

#### Task 2.3: OAuth Integration
- [ ] Implement Google OAuth (using expo-auth-session)
- [ ] Configure deep linking for OAuth callbacks
- [ ] Handle OAuth success/failure
- [ ] Merge OAuth user with existing account if needed
- [ ] Test OAuth flow end-to-end

#### Task 2.4: Session Management
- [ ] Implement session restoration on app launch
- [ ] Add session refresh logic
- [ ] Handle session expiration
- [ ] Implement logout functionality
- [ ] Secure token storage with expo-secure-store

#### Task 2.5: Biometric Authentication
- [ ] Implement Face ID / Touch ID prompt
- [ ] Enable biometric unlock option in settings
- [ ] Store biometric preference
- [ ] Handle biometric errors gracefully
- [ ] Test on iOS and Android

---

### Phase 3: Onboarding Flow (Week 4)

#### Task 3.1: Onboarding Framework
- [ ] Create OnboardingScreen with stepper
- [ ] Implement progress indicator
- [ ] Set up navigation between steps
- [ ] Configure state persistence across steps
- [ ] Add skip option for logged-in users with existing data

#### Task 3.2: Step 1 - Welcome
- [ ] Create WelcomeStep component
- [ ] Name and email input fields
- [ ] App introduction text
- [ ] Next button with validation
- [ ] Save data to Zustand store

#### Task 3.3: Step 2 - Conditions Selection
- [ ] Create ConditionsStep component
- [ ] Display predefined conditions (CKD, T2DM, HTN, PCOS, High Cholesterol)
- [ ] Implement ICD-11 search functionality
- [ ] Display condition cards with icons and descriptions
- [ ] Multi-select support
- [ ] Add custom condition option via ICD-11 API
- [ ] Integrate JIT onboarding endpoint

#### Task 3.4: Step 3 - Biometrics
- [ ] Create BiometricsStep component
- [ ] Height, weight, age, gender inputs
- [ ] Waist measurement field
- [ ] Metric/imperial unit toggle
- [ ] Form validation
- [ ] Save data to store

#### Task 3.5: Step 4 - Medical Information
- [ ] Create MedicalStep component
- [ ] Insulin usage checkbox
- [ ] Medication search interface (FDA RxNorm API)
- [ ] Display medication cards with details
- [ ] Add multiple medications support
- [ ] Show medication warnings and interactions
- [ ] Save medications to store

#### Task 3.6: Step 5 - Dietary Preferences
- [ ] Create DietaryStep component
- [ ] Favorite foods multi-select
- [ ] Disliked foods multi-select
- [ ] Favorite cuisines selection
- [ ] Disliked cuisines selection
- [ ] Save preferences to store

#### Task 3.7: Step 6 - Synthesizing
- [ ] Create SynthesizingStep component
- [ ] Real-time log display
- [ ] Implement backend parallel simulation
- [ ] Call POST /api/users/profile/generate-limits
- [ ] Save profile to backend
- [ ] Generate initial meal plan
- [ ] Navigate to dashboard on completion
- [ ] Add retry logic on failure

---

### Phase 4: Dashboard (Week 5)

#### Task 4.1: Dashboard Layout
- [ ] Create HomeScreen with tab navigation
- [ ] Implement DashboardHeader with user info
- [ ] Add FloatingDock for bottom navigation
- [ ] Configure tab icons (Home, Plan, Grocery, Scan, Profile)
- [ ] Add pull-to-refresh functionality

#### Task 4.2: Timeline Feed
- [ ] Create TimelineFeed component
- [ ] Display today's meals chronologically
- [ ] Show meal status (pending, completed, skipped)
- [ ] Add tap to mark meal as eaten
- [ ] Display nutrition summary
- [ ] Implement time-based ordering

#### Task 4.3: Stats Cards
- [ ] Create StatsCard component
- [ ] Display daily calorie progress
- [ ] Show key nutrition metrics (sodium, carbs, protein)
- [ ] Add visual progress indicators
- [ ] Implement card tap for details

#### Task 4.4: Quick Actions
- [ ] Add "Generate Plan" button
- [ ] Implement "Log Metric" quick action
- [ ] Add "Scan Menu" shortcut
- [ ] Create "Add to Grocery" button

#### Task 4.5: Empty States
- [ ] Design empty state for no plan
- [ ] Add CTA to generate plan
- [ ] Create loading skeleton states
- [ ] Handle network errors gracefully

---

### Phase 5: Meal Planning (Week 6)

#### Task 5.1: Plan View Component
- [ ] Create PlanView component
- [ ] Display breakfast, lunch, dinner sections
- [ ] Show meal cards with images
- [ ] Display nutrition information per meal
- [ ] Add meal status indicators
- [ ] Implement date picker for viewing different days

#### Task 5.2: Meal Card Component
- [ ] Create MealCard with recipe image
- [ ] Display recipe name and category
- [ ] Show nutrition summary (calories, macros)
- [ ] Add status badge (pending, completed, skipped, swapped)
- [ ] Implement tap for recipe details
- [ ] Add swipe actions (mark eaten, skip, swap)

#### Task 5.3: Plan Generation
- [ ] Implement "Generate Plan" button
- [ ] Call POST /api/plans/generate
- [ ] Show loading animation during generation
- [ ] Handle plan exists for date
- [ ] Display success message
- [ ] Add retry logic on failure

#### Task 5.4: Meal Status Management
- [ ] Implement meal status update (PATCH /api/plans/:id/status)
- [ ] Create status confirmation dialog
- [ ] Update UI to reflect status changes
- [ ] Add visual feedback for status updates
- [ ] Sync status with backend

#### Task 5.5: Meal Swap Functionality
- [ ] Implement swap button on meal card
- [ ] Call POST /api/plans/:id/meals/:type/swap
- [ ] Display new meal options
- [ ] Show swap confirmation
- [ ] Update plan with new meal
- [ ] Animate transition between meals

#### Task 5.6: Meal Removal
- [ ] Add remove button on meal card
- [ ] Implement DELETE /api/plans/:id/meals/:type
- [ ] Show confirmation dialog
- [ ] Update plan state
- [ ] Display empty state for removed meal

#### Task 5.7: External Meal Addition
- [ ] Create "Add Restaurant Meal" button
- [ ] Implement manual meal entry form
- [ ] Call POST /api/plans/external-meal
- [ ] Validate meal data
- [ ] Add external meal to plan

#### Task 5.8: Recipe Details Modal
- [ ] Create RecipeDetailsModal
- [ ] Display recipe image
- [ ] Show full nutrition breakdown
- [ ] Display ingredients list
- [ ] Show cooking instructions
- [ ] Add "Add to Grocery" button
- [ ] Implement save recipe functionality

#### Task 5.9: Plan Date Navigation
- [ ] Implement date picker component
- [ ] Add previous/next day buttons
- [ ] Cache plan data for viewed dates
- [ ] Implement swipe to change date
- [ ] Show "Today" quick access button

---

### Phase 6: Food Analysis (Week 7)

#### Task 6.1: Food Search Screen
- [ ] Create FoodSearchScreen
- [ ] Implement search bar with autocomplete
- [ ] Add filter dropdown (Brand/Generic)
- [ ] Display search results in list
- [ ] Show loading and error states

#### Task 6.2: Food Analysis Card
- [ ] Create FoodAnalysisCard component
- [ ] Display food name and brand
- [ ] Show food image
- [ ] Display full nutrition panel
- [ ] Implement conflict engine integration
- [ ] Show safety status (Safe/Caution/Avoid)
- [ ] Display reasoning and modifications

#### Task 6.3: Conflict Engine Integration
- [ ] Port conflictEngine.ts from web to mobile
- [ ] Port additives.ts patterns
- [ ] Port toxicity.ts logic
- [ ] Create ConflictIndicator component
- [ ] Implement color coding (green/yellow/red)
- [ ] Display detailed conflict breakdown

#### Task 6.4: Barcode Scanning
- [ ] Implement barcode scanner using expo-barcode-scanner
- [ ] Call GET /api/food/barcode/:code
- [ ] Display product information
- [ ] Show nutrition analysis
- [ ] Handle product not found
- [ ] Add to grocery list option

#### Task 6.5: Nutrition Visualization
- [ ] Create NutritionBadge component
- [ ] Display key nutrients with limits
- [ ] Show progress bars for daily limits
- [ ] Implement color coding for nutrient levels
- [ ] Add expandable details

#### Task 6.6: Food Details Modal
- [ ] Create FoodDetailsModal
- [ ] Display comprehensive nutrition data
- [ ] Show ingredient conflicts
- [ ] Add "Add to Grocery" button
- [ ] Implement share functionality
- [ ] Add "Not for me" option (dislike)

---

### Phase 7: Restaurant Rescue - Menu Scanning (Week 8)

#### Task 7.1: Camera Integration
- [ ] Create CameraView component using expo-camera
- [ ] Implement camera permissions handling
- [ ] Add capture button with focus lock
- [ ] Implement flash toggle
- [ ] Show camera guide overlay
- [ ] Handle camera errors

#### Task 7.2: Image Processing
- [ ] Implement image capture handler
- [ ] Convert image to base64
- [ ] Compress image for upload
- [ ] Show image preview before upload
- [ ] Add retake option

#### Task 7.3: Menu Scan API Integration
- [ ] Call POST /api/menu/scan with image
- [ ] Handle loading state with animation
- [ ] Implement timeout handling
- [ ] Add retry logic on failure
- [ ] Display error messages

#### Task 7.4: Menu Results Display
- [ ] Create MenuResults component
- [ ] Display analyzed menu items
- [ ] Show status badges (SAFE/CAUTION/AVOID)
- [ ] Display reasoning for each item
- [ ] Show modification suggestions
- [ ] Implement tap for item details

#### Task 7.5: Menu Item Details
- [ ] Create MenuItemDetail component
- [ ] Show full analysis
- [ ] Display suggested modifications
- [ ] Add "Mark as eaten" button
- [ ] Implement save for later
- [ ] Add share option

#### Task 7.6: Image Gallery Integration
- [ ] Add option to upload from gallery
- [ ] Use expo-image-picker
- [ ] Handle multiple images
- [ ] Implement image cropping
- [ ] Optimize image size

#### Task 7.7: Menu History
- [ ] Save scanned menus to history
- [ ] Create MenuHistoryScreen
- [ ] Display previous scans with dates
- [ ] Allow re-analysis of saved menus
- [ ] Implement delete history

---

### Phase 8: Grocery List (Week 9)

#### Task 8.1: Grocery List Screen
- [ ] Create GroceryScreen
- [ ] Fetch grocery list (GET /api/grocery)
- [ ] Display items organized by category
- [ ] Show checked/unchecked state
- [ ] Implement pull-to-refresh

#### Task 8.2: Grocery Item Component
- [ ] Create GroceryItem component
- [ ] Display item name and category
- [ ] Implement checkbox for check/uncheck
- [ ] Add delete button (swipe or long press)
- [ ] Show item count

#### Task 8.3: Add Item Functionality
- [ ] Create AddItemModal
- [ ] Implement text input for new items
- [ ] Add category selector
- [ ] Call POST /api/grocery
- [ ] Validate input
- [ ] Show success feedback

#### Task 8.4: Item Management
- [ ] Implement PATCH /api/grocery/:id/toggle
- [ ] Implement DELETE /api/grocery/:id
- [ ] Add swipe-to-delete
- [ ] Implement "Clear All" button
- [ ] Call DELETE /api/grocery/all

#### Task 8.5: Generate from Plan
- [ ] Add "Generate from Plan" button
- [ ] Call POST /api/grocery/ingredients
- [ ] Display ingredient extraction progress
- [ ] Show added items
- [ ] Handle duplicate items

#### Task 8.6: Shopping List Features
- [ ] Implement drag-and-drop reordering
- [ ] Add item notes field
- [ ] Implement quantity tracking
- [ ] Add share list functionality
- [ ] Create print-friendly view

#### Task 8.7: Category Filtering
- [ ] Add category filter dropdown
- [ ] Implement category tabs
- [ ] Show items per category count
- [ ] Filter by checked/unchecked

---

### Phase 9: Health Metrics (Week 10)

#### Task 9.1: Metrics Screen
- [ ] Create MetricsScreen
- [ ] Display metric type selector (Glucose, BP, Weight, Water)
- [ ] Show recent metrics list
- [ ] Implement pull-to-refresh

#### Task 9.2: Metric Logger Component
- [ ] Create MetricLogger component
- [ ] Display input fields based on metric type
- [ ] Add tag selector (Fasting, Post-Meal, Stress)
- [ ] Implement custom tag input
- [ ] Call POST /api/metrics
- [ ] Show success feedback

#### Task 9.3: Glucose Logging
- [ ] Implement glucose input (value1)
- [ ] Add unit selector (mg/dL)
- [ ] Display glucose tag options
- [ ] Show last reading comparison
- [ ] Add trend indicator

#### Task 9.4: Blood Pressure Logging
- [ ] Implement BP input (value1/value2 for systolic/diastolic)
- [ ] Add unit selector (mmHg)
- [ ] Display BP category (Normal, Elevated, Stage 1, Stage 2)
- [ ] Show color-coded result

#### Task 9.5: Weight Logging
- [ ] Implement weight input
- [ ] Add unit toggle (kg/lbs)
- [ ] Display weight trend
- [ ] Show BMI calculation
- [ ] Add weight goal progress

#### Task 9.6: Water Logging
- [ ] Implement water input
- [ ] Add unit selector (ml/oz)
- [ ] Display daily water goal
- [ ] Show cumulative intake
- [ ] Add quick-add buttons (+250ml, +500ml)

#### Task 9.7: Metric History View
- [ ] Create MetricHistory component
- [ ] Display chronological list of logs
- [ ] Show date and time
- [ ] Display tags and values
- [ ] Implement delete option
- [ ] Add edit functionality

#### Task 9.8: Charts and Visualization
- [ ] Implement MetricChart using react-native-chart-kit
- [ ] Create line chart for trends
- [ ] Add bar chart for daily summaries
- [ ] Display time range selector (7 days, 30 days, 90 days)
- [ ] Add data point tap for details

#### Task 9.9: Metric Reminders
- [ ] Create reminder setup
- [ ] Configure notification times
- [ ] Use expo-notifications for alerts
- [ ] Display reminder list
- [ ] Add edit/delete reminders

---

### Phase 10: Profile & Settings (Week 11)

#### Task 10.1: Profile Screen
- [ ] Create ProfileScreen
- [ ] Display user profile header (avatar, name, email)
- [ ] Show account details
- [ ] Display subscription status
- [ ] Add logout button

#### Task 10.2: Profile Editing
- [ ] Create ProfileEditor component
- [ ] Implement editable fields
- [ ] Call PATCH /api/users/profile
- [ ] Add avatar upload
- [ ] Save changes

#### Task 10.3: Nutrition Limits Management
- [ ] Display current nutrition limits
- [ ] Implement GET /api/users/profile/nutrition-limits
- [ ] Create edit modal for limits
- [ ] Call PUT /api/users/profile/nutrition-limits
- [ ] Add regenerate AI limits option
- [ ] Show last generation date

#### Task 10.4: Conditions Management
- [ ] Display user's conditions
- [ ] Add new condition via ICD-11 search
- [ ] Implement condition onboarding
- [ ] Call POST /api/conditions/onboard
- [ ] Show condition details
- [ ] Add remove condition option

#### Task 10.5: Medications Management
- [ ] Display current medications
- [ ] Add new medication via FDA API search
- [ ] Show medication details
- [ ] Edit medication information
- [ ] Remove medication
- [ ] Display interaction warnings

#### Task 10.6: Settings List
- [ ] Create SettingsList component
- [ ] Theme toggle (dark/light)
- [ ] Unit preferences (metric/imperial)
- [ ] Notification settings
- [ ] Privacy settings
- [ ] App version info
- [ ] Terms and privacy policy links

#### Task 10.7: Subscription Management
- [ ] Create SubscriptionScreen
- [ ] Display subscription plans
- [ ] Show current subscription status
- [ ] Implement upgrade flow
- [ ] Manage billing
- [ ] Show invoice history

#### Task 10.8: Account Deletion
- [ ] Add "Delete Account" option
- [ ] Show confirmation dialog
- [ ] Call DELETE /api/users/test-account
- [ ] Confirm deletion
- [ ] Logout and clear data

---

### Phase 11: Notifications & Background Services (Week 12)

#### Task 11.1: Push Notifications Setup
- [ ] Configure expo-notifications
- [ ] Request notification permissions
- [ ] Register for push tokens
- [ ] Test notification delivery

#### Task 11.2: Meal Reminders
- [ ] Create meal reminder system
- [ ] Set reminders for breakfast, lunch, dinner
- [ ] Use meal times from plan
- [ ] Customize reminder times
- [ ] Display notification content
- [ ] Handle notification taps

#### Task 11.3: Metric Logging Reminders
- [ ] Create metric reminder system
- [ ] Set glucose logging reminders
- [ ] Set BP logging reminders
- [ ] Set weight logging reminders
- [ ] Allow custom reminder schedules

#### Task 11.4: Background Sync
- [ ] Implement background data sync
- [ ] Sync when app opens
- [ ] Sync when network changes
- [ ] Handle offline mode
- [ ] Queue failed requests

#### Task 11.5: Offline Support
- [ ] Implement offline detection
- [ ] Cache essential data
- [ ] Queue offline actions
- [ ] Sync on reconnection
- [ ] Show offline indicator

---

### Phase 12: Polish & Optimization (Week 13)

#### Task 12.1: Performance Optimization
- [ ] Implement React Query caching
- [ ] Optimize image loading with caching
- [ ] Add lazy loading for lists
- [ ] Implement virtualization for long lists
- [ ] Optimize bundle size
- [ ] Test on low-end devices

#### Task 12.2: Animations & Transitions
- [ ] Add smooth screen transitions
- [ ] Implement micro-interactions
- [ ] Add loading animations
- [ ] Create success/failure animations
- [ ] Optimize animation performance

#### Task 12.3: Accessibility
- [ ] Add accessibility labels to components
- [ ] Implement screen reader support
- [ ] Add dynamic font scaling
- [ ] Ensure touch targets are adequate
- [ ] Test with VoiceOver and TalkBack

#### Task 12.4: Error Handling
- [ ] Implement global error boundaries
- [ ] Add user-friendly error messages
- [ ] Create error screen components
- [ ] Implement retry logic
- [ ] Log errors for debugging

#### Task 12.5: Internationalization
- [ ] Set up i18n framework
- [ ] Create translation files
- [ ] Implement language selector
- [ ] Test RTL languages
- [ ] Add locale-specific formats

#### Task 12.6: Deep Linking
- [ ] Implement deep link handling
- [ ] Configure URL schemes
- [ ] Handle universal links
- [ ] Test deep links to specific screens
- [ ] Implement deferred deep linking

---

### Phase 13: Testing & Quality Assurance (Week 14)

#### Task 13.1: Unit Testing
- [ ] Set up Jest and React Native Testing Library
- [ ] Write tests for API client
- [ ] Write tests for stores
- [ ] Write tests for utility functions
- [ ] Write tests for hooks

#### Task 13.2: Component Testing
- [ ] Write tests for common components
- [ ] Write tests for screen components
- [ ] Test navigation flows
- [ ] Test user interactions
- [ ] Test state updates

#### Task 13.3: Integration Testing
- [ ] Test onboarding flow end-to-end
- [ ] Test meal generation flow
- [ ] Test food analysis flow
- [ ] Test menu scanning flow
- [ ] Test grocery list operations
- [ ] Test metric logging flow

#### Task 13.4: Manual Testing
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test different screen sizes
- [ ] Test different OS versions
- [ ] Test network conditions

#### Task 13.5: Edge Cases
- [ ] Test with no network
- [ ] Test with slow network
- [ ] Test with large data sets
- [ ] Test with invalid data
- [ ] Test concurrent operations

#### Task 13.6: User Acceptance Testing
- [ ] Create testing scenarios
- [ ] Recruit beta testers
- [ ] Collect feedback
- [ ] Identify bugs
- [ ] Prioritize fixes

---

### Phase 14: Deployment (Week 15)

#### Task 14.1: Build Configuration
- [ ] Configure EAS build for iOS
- [ ] Configure EAS build for Android
- [ ] Set up app icons and splash screens
- [ ] Configure app signing
- [ ] Set up versioning

#### Task 14.2: App Store Submission
- [ ] Create App Store Connect listing
- [ ] Prepare screenshots
- [ ] Write app description
- [ ] Set up privacy policy URL
- [ ] Submit to TestFlight
- [ ] Address review feedback

#### Task 14.3: Play Store Submission
- [ ] Create Google Play Console listing
- [ ] Prepare screenshots and promotional art
- [ ] Write store listing
- [ ] Set up content rating
- [ ] Submit to internal testing
- [ ] Submit to closed testing
- [ ] Submit to production

#### Task 14.4: Monitoring & Analytics
- [ ] Implement analytics (Mixpanel or Firebase)
- [ ] Set up crash reporting (Sentry)
- [ ] Set up performance monitoring
- [ ] Create dashboards
- [ ] Set up alerts

---

## 4. Key Differences from Web Frontend

### Mobile-Specific Enhancements

1. **Native Camera Integration**
   - Built-in barcode scanning for food products
   - Enhanced menu scanning with camera controls
   - Image gallery integration

2. **Biometric Authentication**
   - Face ID / Touch ID unlock
   - Secure token storage

3. **Push Notifications**
   - Meal time reminders
   - Metric logging reminders
   - Plan generation notifications

4. **Offline Support**
   - Cache critical data locally
   - Queue offline operations
   - Sync on reconnection

5. **Native Gestures**
   - Swipe actions on lists
   - Pull-to-refresh
   - Long-press menus

6. **Haptic Feedback**
   - Confirmation vibrations
   - Error feedback
   - Success notifications

7. **Device-Specific Features**
   - Location-aware restaurant suggestions
   - Calendar integration for meal plans
   - HealthKit / Google Fit integration

---

## 5. Development Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Foundation & Setup | 2 weeks | Project scaffolded, navigation, API client, stores |
| Authentication | 1 week | Login, registration, OAuth, session management |
| Onboarding Flow | 1 week | Complete 6-step onboarding |
| Dashboard | 1 week | Home screen, timeline, quick actions |
| Meal Planning | 1 week | Plan view, meal cards, swap, status management |
| Food Analysis | 1 week | Food search, barcode scanning, conflict engine |
| Menu Scanning | 1 week | Camera integration, AI analysis, results display |
| Grocery List | 1 week | List management, generate from plan |
| Health Metrics | 1 week | Metric logging, history, charts |
| Profile & Settings | 1 week | Profile editing, subscription, settings |
| Notifications | 1 week | Push notifications, reminders, background sync |
| Polish & Optimization | 1 week | Performance, animations, accessibility |
| Testing | 1 week | Unit tests, integration tests, manual testing |
| Deployment | 1 week | App Store, Play Store submission |

**Total Duration:** 15 weeks (approximately 3.5 months)

---

## 6. Risk Mitigation

### Technical Risks
- **Camera permissions:** Test early on both platforms
- **API compatibility:** Ensure backend API is mobile-friendly (no SSR dependencies)
- **Bundle size:** Implement code splitting and lazy loading
- **Performance:** Test on low-end devices throughout development

### Resource Risks
- **Developer availability:** Plan buffer time for each phase
- **Knowledge gaps:** Document API integrations thoroughly
- **Testing devices:** Ensure access to both iOS and Android devices

### User Experience Risks
- **Onboarding friction:** Keep steps concise and engaging
- **Learning curve:** Use familiar mobile patterns
- **Accessibility:** Test with screen readers early

---

## 7. Success Criteria

- [ ] All core features from web frontend implemented
- [ ] Native features (camera, biometrics, notifications) working
- [ ] Passes all integration tests
- [ ] Performs well on entry-level devices
- [ ] Rated 4.5+ on app stores after launch
- [ ] <5% crash rate in production
- [ ] 95%+ API success rate

---

## 8. Backend API Endpoints Reference

### Base URL: `http://localhost:3001/api`

The React Native app will consume these endpoints without modification:

- **Authentication:** POST /auth/login, POST /auth/register, POST /auth/sign-out, GET /auth/session
- **Users:** GET /users/profile, PATCH /users/profile, DELETE /users/test-account, GET /users/profile/nutrition-limits, PUT /users/profile/nutrition-limits, POST /users/profile/generate-limits
- **Plans:** GET /plans/daily, POST /plans/generate, PATCH /plans/:id/status, DELETE /plans/daily, POST /plans/external-meal, POST /plans/:id/meals/:type/swap, DELETE /plans/:id/meals/:type, PATCH /plans/:id
- **Food:** GET /food/analyze, GET /food/search, GET /food/barcode/:code
- **Menu:** POST /menu/scan
- **Grocery:** GET /grocery, POST /grocery, PATCH /grocery/:id/toggle, DELETE /grocery/:id, DELETE /grocery/all, POST /grocery/seed, POST /grocery/ingredients, POST /grocery/generate
- **Conditions:** GET /conditions, GET /conditions/search, POST /conditions/onboard
- **Metrics:** POST /metrics, GET /metrics
- **Drugs:** GET /drugs/search, GET /drugs/details
- **Products:** GET /products, GET /products/:id

All endpoints use HTTP-only cookies for session management and return JSON responses.

---

## 9. Environment Variables

```bash
# Backend API URL (configurable for different environments)
API_BASE_URL="http://localhost:3001/api"

# Optional: Feature flags
ENABLE_BIOMETRICS=true
ENABLE_NOTIFICATIONS=true
ENABLE_OFFLINE_MODE=true
```
