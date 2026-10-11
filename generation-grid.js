// Results use the same screen and component in the main page and Storybook.
class GenerationGrid {
  constructor(root, promptField) {
    this.root = root;
    this.promptField = promptField;
    this.phase = 'idle';
    this.request = null;
    this.result = null;
    this.revealTimers = [];
    this.readyCount = 0;
    this.favorites = new Set();
    this.feedbackChoice = null;
    this.referenceUrls = [];
    this.previewObserver = null;
    this.copyFeedbackTimer = null;
    this.mobileActionsLayout = window.matchMedia('(max-width: 600px)');
    this.stackedActionsLayout = window.matchMedia('(max-width: 780px)');
    this.mobileActionsLayout.addEventListener('change', () => this.placeActions());
    this.stackedActionsLayout.addEventListener('change', () => this.placeActions());
    this.viewer = document.querySelector('#image-viewer');
    this.viewerStage = this.viewer.querySelector('.image-viewer-stage');
    this.viewerImage = this.viewer.querySelector('.image-viewer-image');
    this.composerRegion = document.querySelector('.composer-region');
    this.composerSlot = document.createComment('composer home');
    this.composerRegion.before(this.composerSlot);
    this.menuSlot = document.createComment('menu home');
    promptField.menuLayer.before(this.menuSlot);
    this.fileSlot = document.createComment('file input home');
    promptField.fileInput.before(this.fileSlot);
    this.viewerTrigger = null;
    this.viewerDraft = null;
    this.viewerSource = null;
    this.viewerSubmitted = false;
    this.viewer.addEventListener('click', event => {
      if (event.target === this.viewer || event.target === this.viewerStage || event.target.closest('.image-viewer-close')) this.viewer.close();
    });
    this.viewer.addEventListener('close', () => {
      promptField.closeMenu();
      this.composerSlot.after(this.composerRegion);
      this.menuSlot.after(promptField.menuLayer);
      this.fileSlot.after(promptField.fileInput);
      if (this.viewerDraft && !this.viewerSubmitted) {
        promptField.references.forEach(asset => {
          if (asset !== this.viewerSource && !this.viewerDraft.references.includes(asset) && !asset.libraryId && asset.url.startsWith('blob:')) URL.revokeObjectURL(asset.url);
        });
        promptField.references = this.viewerDraft.references;
        promptField.renderAttachments();
        promptField.input.value = this.viewerDraft.prompt;
        promptField.input.dispatchEvent(new Event('input', { bubbles: true }));
        promptField.emitChange();
      }
      this.viewerImage.removeAttribute('src');
      if (this.viewerTrigger?.isConnected) this.viewerTrigger.focus({ preventScroll: true });
      this.viewerTrigger = null;
      this.viewerDraft = null;
      this.viewerSource = null;
      this.viewerSubmitted = false;
    });

    const inStorybook = () => document.documentElement.classList.contains('story-mode');
    promptField.root.addEventListener('prompt:submit', event => {
      if (!inStorybook()) this.start(event.detail);
      if (this.viewer.open) {
        this.viewerSubmitted = true;
        this.viewerDraft?.references.forEach(asset => { if (!asset.libraryId && asset.url.startsWith('blob:')) URL.revokeObjectURL(asset.url); });
        this.viewer.close();
      }
    });
    promptField.root.addEventListener('prompt:complete', event => { if (!inStorybook()) this.complete(event.detail.result); });
    promptField.root.addEventListener('prompt:error', () => { if (!inStorybook()) this.fail(); });
    root.addEventListener('click', event => this.handleAction(event));
    root.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const preview = event.target.closest('.generation-prompt-preview');
      if (!preview || event.target !== preview) return;
      event.preventDefault();
      this.copyPrompt(preview);
    });
  }

  start(request) {
    this.stopTimers();
    this.setRequest(request);
    this.result = null;
    this.favorites.clear();
    this.feedbackChoice = null;
    this.phase = 'loading';
    this.readyCount = 0;
    this.render();
  }

  complete(result) {
    if (!this.request) return;
    this.stopTimers();
    this.result = result;
    this.phase = 'partial';
    this.readyCount = 0;
    this.render();
    const count = Math.min(4, Math.max(1, Number(this.request.resultCount) || 1));
    const images = this.resultImages();
    for (let index = 0; index < count; index++) {
      this.revealTimers.push(window.setTimeout(() => {
        this.readyCount = index + 1;
        if (this.readyCount === count) this.phase = 'ready';
        this.root.querySelectorAll('.generation-card')[index]?.replaceWith(this.renderCard(index, images[index]));
        this.root.dataset.phase = this.phase;
        this.root.querySelector('.generation-status').textContent =
          this.phase === 'ready' ? 'Images ready' : 'Some images are ready';
        if (this.phase === 'ready') this.renderActions();
      }, 120 * (index + 1)));
    }
  }

  fail() {
    if (!this.request) return;
    this.stopTimers();
    this.phase = 'error';
    this.readyCount = 0;
    this.render();
  }

  clear() {
    if (this.viewer.open) this.viewer.close();
    this.stopTimers();
    window.clearTimeout(this.copyFeedbackTimer);
    this.previewObserver?.disconnect();
    this.previewObserver = null;
    this.releaseReferenceUrls();
    this.phase = 'idle';
    this.request = null;
    this.result = null;
    this.feedbackChoice = null;
    this.root.hidden = true;
    this.root.replaceChildren();
    document.querySelector('.page').classList.remove('has-generation');
    document.documentElement.classList.remove('has-generation');
  }

  stopTimers() {
    this.revealTimers.forEach(timer => window.clearTimeout(timer));
    this.revealTimers = [];
  }

  releaseReferenceUrls() {
    this.referenceUrls.forEach(url => URL.revokeObjectURL(url));
    this.referenceUrls = [];
  }

  setRequest(request) {
    this.releaseReferenceUrls();
    const referencePreviews = (request.references || []).map((reference, index) => {
      const file = reference?.file || reference;
      let url = typeof reference === 'string' ? reference : reference?.url;
      if (!url && file instanceof Blob) {
        url = URL.createObjectURL(file);
        this.referenceUrls.push(url);
      }
      return { url, name: file?.name || `Reference ${index + 1}`, source: reference?.source || 'references' };
    }).filter(reference => reference.url);
    this.request = { ...request, referencePreviews };
  }

  showDemo({ phase = 'ready', prompt, modelName = 'GPT Image 2', resultCount = 4, aspectRatio = '1:1', references = [] } = {}) {
    this.stopTimers();
    this.favorites.clear();
    this.feedbackChoice = null;
    this.setRequest({
      prompt: prompt || 'A portrait of a young woman with a natural afro hairstyle, sitting at the beach during golden hour',
      modelName,
      resultCount: Math.min(4, Math.max(1, Number(resultCount) || 1)),
      aspectRatio,
      references
    });
    this.result = null;
    this.phase = phase;
    this.readyCount = phase === 'partial' ? 1 : phase === 'ready' ? this.request.resultCount : 0;
    this.render();
  }

  resultImages() {
    const result = this.result;
    const images = Array.isArray(result) ? result : Array.isArray(result?.images) ? result.images : [];
    return images.map(image => typeof image === 'string' ? image : image?.url || image?.src).filter(Boolean);
  }

  render() {
    if (!this.request) return this.clear();
    window.clearTimeout(this.copyFeedbackTimer);
    this.previewObserver?.disconnect();
    this.previewObserver = null;
    const request = this.request;
    const count = Math.min(4, Math.max(1, Number(request.resultCount) || 1));
    const images = this.resultImages();
    this.root.replaceChildren();
    this.root.hidden = false;
    this.root.dataset.phase = this.phase;
    document.querySelector('.page').classList.add('has-generation');
    document.documentElement.classList.add('has-generation');

    const body = document.createElement('div');
    body.className = 'generation-results';
    body.style.setProperty('--result-columns', Math.min(count, 2));
    body.dataset.count = String(count);
    const promptColumn = document.createElement('div');
    promptColumn.className = 'generation-prompt-column';
    const preview = document.createElement('div');
    preview.className = 'generation-prompt-preview';
    if (request.prompt) {
      preview.tabIndex = 0;
      preview.setAttribute('role', 'button');
      preview.setAttribute('aria-label', 'Copy full prompt');
      preview.dataset.copyLabel = 'Copy prompt';
    } else {
      preview.classList.add('is-empty-prompt');
    }
    const previewText = document.createElement('p');
    previewText.textContent = request.prompt || 'No prompt used';
    preview.append(previewText);
    const copyStatus = document.createElement('span');
    copyStatus.className = 'sr-only';
    copyStatus.setAttribute('role', 'status');
    preview.append(copyStatus);
    if (request.referencePreviews.length) {
      const references = document.createElement('div');
      references.className = 'generation-prompt-assets';
      references.setAttribute('aria-label', `${request.referencePreviews.length} image references`);
      request.referencePreviews.forEach((reference, index) => {
        const asset = document.createElement('div');
        asset.className = 'attachment-item generation-reference-item';
        const { tile, image } = createAssetThumbnail({
          name: reference.name,
          source: reference.source,
          sourceLabel: 'References'
        });
        image.src = reference.url;
        image.alt = `Reference ${index + 1}: ${reference.name}`;
        asset.append(tile);
        references.append(asset);
      });
      preview.append(references);
    }
    const cards = document.createElement('div');
    cards.className = 'generation-card-strip';
    promptColumn.append(preview);
    body.append(promptColumn, cards);
    for (let index = 0; index < count; index++) cards.append(this.renderCard(index, images[index]));

    const status = document.createElement('span');
    status.className = 'sr-only generation-status';
    status.setAttribute('role', 'status');
    status.textContent = this.phase === 'loading' ? 'Generating images' :
      this.phase === 'partial' ? 'Some images are ready' :
      this.phase === 'error' ? 'Generation failed' : 'Images ready';
    this.root.append(body, status);
    const syncPromptPreview = () => {
      const cardsHeight = cards.getBoundingClientRect().height;
      if (!cardsHeight) return;
      const references = preview.querySelector('.generation-prompt-assets');
      const referencesHeight = references ? references.getBoundingClientRect().height + 8 : 0;
      const lineHeight = parseFloat(getComputedStyle(previewText).lineHeight) || 22;
      const visibleLines = Math.max(1, Math.floor((cardsHeight - 32 - referencesHeight) / lineHeight));
      preview.style.maxHeight = `${cardsHeight}px`;
      preview.style.setProperty('--prompt-lines', visibleLines);
    };
    syncPromptPreview();
    if ('ResizeObserver' in window) {
      this.previewObserver = new ResizeObserver(syncPromptPreview);
      this.previewObserver.observe(cards);
    }
    if (this.phase === 'ready' || this.phase === 'error') this.renderActions();
  }

  renderCard(index, resultImage) {
    const isReady = this.phase === 'ready' || this.phase === 'partial' && index < this.readyCount;
    const card = document.createElement('div');
    card.className = `generation-card is-${isReady ? 'ready' : this.phase === 'error' ? 'error' : 'loading'}`;
    card.classList.toggle('is-favorite', this.favorites.has(index));
    card.dataset.index = index;
    card.style.setProperty('--shimmer-delay', `${index * -.35}s`);
    card.style.aspectRatio = (this.request.aspectRatio || '1:1').replace(':', ' / ');
    if (isReady) {
      const image = document.createElement('img');
      image.className = 'generation-card-image';
      image.src = resultImage || './assets/generation-result.jpg';
      image.alt = `Generated image ${index + 1}`;
      const previewButton = document.createElement('button');
      previewButton.type = 'button';
      previewButton.className = 'generation-card-preview';
      previewButton.dataset.action = 'open';
      previewButton.setAttribute('aria-label', `View generated image ${index + 1} full screen`);
      previewButton.append(image);
      card.append(previewButton);
      const overlay = document.createElement('div');
      overlay.className = 'generation-card-overlay';
      const tools = document.createElement('div');
      tools.className = 'generation-card-tools';
      const download = document.createElement('a');
      download.className = 'generation-card-tool';
      download.href = image.src;
      download.download = `generation-${index + 1}.jpg`;
      download.title = 'Download image';
      download.setAttribute('aria-label', `Download image ${index + 1}`);
      const downloadIcon = document.createElement('img');
      downloadIcon.src = './assets/download.svg';
      downloadIcon.alt = '';
      download.append(downloadIcon);
      tools.append(download, this.actionButton('favorite', 'Favorite', './assets/star.svg', index));
      overlay.append(tools);
      card.append(overlay);
    } else if (this.phase === 'error') {
      const error = document.createElement('span');
      error.className = 'generation-card-error';
      error.textContent = '!';
      error.setAttribute('aria-label', 'Generation failed');
      card.append(error);
    } else {
      const loading = document.createElement('div');
      loading.className = 'generation-loading';
      const spinner = document.createElement('span');
      spinner.className = 'generation-loading-spinner';
      spinner.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = 'Generating';
      loading.append(spinner, label);
      card.append(loading);
    }
    return card;
  }

  actionButton(action, label, iconPath, index, disabled = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = action;
    if (index !== undefined) button.dataset.index = index;
    button.className = index === undefined ? 'generation-grid-action' : 'generation-card-tool';
    button.title = disabled ? `${label} is not available in this preview` : label;
    button.setAttribute('aria-label', index === undefined ? label : `${label} image ${index + 1}`);
    button.disabled = disabled;
    if (action === 'favorite') {
      const selected = this.favorites.has(index);
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', selected ? `Remove image ${index + 1} from favorites` : `Add image ${index + 1} to favorites`);
      button.title = selected ? 'Remove from favorites' : 'Add to favorites';
    }
    if (action === 'like' || action === 'dislike') {
      const selected = this.feedbackChoice === action;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('is-selected', selected);
    }
    const icon = document.createElement('img');
    icon.src = action === 'favorite' && this.favorites.has(index) ? './assets/star-filled.svg' : iconPath;
    icon.alt = '';
    button.append(icon);
    return button;
  }

  renderActions() {
    if (this.root.querySelector('.generation-grid-actions')) return;
    const actions = document.createElement('div');
    actions.className = 'generation-grid-actions';
    actions.append(
      this.actionButton('retry', 'Retry', './assets/rotate-ccw.svg'),
      this.actionButton('delete', 'Delete', './assets/trash-2.svg'),
      this.actionButton('like', 'Like', './assets/thumbs-up.svg'),
      this.actionButton('dislike', 'Dislike', './assets/thumbs-down.svg')
    );
    const target = this.actionsBelowCards()
      ? this.root.querySelector('.generation-results')
      : this.root.querySelector('.generation-prompt-column');
    target.append(actions);
  }

  actionsBelowCards() {
    const count = Number(this.root.querySelector('.generation-results')?.dataset.count) || 1;
    return this.mobileActionsLayout.matches || (this.stackedActionsLayout.matches && count > 1);
  }

  placeActions() {
    const actions = this.root.querySelector('.generation-grid-actions');
    const target = this.actionsBelowCards()
      ? this.root.querySelector('.generation-results')
      : this.root.querySelector('.generation-prompt-column');
    if (actions && target && actions.parentElement !== target) target.append(actions);
  }

  async retryRequest() {
    const request = { ...this.request };
    const field = this.promptField;
    this.start(request);
    field.state.loading = true;
    field.modelButton.disabled = true;
    field.submitButton.classList.add('is-loading');
    field.submitButton.setAttribute('aria-label', 'Generating');
    field.root.setAttribute('aria-busy', 'true');
    field.updateSubmit();
    try {
      this.complete(await field.onSubmit(request));
    } catch (_) {
      this.fail();
    } finally {
      field.state.loading = false;
      field.modelButton.disabled = false;
      field.submitButton.classList.remove('is-loading');
      field.submitButton.setAttribute('aria-label', 'Generate image');
      field.root.removeAttribute('aria-busy');
      field.updateSubmit();
    }
  }

  async copyPrompt(preview) {
    const prompt = this.request?.prompt;
    if (!prompt) return;
    let copied = false;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(prompt);
      copied = true;
    } catch (_) {
      const field = document.createElement('textarea');
      const activeElement = document.activeElement;
      field.value = prompt;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.append(field);
      field.select();
      try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
      field.remove();
      activeElement?.focus?.({ preventScroll: true });
    }
    if (!preview.isConnected) return;
    window.clearTimeout(this.copyFeedbackTimer);
    preview.classList.toggle('is-copied', copied);
    preview.dataset.copyLabel = copied ? 'Copied' : 'Copy failed';
    preview.querySelector('[role="status"]').textContent = copied ? 'Prompt copied' : 'Could not copy prompt';
    this.copyFeedbackTimer = window.setTimeout(() => {
      preview.classList.remove('is-copied');
      preview.dataset.copyLabel = 'Copy prompt';
    }, 1600);
  }

  openImage(button) {
    const image = button.querySelector('.generation-card-image');
    if (!image) return;
    const field = this.promptField;
    this.viewerTrigger = button;
    this.viewerImage.src = image.currentSrc || image.src;
    this.viewerImage.alt = image.alt;
    this.viewerDraft = { prompt: field.input.value, references: field.references };
    this.viewerSource = {
      file: { name: `generated-image-${Number(button.closest('.generation-card')?.dataset.index) + 1 || 1}.jpg`, type: 'image/jpeg' },
      url: this.viewerImage.src,
      source: 'references',
      status: 'ready',
      libraryId: 'generated-image'
    };
    field.closeMenu();
    field.references = field.model.references ? [this.viewerSource] : [];
    field.renderAttachments();
    field.input.value = '';
    this.viewer.append(this.composerRegion, field.menuLayer, field.fileInput);
    this.viewer.showModal();
    field.input.dispatchEvent(new Event('input', { bubbles: true }));
    field.emitChange();
  }

  handleAction(event) {
    const preview = event.target.closest('.generation-prompt-preview');
    if (preview && this.root.contains(preview)) {
      this.copyPrompt(preview);
      return;
    }
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'open') { this.openImage(button); return; }
    if (action === 'delete') this.clear();
    if (action === 'retry') {
      if (document.documentElement.classList.contains('story-mode')) {
        const previous = this.request;
        this.showDemo({ ...previous, phase: 'loading' });
        this.revealTimers.push(window.setTimeout(() => this.showDemo({ ...previous, phase: 'ready' }), 1300));
      } else this.retryRequest();
    }
    if (action === 'like' || action === 'dislike') {
      this.feedbackChoice = this.feedbackChoice === action ? null : action;
      this.root.querySelectorAll('.generation-grid-action[data-action="like"], .generation-grid-action[data-action="dislike"]').forEach(feedbackButton => {
        const selected = feedbackButton.dataset.action === this.feedbackChoice;
        feedbackButton.setAttribute('aria-pressed', String(selected));
        feedbackButton.classList.toggle('is-selected', selected);
      });
    }
    if (action === 'favorite') {
      const index = Number(button.dataset.index);
      if (this.favorites.has(index)) this.favorites.delete(index);
      else this.favorites.add(index);
      const selected = this.favorites.has(index);
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', selected ? `Remove image ${index + 1} from favorites` : `Add image ${index + 1} to favorites`);
      button.title = selected ? 'Remove from favorites' : 'Add to favorites';
      button.querySelector('img').src = selected ? './assets/star-filled.svg' : './assets/star.svg';
      button.closest('.generation-card')?.classList.toggle('is-favorite', selected);
    }
  }
}

window.GenerationGrid = GenerationGrid;
window.generationGrid = new GenerationGrid(document.querySelector('#generation-grid'), window.promptField);
