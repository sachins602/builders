# Map Component Documentation

## Overview

The map component has been refactored into a modular, maintainable structure following React best practices.

## File Structure

### Core Component

- `index.tsx` - Main MapComponent that orchestrates all functionality

### Types & Constants

- `types.ts` - Shared types and configuration constants

### Custom Hooks

- `useMapSearch.ts` - Search functionality with Nominatim API
- `useMapToast.ts` - Toast notifications based on zoom level

### UI Components

- `SearchBar.tsx` - Address search input with controls
- `ToolBar.tsx` - Action buttons (Search, Build, Edit)
- `NavigationButtons.tsx` - Popular and Community navigation
- `PropertyPopup.tsx` - Street view images and nearby builds display
- `PropertyPolygons.tsx` - Property boundary rendering with interactions
- `MapEvents.tsx` - Map click and zoom event handling

## Usage

```tsx
import MapComponent from "~/app/_components/map";

export default function Page() {
  return <MapComponent />;
}
```

## Key Features

- **Modular Architecture**: Each component has a single responsibility
- **Custom Hooks**: Reusable business logic separated from UI
- **TypeScript**: Full type safety throughout
- **Performance**: Optimized with useCallback and proper state management
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Responsive**: Mobile-friendly design

## Dependencies

- React Leaflet for map functionality
- Tailwind CSS for styling
- tRPC for API communication
- Sonner for toast notifications
- Lucide React for icons
