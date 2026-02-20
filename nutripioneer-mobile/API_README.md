# NutriPioneer Mobile - API Client Setup

This API client provides access to all NutriPioneer backend endpoints in the React Native mobile app.

## Setup

1. **Environment Configuration**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Set your API URL:
   ```
   EXPO_PUBLIC_API_URL=https://api.nutripioneer.com
   ```

2. **Dependencies**
   
   The following dependencies are already installed:
   - `axios` - HTTP client
   - `@react-native-async-storage/async-storage` - Local storage for auth tokens

## Usage

### Import the API client

```typescript
import { api } from '../lib';
import { handleLogin, handleLogout, authService } from '../lib';
import { User, Plan, Recipe } from '../types/api';
```

### Authentication

```typescript
// Login
const login = async (email: string, password: string) => {
    try {
        const response = await api.auth.login({ email, password });
        const user = await handleLogin(response.data);
        console.log('Logged in:', user);
    } catch (error) {
        console.error('Login failed:', error);
    }
};

// Register
const register = async (email: string, password: string, name: string) => {
    try {
        const response = await api.auth.register({ email, password, name });
        const user = await handleLogin(response.data);
        console.log('Registered:', user);
    } catch (error) {
        console.error('Registration failed:', error);
    }
};

// Logout
const logout = async () => {
    try {
        await api.auth.logout();
        await handleLogout();
    } catch (error) {
        console.error('Logout failed:', error);
    }
};

// Check authentication status
const checkAuth = async () => {
    const authenticated = await authService.isAuthenticated();
    const user = await authService.getUser();
    console.log('Authenticated:', authenticated, 'User:', user);
};
```

### User Profile

```typescript
// Get profile
const profile = await api.user.getProfile();

// Update profile
await api.user.updateProfile({
    name: 'John Doe',
    age: 35,
});

// Update preferences
await api.user.updatePreferences({
    theme: 'dark',
    notifications: true,
});

// Get nutrition limits
const limits = await api.user.getNutritionLimits();

// Update nutrition limits
await api.user.updateNutritionLimits({
    daily_calories: { min: 1800, max: 2200, label: 'Calories' },
    nutrients: {
        NA: { max: 2300, label: 'Sodium', unit: 'mg' },
    },
});

// Generate AI nutrition limits (60s timeout)
await api.user.generateNutritionLimits();
```

### Meal Plans

```typescript
// Get daily plan
const plan: Plan = (await api.plans.getDaily('2024-01-15')).data;

// Generate plan for date
await api.plans.generate('2024-01-15');

// Update meal status
await api.plans.updateStatus('plan-id', 'breakfast', 'COMPLETED');

// Update plan
await api.plans.update('plan-id', { breakfastTime: '09:00' });

// Delete plan
await api.plans.delete('2024-01-15');

// Add external/restaurant meal
await api.plans.addExternalMeal({
    date: '2024-01-15',
    type: 'lunch',
    name: 'Grilled Chicken Salad',
    restaurantName: 'Cafe Healthy',
});

// Swap meal
await api.meals.swap('plan-id', 'breakfast');

// Remove meal
await api.plans.removeMeal('plan-id', 'dinner');
```

### Food Analysis

```typescript
// Analyze food
const analysis = (await api.food.analyze('chicken breast', 'Generic')).data;

// Search food
const results = (await api.food.search('salmon', 'Brand')).data;

// Barcode scan
const product = (await api.food.analyzeBarcode('0123456789012')).data;
```

### Menu Scanning (Restaurant Rescue)

```typescript
// Scan menu image
const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
    });

    if (!result.canceled) {
        const scanResult = (await api.menu.scan(result.assets[0])).data;
        console.log('Menu analysis:', scanResult);
    }
};
```

### Grocery List

```typescript
// Get grocery list
const items = (await api.grocery.list()).data;

// Add item
await api.grocery.add('Milk');

// Toggle item
await api.grocery.toggle('item-id', true);

// Remove item
await api.grocery.remove('item-id');

// Clear list
await api.grocery.clear();

// Seed sample items
await api.grocery.seed();

// Add ingredients from plan
await api.grocery.addIngredients(['Chicken', 'Rice', 'Broccoli']);

// Generate shopping list
await api.grocery.generateShoppingList([
    { name: 'Chicken', quantity: 2 },
    { name: 'Rice', quantity: 1 },
]);
```

### Conditions

```typescript
// List conditions
const conditions = (await api.conditions.list()).data;

// Search conditions (ICD-11)
const results = (await api.conditions.search('diabetes')).data;

// Onboard new condition
await api.conditions.onboard({
    icdCode: '5A11',
    title: 'Type 2 diabetes mellitus',
    uri: 'http://id.who.int/icd/entity/5A11',
    description: '...',
});

// Get condition by ID
const condition = (await api.conditions.getById('condition-id')).data;
```

### Health Metrics

```typescript
// Log metric
await api.metrics.log({
    type: 'GLUCOSE',
    value1: 120,
    tag: 'Fasting',
});

// Log blood pressure
await api.metrics.log({
    type: 'BP',
    value1: 120,
    value2: 80,
    tag: 'Morning',
});

// Get metric history
const history = (await api.metrics.history()).data;
```

### Drugs/Medications

```typescript
// Search drugs
const results = (await api.drugs.search('metformin')).data;

// Get drug details
const details = (await api.drugs.details('Metformin', '123456')).data;
```

### Products

```typescript
// List products
const products = (await api.products.list()).data;

// Get product details
const product = (await api.products.get('product-id')).data;
```

### Feedback

```typescript
// Submit feedback
await api.feedback.submit({
    rating: 5,
    message: 'Great app!',
});
```

## Type Safety

All API responses are fully typed. Import types from `../types/api`:

```typescript
import { 
    User, 
    Plan, 
    Recipe, 
    GroceryItem, 
    MetricLog,
    Condition,
    FoodAnalysis,
    MenuScanResult,
    DrugInfo,
    NutritionLimits,
} from '../types/api';
```

## Error Handling

All API calls can throw errors. Always wrap in try-catch:

```typescript
try {
    const profile = await api.user.getProfile();
    console.log(profile.data);
} catch (error) {
    if (axios.isAxiosError(error)) {
        console.error('API Error:', error.response?.data?.message);
    } else {
        console.error('Unexpected error:', error);
    }
}
```

## Interceptors

The API client includes automatic interceptors for:
- **Request**: Adds auth token to all requests
- **Response**: Handles 401 errors and clears auth tokens

## Token Management

Auth tokens are automatically managed by AsyncStorage:
- Stored after login
- Automatically included in requests
- Cleared on logout or 401 errors

Access tokens manually if needed:

```typescript
import { authService } from '../lib';

const token = await authService.getToken();
const user = await authService.getUser();
await authService.clearAuth();
```
