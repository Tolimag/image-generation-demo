// Observed in Picture Lab on 2026-09-27. IDs are local demo identifiers, not API contracts.
const COMMON_RATIOS = ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16'];
const QWEN_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4'];
const IMAGE_MODELS = [
  { id: 'flux-2-klein', name: 'Flux 2 Klein', family: 'Black Forest Labs', speed: 'Fast', size: '1K', references: 3, ratios: COMMON_RATIOS },
  { id: 'flux-2-pro', name: 'Flux 2 Pro', family: 'Black Forest Labs', speed: 'Medium', size: '2K', references: 3, ratios: [...COMMON_RATIOS, '4:5', '5:4', '7:3'] },
  { id: 'flux-1-kontext-pro', name: 'Flux 1 Kontext Pro', family: 'Black Forest Labs', speed: 'Medium', size: '1K', references: 1, referenceLabel: 'Starter Shot', ratios: [...COMMON_RATIOS, '3:7', '7:3'] },
  { id: 'gpt-image-2', name: 'GPT Image 2', family: 'OpenAI', speed: 'Slow', size: '3K', references: 16, ratios: COMMON_RATIOS, quality: ['low', 'medium', 'high'], resolution: ['1K', '2K', '3K'] },
  { id: 'gpt-image', name: 'GPT Image', family: 'OpenAI', speed: 'Slow', size: '1.5K', references: 0, ratios: ['1:1', '3:2', '2:3'], quality: ['high', 'medium', 'low'], background: ['transparent', 'opaque'] },
  { id: 'grok-imagine', name: 'Grok Imagine', family: 'xAI', speed: 'Fast', size: '2K', references: 1, ratios: COMMON_RATIOS, resolution: ['1K', '2K'] },
  { id: 'nano-banana-2', name: 'Nano Banana 2', family: 'Google', speed: 'Fast', size: '4K', references: 14, ratios: COMMON_RATIOS, resolution: ['1K', '2K', '4K'] },
  { id: 'nano-banana-pro', name: 'Nano Banana Pro', family: 'Google', speed: 'Medium', size: '4K', references: 14, ratios: COMMON_RATIOS, resolution: ['1K', '2K', '4K'] },
  { id: 'qwen-image-2', name: 'Qwen Image 2.0', family: 'Qwen', speed: 'Fast', size: '4K', references: 3, ratios: QWEN_RATIOS, resolution: ['1K', '2K', '4K'], promptLimit: 800 },
  { id: 'qwen-image-2-pro', name: 'Qwen Image 2.0 Pro', family: 'Qwen', speed: 'Medium', size: '4K', references: 3, ratios: QWEN_RATIOS, resolution: ['1K', '2K', '4K'], promptLimit: 800 },
  { id: 'qwen-edit', name: 'Qwen Edit', family: 'Qwen', speed: 'Medium', size: '2K', references: 3, ratios: COMMON_RATIOS },
  { id: 'seedream-5', name: 'Seedream 5', family: 'ByteDance', speed: 'Fast', size: '4K', references: 14, ratios: COMMON_RATIOS, resolution: ['2K', '3K', '4K'] },
  { id: 'seedream-5-pro', name: 'Seedream 5 Pro', family: 'ByteDance', speed: 'Medium', size: '2K', references: 10, ratios: COMMON_RATIOS, resolution: ['1K', '2K'], defaultResolution: '2K' },
  { id: 'seedream-4', name: 'Seedream 4.0', family: 'ByteDance', speed: 'Fast', size: '4K', references: 3, ratios: ['1:1', '16:9', '9:16', '3:2', '4:5', '2:3', '3:4', '4:3'], resolution: ['1K', '2K', '4K'] },
  { id: 'wan-2-7', name: 'Wan 2.7', family: 'Wan', speed: 'Medium', size: '2K', references: 9, ratios: QWEN_RATIOS, resolution: ['1K', '2K'], defaultResolution: '2K' },
  { id: 'wan-2-7-pro', name: 'Wan 2.7 Pro', family: 'Wan', speed: 'Medium', size: '4K', references: 9, ratios: QWEN_RATIOS, resolution: ['1K', '2K', '4K'], defaultResolution: '2K' },
  { id: 'z-image', name: 'Z-Image', family: 'Tongyi', speed: 'Fast', size: '2K', references: 0, ratios: COMMON_RATIOS, lora: true }
];
const SETTING_META = {
  references: { title: 'Image references', icon: 'images' },
  aspect: { title: 'Aspect ratio', icon: 'rectangle-horizontal' },
  quality: { title: 'Quality', icon: 'sliders-horizontal' },
  resolution: { title: 'Resolution', icon: 'scan' },
  background: { title: 'Background', icon: 'blend' },
  lora: { title: 'LoRA Library', icon: 'layers' }
};
function initialModelSettings(model) {
  return { aspect: '1:1', results: 1, quality: model.quality ? 'medium' : undefined,
    resolution: model.defaultResolution || model.resolution?.[0], background: model.background ? 'opaque' : undefined };
}
