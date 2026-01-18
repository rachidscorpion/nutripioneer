'use server'

export async function getFreeGroceryStores(lat: number, lng: number, radius: number = 3, unit: 'km' | 'mi' = 'km') {
    // Overpass QL Query
    // We look for nodes/ways with shop=supermarket OR shop=convenience within the specified radius
    // [out:json]; determines the output format.

    const radiusInMeters = Math.round(unit === 'mi' ? radius * 1609.34 : radius * 1000);

    const query = `
    [out:json];
    (
      node["shop"="supermarket"](around:${radiusInMeters}, ${lat}, ${lng});
      way["shop"="supermarket"](around:${radiusInMeters}, ${lat}, ${lng});
    );
    out center;
  `;

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            // Add a user agent as per OSM policy
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'MyNextGroceryApp/1.0'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch from Overpass API');
        }

        const data = await response.json();
        return { success: true, elements: data.elements || [] };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to fetch stores' };
    }
}
