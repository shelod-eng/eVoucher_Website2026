'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/common/Header';
import Icon from '@/components/ui/AppIcon';
import {
  findStoresNearMe,
  getStoresByProvince,
  getAllProvinces,
  getAllBrands,
  searchStores,
  formatDistance,
  getDirectionsUrl,
  type StoreLocation,
  type Coordinates,
} from '@/server/services/store-locator';

export default function StoreLocatorPage() {
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationMethod, setLocationMethod] = useState<'gps' | 'ip' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [error, setError] = useState('');

  const provinces = getAllProvinces();
  const brands = getAllBrands();

  const handleFindNearMe = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await findStoresNearMe(20);
      setStores(result.stores);
      setUserLocation(result.userLocation);
      setLocationMethod(result.method);

      if (result.method === 'ip') {
        setError('GPS unavailable. Showing stores based on approximate IP location.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to find stores');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const results = searchStores(searchQuery);
      setStores(results);
      setUserLocation(null);
      setLocationMethod(null);
    }
  };

  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    if (province === 'all') {
      setStores([]);
    } else {
      const results = getStoresByProvince(province);
      setStores(results);
      setUserLocation(null);
      setLocationMethod(null);
    }
  };

  useEffect(() => {
    if (selectedBrand !== 'all') {
      const filtered = stores.filter((store) => store.brand === selectedBrand);
      setStores(filtered);
    }
  }, [selectedBrand]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.16),_transparent_50%),#f4fbfa]">
      <Header />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-headline font-bold text-4xl lg:text-5xl text-foreground mb-3">
              Find Stores Near You
            </h1>
            <p className="text-muted-foreground font-body text-lg">
              Locate stores accepting eVouchers. Use GPS or search by location.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="bg-card rounded-2xl shadow-lg p-6 border border-border mb-8">
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by store name, city, or address..."
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background font-body"
                />
              </div>

              <select
                value={selectedProvince}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className="px-4 py-3 border border-border rounded-lg bg-background font-body"
              >
                <option value="all">All Provinces</option>
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>

              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-4 py-3 border border-border rounded-lg bg-background font-body"
              >
                <option value="all">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleFindNearMe}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-headline font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                <Icon name="MapPinIcon" size={20} variant="solid" />
                {loading ? 'Locating...' : 'Find Stores Near Me'}
              </button>

              <button
                onClick={handleSearch}
                className="px-6 py-3 border border-border rounded-lg font-headline font-semibold hover:bg-muted"
              >
                Search
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning font-body">{error}</p>
              </div>
            )}

            {locationMethod && userLocation && (
              <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm text-success font-body">
                  {locationMethod === 'gps' ? (
                    <>
                      <Icon name="MapPinIcon" size={16} variant="solid" className="inline mr-1" />
                      GPS location detected (accurate)
                    </>
                  ) : (
                    <>
                      <Icon name="GlobeAltIcon" size={16} variant="solid" className="inline mr-1" />
                      Using approximate IP location
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="grid lg:grid-cols-2 gap-6">
            {stores.length === 0 && !loading && (
              <div className="lg:col-span-2 text-center py-12">
                <Icon
                  name="MapPinIcon"
                  size={48}
                  variant="outline"
                  className="text-muted-foreground mx-auto mb-4"
                />
                <p className="text-muted-foreground font-body">
                  Click "Find Stores Near Me" or use the search filters above
                </p>
              </div>
            )}

            {stores.map((store) => (
              <div
                key={store.id}
                className="bg-card rounded-2xl shadow-lg p-6 border border-border hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-headline font-bold text-xl text-foreground mb-1">
                      {store.name}
                    </h3>
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-headline font-semibold rounded-full">
                      {store.brand}
                    </span>
                  </div>
                  {store.distance !== undefined && (
                    <div className="text-right">
                      <p className="text-2xl font-headline font-bold text-primary">
                        {formatDistance(store.distance)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Icon
                      name="MapPinIcon"
                      size={20}
                      variant="outline"
                      className="text-muted-foreground mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm text-foreground font-body">{store.address}</p>
                      <p className="text-sm text-muted-foreground font-body">
                        {store.city}, {store.province}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Icon
                      name="PhoneIcon"
                      size={20}
                      variant="outline"
                      className="text-muted-foreground"
                    />
                    <a
                      href={`tel:${store.phone}`}
                      className="text-sm text-primary font-body hover:underline"
                    >
                      {store.phone}
                    </a>
                  </div>

                  <div className="flex items-start gap-3">
                    <Icon
                      name="ClockIcon"
                      size={20}
                      variant="outline"
                      className="text-muted-foreground mt-0.5 flex-shrink-0"
                    />
                    <p className="text-sm text-muted-foreground font-body">{store.openingHours}</p>
                  </div>

                  {store.acceptsVouchers && (
                    <div className="flex items-center gap-3">
                      <Icon
                        name="CheckCircleIcon"
                        size={20}
                        variant="solid"
                        className="text-success"
                      />
                      <p className="text-sm text-success font-body font-semibold">
                        Accepts eVouchers
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <a
                    href={getDirectionsUrl(store.coordinates, userLocation || undefined)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-headline font-semibold hover:bg-primary/90"
                  >
                    <Icon name="MapIcon" size={20} variant="solid" />
                    Get Directions
                  </a>

                  <a
                    href={`tel:${store.phone}`}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg font-headline font-semibold hover:bg-muted"
                  >
                    <Icon name="PhoneIcon" size={20} variant="outline" />
                    Call
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Info Section */}
          <div className="mt-12 bg-gradient-to-r from-teal-700 to-teal-600 rounded-2xl p-8 text-white">
            <h2 className="font-headline font-bold text-2xl mb-4">About Store Locations</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-headline font-semibold text-lg mb-2">GPS Location</h3>
                <p className="text-sm opacity-90">
                  Click "Find Stores Near Me" to use your device's GPS for accurate results. This
                  requires location permission.
                </p>
              </div>
              <div>
                <h3 className="font-headline font-semibold text-lg mb-2">IP-Based Location</h3>
                <p className="text-sm opacity-90">
                  If GPS is unavailable, we use your IP address to estimate your location. Results
                  may be less accurate.
                </p>
              </div>
              <div>
                <h3 className="font-headline font-semibold text-lg mb-2">
                  Participating Retailers
                </h3>
                <p className="text-sm opacity-90">
                  All listed stores accept eVouchers. Show your voucher code at checkout.
                </p>
              </div>
              <div>
                <h3 className="font-headline font-semibold text-lg mb-2">More Stores Coming</h3>
                <p className="text-sm opacity-90">
                  We're continuously adding more locations. Check back regularly for updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
