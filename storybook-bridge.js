// Keeps component examples tied to the real screen and PromptField implementation.
(() => {
if (document.documentElement.classList.contains('story-mode')) {
  document.documentElement.classList.remove('is-entering');
  const field = window.promptField;
  const galleryCards = [...document.querySelectorAll('.gallery-card')];
  const feedback = document.querySelector('#feedback');
  const validStories = new Set(['prompt', 'input', 'model', 'gallery', 'card', 'hero', 'settings', 'setting', 'menu', 'references', 'attachment', 'stepper', 'submit', 'generation', 'result-card']);
  let applyingStory = false;
  let storyRevision = 0;

  field.root.addEventListener('prompt:change', () => {
    if (applyingStory) return;
    const value = field.getValue();
    window.parent.postMessage({ type: 'workroom:story-change', value: {
      model: value.model, prompt: field.input.value, references: value.references.length,
      results: value.resultCount, aspect: value.aspectRatio,
      quality: value.quality, resolution: value.resolution, background: value.background
    } }, '*');
  });

  function showStory(state) {
    if (!validStories.has(state.component)) return;
    applyingStory = true;
    const revision = ++storyRevision;
    const model = IMAGE_MODELS.find(item => item.id === state.model) || IMAGE_MODELS.find(item => item.id === 'gpt-image-2');
    const story = state.component;
    document.documentElement.classList.toggle('has-submitted-prompt', state.variant === 'submitted' || story === 'generation' || story === 'result-card');
    document.documentElement.dataset.story = story;
    document.documentElement.dataset.variant = state.variant;
    window.generationGrid.clear();
    field.closeMenu();
    clearTimeout(field.feedbackTimer);
    feedback.classList.remove('is-visible');
    feedback.textContent = '';
    field.references.forEach(asset => { if (asset.url.startsWith('blob:')) URL.revokeObjectURL(asset.url); });
    field.modelStates.clear();
    field.model = model;
    field.state = { ...initialModelSettings(model), loading: false };
    for (const kind of ['quality', 'resolution', 'background']) {
      if (model[kind]?.includes(state[kind])) field.state[kind] = state[kind];
    }
    if (model.ratios.includes(state.aspect)) field.state.aspect = state.aspect;
    field.state.results = Math.min(4, Math.max(1, Number(state.results) || 1));
    field.modelButton.disabled = false;
    document.querySelector('#model-name').textContent = model.name;
    field.modelButton.setAttribute('aria-label', `Select model: ${model.name}`);
    field.references = Array.from({ length: Math.min(model.references, Math.max(0, Number(state.references) || 0)) }, (_, index) => ({
      file: { name: `Reference ${index + 1}.png`, type: 'image/png' },
      url: `./assets/gallery-${index % 5 + 1}.png`,
      source: 'references',
      status: story === 'attachment' && ['loading', 'error'].includes(state.variant) ? state.variant : 'ready',
      demoStatus: story === 'attachment'
    }));
    field.renderSettings();
    if (story === 'setting') {
      [...field.settingsElement.children].forEach(button => { button.hidden = button.dataset.menu !== (state.menuKind || 'aspect'); });
    }
    field.renderAttachments();
    field.updateStepper();
    field.input.value = String(state.prompt || '');
    field.input.dispatchEvent(new Event('input', { bubbles: true }));
    field.root.classList.toggle('is-dragging', state.variant === 'dragging');
    const loading = ['prompt', 'submit'].includes(story) && state.variant === 'loading';
    field.state.loading = loading;
    field.root.toggleAttribute('aria-busy', loading);
    field.submitButton.classList.toggle('is-loading', loading);
    field.updateSubmit();
    if (story === 'generation' || story === 'result-card') {
      window.generationGrid.showDemo({
        phase: state.phase || (state.variant === 'hovered' ? 'ready' : state.variant),
        prompt: state.prompt,
        modelName: model.name,
        resultCount: story === 'result-card' ? 1 : state.results,
        aspectRatio: state.aspect,
        references: Array.from({ length: Number(state.references) || 0 }, (_, index) => `./assets/gallery-${index % 5 + 1}.png`)
      });
      if (state.variant === 'hovered') window.generationGrid.root.querySelector('.generation-card')?.classList.add('is-demo-hover');
    }

    const selectedCard = Math.min(4, Math.max(0, Number(state.card) || 0));
    galleryCards.forEach((card, index) => {
      card.hidden = story === 'card' && index !== selectedCard;
      card.classList.toggle('is-previewed', (story === 'card' && index === selectedCard || story === 'gallery' && index === selectedCard) && state.variant === 'hovered');
    });
    if ((story === 'prompt' || story === 'input') && state.variant === 'focus') field.input.focus({ preventScroll: true });
    if (story === 'card' && state.variant === 'clicked') galleryCards[selectedCard].click();

    if (story === 'model' && ['open', 'search'].includes(state.variant)) {
      requestAnimationFrame(() => {
        if (revision !== storyRevision) return;
        field.toggleMenu('model', field.modelButton);
        if (state.variant === 'search') {
          const search = field.activeMenu?.popover.querySelector('input[type="search"]');
          if (search) { search.value = 'Qwen'; search.dispatchEvent(new Event('input', { bubbles: true })); }
        }
      });
    }
    if ((story === 'menu' || story === 'settings' && state.variant === 'expanded') && state.menuKind) {
      requestAnimationFrame(() => {
        if (revision !== storyRevision) return;
        const button = field.settingsElement.querySelector(`[data-menu="${state.menuKind}"]`);
        if (button) field.toggleMenu(state.menuKind, button);
      });
    }
    applyingStory = false;
  }

  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.data?.type !== 'workroom:show-story') return;
    showStory(event.data.state || {});
  });
  window.parent.postMessage({ type: 'workroom:story-ready' }, '*');
}
})();
