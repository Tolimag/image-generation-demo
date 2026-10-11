# Turn Ideas Into Images demo

Open [storybook.html](./storybook.html) for the local component explorer. It works from `file://` like the screen itself, and the top navigation switches between the screen and components. Every component has its own URL fragment (for example `storybook.html#prompt/references`), a canvas, a description, variants, and controls. The canvas loads the real `index.html` in isolation, so edits to its components, styles, and behavior appear in the explorer without maintaining a separate copy. Generation and reference images in the explorer are demo states.

Responsive implementation of the [Figma page layout](https://www.figma.com/design/v89aWRdIAo3I005o1Rdd1i/Workroom-UX-UI?node-id=20967-51652), using the existing interactive [Prompt / Field component](https://www.figma.com/design/v89aWRdIAo3I005o1Rdd1i/Workroom-UX-UI?node-id=20959-45029).

Run a static server in this folder, for example `python3 -m http.server 8000`, then open `http://localhost:8000`.

The field supports prompt entry with animated multiline growth, keyboard submit (`⌘/Ctrl + Enter`), settings menus with arrow-key navigation and Escape, image upload and drop, attachment removal from the thumbnail cross or its menu, a 1–4 result stepper, and submit feedback. The host product can listen for `prompt:change` and `prompt:submit` on `#prompt-field`; the event detail contains the model ID/name, prompt, aspect ratio, result count, supported quality/resolution/background values, and reference `File` objects. Generation is simulated in the demo. Replace the initialization with `new PromptField(root, { onSubmit: async (value) => { /* await your API */ } })` to connect the product API. Loading and failure states follow the returned promise.

The page uses the five gallery images and local SVG assets from Figma. Circe is loaded from the bundled font files, with Arial as a fallback.


## Model selector

`models.js` contains the 17 image models inspected in [Everypixel Picture Lab](https://app.everypixel.com/image?model=gpt-image-2) on 2026-09-27. The selector starts with GPT Image 2, supports search and keyboard navigation, and remembers settings per model for the current page session. The prompt is preserved. References beyond a model's supported limit are retained for switching back, but excluded from its submission payload. Image models use References (or Starter Shot for Flux 1 Kontext Pro), replacing the earlier video-style Start/End Frame controls.

Supported controls: aspect ratio for all models; quality for GPT Image / GPT Image 2; background for GPT Image; resolution for GPT Image 2, Grok, Nano Banana, Qwen Image 2.0, Seedream and Wan families. Z-Image exposes Avatar / Style / Product tabs in LoRA Library. The inspected signed-out library was empty, so the demo shows an empty library; account assets and generation APIs are not connected. Local model IDs are demo identifiers and need mapping to the product API.

New icons are vendored from the official [Lucide repository](https://github.com/lucide-icons/lucide): Sparkles for model selection, Images for references, Rectangle Horizontal for ratio, Sliders Horizontal for quality, Scan for resolution, Blend for background, and Layers for LoRA. License: `assets/LUCIDE-LICENSE`.
