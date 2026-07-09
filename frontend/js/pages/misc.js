function renderHowItWorks(app) {
  app.innerHTML = `
    <div class="container" style="padding:50px 0 80px; max-width:820px;">
      <div class="page-title-bar"><span class="eyebrow">The process</span><h1>How SwapWear works</h1></div>
      <p>SwapWear replaces buying and selling with direct exchange. Here's the full flow from listing to handover.</p>

      <div class="dash-card">
        <h3>1. List an item</h3>
        <p>Upload clear photos, describe the condition honestly, and set an estimated value. This value helps both sides judge whether a swap is fair — it isn't a price tag, since no money changes hands.</p>
      </div>
      <div class="dash-card">
        <h3>2. Browse and request</h3>
        <p>Search by category, size, brand, or condition. When you find something you want, send a swap request — optionally offering one of your own listings in return, or just asking to discuss options.</p>
      </div>
      <div class="dash-card">
        <h3>3. Chat and confirm</h3>
        <p>Once a request is accepted, a private chat opens between both people to arrange photos, sizing questions, and handover logistics — in person or by courier.</p>
      </div>
      <div class="dash-card">
        <h3>4. Complete the swap</h3>
        <p>After the exchange happens, either side marks the swap complete. This updates both people's swap history and unlocks the ability to leave a review.</p>
      </div>

      <div class="detail-actions" style="margin-top:20px;">
        <a href="#/browse" data-link class="btn btn-primary">Start browsing</a>
        <a href="#/register" data-link class="btn btn-ghost">Create an account</a>
      </div>
    </div>`;
}
