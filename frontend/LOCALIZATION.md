# Localization (i18n) Documentation

## Overview
QueueLanka's service center listing UI now supports multiple languages, enabling citizens to view service center information in their preferred language.

## Supported Languages
- **English (en)** - Default language
- **Sinhala (සිංහල) (si)** - Native language support
- **Tamil (தமிழ்) (ta)** - Native language support

## Implementation Details

### Libraries Used
- **i18next**: Core internationalization framework
- **react-i18next**: React bindings for i18next
- **i18next-browser-languagedetector**: Automatic language detection from browser settings

### File Structure
```
frontend/src/
├── i18n/
│   ├── config.ts           # i18n configuration
│   └── locales/
│       ├── en.json         # English translations
│       ├── si.json         # Sinhala translations
│       └── ta.json         # Tamil translations
└── components/
    └── common/
        └── LanguageSelector.tsx  # Language switcher component
```

## Features

### 1. Automatic Language Detection
The system automatically detects the user's preferred language from:
- Previously selected language (stored in localStorage)
- Browser language settings

### 2. Language Persistence
The selected language is stored in `localStorage` under the key `i18nextLng` and persists across sessions.

### 3. Language Selector
A dropdown component allows users to switch between languages in real-time without page reload.

### 4. Fallback Support
If a translation is missing in the selected language, the system falls back to English.

## Usage

### Using Translations in Components
```tsx
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('serviceCenters.title')}</h1>
      <p>{t('serviceCenters.subtitle')}</p>
    </div>
  );
}
```

### Translation Keys with Variables
```tsx
// Translation with interpolation
{t('serviceCenters.noResultsFilter', { filter: 'available' })}
```

### Adding the Language Selector
```tsx
import LanguageSelector from '../components/common/LanguageSelector';

<LanguageSelector />
```

## Translation Keys

### Common Translations
```
common.appName         - Application name
common.signOut         - Sign out button
common.retry           - Retry button
common.loading         - Loading message
common.error           - Error message
```

### Service Centers Translations
```
serviceCenters.title                  - Page title
serviceCenters.subtitle               - Page subtitle
serviceCenters.filters.allCenters     - All centers filter
serviceCenters.filters.available      - Available filter
serviceCenters.filters.unavailable    - Unavailable filter
serviceCenters.loading                - Loading message
serviceCenters.errorLoading           - Error loading message
serviceCenters.noResults              - No results message
serviceCenters.noResultsFilter        - No results with filter
serviceCenters.noResultsGeneric       - Generic no results
```

### Service Center Card Translations
```
serviceCenterCard.available      - Available status
serviceCenterCard.unavailable    - Unavailable status
serviceCenterCard.hours          - Hours label
serviceCenterCard.capacity       - Capacity label
serviceCenterCard.viewDetails    - View details button
```

## Adding New Translations

### 1. Add to Translation Files
Update all three language files (`en.json`, `si.json`, `ta.json`):

**en.json:**
```json
{
  "myFeature": {
    "newKey": "New text in English"
  }
}
```

**si.json:**
```json
{
  "myFeature": {
    "newKey": "සිංහල පරිවර්තනය"
  }
}
```

**ta.json:**
```json
{
  "myFeature": {
    "newKey": "தமிழ் மொழிபெயர்ப்பு"
  }
}
```

### 2. Use in Components
```tsx
{t('myFeature.newKey')}
```

## Adding New Languages

### 1. Create Translation File
Create a new JSON file in `src/i18n/locales/`:
```
src/i18n/locales/fr.json  # For French
```

### 2. Update i18n Config
Edit `src/i18n/config.ts`:
```typescript
import frTranslations from './locales/fr.json';

const resources = {
  en: { translation: enTranslations },
  si: { translation: siTranslations },
  ta: { translation: taTranslations },
  fr: { translation: frTranslations }  // Add new language
};
```

### 3. Update Language Selector
Edit `src/components/common/LanguageSelector.tsx`:
```typescript
const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'fr', name: 'French', nativeName: 'Français' }  // Add new language
];
```

## Testing

### Manual Testing
1. Navigate to the Service Centers page
2. Use the language selector dropdown in the navigation bar
3. Select different languages and verify:
   - All static text changes to the selected language
   - Language preference persists on page reload
   - No console errors

### Programmatic Language Change
```typescript
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();
i18n.changeLanguage('si'); // Change to Sinhala
```

## Best Practices

1. **Always use translation keys** - Never hardcode UI text
2. **Provide context in keys** - Use nested keys like `page.section.element`
3. **Keep translations consistent** - Use the same terms across the app
4. **Test all languages** - Verify translations make sense in context
5. **Handle pluralization** - Use i18next's pluralization features when needed
6. **RTL support** - Consider right-to-left languages if needed in the future

## Configuration Options

### Debug Mode
Enable debug mode in development to see missing translations:
```typescript
// In src/i18n/config.ts
.init({
  debug: true,  // Set to true for development
  // ...
});
```

### Change Fallback Language
```typescript
.init({
  fallbackLng: 'en',  // Change default fallback
  // ...
});
```

## Troubleshooting

### Translations Not Appearing
1. Check browser console for errors
2. Verify translation key exists in JSON files
3. Ensure i18n config is imported in `main.tsx`
4. Clear localStorage and reload page

### Language Not Persisting
1. Check browser localStorage for `i18nextLng` key
2. Ensure browser allows localStorage
3. Verify LanguageDetector is configured correctly

### Missing Translations
1. Check all language files have the same keys
2. Enable debug mode to log missing keys
3. Fallback language will be used automatically

## Future Enhancements
- Add more languages (French, Hindi, etc.)
- Implement right-to-left (RTL) support for Arabic/Hebrew
- Add date/time localization
- Implement number formatting based on locale
- Add language-specific API responses

## Acceptance Criteria ✅
- ✅ Localization support implemented for service center listing UI
- ✅ All static content is translatable
- ✅ All dynamic content is translatable
- ✅ Users can select their preferred language via dropdown selector
- ✅ Language preference persists across sessions
- ✅ Supports English, Sinhala, and Tamil languages
