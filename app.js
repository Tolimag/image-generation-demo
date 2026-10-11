function displaySettingValue(value) {
  return value.replace(/^[a-z]/, letter => letter.toUpperCase());
}

const ASSET_LIBRARY = [
  { id: 'dog', name: 'Dog portrait', url: './assets/gallery-1.png', type: 'image/png' },
  { id: 'fashion', name: 'Fashion portrait', url: './assets/gallery-2.png', type: 'image/png' },
  { id: 'flowers', name: 'Flower garden', url: './assets/gallery-3.png', type: 'image/png' },
  { id: 'rabbit', name: 'Volcano rabbit', url: './assets/gallery-4.png', type: 'image/png' },
  { id: 'tiger', name: 'Underwater tiger', url: './assets/gallery-5.png', type: 'image/png' },
  { id: 'picnic', name: 'Picnic', url: './assets/library-picnic.webp', type: 'image/webp' },
  { id: 'pottery', name: 'Pottery', url: './assets/library-pottery.webp', type: 'image/webp' },
  { id: 'robot', name: 'Robot', url: './assets/library-robot.webp', type: 'image/webp' },
  { id: 'santorini', name: 'Santorini', url: './assets/library-santorini.webp', type: 'image/webp' },
  { id: 'beach', name: 'Beach portrait', url: './assets/generation-result.jpg', type: 'image/jpeg' },
  { id: 'dog-detail', name: 'Dog portrait detail', url: './assets/gallery-1.png', type: 'image/png', previewPosition: 'center 20%' },
  { id: 'fashion-detail', name: 'Fashion portrait detail', url: './assets/gallery-2.png', type: 'image/png', previewPosition: 'center 16%' },
  { id: 'flowers-detail', name: 'Flower garden detail', url: './assets/gallery-3.png', type: 'image/png', previewPosition: 'center 75%' },
  { id: 'rabbit-detail', name: 'Volcano rabbit detail', url: './assets/gallery-4.png', type: 'image/png', previewPosition: 'center 18%' },
  { id: 'tiger-detail', name: 'Underwater tiger detail', url: './assets/gallery-5.png', type: 'image/png', previewPosition: 'center 78%' },
  { id: 'picnic-detail', name: 'Picnic detail', url: './assets/library-picnic.webp', type: 'image/webp', previewPosition: 'center 18%' },
  { id: 'pottery-detail', name: 'Pottery detail', url: './assets/library-pottery.webp', type: 'image/webp', previewPosition: 'center 80%' },
  { id: 'robot-detail', name: 'Robot detail', url: './assets/library-robot.webp', type: 'image/webp', previewPosition: 'center 20%' }
];

function createAssetThumbnail({ name, source = 'references', sourceLabel } = {}) {
  const tile = document.createElement('div');
  tile.className = 'attachment';
  tile.title = name || '';
  const image = document.createElement('img');
  image.alt = name || '';
  const sourceIcon = document.createElement('img');
  sourceIcon.className = 'attachment-source';
  sourceIcon.src = `./assets/${SETTING_META[source]?.icon || SETTING_META.references.icon}.svg`;
  sourceIcon.width = sourceIcon.height = 16;
  sourceIcon.alt = `Added from ${sourceLabel || SETTING_META[source]?.title || SETTING_META.references.title}`;
  tile.append(image, sourceIcon);
  return { tile, image };
}

class PromptField {
  constructor(root, options = {}) {
    this.root = root;
    this.onSubmit = options.onSubmit || (() => new Promise(resolve => setTimeout(resolve, 1300)));
    this.input = root.querySelector('#prompt-input');
    this.inputMeasure = document.createElement('textarea');
    this.inputMeasure.rows = 1;
    this.inputMeasure.className = 'input-measure';
    this.inputMeasure.setAttribute('aria-hidden', 'true');
    this.inputMeasure.tabIndex = -1;
    this.input.closest('.input-wrap').append(this.inputMeasure);
    this.submitButton = root.querySelector('#submit');
    this.resultDecrement = root.querySelector('#result-decrement');
    this.resultIncrement = root.querySelector('#result-increment');
    this.resultCurrent = root.querySelector('#result-current');
    this.attachmentsElement = root.querySelector('#attachments');
    this.fileInput = document.querySelector('#file-input');
    this.menuLayer = document.querySelector('#menu-layer');
    this.pointerInitiated = false;
    this.feedback = document.querySelector('#feedback');
    this.model = IMAGE_MODELS.find(model => model.id === 'gpt-image-2');
    this.modelStates = new Map();
    this.state = { ...initialModelSettings(this.model), loading: false };
    this.references = [];
    this.modelButton = document.querySelector('#model-selector');
    this.settingsElement = root.querySelector('#model-settings');
    this.activeMenu = null;
    this.dragDepth = 0;
    this.feedbackTimer = null;
    this.renderSettings();
    this.bind();
    this.resizeInput();
    this.updateSubmit();
    this.updateStepper();
  }

  bind() {
    this.input.addEventListener('input', () => { this.resizeInput(); this.updateSubmit(); this.emitChange(); });
    this.input.addEventListener('keydown', event => {
      if (event.key !== 'Enter' || event.shiftKey || event.isComposing || event.keyCode === 229) return;
      event.preventDefault();
      this.submit();
    });
    this.submitButton.addEventListener('click', () => this.submit());
    this.resultDecrement.addEventListener('click', () => this.changeResults(-1));
    this.resultIncrement.addEventListener('click', () => this.changeResults(1));
    this.root.addEventListener('click', event => {
      const button = event.target.closest('[data-menu]');
      if (button) this.toggleMenu(button.dataset.menu, button);
    });
    this.fileInput.addEventListener('change', () => {
      this.attachFiles([...this.fileInput.files]);
      this.fileInput.value = '';
    });
    this.attachmentsElement.addEventListener('scroll', () => this.updateAttachmentScroll(), { passive: true });
    document.addEventListener('pointerdown', event => {
      this.pointerInitiated = true;
      const pinnedStoryMenu = document.documentElement.classList.contains('story-mode') && document.documentElement.dataset.story === 'menu';
      if (this.activeMenu && !pinnedStoryMenu && !this.menuLayer.contains(event.target) && !event.target.closest('[data-menu]')) this.closeMenu();
    });
    document.addEventListener('keydown', event => {
      this.pointerInitiated = false;
      if (event.key === 'Escape') this.closeMenu(true);
    });
    window.addEventListener('resize', () => { this.resizeInput(); this.positionMenu(); this.updateAttachmentScroll(); });
    window.addEventListener('pageshow', () => { this.resizeInput(); this.updateSubmit(); });
    window.addEventListener('scroll', event => {
      if (event.target instanceof Node && this.menuLayer.contains(event.target)) return;
      this.positionMenu();
    }, true);
    this.root.addEventListener('dragenter', event => {
      if (!this.hasImageTransfer(event)) return;
      event.preventDefault();
      this.dragDepth++;
      this.root.classList.add('is-dragging');
    });
    this.root.addEventListener('dragover', event => { if (this.hasImageTransfer(event)) event.preventDefault(); });
    this.root.addEventListener('dragleave', event => {
      if (!this.hasImageTransfer(event)) return;
      this.dragDepth = Math.max(0, this.dragDepth - 1);
      if (this.dragDepth === 0) this.root.classList.remove('is-dragging');
    });
    this.root.addEventListener('drop', event => {
      event.preventDefault();
      this.dragDepth = 0;
      this.root.classList.remove('is-dragging');
      const files = [...event.dataTransfer.files].filter(file => file.type.startsWith('image/'));
      if (!files.length) return;
      this.attachFiles(files);
    });
  }

  selectModel(id) {
    const model = IMAGE_MODELS.find(item => item.id === id);
    if (!model || this.state.loading) return;
    this.modelStates.set(this.model.id, { ...this.state, loading: false });
    this.model = model;
    this.state = { ...(this.modelStates.get(id) || initialModelSettings(model)), loading: false };
    document.querySelector('#model-name').textContent = model.name;
    this.modelButton.setAttribute('aria-label', `Select model: ${model.name}`);
    this.closeMenu();
    this.renderSettings();
    this.renderAttachments();
    this.updateStepper();
    this.updateSubmit();
    this.resizeInput();
    if (!this.pointerInitiated) this.modelButton.focus();
    this.emitChange();
  }

  renderSettings() {
    this.settingsElement.replaceChildren();
    const kinds = [this.model.references ? 'references' : null, this.model.lora ? 'lora' : null,
      'aspect', ...['quality', 'resolution', 'background'].filter(key => this.model[key])].filter(Boolean);
    kinds.forEach(kind => {
      const meta = SETTING_META[kind];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'setting-button';
      button.dataset.menu = kind;
      button.setAttribute('aria-haspopup', kind === 'lora' || kind === 'references' ? 'dialog' : 'menu');
      button.setAttribute('aria-expanded', 'false');
      const label = kind === 'references' ? (this.model.referenceLabel || 'References') : kind === 'lora' ? 'LoRA Library' : displaySettingValue(this.state[kind]);
      button.title = `${meta.title}${this.state[kind] ? ': ' + displaySettingValue(this.state[kind]) : ''}`;
      button.setAttribute('aria-label', button.title);
      const img = document.createElement('img');
      img.className = 'setting-icon'; img.src = `./assets/${meta.icon}.svg`; img.alt = ''; img.width = img.height = 20;
      const text = document.createElement('span'); text.className = 'chip-label'; text.textContent = label;
      button.append(img, text); this.settingsElement.append(button);
    });
    this.input.maxLength = this.model.promptLimit || 1000;
    this.root.querySelector('.drop-overlay').textContent = this.model.references
      ? `Drop up to ${this.model.references} ${this.model.references === 1 ? 'image' : 'images'} to add references`
      : `${this.model.name} does not support image references`;
  }

  hasImageTransfer(event) { return [...(event.dataTransfer?.types || [])].includes('Files'); }
  resizeInput() {
    this.inputMeasure.style.width = `${this.input.clientWidth}px`;
    this.inputMeasure.value = this.input.value;
    const contentHeight = this.inputMeasure.scrollHeight;
    const baseHeight = window.matchMedia('(max-width: 600px)').matches ? 24 : 48;
    const nextHeight = Math.min(Math.max(contentHeight, baseHeight), 168);
    this.input.style.height = `${nextHeight}px`;
    this.input.style.overflowY = contentHeight > 168 ? 'auto' : 'hidden';
  }
  updateSubmit() {
    this.submitButton.disabled = this.state.loading;
    this.submitButton.setAttribute('aria-label', this.state.loading ? 'Generating' : 'Generate image');
  }
  changeResults(delta) {
    const next = Math.min(4, Math.max(1, this.state.results + delta));
    if (next === this.state.results) return;
    this.state.results = next;
    this.updateStepper();
    this.emitChange();
  }
  updateStepper() {
    this.resultCurrent.textContent = this.state.results;
    this.resultDecrement.disabled = this.state.results === 1;
    this.resultIncrement.disabled = this.state.results === 4;
  }

  toggleMenu(kind, button) {
    if (this.activeMenu?.kind === kind) { this.closeMenu(); return; }
    this.closeMenu();
    const popover = document.createElement('div');
    popover.className = `popover${kind === 'model' ? '' : ' setting-popover'}`;
    popover.setAttribute('role', kind === 'model' || kind === 'lora' || kind === 'references' ? 'dialog' : 'menu');
    popover.setAttribute('aria-label', kind === 'references' ? 'Add images' : `${button.textContent.trim()} options`);
    if (kind === 'references') popover.tabIndex = -1;
    this.activeMenu = { kind, button, popover };
    button.setAttribute('aria-expanded', 'true');
    this.renderMenu();
    this.menuLayer.append(popover);
    this.positionMenu();
    if (!this.pointerInitiated) (kind === 'references' ? popover : popover.querySelector('input') || popover.querySelector('[aria-checked="true"]') || popover.querySelector('.menu-item, [role="tab"]'))?.focus();
    popover.addEventListener('keydown', event => {
      const items = [...popover.querySelectorAll('.menu-item:not(:disabled)')];
      if (!items.length) return;
      const index = items.indexOf(document.activeElement);
      if (event.target.tagName === 'INPUT' && !['ArrowDown', 'Escape'].includes(event.key)) return;
      let next;
      if (event.key === 'ArrowDown') next = (index + 1) % items.length;
      if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = items.length - 1;
      if (next !== undefined) { event.preventDefault(); items[next].focus(); }
      if (event.key === 'Tab') this.closeMenu(true);
    });
  }

  renderMenu() {
    const { kind, popover } = this.activeMenu;
    popover.replaceChildren();
    if (kind === 'model') { this.renderModelMenu(popover); return; }
    if (kind === 'references') { this.renderAssetMenu(popover); return; }
    const title = document.createElement('div');
    title.className = 'popover-title';
    title.textContent = SETTING_META[kind].title;
    popover.append(title);
    if (kind === 'lora') {
      const tabs = document.createElement('div'); tabs.className = 'library-tabs'; tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'LoRA category');
      const empty = document.createElement('div'); empty.className = 'library-empty'; empty.id = 'lora-panel'; empty.setAttribute('role', 'tabpanel');
      empty.textContent = 'No avatars in this library';
      ['Avatar', 'Style', 'Product'].forEach((name, index) => {
        const tab = document.createElement('button'); tab.type = 'button'; tab.textContent = name;
        tab.id = `lora-tab-${index}`; tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', empty.id); tab.setAttribute('aria-selected', String(index === 0)); tab.tabIndex = index === 0 ? 0 : -1;
        tab.addEventListener('click', () => {
          [...tabs.children].forEach(item => { item.setAttribute('aria-selected', String(item === tab)); item.tabIndex = item === tab ? 0 : -1; });
          empty.setAttribute('aria-labelledby', tab.id); empty.textContent = `No ${name.toLowerCase()}s in this library`;
        });
        tab.addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); const next = tabs.children[(index + (event.key === 'ArrowRight' ? 1 : 2)) % 3]; next.click(); next.focus(); } });
        tabs.append(tab);
      });
      empty.setAttribute('aria-labelledby', 'lora-tab-0');
      popover.append(tabs, empty); return;
    }
    const values = kind === 'aspect' ? this.model.ratios : this.model[kind];
    values.forEach(value => {
      this.addMenuItem(popover, displaySettingValue(value), () => {
        this.state[kind] = value;
        this.closeMenu(); this.renderSettings(); this.renderAttachments();
        if (!this.pointerInitiated) this.settingsElement.querySelector(`[data-menu="${kind}"]`).focus();
        this.emitChange();
      }, { checked: this.state[kind] === value, ratio: kind === 'aspect' ? value : null });
    });
  }

  renderAssetMenu(popover) {
    popover.classList.add('asset-popover');
    const limit = this.model.references;
    const used = Math.min(this.references.length, limit);
    const remaining = Math.max(0, limit - used);
    const attachedIds = new Set(this.references.slice(0, limit).map(asset => asset.libraryId).filter(Boolean));
    const selectedIds = new Set();

    const grid = document.createElement('div'); grid.className = 'asset-grid';
    grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', 'Available images');

    const footer = document.createElement('div'); footer.className = 'asset-popover-footer';
    const makeAction = (label, iconPath, className, onClick) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = `asset-popover-action ${className}`;
      const icon = document.createElement('img'); icon.src = iconPath; icon.alt = ''; icon.width = icon.height = 20;
      const text = document.createElement('span'); text.textContent = label;
      button.append(icon, text); button.addEventListener('click', onClick);
      return button;
    };
    const upload = makeAction('Upload', './assets/upload.svg', 'is-secondary', () => { this.closeMenu(); this.fileInput.click(); });
    upload.disabled = remaining === 0;
    const select = makeAction('Select', './assets/images.svg', 'is-primary', () => {
      const chosen = ASSET_LIBRARY.filter(asset => selectedIds.has(asset.id)).slice(0, remaining);
      chosen.forEach(asset => this.references.push({
        file: { name: `${asset.id}.${asset.type.split('/')[1]}`, type: asset.type },
        url: asset.url,
        source: 'references',
        status: 'ready',
        libraryId: asset.id
      }));
      this.renderAttachments(); this.emitChange(); this.closeMenu(true);
    });
    const selectCount = document.createElement('span'); selectCount.className = 'asset-select-count';
    const selectCurrent = document.createElement('span'); selectCurrent.className = 'stepper-current';
    const selectTotal = document.createElement('span'); selectTotal.className = 'stepper-total';
    selectTotal.textContent = `/${limit}`;
    selectCount.append(selectCurrent, selectTotal);
    select.append(selectCount);
    select.disabled = true;
    const syncSelection = () => {
      select.disabled = selectedIds.size === 0;
      selectCurrent.textContent = String(used + selectedIds.size);
      select.setAttribute('aria-label', `Select images, ${used + selectedIds.size} of ${limit}`);
    };
    syncSelection();
    ASSET_LIBRARY.forEach(asset => {
      const tile = document.createElement('button'); tile.type = 'button'; tile.className = 'asset-grid-tile';
      tile.setAttribute('aria-label', attachedIds.has(asset.id) ? `${asset.name}, already added` : asset.name);
      tile.setAttribute('aria-pressed', 'false');
      tile.disabled = attachedIds.has(asset.id) || remaining === 0;
      const image = document.createElement('img'); image.src = asset.url; image.alt = ''; image.loading = 'eager';
      if (asset.previewPosition) image.style.objectPosition = asset.previewPosition;
      const checkBadge = document.createElement('span'); checkBadge.className = 'asset-grid-check-badge';
      const check = document.createElement('img'); check.src = './assets/check.svg'; check.alt = ''; check.className = 'asset-grid-check';
      checkBadge.append(check);
      tile.append(image, checkBadge);
      tile.addEventListener('click', () => {
        if (selectedIds.has(asset.id)) selectedIds.delete(asset.id);
        else if (selectedIds.size < remaining) selectedIds.add(asset.id);
        tile.setAttribute('aria-pressed', String(selectedIds.has(asset.id)));
        syncSelection();
      });
      grid.append(tile);
    });
    footer.append(upload, select);
    popover.append(grid, footer);
  }

  renderModelMenu(popover) {
    popover.classList.add('model-popover');
    popover.setAttribute('aria-label', 'Select image model');
    const searchWrap = document.createElement('div'); searchWrap.className = 'model-search';
    const icon = document.createElement('img'); icon.src = './assets/search.svg'; icon.className = 'setting-icon'; icon.alt = '';
    const search = document.createElement('input'); search.type = 'search'; search.placeholder = 'Search models…'; search.setAttribute('aria-label', 'Search models');
    const close = document.createElement('button'); close.type = 'button'; close.className = 'model-menu-close'; close.setAttribute('aria-label', 'Close model menu');
    close.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3.5 3.5 14.5 14.5M14.5 3.5 3.5 14.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>';
    close.addEventListener('click', () => this.closeMenu(true));
    searchWrap.append(icon, search, close);
    const list = document.createElement('div'); list.className = 'model-list'; list.setAttribute('role', 'group'); list.setAttribute('aria-label', 'Image models');
    const render = () => {
      list.replaceChildren();
      const query = search.value.trim().toLowerCase();
      const models = IMAGE_MODELS.filter(model => `${model.name} ${model.family}`.toLowerCase().includes(query));
      models.forEach(model => {
        const item = document.createElement('button'); item.type = 'button'; item.className = 'menu-item model-option';
        item.setAttribute('aria-pressed', String(model.id === this.model.id));
        const modelIcon = document.createElement('img'); modelIcon.className = 'model-option-icon'; modelIcon.src = './assets/cpu.svg'; modelIcon.alt = '';
        const content = document.createElement('span'); content.className = 'model-option-copy';
        const name = document.createElement('span'); name.className = 'model-option-name'; name.textContent = model.name;
        const description = document.createElement('span'); description.className = 'model-option-meta'; description.textContent = `${model.family} · ${model.speed} · ${model.size}`;
        content.append(name, description); item.append(modelIcon, content);
        if (model.id === this.model.id) { const check = document.createElement('img'); check.src = './assets/check.svg'; check.className = 'setting-icon model-check'; check.alt = 'Selected'; item.append(check); }
        item.addEventListener('click', () => this.selectModel(model.id)); list.append(item);
      });
      if (!models.length) { const empty = document.createElement('div'); empty.className = 'menu-hint'; empty.textContent = 'No models found'; empty.setAttribute('role', 'status'); list.append(empty); }
      this.positionMenu();
    };
    popover.append(searchWrap, list); search.addEventListener('input', render); render();
  }

  addMenuItem(parent, label, action, options = {}) {
    const item = document.createElement('button');
    item.type = 'button';
    item.disabled = Boolean(options.disabled);
    item.className = `menu-item${options.danger ? ' danger' : ''}`;
    item.setAttribute('role', options.checked === undefined ? 'menuitem' : 'menuitemradio');
    if (options.checked !== undefined) item.setAttribute('aria-checked', String(options.checked));
    if (options.ratio) {
      const [width, height] = options.ratio.split(':').map(Number);
      const scale = 20 / Math.max(width, height);
      const icon = document.createElement('span'); icon.className = 'menu-item-ratio'; icon.setAttribute('aria-hidden', 'true');
      const shape = document.createElement('span'); shape.className = 'menu-item-ratio-shape';
      shape.style.width = `${width * scale}px`; shape.style.height = `${height * scale}px`;
      icon.append(shape); item.append(icon);
    }
    const text = document.createElement('span'); text.className = 'menu-item-label'; text.textContent = label; item.append(text);
    if (options.checked) {
      const check = document.createElement('img'); check.src = './assets/check.svg'; check.className = 'menu-item-check'; check.width = check.height = 16; check.alt = '';
      item.append(check);
    }
    item.addEventListener('click', action);
    parent.append(item);
  }

  positionMenu() {
    if (!this.activeMenu) return;
    const { button, popover } = this.activeMenu;
    if (this.activeMenu.kind === 'model' && window.matchMedia('(max-width: 600px)').matches) {
      const height = Math.min(Math.round(window.innerHeight * .78), 760);
      popover.style.width = `${window.innerWidth}px`;
      popover.style.height = `${height}px`;
      popover.style.maxHeight = `${height}px`;
      popover.style.left = '0';
      popover.style.right = '0';
      popover.style.top = 'auto';
      popover.style.bottom = '0';
      popover.style.transformOrigin = 'bottom center';
      return;
    }
    popover.style.height = '';
    popover.style.right = '';
    popover.style.bottom = '';
    const rect = button.getBoundingClientRect();
    const widthByKind = { model: 360, lora: 220, references: 360 };
    const width = Math.min(widthByKind[this.activeMenu.kind] ?? 200, window.innerWidth - 24);
    popover.style.width = `${width}px`;
    if (this.activeMenu.kind === 'references') {
      const tileSize = (width - 30) / 3;
      popover.style.setProperty('--asset-tile-size', `${tileSize}px`);
      popover.style.setProperty('--asset-peek-height', `${tileSize * 2.5 + 12}px`);
    }
    popover.style.maxHeight = `${window.innerHeight - 24}px`;
    const left = Math.min(rect.left, window.innerWidth - width - 12);
    popover.style.left = `${Math.max(12, left)}px`;
    const aboveSpace = Math.max(0, rect.top - 20);
    const belowSpace = Math.max(0, window.innerHeight - rect.bottom - 20);
    const below = belowSpace >= popover.offsetHeight || belowSpace >= aboveSpace;
    popover.style.maxHeight = `${Math.max(96, below ? belowSpace : aboveSpace)}px`;
    const height = popover.offsetHeight;
    popover.style.top = `${below ? rect.bottom + 8 : Math.max(12, rect.top - height - 8)}px`;
    popover.style.transformOrigin = below ? 'top left' : 'bottom left';
  }
  closeMenu(restoreFocus = false) {
    if (!this.activeMenu) return;
    const { button, popover } = this.activeMenu;
    button.setAttribute('aria-expanded', 'false');
    popover.classList.add('is-closing');
    popover.inert = true;
    setTimeout(() => popover.remove(), 140);
    this.activeMenu = null;
    if (restoreFocus && !this.pointerInitiated) button.focus();
  }

  attachFiles(files) {
    if (!this.model.references) { this.showFeedback(`${this.model.name} does not support image references`); return; }
    const images = files.filter(file => file.type.startsWith('image/'));
    if (!images.length) { this.showFeedback('Choose an image file'); return; }
    const remaining = Math.max(0, this.model.references - this.references.length);
    images.slice(0, remaining).forEach(file => this.references.push({ file, url: URL.createObjectURL(file), source: 'references', status: 'loading' }));
    if (images.length > remaining) this.showFeedback(`${this.model.name} supports up to ${this.model.references} references`);
    this.renderAttachments(); this.emitChange();
  }

  renderAttachments() {
    this.attachmentsElement.classList.remove('is-collapsing');
    this.attachmentsElement.replaceChildren();
    const active = this.references.slice(0, this.model.references);
    active.forEach((asset, index) => {
      const item = document.createElement('div'); item.className = 'attachment-item';
      const status = asset.status || 'ready';
      item.classList.toggle('is-loading', status === 'loading');
      item.classList.toggle('is-error', status === 'error');
      const { tile, image: img } = createAssetThumbnail({
        name: asset.file.name,
        source: asset.source,
        sourceLabel: this.model.referenceLabel
      });
      if (status === 'loading' && !asset.demoStatus) {
        img.addEventListener('load', () => {
          if (asset.status !== 'loading') return;
          asset.status = 'ready'; item.classList.remove('is-loading'); tile.querySelector('.attachment-status')?.remove();
        }, { once: true });
        img.addEventListener('error', () => {
          if (asset.status !== 'loading') return;
          asset.status = 'error'; item.classList.remove('is-loading'); item.classList.add('is-error');
          const indicator = tile.querySelector('.attachment-status');
          if (indicator) { indicator.className = 'attachment-status attachment-status-error'; indicator.textContent = '!'; indicator.setAttribute('aria-label', 'Image failed to load'); }
        }, { once: true });
      }
      img.src = asset.url;
      if (status !== 'ready') {
        const indicator = document.createElement('span'); indicator.className = `attachment-status attachment-status-${status}`;
        indicator.setAttribute('role', 'status'); indicator.setAttribute('aria-label', status === 'loading' ? 'Loading image' : 'Image failed to load');
        if (status === 'error') indicator.textContent = '!';
        tile.append(indicator);
      }
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'attachment-remove'; remove.setAttribute('aria-label', `Remove reference ${index + 1}`);
      remove.addEventListener('click', () => {
        remove.disabled = true;
        item.classList.add('is-removing');
        const lastAsset = this.references.length === 1;
        if (lastAsset) this.attachmentsElement.classList.add('is-collapsing');
        const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : lastAsset ? 320 : 180;
        setTimeout(() => {
          this.references = this.references.filter(item => item !== asset); if (asset.url.startsWith('blob:')) URL.revokeObjectURL(asset.url);
          this.renderAttachments(); this.emitChange();
          (this.attachmentsElement.querySelector('.attachment-remove') || this.settingsElement.querySelector('[data-menu="references"]'))?.focus();
        }, delay);
      });
      item.append(tile, remove); this.attachmentsElement.append(item);
    });
    this.attachmentsElement.hidden = !active.length;
    const button = this.settingsElement.querySelector('[data-menu="references"]');
    if (button) {
      button.classList.toggle('is-filled', active.length > 0);
      button.querySelector('.chip-label').textContent = this.model.referenceLabel || 'References';
      button.setAttribute('aria-label', `${this.model.referenceLabel || 'References'}: ${active.length} of ${this.model.references}`);
      button.querySelector('.reference-count')?.remove();
      if (active.length) {
        const count = document.createElement('span');
        count.className = 'reference-count';
        const current = document.createElement('span');
        current.className = 'stepper-current';
        current.textContent = active.length;
        const total = document.createElement('span');
        total.className = 'stepper-total';
        total.textContent = `/${this.model.references}`;
        count.append(current, total);
        button.append(count);
      }
    }
    if (this.references.length > active.length) {
      const note = document.createElement('span'); note.className = 'attachment-note';
      note.textContent = `${this.references.length - active.length} references saved for other models`;
      this.attachmentsElement.append(note); this.attachmentsElement.hidden = false;
    }
    this.updateAttachmentScroll();
  }

  updateAttachmentScroll() {
    const strip = this.attachmentsElement;
    const maxScroll = Math.max(0, strip.scrollWidth - strip.clientWidth);
    strip.classList.toggle('can-scroll-left', !strip.hidden && strip.scrollLeft > 1);
    strip.classList.toggle('can-scroll-right', !strip.hidden && strip.scrollLeft < maxScroll - 1);
  }

  emitChange() {
    this.root.dispatchEvent(new CustomEvent('prompt:change', { bubbles: true, detail: this.getValue() }));
  }
  getValue() {
    return {
      prompt: this.input.value.trim(),
      aspectRatio: this.state.aspect,
      resultCount: this.state.results,
      model: this.model.id,
      modelName: this.model.name,
      ...(this.model.quality ? { quality: this.state.quality } : {}),
      ...(this.model.resolution ? { resolution: this.state.resolution } : {}),
      ...(this.model.background ? { background: this.state.background } : {}),
      references: this.references.slice(0, this.model.references).map(asset => asset.libraryId ? { file: asset.file, url: asset.url, source: asset.source } : asset.file)
    };
  }
  async submit() {
    if (this.state.loading) return;
    if (this.input.value.length > this.input.maxLength) { this.showFeedback(`This model supports up to ${this.input.maxLength} characters`); this.input.focus(); return; }
    this.closeMenu();
    this.state.loading = true;
    this.modelButton.disabled = true;
    this.submitButton.classList.add('is-loading');
    this.submitButton.setAttribute('aria-label', 'Generating');
    this.root.setAttribute('aria-busy', 'true');
    this.updateSubmit();
    const submittedText = this.input.value;
    const detail = this.getValue();
    const submittedReferences = this.references;
    this.root.dispatchEvent(new CustomEvent('prompt:submit', { bubbles: true, detail }));
    this.references = [];
    this.renderAttachments();
    this.input.value = '';
    this.input.dispatchEvent(new Event('input', { bubbles: true }));
    try {
      const result = await this.onSubmit(detail);
      this.root.dispatchEvent(new CustomEvent('prompt:complete', { bubbles: true, detail: { request: detail, result } }));
      submittedReferences.forEach(asset => { if (!asset.libraryId && asset.url.startsWith('blob:')) URL.revokeObjectURL(asset.url); });
    } catch (error) {
      if (!this.input.value) {
        this.input.value = submittedText;
        this.input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (!this.references.length) {
        this.references = submittedReferences;
        this.renderAttachments();
        this.emitChange();
      } else {
        submittedReferences.forEach(asset => { if (!asset.libraryId && asset.url.startsWith('blob:')) URL.revokeObjectURL(asset.url); });
      }
      this.root.dispatchEvent(new CustomEvent('prompt:error', { bubbles: true, detail: error }));
    } finally {
      this.state.loading = false;
      this.modelButton.disabled = false;
      this.submitButton.classList.remove('is-loading');
      this.submitButton.setAttribute('aria-label', 'Generate image');
      this.root.removeAttribute('aria-busy');
      this.updateSubmit();
    }
  }
  showFeedback(message) {
    clearTimeout(this.feedbackTimer);
    this.feedback.textContent = message;
    this.feedback.classList.add('is-visible');
    this.feedbackTimer = setTimeout(() => this.feedback.classList.remove('is-visible'), 5000);
  }
}

window.PromptField = PromptField;
window.promptField = new PromptField(document.querySelector('#prompt-field'));

const finishEntrance = () => document.documentElement.classList.remove('is-entering');
document.querySelector('.gallery-card-five').addEventListener('animationend', event => {
  if (event.animationName === 'card-arrive') finishEntrance();
});
setTimeout(finishEntrance, 1500);

const page = document.querySelector('.page');
const promptToolbar = document.querySelector('#prompt-field .toolbar');
function reserveComposerSpace() {
  // Reserve the base composer height; extra prompt lines grow upward.
  const baseInputHeight = window.matchMedia('(max-width: 600px)').matches ? 32 : 56;
  page.style.setProperty('--composer-base-height', `${30 + baseInputHeight + Math.ceil(promptToolbar.getBoundingClientRect().height)}px`);
  page.style.setProperty('--composer-current-height', `${Math.ceil(window.promptField.root.getBoundingClientRect().height)}px`);
}
reserveComposerSpace();
if ('ResizeObserver' in window) {
  const composerResizeObserver = new ResizeObserver(reserveComposerSpace);
  composerResizeObserver.observe(promptToolbar);
  composerResizeObserver.observe(window.promptField.root);
}
window.addEventListener('resize', reserveComposerSpace);

const gallery = document.querySelector('.image-gallery');
const galleryCards = [...gallery.querySelectorAll('.gallery-card')];
const promptInput = window.promptField.input;
window.addEventListener('load', () => {
  if (!document.documentElement.classList.contains('story-mode') && document.activeElement === document.body) promptInput.focus({ preventScroll: true });
}, { once: true });
const promptExamples = [
  'A cinematic fox in a neon city',
  'A surreal garden of glass flowers',
  'A cozy cabin above the clouds',
  'An underwater fashion portrait'
];
const reducedPlaceholderMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const placeholderOverlay = document.createElement('div');
placeholderOverlay.className = 'prompt-placeholder-words';
placeholderOverlay.setAttribute('aria-hidden', 'true');
promptInput.closest('.input-wrap').append(placeholderOverlay);
let placeholderTimer = null;
let exampleIndex = 0;
let wordIndex = 0;

function schedulePlaceholder(delay) {
  placeholderTimer = setTimeout(advancePlaceholder, delay);
}

function advancePlaceholder() {
  placeholderTimer = null;
  if (promptInput.value || document.hidden || reducedPlaceholderMotion.matches || document.documentElement.classList.contains('has-submitted-prompt')) return;
  const words = promptExamples[exampleIndex].split(' ');
  if (wordIndex < words.length) {
    const word = document.createElement('span');
    word.className = 'prompt-placeholder-word';
    word.textContent = words[wordIndex++];
    placeholderOverlay.append(word);
    schedulePlaceholder(wordIndex === words.length ? 1800 : 230);
    return;
  }
  placeholderOverlay.classList.add('is-exiting');
  placeholderTimer = setTimeout(() => {
    placeholderTimer = null;
    if (promptInput.value || document.hidden || reducedPlaceholderMotion.matches || document.documentElement.classList.contains('has-submitted-prompt')) return;
    placeholderOverlay.replaceChildren();
    placeholderOverlay.classList.remove('is-exiting');
    wordIndex = 0;
    exampleIndex = (exampleIndex + 1) % promptExamples.length;
    promptInput.placeholder = promptExamples[exampleIndex];
    schedulePlaceholder(280);
  }, 380);
}

function syncPlaceholder() {
  clearTimeout(placeholderTimer);
  placeholderTimer = null;
  placeholderOverlay.replaceChildren();
  placeholderOverlay.classList.remove('is-exiting');
  wordIndex = 0;
  if (document.querySelector('#image-viewer')?.open) {
    placeholderOverlay.hidden = true;
    promptInput.classList.remove('is-animated-placeholder');
    promptInput.placeholder = 'Edit this image by describing what you want to change...';
    return;
  }
  if (document.documentElement.classList.contains('has-submitted-prompt')) {
    placeholderOverlay.hidden = true;
    promptInput.classList.remove('is-animated-placeholder');
    promptInput.placeholder = 'Describe an image';
    return;
  }
  if (reducedPlaceholderMotion.matches) {
    placeholderOverlay.hidden = true;
    promptInput.classList.remove('is-animated-placeholder');
    promptInput.placeholder = promptExamples[0];
    return;
  }
  placeholderOverlay.hidden = !!promptInput.value || document.hidden;
  promptInput.classList.add('is-animated-placeholder');
  promptInput.placeholder = promptExamples[exampleIndex];
  if (!placeholderOverlay.hidden) schedulePlaceholder(240);
}

syncPlaceholder();
promptInput.addEventListener('input', syncPlaceholder);
document.querySelector('#prompt-field').addEventListener('prompt:submit', () => {
  document.documentElement.classList.add('has-submitted-prompt');
  syncPlaceholder();
});
document.addEventListener('visibilitychange', syncPlaceholder);
window.addEventListener('pageshow', syncPlaceholder);
reducedPlaceholderMotion.addEventListener('change', () => {
  exampleIndex = 0;
  syncPlaceholder();
});

let previewedCard = null;
let savedPrompt = '';
let restoreTimer = null;
let cardClickAnimation = null;

document.querySelector('#prompt-field').addEventListener('prompt:submit', () => {
  clearTimeout(restoreTimer);
  previewedCard?.classList.remove('is-previewed');
  previewedCard = null;
  savedPrompt = '';
});

function setGalleryPrompt(value) {
  promptInput.value = value;
  promptInput.dispatchEvent(new Event('input', { bubbles: true }));
}

function previewGalleryCard(card) {
  clearTimeout(restoreTimer);
  if (!previewedCard) savedPrompt = promptInput.value;
  previewedCard?.classList.remove('is-previewed');
  previewedCard = card;
  card.classList.add('is-previewed');
  setGalleryPrompt(card.dataset.prompt);
}

function restoreGalleryPrompt() {
  if (!previewedCard) return;
  previewedCard.classList.remove('is-previewed');
  previewedCard = null;
  setGalleryPrompt(savedPrompt);
}

function animateCardClick(card) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !card.animate) return;
  cardClickAnimation?.cancel();

  cardClickAnimation = card.animate([
    { scale: '1', offset: 0, easing: 'cubic-bezier(.4, 0, .6, 1)' },
    { scale: '.97', offset: .3, easing: 'cubic-bezier(.16, 1, .3, 1)' },
    { scale: '1.018', offset: .68, easing: 'ease-out' },
    { scale: '1', offset: 1 }
  ], { duration: 700 });
}

galleryCards.forEach(card => {
  card.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') previewGalleryCard(card);
  });
  card.addEventListener('pointerleave', () => {
    restoreTimer = setTimeout(restoreGalleryPrompt, 90);
  });
  card.addEventListener('focus', () => previewGalleryCard(card));
  card.addEventListener('blur', () => {
    restoreTimer = setTimeout(restoreGalleryPrompt, 90);
  });
  card.addEventListener('click', () => {
    clearTimeout(restoreTimer);
    setGalleryPrompt(card.dataset.prompt);
    animateCardClick(card);
    savedPrompt = promptInput.value;
    previewedCard?.classList.remove('is-previewed');
    previewedCard = null;
  });
});

promptInput.addEventListener('input', event => {
  if (event.isTrusted && previewedCard) {
    clearTimeout(restoreTimer);
    previewedCard.classList.remove('is-previewed');
    previewedCard = null;
  }
});
