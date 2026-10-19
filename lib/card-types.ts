export type PlatformRatioId = 'xhs-3-4' | 'douyin-9-16' | 'square-1-1' | 'landscape-4-3' | 'custom';

export interface PlatformPreset {
  id: PlatformRatioId;
  name: string;
  platformLabel: string;
  ratioLabel: string;
  width: number;        // Base DOM render width in px
  height: number;       // Base DOM render height in px
  exportScale: number;  // Multiplier for HD export (e.g., 3x -> 1080x1440)
  description: string;
}

export type PatternType =
  | 'none'
  | 'grid'
  | 'dots'
  | 'ruled-lines'
  | 'paper-grain'
  | 'crosshairs'
  | 'diagonal';

export type BorderFrameType =
  | 'none'
  | 'double-editorial'
  | 'viewfinder-corners'
  | 'stamp-perforated'
  | 'film-sprocket'
  | 'gallery-filigree'
  | 'swiss-grid'
  | 'custom-image';

export type FontPairingMode = 'editorial-serif' | 'modern-sans' | 'technical-mono';

export interface CardTemplate {
  id: string;
  name: string;
  subtitle: string;
  isCustom?: boolean;
  // Background layer
  bgStyle: string;              // Solid hex or CSS gradient
  bgColorHex: string;           // Fallback / primary background hex
  customBgImage?: string;       // Optional uploaded background image URL / DataURL
  bgImageOpacity?: number;      // 0.05 to 1
  // Pattern layer (底纹)
  patternType: PatternType;
  patternColor: string;
  patternOpacity: number;       // 0.03 to 0.4
  // Border & Frame layer (边框/装饰层)
  borderFrameType: BorderFrameType;
  borderColor: string;
  borderInset: number;          // Inset in px from card edge
  customBorderImage?: string;   // Optional uploaded transparent PNG/SVG border overlay
  // Typography & Palette
  fontMode: FontPairingMode;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  accentBgSoft: string;
  cardSurfaceBg: string;        // For tables, code blocks, quotes
  tableBorderColor: string;
  // Layout & Safe Zone
  paddingX: number;
  paddingY: number;
  borderRadius: number;
}

export type PaginationMode = 'smart-auto' | 'manual-hr' | 'by-h2';

export interface CardMetaConfig {
  showHeader: boolean;
  headerLeft: string;
  headerRight: string;
  showFooter: boolean;
  authorHandle: string;
  footerNote: string;
  showPageNumber: boolean;
  showSafeZoneGuide: boolean;
  fontSizeScale: number; // 0.85 to 1.2
}

export type MarkdownBlockType =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'paragraph'
  | 'image'
  | 'table'
  | 'ul'
  | 'ol'
  | 'blockquote'
  | 'code';

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ListItemData {
  text: string;
  checked?: boolean;
}

export interface MarkdownBlock {
  id: string;
  type: MarkdownBlockType;
  content: string;
  imageUrl?: string;
  imageAlt?: string;
  table?: TableData;
  items?: ListItemData[];
  language?: string;
  estimatedHeight: number;
}

export interface PaginatedCard {
  index: number;
  total: number;
  isCover: boolean;
  blocks: MarkdownBlock[];
  estimatedUsedHeight: number;
  maxAvailableHeight: number;
  isOverflowing: boolean;
}

export const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    id: 'xhs-3-4',
    name: '小红书标准竖图',
    platformLabel: '小红书 RedNote',
    ratioLabel: '3 : 4',
    width: 360,
    height: 480,
    exportScale: 3, // 1080 x 1440 px
    description: '1080 × 1440 px · 小红书流量池最优选竖版画幅',
  },
  {
    id: 'douyin-9-16',
    name: '抖音图文全屏',
    platformLabel: '抖音 Douyin',
    ratioLabel: '9 : 16',
    width: 360,
    height: 640,
    exportScale: 3, // 1080 x 1920 px
    description: '1080 × 1920 px · 沉浸式全屏滑动图文画幅',
  },
  {
    id: 'square-1-1',
    name: '极简方形卡片',
    platformLabel: '通用方图 1:1',
    ratioLabel: '1 : 1',
    width: 380,
    height: 380,
    exportScale: 3, // 1140 x 1140 px
    description: '1080 × 1080 px · 适合知识金句与多宫格连发',
  },
  {
    id: 'landscape-4-3',
    name: '横版干货图谱',
    platformLabel: '横屏笔记 4:3',
    ratioLabel: '4 : 3',
    width: 480,
    height: 360,
    exportScale: 3, // 1440 x 1080 px
    description: '1440 × 1080 px · 适合宽幅对比表格与思维框架',
  },
];

export const BUILTIN_TEMPLATES: CardTemplate[] = [
  {
    id: 'editorial-paper',
    name: '宣纸杂志',
    subtitle: '温润米白 · 双线画框 · 宋刻标题',
    bgStyle: 'linear-gradient(165deg, #FAF7F0 0%, #F3EDE0 100%)',
    bgColorHex: '#FAF7F0',
    patternType: 'paper-grain',
    patternColor: '#8C7A6B',
    patternOpacity: 0.12,
    borderFrameType: 'double-editorial',
    borderColor: '#A69580',
    borderInset: 14,
    fontMode: 'editorial-serif',
    textColor: '#231F1C',
    mutedColor: '#786E65',
    accentColor: '#C83E2B',
    accentBgSoft: 'rgba(200, 62, 43, 0.10)',
    cardSurfaceBg: 'rgba(255, 255, 255, 0.65)',
    tableBorderColor: '#D6CBC0',
    paddingX: 30,
    paddingY: 32,
    borderRadius: 0,
  },
  {
    id: 'rednote-studio',
    name: '小红书纯白实验室',
    subtitle: '高透纯白 · 细密方格 · 朱砂重点',
    bgStyle: '#FFFFFF',
    bgColorHex: '#FFFFFF',
    patternType: 'grid',
    patternColor: '#18181B',
    patternOpacity: 0.05,
    borderFrameType: 'viewfinder-corners',
    borderColor: '#E11D48',
    borderInset: 14,
    fontMode: 'modern-sans',
    textColor: '#18181B',
    mutedColor: '#71717A',
    accentColor: '#E11D48',
    accentBgSoft: 'rgba(225, 29, 72, 0.09)',
    cardSurfaceBg: '#F8FAFC',
    tableBorderColor: '#E4E4E7',
    paddingX: 28,
    paddingY: 30,
    borderRadius: 0,
  },
  {
    id: 'obsidian-gold',
    name: '暗夜黑金刊物',
    subtitle: '深邃曜石 · 典藏花角 · 鎏金高光',
    bgStyle: 'linear-gradient(155deg, #131316 0%, #09090B 100%)',
    bgColorHex: '#0D0D10',
    patternType: 'crosshairs',
    patternColor: '#D4AF37',
    patternOpacity: 0.14,
    borderFrameType: 'gallery-filigree',
    borderColor: '#D4AF37',
    borderInset: 14,
    fontMode: 'editorial-serif',
    textColor: '#F5F3EF',
    mutedColor: '#A19E95',
    accentColor: '#EAB308',
    accentBgSoft: 'rgba(234, 179, 8, 0.15)',
    cardSurfaceBg: 'rgba(255, 255, 255, 0.05)',
    tableBorderColor: '#2E2D2A',
    paddingX: 30,
    paddingY: 32,
    borderRadius: 0,
  },
  {
    id: 'kyoto-matcha',
    name: '京都抹茶手账',
    subtitle: '森系苔绿 · 横线信纸 · 邮票齿孔框',
    bgStyle: 'linear-gradient(180deg, #F3F6F1 0%, #E7EFE4 100%)',
    bgColorHex: '#F1F5EE',
    patternType: 'ruled-lines',
    patternColor: '#3F624D',
    patternOpacity: 0.09,
    borderFrameType: 'stamp-perforated',
    borderColor: '#4D725B',
    borderInset: 12,
    fontMode: 'editorial-serif',
    textColor: '#1B2E22',
    mutedColor: '#5B7564',
    accentColor: '#2F6F4E',
    accentBgSoft: 'rgba(47, 111, 78, 0.12)',
    cardSurfaceBg: 'rgba(255, 255, 255, 0.7)',
    tableBorderColor: '#C5D6C9',
    paddingX: 30,
    paddingY: 32,
    borderRadius: 0,
  },
  {
    id: 'film-35mm',
    name: '复古胶片暗房',
    subtitle: '银盐暖灰 · 点阵底纹 · 35mm齿孔边框',
    bgStyle: 'linear-gradient(160deg, #F4F1EA 0%, #E8E2D5 100%)',
    bgColorHex: '#EFECE4',
    patternType: 'dots',
    patternColor: '#27272A',
    patternOpacity: 0.10,
    borderFrameType: 'film-sprocket',
    borderColor: '#27272A',
    borderInset: 10,
    fontMode: 'modern-sans',
    textColor: '#18181B',
    mutedColor: '#52525B',
    accentColor: '#D97706',
    accentBgSoft: 'rgba(217, 119, 6, 0.13)',
    cardSurfaceBg: 'rgba(255, 255, 255, 0.6)',
    tableBorderColor: '#D4CFC4',
    paddingX: 34,
    paddingY: 28,
    borderRadius: 0,
  },
  {
    id: 'swiss-grid',
    name: '瑞士国际主义网格',
    subtitle: '建筑秩序 · 十字基准 · 结构外框',
    bgStyle: '#F4F4F0',
    bgColorHex: '#F4F4F0',
    patternType: 'crosshairs',
    patternColor: '#18181B',
    patternOpacity: 0.12,
    borderFrameType: 'swiss-grid',
    borderColor: '#18181B',
    borderInset: 14,
    fontMode: 'modern-sans',
    textColor: '#111111',
    mutedColor: '#666660',
    accentColor: '#2563EB',
    accentBgSoft: 'rgba(37, 99, 235, 0.10)',
    cardSurfaceBg: '#FFFFFF',
    tableBorderColor: '#18181B',
    paddingX: 28,
    paddingY: 30,
    borderRadius: 0,
  },
  {
    id: 'sunset-mesh',
    name: '落日弥散微光',
    subtitle: '柔光渐变 · 斜纹肌理 · 双层细框',
    bgStyle: 'linear-gradient(135deg, #FFF5F5 0%, #FFFBEB 50%, #F0FDF4 100%)',
    bgColorHex: '#FFF8F6',
    patternType: 'diagonal',
    patternColor: '#F43F5E',
    patternOpacity: 0.05,
    borderFrameType: 'double-editorial',
    borderColor: '#FDA4AF',
    borderInset: 14,
    fontMode: 'modern-sans',
    textColor: '#27171C',
    mutedColor: '#886973',
    accentColor: '#E11D48',
    accentBgSoft: 'rgba(225, 29, 72, 0.10)',
    cardSurfaceBg: 'rgba(255, 255, 255, 0.80)',
    tableBorderColor: '#FECDD3',
    paddingX: 28,
    paddingY: 30,
    borderRadius: 0,
  },
  {
    id: 'blueprint-tech',
    name: '深海工程蓝图',
    subtitle: '精密制图 · 坐标方格 · 极客等宽',
    bgStyle: 'linear-gradient(165deg, #0B192C 0%, #07111E 100%)',
    bgColorHex: '#0B192C',
    patternType: 'grid',
    patternColor: '#38BDF8',
    patternOpacity: 0.12,
    borderFrameType: 'viewfinder-corners',
    borderColor: '#38BDF8',
    borderInset: 14,
    fontMode: 'technical-mono',
    textColor: '#F0F9FF',
    mutedColor: '#7DD3FC',
    accentColor: '#38BDF8',
    accentBgSoft: 'rgba(56, 189, 248, 0.15)',
    cardSurfaceBg: 'rgba(14, 116, 144, 0.18)',
    tableBorderColor: '#1E3A5F',
    paddingX: 28,
    paddingY: 30,
    borderRadius: 0,
  },
];

export const DEFAULT_MARKDOWN_CONTENT = `# 小红书 & 抖音高赞图文排版指南

为什么同样干货满满的深度长文，别人的图文笔记收藏率能翻 3 倍？核心秘密在于**严格的画幅尺寸控制**与**呼吸感视觉节奏**。

![手冲咖啡与手账桌面美学](/samples/editorial-desk.svg)

> 视觉卡片第一定律：绝不让单张图片信息过载。将长篇 Markdown 拆解为固定宽高比的序列卡片，读者划动时的完读率提升 68%。

---

## 01. 主流平台图文尺寸黄金标准

不同内容平台对首图与内页画幅有极其严苛的裁切规范。选对比例，才能避免关键文字被系统 UI 遮挡：

| 平台场景 | 推荐比例 | 导出分辨率 | 核心排版建议 |
| :--- | :--- | :--- | :--- |
| 小红书竖图 | 3 : 4 | 1080 × 1440 | 标题控制在 2 行内，四周留白 30px |
| 抖音图文 | 9 : 16 | 1080 × 1920 | 底部预留安全区，避免文案区遮挡 |
| 知识金句卡 | 1 : 1 | 1080 × 1080 | 居中聚焦单个核心观点或公式 |

![平台画幅黄金比例对比](/samples/platform-grid.svg)

---

## 02. 结构化内容拆解清单

当你在左侧输入标准 Markdown 语法时，系统会自动识别并渲染为精美组件：

- [x] **多级标题与 ==重点高亮语法==**：使用双等号包裹关键词即可生成醒目荧光标记
- [x] **自适应数据表格**：自动对齐数字列，告别截图模糊与手机端排版错位
- [x] **底纹与边框图层叠加**：支持方格、点阵、信纸横线及自定义 PNG 透明边框图层
- [ ] **前后端双向协同**：既可纯前端一键打包导出高清 PNG，也可通过 JSON AST 接入后端渲染队列

\`\`\`json
{
  "ratio": "3:4",
  "resolution": "1080x1440",
  "template": "editorial-paper",
  "pagination": "smart-auto"
}
\`\`\`

> 提示：在编辑器中插入 \`---\` 即可强制在任意位置新建一张卡片；开启「智能高度分页」后，超长段落与表格将自动顺延至下一张卡片。`;
