let __selectedFiles = [];

async function renderAddListing(app, params) {
  __selectedFiles = [];
  const isEdit = !!params.id;
  let existing = null;

  if (isEdit) {
    try {
      const { listing } = await api.getListing(params.id);
      if (listing.owner._id !== state.user._id && state.user.role !== 'admin') {
        toast('Not authorized to edit this listing', 'error');
        navigate('/dashboard');
        return;
      }
      existing = listing;
    } catch (err) {
      toast(err.message, 'error');
      navigate('/dashboard');
      return;
    }
  }

  const categories = ['Tops','Bottoms','Dresses','Outerwear','Footwear','Accessories','Ethnic Wear','Activewear'];
  const genders = ['Men','Women','Unisex','Kids'];
  const conditions = ['New with tags','Like new','Gently used','Well loved'];

  app.innerHTML = `
    <div class="container" style="max-width:760px;">
      <div class="page-title-bar"><h1>${isEdit ? 'Edit listing' : 'List an item'}</h1></div>
      <form id="listing-form" class="dash-card">
        <div class="field">
          <label>Photos</label>
          <div class="dropzone" id="dropzone">
            <p>Drag and drop images here, or <label for="file-input" style="color:var(--color-primary); font-weight:700; cursor:pointer;">browse</label></p>
            <div class="field-hint">Up to 8 images, JPG/PNG/WebP, max 8MB each.</div>
            <input type="file" id="file-input" accept="image/*" multiple hidden />
          </div>
          <div class="preview-grid" id="preview-grid"></div>
          ${existing ? `<div class="field-hint">Existing photos will be kept; new ones are added.</div>` : ''}
        </div>

        <div class="field">
          <label for="title">Title</label>
          <input type="text" id="title" required maxlength="100" value="${existing ? escapeHtml(existing.title) : ''}"/>
        </div>
        <div class="field">
          <label for="description">Description</label>
          <textarea id="description" rows="4" required maxlength="2000">${existing ? escapeHtml(existing.description) : ''}</textarea>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="category">Category</label>
            <select id="category" required>${categories.map((c) => `<option ${existing?.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
          </div>
          <div class="field">
            <label for="gender">Gender</label>
            <select id="gender" required>${genders.map((g) => `<option ${existing?.gender === g ? 'selected' : ''}>${g}</option>`).join('')}</select>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="brand">Brand</label>
            <input type="text" id="brand" value="${existing ? escapeHtml(existing.brand) : ''}" placeholder="e.g. Zara"/>
          </div>
          <div class="field">
            <label for="size">Size</label>
            <input type="text" id="size" required value="${existing ? escapeHtml(existing.size) : ''}" placeholder="e.g. M, UK 8, 32"/>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="condition">Condition</label>
            <select id="condition" required>${conditions.map((c) => `<option ${existing?.condition === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
          </div>
          <div class="field">
            <label for="estimatedValue">Estimated value (₹)</label>
            <input type="number" id="estimatedValue" min="0" required value="${existing ? existing.estimatedValue : ''}"/>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label for="location">Location</label>
            <input type="text" id="location" required value="${existing ? escapeHtml(existing.location) : ''}" placeholder="City"/>
          </div>
          <div class="field">
            <label for="tags">Tags (comma separated)</label>
            <input type="text" id="tags" value="${existing && existing.tags ? escapeHtml(existing.tags.join(', ')) : ''}" placeholder="vintage, summer, cotton"/>
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Save changes' : 'Publish listing'}</button>
      </form>
    </div>`;

  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');

  const renderPreviews = () => {
    const grid = document.getElementById('preview-grid');
    grid.innerHTML = __selectedFiles.map((file, i) => `
      <div class="preview-item">
        <img src="${URL.createObjectURL(file)}" alt="preview"/>
        <button type="button" data-remove="${i}">&times;</button>
      </div>`).join('');
    grid.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        __selectedFiles.splice(parseInt(btn.dataset.remove, 10), 1);
        renderPreviews();
      });
    });
  };

  const addFiles = (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    __selectedFiles = [...__selectedFiles, ...files].slice(0, 8);
    renderPreviews();
  };

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => addFiles(e.target.files));
  ['dragenter', 'dragover'].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); })
  );
  ['dragleave', 'drop'].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); })
  );
  dropzone.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));

  document.getElementById('listing-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isEdit && __selectedFiles.length === 0) {
      toast('Please add at least one photo', 'error');
      return;
    }
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;

    const fd = new FormData();
    fd.append('title', document.getElementById('title').value.trim());
    fd.append('description', document.getElementById('description').value.trim());
    fd.append('category', document.getElementById('category').value);
    fd.append('gender', document.getElementById('gender').value);
    fd.append('brand', document.getElementById('brand').value.trim() || 'Unbranded');
    fd.append('size', document.getElementById('size').value.trim());
    fd.append('condition', document.getElementById('condition').value);
    fd.append('estimatedValue', document.getElementById('estimatedValue').value);
    fd.append('location', document.getElementById('location').value.trim());
    fd.append('tags', document.getElementById('tags').value.trim());
    __selectedFiles.forEach((file) => fd.append('images', file));

    try {
      if (isEdit) {
        await api.updateListing(existing._id, fd);
        toast('Listing updated successfully', 'success');
        navigate(`/listing/${existing._id}`);
      } else {
        const { listing } = await api.createListing(fd);
        toast('Listing published!', 'success');
        navigate(`/listing/${listing._id}`);
      }
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
    }
  });
}
