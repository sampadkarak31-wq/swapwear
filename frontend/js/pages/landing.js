const UNSPLASH = {
  rack: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=700&q=70',
  denim: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=700&q=70',
  dress: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=700&q=70',
  shoes: 'https://images.unsplash.com/photo-1520256862855-398228c41684?auto=format&fit=crop&w=700&q=70',
  jacket: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=700&q=70',
  accessory: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=700&q=70',
  ethnic: 'https://images.unsplash.com/photo-1610189020217-16d8d7cec4c6?auto=format&fit=crop&w=700&q=70',
  activewear: 'https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=700&q=70',
  person1: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=70',
  person2: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=70',
  person3: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=70',
};

async function renderLanding(app) {
  app.innerHTML = `
    <section class="hero">
      <div class="container hero-inner">
        <div>
          <span class="eyebrow">A closet that keeps moving</span>
          <h1>Swap what you have<br/>for what you <em>love</em>.</h1>
          <p class="hero-lede">SwapWear is a clothing exchange marketplace — trade the pieces you've outgrown for something new to you, without spending a rupee.</p>
          <div class="hero-cta">
            <a href="#/browse" data-link class="btn btn-primary">Browse listings</a>
            <a href="#/add-listing" data-link class="btn btn-ghost">List an item</a>
          </div>
          <div class="hero-stats">
            <div class="hero-stat"><b id="stat-listings">2,400+</b><span>Active listings</span></div>
            <div class="hero-stat"><b id="stat-swaps">6,100+</b><span>Swaps completed</span></div>
            <div class="hero-stat"><b>4.8</b><span>Average rating</span></div>
          </div>
        </div>
        <div class="hero-visual" aria-hidden="true">
          <div class="hero-card hero-card-1"><img src="${UNSPLASH.denim}" alt=""/><div class="cap">Vintage Denim Jacket</div></div>
          <div class="hero-card hero-card-2"><img src="${UNSPLASH.dress}" alt=""/><div class="cap">Silk Wrap Dress</div></div>
          <div class="hero-card hero-card-3"><img src="${UNSPLASH.shoes}" alt=""/><div class="cap">Leather Sneakers</div></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Shop by category</span>
          <h2>Find your next favourite piece</h2>
        </div>
        <div class="grid-4">
          ${categoryCard('Tops', UNSPLASH.rack)}
          ${categoryCard('Dresses', UNSPLASH.dress)}
          ${categoryCard('Outerwear', UNSPLASH.jacket)}
          ${categoryCard('Footwear', UNSPLASH.shoes)}
          ${categoryCard('Accessories', UNSPLASH.accessory)}
          ${categoryCard('Ethnic Wear', UNSPLASH.ethnic)}
          ${categoryCard('Activewear', UNSPLASH.activewear)}
          ${categoryCard('Bottoms', UNSPLASH.denim)}
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Featured this week</span>
          <h2>Fresh to the closet</h2>
        </div>
        <div id="featured-grid" class="listing-grid">${skeletonCards(3)}</div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">How it works</span>
          <h2>Three steps to your next outfit</h2>
        </div>
        <div class="grid-3">
          <div class="step-card"><div class="step-num">1</div><h3>List an item</h3><p>Snap a few photos, add details, and set an estimated value for what you no longer wear.</p></div>
          <div class="step-card"><div class="step-num">2</div><h3>Request a swap</h3><p>Browse listings and offer one of your own items in exchange, or propose a straight swap.</p></div>
          <div class="step-card"><div class="step-num">3</div><h3>Meet or ship</h3><p>Chat in real time to arrange the handover, then confirm once the swap is complete.</p></div>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Community</span>
          <h2>Loved by swappers</h2>
        </div>
        <div class="grid-3">
          <div class="testimonial-card">
            <p class="testimonial-quote">"I swapped a coat I never wore for boots I've worn every week since. Zero money changed hands."</p>
            <div class="testimonial-person"><img src="${UNSPLASH.person1}" alt=""/><div><b>Ananya R.</b><span>42 swaps completed</span></div></div>
          </div>
          <div class="testimonial-card">
            <p class="testimonial-quote">"The chat made coordinating pickup so easy. It feels like a proper marketplace, not a Facebook group."</p>
            <div class="testimonial-person"><img src="${UNSPLASH.person2}" alt=""/><div><b>Rohit M.</b><span>18 swaps completed</span></div></div>
          </div>
          <div class="testimonial-card">
            <p class="testimonial-quote">"My wardrobe turns over constantly now and I haven't bought new clothes in four months."</p>
            <div class="testimonial-person"><img src="${UNSPLASH.person3}" alt=""/><div><b>Priya S.</b><span>27 swaps completed</span></div></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="cta-band">
        <h2>Your closet has a second life waiting</h2>
        <p>Join thousands trading clothes instead of buying new.</p>
        <a href="#/register" data-link class="btn btn-accent">Create a free account</a>
      </div>
    </section>
  `;

  loadFeatured();
}

function categoryCard(name, img) {
  return `
    <a href="#/browse?category=${encodeURIComponent(name)}" data-link class="category-card">
      <img src="${img}" alt="${name}" loading="lazy"/>
      <span>${name}</span>
    </a>`;
}

async function loadFeatured() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  try {
    const { listings } = await api.getListings('?limit=3&sort=newest');
    if (!listings.length) {
      grid.innerHTML = `<div class="empty-state"><h3>No listings yet</h3><p>Be the first to list an item.</p></div>`;
      return;
    }
    grid.innerHTML = listings.map(listingCardHtml).join('');
  } catch (err) {
    grid.innerHTML = `<p>Could not load featured listings right now.</p>`;
  }
}
