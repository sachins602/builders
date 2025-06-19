# Enhanced Property Boundary Detection

This system provides accurate property boundary detection using multiple data sources with intelligent fallbacks.

## How It Works

When a user clicks on the map, the system attempts to get property boundaries from multiple sources in order of preference:

### 1. OpenStreetMap (OSM) - **Primary Source** 🟢

- **Accuracy**: High
- **Coverage**: Excellent for buildings in urban areas
- **Data Quality**: Community-maintained, very detailed
- **API**: Overpass API (free)
- **What we get**: Exact building footprints, property types, addresses

### 2. Toronto Open Data - **Secondary Source** 🔵

- **Accuracy**: High (official government data)
- **Coverage**: Toronto only
- **Data Quality**: Authoritative
- **API**: Toronto Open Data API (free)
- **What we get**: Official property parcels, land use

### 3. Google Maps - **Tertiary Source** 🟠

- **Accuracy**: Medium
- **Coverage**: Global
- **Data Quality**: Good but generalized
- **API**: Google Geocoding API (paid)
- **What we get**: Property bounds from geocoding

### 4. Fallback Buffer - **Last Resort** 🔴

- **Accuracy**: Low
- **Coverage**: Universal
- **Data Quality**: Estimated
- **Method**: Creates reasonable building-sized boundary

## Database Schema

The enhanced property data is stored with these new fields:

```sql
-- Enhanced property boundary data
osmBuildingId         -- OSM building ID (way/relation)
osmBuildingGeometry   -- OSM building boundary geometry
propertyBoundary      -- Property parcel boundary (GeoJSON)
boundarySource        -- 'osm' | 'toronto_open_data' | 'google' | 'fallback'
boundaryAccuracy      -- 'high' | 'medium' | 'low'

-- Additional property details
propertyType          -- residential, commercial, industrial, etc.
buildingType          -- house, apartment, office, etc.
lotArea              -- Property lot area in square meters
buildingArea         -- Building footprint area in square meters
```

## Visual Indicators

Properties are color-coded on the map based on data source:

- 🟢 **Green**: OpenStreetMap (high accuracy)
- 🔵 **Blue**: Toronto Open Data (official)
- 🟠 **Orange**: Google Maps (medium accuracy)
- 🔴 **Red**: Fallback/estimated boundaries

## API Usage

### Getting Property Boundaries

```typescript
import { getPropertyBoundary } from "~/lib/propertyBoundaryService";

const boundary = await getPropertyBoundary(lat, lng);
console.log(`Source: ${boundary.source}`);
console.log(`Accuracy: ${boundary.accuracy}`);
console.log(`Building Type: ${boundary.properties.buildingType}`);
```

### Enhanced Parcel Data Query

```typescript
const parcels = api.response.getEnhancedParcelData.useQuery();
// Returns parcels with parsed boundary geometries
```

## Free vs Paid Solutions

### Free Solutions Used:

- ✅ **OpenStreetMap Overpass API**: Unlimited use, most detailed building data
- ✅ **Toronto Open Data API**: Official city data, free access
- ❌ **Google Geocoding API**: Requires API key, usage costs

### Alternative Free Solutions:

- **Nominatim**: OSM-based geocoding (could replace Google for addresses)
- **MapBox**: Has a generous free tier
- **HERE**: Free tier available

## Performance Considerations

1. **Caching**: Boundary data is cached in the database
2. **Fallbacks**: Fast fallback to simpler boundaries if APIs fail
3. **Rate Limits**: Overpass API has usage limits for heavy usage
4. **Offline Support**: Cached data works offline

## Examples

### Residential Property (OSM)

```json
{
  "geometry": { "type": "Polygon", "coordinates": [...] },
  "source": "osm",
  "accuracy": "high",
  "properties": {
    "osmId": "67104773",
    "buildingType": "house",
    "propertyType": "residential",
    "buildingArea": 150.5,
    "address": "123 Main St, Toronto"
  }
}
```

### Commercial Building (Google)

```json
{
  "geometry": { "type": "Polygon", "coordinates": [...] },
  "source": "google",
  "accuracy": "medium",
  "properties": {
    "placeId": "ChIJ...",
    "propertyType": "commercial",
    "address": "456 Business Ave, Toronto"
  }
}
```

## Future Enhancements

1. **Additional Sources**:

   - Provincial property databases
   - Municipal assessment data
   - Satellite imagery analysis

2. **Improved Accuracy**:

   - Machine learning for boundary detection
   - User feedback for corrections
   - Historical data comparison

3. **Performance**:
   - Pre-cache boundaries for high-traffic areas
   - Serverless boundary detection
   - Real-time boundary updates

## Troubleshooting

### Common Issues

1. **No OSM data found**: Rural areas may not have detailed building data
2. **API rate limits**: Use caching and implement backoff strategies
3. **Coordinate system mismatches**: Ensure consistent lat/lng order

### Debugging

```typescript
// Enable detailed logging
console.log("Using OSM boundary data");
console.log("Using Toronto Open Data");
console.log("Using Google boundary data");
console.log("Using fallback boundary");
```

## Cost Analysis

| Source       | Cost            | Accuracy | Coverage     | Notes                       |
| ------------ | --------------- | -------- | ------------ | --------------------------- |
| OSM          | Free            | High     | Global       | Best for urban buildings    |
| Toronto Data | Free            | High     | Toronto only | Official government data    |
| Google       | ~$0.005/request | Medium   | Global       | Backup for missing OSM data |
| Fallback     | Free            | Low      | Universal    | Always available            |

For ~1000 property lookups/month:

- OSM + Toronto: **$0/month**
- With Google fallback: **~$5/month**

This makes it very cost-effective while providing excellent accuracy!
