export class MemoryLayer {
  constructor() {
    this.store = new Map();
  }

  async getSession(userId) {
    const key = `session:${userId}`;
    const entry = this.store.get(key);
    if (!entry) {
      const fresh = {
        userId,
        preferences: { currency: "USD", language: "en", theme: "dark" },
        tripHistory: [],
        searchHistory: [],
        recommendationProfile: { categories: [], priceRange: { min: 0, max: 1000 } },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.store.set(key, fresh);
      return fresh;
    }
    return entry;
  }

  async updateSession(userId, updates = {}) {
    const session = await this.getSession(userId);
    const merged = {
      ...session,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.store.set(`session:${userId}`, merged);
    return merged;
  }

  async recordSearch(userId, query, context = {}) {
    const session = await this.getSession(userId);
    session.searchHistory.unshift({
      query,
      context,
      timestamp: new Date().toISOString(),
    });
    if (session.searchHistory.length > 50) session.searchHistory.length = 50;
    await this.updateSession(userId, { searchHistory: session.searchHistory });
    return session;
  }

  async updateRecommendationProfile(userId, category, price) {
    const session = await this.getSession(userId);
    const profile = session.recommendationProfile || { categories: [], priceRange: { min: 0, max: 1000 } };
    profile.categories = [category, ...profile.categories.filter(c => c !== category)].slice(0, 20);
    profile.priceRange.max = Math.max(profile.priceRange.max, price);
    profile.priceRange.min = Math.min(profile.priceRange.min, price);
    await this.updateSession(userId, { recommendationProfile: profile });
    return session;
  }
}

export default new MemoryLayer();