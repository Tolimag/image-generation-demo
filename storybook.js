(() => {
  const samplePrompt = 'A cinematic portrait of an elegant Afghan hound resting in a lush garden, soft afternoon light, editorial photography.';
  const longPrompt = 'An imaginative editorial scene with delicate glass flowers and reflective chrome forms. Soft daylight filters through the garden while tiny butterflies drift between the petals. Rich texture, subtle shadows, balanced composition, highly detailed photography.';
  const stories = [
    { id: 'prompt', title: 'Поле промпта', summary: 'Ввод текста, референсы и настройки генерации в одном компоненте.',
      description: 'Поле на экране используется без подмены разметки. Здесь можно проверить две базовые строки на десктопе, вложения, загрузку и статичный плейсхолдер после отправки.',
      interactions: 'Введите свой текст, смените модель, добавьте референсы или перетащите изображение в превью. Команды ⌘/Ctrl + Enter и настройки работают как на экране.',
      variants: [
        { id: 'default', label: 'Пустое поле' },
        { id: 'submitted', label: 'После отправки' },
        { id: 'filled', label: 'С текстом', prompt: samplePrompt },
        { id: 'multiline', label: 'Много строк', prompt: longPrompt },
        { id: 'references', label: 'С референсами', prompt: samplePrompt, references: 8 },
        { id: 'focus', label: 'Фокус' },
        { id: 'dragging', label: 'Drag & drop' },
        { id: 'loading', label: 'Загрузка', prompt: samplePrompt }
      ] },
    { id: 'input', title: 'Инпут промпта', summary: 'Текстовое поле отдельно от панели настроек.',
      description: 'Можно отдельно проверить анимированный и статичный плейсхолдер, фокус и плавный рост текста. На мобильной ширине базовая высота — одна строка.',
      interactions: 'Введите текст, добавьте переносы строк и проверьте цвет каретки и поведение при фокусе.',
      variants: [
        { id: 'default', label: 'Пустой' },
        { id: 'submitted', label: 'После отправки' },
        { id: 'filled', label: 'С текстом', prompt: samplePrompt },
        { id: 'multiline', label: 'Много строк', prompt: longPrompt },
        { id: 'focus', label: 'Фокус' }
      ] },
    { id: 'model', title: 'Селектор модели', summary: 'Выбор и поиск модели генерации.',
      description: 'Открывает список из 17 моделей. Настройки поля зависят от выбранной модели.',
      interactions: 'Откройте меню, попробуйте поиск и выберите модель. Клавиши со стрелками и Escape доступны в меню.',
      variants: [
        { id: 'default', label: 'Закрыт' },
        { id: 'open', label: 'Список открыт' },
        { id: 'search', label: 'Поиск моделей' }
      ] },
    { id: 'settings', title: 'Кнопки настроек', summary: 'Набор кнопок меняется вместе с моделью.',
      description: 'Состав кнопок берётся из конфигурации модели: референсы, пропорции, качество, разрешение, фон или LoRA.',
      interactions: 'Переключайте модели и кликайте по настройкам, чтобы проверить доступные значения.',
      variants: [
        { id: 'default', label: 'Обычное состояние' },
        { id: 'filled', label: 'С референсами', references: 3 },
        { id: 'expanded', label: 'Открытая настройка', menuKind: 'aspect' }
      ] },
    { id: 'setting', title: 'Кнопка настройки', summary: 'Одна кнопка с иконкой и значением.',
      description: 'Вкладка выделяет выбранную настройку из реального набора кнопок модели.',
      interactions: 'Наводите курсор, открывайте меню и переключайте варианты для разных типов настроек.',
      variants: [
        { id: 'aspect', label: 'Пропорции', menuKind: 'aspect' },
        { id: 'quality', label: 'Качество', menuKind: 'quality' },
        { id: 'resolution', label: 'Разрешение', menuKind: 'resolution' },
        { id: 'background', label: 'Фон', menuKind: 'background', model: 'gpt-image' },
        { id: 'references', label: 'Референсы', menuKind: 'references', references: 2 },
        { id: 'lora', label: 'LoRA', menuKind: 'lora', model: 'z-image' }
      ] },
    { id: 'menu', title: 'Меню настройки', summary: 'Отдельные варианты меню для каждого типа настройки.',
      description: 'Опции и заголовки взяты из выбранной модели. Меню изображений показывает сетку из трёх колонок, прокрутку и действия загрузки и выбора ассета.',
      interactions: 'Проверьте выбранное значение, навигацию стрелками, закрытие по Escape и переключение модели.',
      variants: [
        { id: 'aspect', label: 'Пропорции', menuKind: 'aspect' },
        { id: 'quality', label: 'Качество', menuKind: 'quality' },
        { id: 'resolution', label: 'Разрешение', menuKind: 'resolution' },
        { id: 'background', label: 'Фон', menuKind: 'background', model: 'gpt-image' },
        { id: 'references', label: 'Референсы', menuKind: 'references', references: 2 },
        { id: 'lora', label: 'Библиотека LoRA', menuKind: 'lora', model: 'z-image' }
      ] },
    { id: 'references', title: 'Лента референсов', summary: 'Вложения в одной строке с горизонтальной прокруткой.',
      description: 'Лента использует настоящие стили карточек, кнопки удаления и затухание по краям.',
      interactions: 'Прокрутите ленту в обе стороны и наведите на карточку, чтобы увидеть кнопку удаления.',
      variants: [
        { id: 'one', label: 'Один референс', references: 1 },
        { id: 'several', label: 'Несколько', references: 5 },
        { id: 'overflow', label: 'Переполнение', references: 16 },
        { id: 'maximum', label: 'Лимит модели', references: 16 }
      ] },
    { id: 'attachment', title: 'Ассет', summary: 'Миниатюра ассета, его источник, загрузка и ошибка.',
      description: 'Ассет использует ту же миниатюру и значок источника, что и лента референсов.',
      interactions: 'Переключайте обычное состояние, наведение, загрузку и ошибку.',
      variants: [
        { id: 'default', label: 'Обычное состояние', references: 1 },
        { id: 'hovered', label: 'Наведение', references: 1 },
        { id: 'loading', label: 'Загрузка', references: 1 },
        { id: 'error', label: 'Ошибка загрузки', references: 1 }
      ] },
    { id: 'stepper', title: 'Степпер результатов', summary: 'Количество изображений от 1 до 4.',
      description: 'Текущее число выделено белым, лимит серым. На границах соответствующая кнопка выключается.',
      interactions: 'Нажимайте плюс и минус, проверяйте disabled состояние и навигацию с клавиатуры.',
      variants: [
        { id: 'one', label: '1 / 4', results: 1 },
        { id: 'two', label: '2 / 4', results: 2 },
        { id: 'three', label: '3 / 4', results: 3 },
        { id: 'four', label: '4 / 4', results: 4 }
      ] },
    { id: 'submit', title: 'Кнопка отправки', summary: 'Обычное, готовое и загрузочное состояния.',
      description: 'Демонстрационная кнопка остаётся фиолетовой даже при пустом поле. Отправка без текста возвращает фокус в поле.',
      interactions: 'Проверьте наведение, нажатие, фокус клавиатурой и анимацию загрузки.',
      variants: [
        { id: 'empty', label: 'Пустой промпт' },
        { id: 'ready', label: 'Готова к отправке', prompt: samplePrompt },
        { id: 'loading', label: 'Загрузка', prompt: samplePrompt }
      ] },
    { id: 'generation', title: 'Сетка генерации', summary: 'Запрос с ассетами и результаты: загрузка, частичная готовность и завершение.',
      description: 'Как в чате, исходный запрос и добавленные изображения собраны вместе. Результаты стоят рядом на широком экране и листаются вбок на телефоне.',
      interactions: 'Переключайте число результатов, референсы, пропорции и ширину сцены. Retry повторяет генерацию, Delete закрывает результат.',
      variants: [
        { id: 'loading', label: 'Загрузка', prompt: samplePrompt, results: 2, aspect: '2:3', references: 3 },
        { id: 'partial', label: 'Часть готова', prompt: samplePrompt, results: 2, aspect: '2:3', references: 3 },
        { id: 'ready', label: 'Результаты готовы', prompt: samplePrompt, results: 2, aspect: '2:3', references: 3 },
        { id: 'four', label: 'Четыре результата', phase: 'ready', prompt: samplePrompt, results: 4, references: 4 },
        { id: 'plain', label: 'Без референсов', phase: 'ready', prompt: samplePrompt, results: 2, aspect: '2:3', references: 0 },
        { id: 'error', label: 'Ошибка генерации', prompt: samplePrompt, results: 2, aspect: '2:3', references: 3 }
      ] },
    { id: 'result-card', title: 'Карточка результата', summary: 'Одна карточка сетки и её состояния.',
      description: 'Карточка результата показывает модель, круговой прогресс, изображение, доступные действия и ошибку.',
      interactions: 'Переключайте состояние и пропорции. В готовом состоянии доступно скачивание и отметка избранного.',
      variants: [
        { id: 'loading', label: 'Загрузка', prompt: samplePrompt },
        { id: 'ready', label: 'Готово', prompt: samplePrompt },
        { id: 'hovered', label: 'Наведение', prompt: samplePrompt },
        { id: 'error', label: 'Ошибка', prompt: samplePrompt }
      ] },
    { id: 'gallery', title: 'Галерея', summary: 'Пять примеров изображений на главном экране.',
      description: 'Карточки показывают пример промпта при наведении. Клик закрепляет промпт в поле ввода.',
      interactions: 'Наводите курсор и кликайте по изображениям. Переключайте выбранную карточку в настройках.',
      variants: [
        { id: 'default', label: 'Обычное состояние' },
        { id: 'hovered', label: 'Выделенная карточка', card: 1 }
      ] },
    { id: 'card', title: 'Карточка примера', summary: 'Одна карточка отдельно от галереи.',
      description: 'Позволяет рассмотреть рамку, масштабирование и отклик на клик без остальных карточек.',
      interactions: 'Наведите курсор или кликните по карточке. В настройках выберите одно из пяти изображений.',
      variants: [
        { id: 'default', label: 'Обычное состояние' },
        { id: 'hovered', label: 'Наведение' },
        { id: 'clicked', label: 'Отклик на клик' }
      ] },
    { id: 'hero', title: 'Заголовок экрана', summary: 'Заголовок и пояснение отдельно от остального экрана.',
      description: 'Показывает типографику, цвет пояснения и градиентную анимацию заголовка.',
      interactions: 'Измените ширину превью, чтобы проверить перенос текста на узком экране.',
      variants: [{ id: 'default', label: 'По умолчанию' }] }
  ];
  const storyById = new Map(stories.map(story => [story.id, story]));
  const edits = new Map();
  const frame = document.querySelector('#story-frame');
  const nav = document.querySelector('#component-nav');
  const controls = document.querySelector('#story-controls');
  const canvas = document.querySelector('#story-canvas');
  const docs = document.querySelector('#story-docs');
  let currentStory = stories[0];
  let currentVariant = currentStory.variants[0];
  let frameReady = false;

  const editKey = () => `${currentStory.id}/${currentVariant.id}`;
  function route() {
    const [storyId, variantId] = decodeURIComponent(location.hash.slice(1)).split('/');
    if (storyId === 'feedback') {
      const story = storyById.get('generation');
      const mappedId = variantId === 'progress' ? 'loading' : variantId === 'success' ? 'ready' : 'error';
      return { story, variant: story.variants.find(item => item.id === mappedId) || story.variants[0] };
    }
    const story = storyById.get(storyId) || stories[0];
    const variant = story.variants.find(item => item.id === variantId) || story.variants[0];
    return { story, variant };
  }
  function modelFor(state) { return IMAGE_MODELS.find(item => item.id === state.model) || IMAGE_MODELS.find(item => item.id === 'gpt-image-2'); }
  function currentState() {
    const draft = edits.get(editKey()) || {};
    const state = { component: currentStory.id, variant: currentVariant.id, model: 'gpt-image-2', prompt: '', references: 0, results: 1, aspect: '1:1', card: 0,
      ...currentVariant, ...draft };
    const model = modelFor(state);
    const defaults = initialModelSettings(model);
    state.model = model.id;
    state.references = Math.min(model.references, Math.max(0, Number(state.references) || 0));
    state.results = Math.min(4, Math.max(1, Number(state.results) || 1));
    state.card = Math.min(4, Math.max(0, Number(state.card) || 0));
    state.aspect = model.ratios.includes(state.aspect) ? state.aspect : defaults.aspect;
    for (const kind of ['quality', 'resolution', 'background']) state[kind] = model[kind]?.includes(state[kind]) ? state[kind] : defaults[kind];
    return state;
  }
  function sendState() {
    if (frameReady && frame.contentWindow) frame.contentWindow.postMessage({ type: 'workroom:show-story', state: currentState() }, '*');
  }
  function setEdit(name, value, rebuild = false) {
    edits.set(editKey(), { ...(edits.get(editKey()) || {}), [name]: value });
    if (rebuild) renderControls();
    sendState();
  }
  function addSelect(name, label, value, options, rebuild = false) {
    const wrapper = document.createElement('label'); wrapper.className = 'control-field'; wrapper.textContent = label;
    const select = document.createElement('select'); select.name = name;
    options.forEach(option => {
      const opt = document.createElement('option');
      opt.value = String(option.value); opt.textContent = option.label;
      select.append(opt);
    });
    select.value = String(value);
    select.addEventListener('change', () => setEdit(name, ['references', 'results', 'card'].includes(name) ? Number(select.value) : select.value, rebuild));
    wrapper.append(select); controls.append(wrapper);
  }
  function addText(name, label, value) {
    const wrapper = document.createElement('label'); wrapper.className = 'control-field control-field--text'; wrapper.textContent = label;
    const textarea = document.createElement('textarea'); textarea.name = name; textarea.value = value;
    textarea.addEventListener('input', () => setEdit(name, textarea.value));
    wrapper.append(textarea); controls.append(wrapper);
  }
  function renderControls() {
    controls.replaceChildren();
    const state = currentState();
    const model = modelFor(state);
    const variantLabel = document.createElement('label'); variantLabel.className = 'control-field'; variantLabel.textContent = 'Вариант';
    const variantSelect = document.createElement('select'); variantSelect.name = 'variant';
    currentStory.variants.forEach(variant => { const option = document.createElement('option'); option.value = variant.id; option.textContent = variant.label; variantSelect.append(option); });
    variantSelect.value = currentVariant.id;
    variantSelect.addEventListener('change', () => { location.hash = `#${currentStory.id}/${variantSelect.value}`; });
    variantLabel.append(variantSelect); controls.append(variantLabel);
    if (['prompt', 'model', 'settings', 'setting', 'menu', 'references', 'attachment', 'submit', 'generation', 'result-card'].includes(currentStory.id)) {
      const compatibleModels = IMAGE_MODELS.filter(item => {
        if (['references', 'attachment'].includes(currentStory.id)) return item.references > 0;
        if (['setting', 'menu'].includes(currentStory.id)) {
          if (state.menuKind === 'references') return item.references > 0;
          if (state.menuKind === 'lora') return Boolean(item.lora);
          return state.menuKind === 'aspect' || Boolean(item[state.menuKind]);
        }
        return true;
      });
      addSelect('model', 'Модель', state.model, compatibleModels.map(item => ({ value: item.id, label: item.name })), true);
    }
    if (['prompt', 'input', 'submit', 'generation', 'result-card'].includes(currentStory.id)) addText('prompt', 'Текст промпта', state.prompt);
    if (['prompt', 'settings', 'setting', 'menu', 'references', 'attachment'].includes(currentStory.id) && model.references) {
      addSelect('references', 'Референсы', state.references, Array.from({ length: model.references + 1 }, (_, index) => ({ value: index, label: `${index} / ${model.references}` })));
    }
    if (['prompt', 'settings', 'setting', 'menu', 'generation', 'result-card'].includes(currentStory.id)) {
      addSelect('aspect', 'Пропорции', state.aspect, model.ratios.map(value => ({ value, label: value })));
      for (const [kind, label] of [['quality', 'Качество'], ['resolution', 'Разрешение'], ['background', 'Фон']]) {
        if (model[kind]) addSelect(kind, label, state[kind], model[kind].map(value => ({ value, label: displaySettingLabel(value) })));
      }
    }
    if (['prompt', 'stepper', 'generation'].includes(currentStory.id)) addSelect('results', 'Результаты', state.results, [1, 2, 3, 4].map(value => ({ value, label: `${value} / 4` })));
    if (['gallery', 'card'].includes(currentStory.id)) addSelect('card', 'Карточка', state.card, [1, 2, 3, 4, 5].map(value => ({ value: value - 1, label: `Карточка ${value}` })));
    if (!controls.querySelectorAll('.control-field').length) {
      const note = document.createElement('p'); note.className = 'control-help'; note.textContent = 'Для этого состояния дополнительных настроек нет.'; controls.append(note);
    }
  }
  function displaySettingLabel(value) { return value.replace(/^[a-z]/, letter => letter.toUpperCase()); }
  function renderDocs() {
    document.querySelector('#docs-description').textContent = currentStory.description;
    document.querySelector('#docs-interactions').textContent = currentStory.interactions;
    const list = document.querySelector('#docs-variants'); list.replaceChildren();
    currentStory.variants.forEach(variant => { const li = document.createElement('li'); li.textContent = variant.label; list.append(li); });
    const sources = document.querySelector('#docs-sources'); sources.replaceChildren();
    const files = ['index.html', 'styles.css', 'app.js'];
    if (['generation', 'result-card'].includes(currentStory.id)) files.push('generation-grid.js');
    if (['model', 'settings', 'setting', 'menu', 'references', 'attachment', 'generation', 'result-card'].includes(currentStory.id)) files.push('models.js');
    files.forEach(file => {
      const item = document.createElement('li');
      const link = document.createElement('a'); link.href = `./${file}`; link.textContent = file; link.target = '_blank'; link.rel = 'noopener';
      item.append(link); sources.append(item);
    });
  }
  function renderNav() {
    [...nav.children].forEach(button => button.setAttribute('aria-current', button.dataset.story === currentStory.id ? 'page' : 'false'));
  }
  function render() {
    ({ story: currentStory, variant: currentVariant } = route());
    document.querySelector('#story-path-name').textContent = currentStory.title;
    document.querySelector('#story-title').textContent = currentStory.title;
    document.querySelector('#story-summary').textContent = currentStory.summary;
    document.querySelector('#canvas-caption').textContent = `${currentStory.title} · ${currentVariant.label}`;
    renderNav(); renderControls(); renderDocs(); sendState();
  }
  function setTab(which) {
    const isCanvas = which === 'canvas';
    canvas.hidden = !isCanvas; docs.hidden = isCanvas;
    document.querySelector('#canvas-tab').setAttribute('aria-selected', String(isCanvas));
    document.querySelector('#docs-tab').setAttribute('aria-selected', String(!isCanvas));
  }

  stories.forEach(story => {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.story = story.id; button.textContent = story.title;
    button.addEventListener('click', () => { const next = `#${story.id}/${story.variants[0].id}`; if (location.hash === next) render(); else location.hash = next; });
    nav.append(button);
  });
  document.querySelector('#canvas-tab').addEventListener('click', () => setTab('canvas'));
  document.querySelector('#docs-tab').addEventListener('click', () => setTab('docs'));
  document.querySelector('.story-tabs').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const target = ['ArrowRight', 'End'].includes(event.key) ? document.querySelector('#docs-tab') : document.querySelector('#canvas-tab');
    target.focus(); target.click();
  });
  document.querySelector('#reset-controls').addEventListener('click', () => { edits.delete(editKey()); renderControls(); sendState(); });
  document.querySelector('#viewport-select').addEventListener('change', event => {
    frame.style.width = { fluid: '100%', wide: '1400px', desktop: '1100px', tablet: '768px', mobile: '390px' }[event.target.value];
  });
  window.addEventListener('hashchange', render);
  window.addEventListener('message', event => {
    if (event.source !== frame.contentWindow) return;
    if (event.data?.type === 'workroom:story-ready') { frameReady = true; sendState(); }
    if (event.data?.type === 'workroom:story-change') {
      edits.set(editKey(), { ...(edits.get(editKey()) || {}), ...event.data.value });
      renderControls();
    }
  });
  render();
  frame.src = './index.html?storybook=1';
})();
