'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import {
  BorderFrameType,
  BUILTIN_TEMPLATES,
  CardMetaConfig,
  CardTemplate,
  DEFAULT_MARKDOWN_CONTENT,
  FontPairingMode,
  PaginatedCard,
  PaginationMode,
  PatternType,
  PLATFORM_PRESETS,
  PlatformPreset,
  PlatformRatioId,
} from '@/lib/card-types';
import { paginateMarkdownToCards } from '@/lib/markdown-paginator';
import { CardCanvas } from './CardCanvas';
import { BackendContractModal } from './BackendContractModal';
import {
  Check,
  Code2,
  Download,
  Eye,
  FilePlus2,
  Frame,
  Grid,
  Highlighter,
  ImagePlus,
  Layers,
  LayoutGrid,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Sliders,
  SplitSquareVertical,
  Table,
  Trash2,
  Type,
  Upload,
} from 'lucide-react';

const PRESET_MARKDOWN_SAMPLES: Record<string, { label: string; content: string }> = {
  guide: {
    label: '小红书高赞排版指南',
    content: DEFAULT_MARKDOWN_CONTENT,
  },
  book: {
    label: '深度读书拆解笔记',
    content: `# 《纳瓦尔宝典》：如何不靠运气变得富有？

财富不是用时间换取的薪水，而是**在你睡觉时依然能为你创造价值的资产**。

> 人生的核心杠杆只有三种：劳动力、资本，以及“复制边际成本为零的产品”（代码与媒体）。

---

## 01. 区分「财富」与「金钱」

很多人终其一生都在追逐高薪，却忽略了复利效应的底层逻辑：

| 维度 | 出售时间（打工） | 构建资产（复利） |
| :--- | :--- | :--- |
| 增长曲线 | 线性增长，停工即停收 | 指数级增长，边际成本趋零 |
| 核心壁垒 | 岗位技能与工时投入 | 专长 × 责任感 × 媒体杠杆 |
| 代表形式 | 时薪、月薪、外包项目 | 开源代码、图文专栏、自动化系统 |

---

## 02. 普通人可落地的 3 个行动准则

1. **将自己产品化**：找到你觉得像玩耍、但别人觉得像工作的天赋领域
2. **善用公开媒体杠杆**：持续输出结构化图文笔记，让优质内容替你 24 小时连接同频伙伴
3. **坚持长期主义复利**：无论是知识体系还是健康习惯，真正拉开差距的永远是 ==第 3 年之后的复利拐点==`,
  },
  tech: {
    label: '桌面效率硬件测评',
    content: `# 2026 极简创作者桌面改造清单

一套舒适的数字工作台，核心不在于堆砌昂贵器材，而在于**消除一切打断心流的视觉噪点**。

![极简创作者手冲咖啡与手账桌面](/samples/editorial-desk.svg)

---

## 核心生产力工具参数横评

经过 90 天高强度码字与修图实测，以下三件单品留在了我的桌面：

| 设备名称 | 关键规格 | 实测体验评分 | 推荐指数 |
| :--- | :--- | :--- | :--- |
| 4K 雾面显示器 | 27寸 · ΔE < 1.2 | 抗反光极佳，久看不累 | 9.6 / 10 |
| 静电容键盘 | 45g 压力克数 | 长文输入指尖无疲劳感 | 9.4 / 10 |
| 暖光屏幕挂灯 | Ra98 显色指数 | 夜间读写桌面氛围感拉满 | 9.5 / 10 |

> 总结：优先投资每天高频接触的「视觉与触觉交互界面」，回报率远超盲目升级主机配置。`,
  },
};

const PATTERN_OPTIONS: { id: PatternType; label: string }[] = [
  { id: 'none', label: '无底纹' },
  { id: 'grid', label: '细密方格' },
  { id: 'dots', label: '手账点阵' },
  { id: 'ruled-lines', label: '横线信纸' },
  { id: 'paper-grain', label: '宣纸肌理' },
  { id: 'crosshairs', label: '瑞士十字' },
  { id: 'diagonal', label: '斜纹织物' },
];

const BORDER_OPTIONS: { id: BorderFrameType; label: string }[] = [
  { id: 'none', label: '无边框' },
  { id: 'double-editorial', label: '双线杂志框' },
  { id: 'viewfinder-corners', label: '四角取景框' },
  { id: 'stamp-perforated', label: '邮票齿孔框' },
  { id: 'film-sprocket', label: '35mm胶片框' },
  { id: 'gallery-filigree', label: '典藏花角框' },
  { id: 'swiss-grid', label: '瑞士结构框' },
];

export function MarkCardStudio() {
  // Markdown content state
  const [markdown, setMarkdown] = useState<string>(DEFAULT_MARKDOWN_CONTENT);
  const [paginationMode, setPaginationMode] = useState<PaginationMode>('smart-auto');

  // Platform ratio & custom dimensions
  const [activeRatioId, setActiveRatioId] = useState<PlatformRatioId>('xhs-3-4');
  const [customWidth, setCustomWidth] = useState<number>(360);
  const [customHeight, setCustomHeight] = useState<number>(480);

  // Template & Custom Saved Templates
  const [customTemplates, setCustomTemplates] = useState<CardTemplate[]>([]);
  const [template, setTemplate] = useState<CardTemplate>(BUILTIN_TEMPLATES[0]);
  const [newTemplateName, setNewTemplateName] = useState<string>('');

  // Card Header / Footer / Scale metadata
  const [meta, setMeta] = useState<CardMetaConfig>({
    showHeader: true,
    headerLeft: '小红书 · 视觉笔记',
    headerRight: '2026 EDITION',
    showFooter: true,
    authorHandle: '@林间漫步',
    footerNote: '向左滑动翻页',
    showPageNumber: true,
    showSafeZoneGuide: false,
    fontSizeScale: 1,
  });

  // UI Workspace controls
  const [rightPanelTab, setRightPanelTab] = useState<'templates' | 'layers' | 'layout'>('templates');
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);

  // Export & Backend API state
  const [exportingIndex, setExportingIndex] = useState<number | 'all' | null>(null);
  const [exportStatusMessage, setExportStatusMessage] = useState<string | null>(null);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);
  const [engineMode, setEngineMode] = useState<'frontend' | 'backend-api'>('frontend');
  const [serverCards, setServerCards] = useState<PaginatedCard[] | null>(null);
  const [lastServerSyncAt, setLastServerSyncAt] = useState<string | null>(null);
  const [isSyncingServer, setIsSyncingServer] = useState<boolean>(false);

  // Refs for DOM-to-Image export and file inputs
  const cardDomRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mdImageInputRef = useRef<HTMLInputElement | null>(null);
  const bgTextureInputRef = useRef<HTMLInputElement | null>(null);
  const borderOverlayInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved custom templates from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('markcard_custom_templates_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCustomTemplates(parsed);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Compute active platform preset
  const activePreset: PlatformPreset = useMemo(() => {
    const found =
      PLATFORM_PRESETS.find((p) => p.id === activeRatioId) || PLATFORM_PRESETS[0];
    return {
      ...found,
      width: customWidth || found.width,
      height: customHeight || found.height,
    };
  }, [activeRatioId, customWidth, customHeight]);

  // Switch platform preset handler
  const handleSelectPlatformPreset = (presetId: PlatformRatioId) => {
    setActiveRatioId(presetId);
    const target = PLATFORM_PRESETS.find((p) => p.id === presetId);
    if (target) {
      setCustomWidth(target.width);
      setCustomHeight(target.height);
    }
  };

  // Pure Frontend real-time pagination calculation
  const localCards: PaginatedCard[] = useMemo(() => {
    return paginateMarkdownToCards(
      markdown,
      activePreset,
      template,
      meta,
      paginationMode
    );
  }, [markdown, activePreset, template, meta, paginationMode]);

  // Sync with backend API `/api/cards` when `engineMode === 'backend-api'`
  const syncWithBackendApi = useCallback(async () => {
    setIsSyncingServer(true);
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown,
          presetId: activePreset.id,
          customWidth: activePreset.width,
          customHeight: activePreset.height,
          customTemplate: template,
          meta,
          paginationMode,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.cards)) {
          setServerCards(data.cards);
          const now = new Date();
          setLastServerSyncAt(
            `${String(now.getHours()).padStart(2, '0')}:${String(
              now.getMinutes()
            ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
          );
        }
      }
    } catch {
      // Fallback to local cards if offline
    } finally {
      setIsSyncingServer(false);
    }
  }, [markdown, activePreset, template, meta, paginationMode]);

  useEffect(() => {
    if (engineMode !== 'backend-api') return;
    const timer = setTimeout(() => {
      syncWithBackendApi();
    }, 280);
    return () => clearTimeout(timer);
  }, [engineMode, syncWithBackendApi]);

  const cards = engineMode === 'backend-api' && serverCards ? serverCards : localCards;

  // Insert snippet at cursor position in Markdown editor
  const insertMarkdownAtCursor = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      setMarkdown((prev) => `${prev}\n${snippet}`);
      return;
    }
    const start = el.selectionStart ?? markdown.length;
    const end = el.selectionEnd ?? markdown.length;
    const updated =
      markdown.slice(0, start) + snippet + markdown.slice(end);
    setMarkdown(updated);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 20);
  };

  // Handle local image upload into Markdown content
  const handleInsertLocalImageToMarkdown = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const cleanName = file.name.replace(/\.[^.]+$/, '');
        insertMarkdownAtCursor(`\n![${cleanName}](${reader.result})\n`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle custom background texture upload
  const handleUploadBgTexture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setTemplate((prev) => ({
          ...prev,
          customBgImage: reader.result as string,
          bgImageOpacity: prev.bgImageOpacity ?? 0.45,
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle custom border frame PNG/SVG upload
  const handleUploadBorderImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setTemplate((prev) => ({
          ...prev,
          customBorderImage: reader.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Save current template configuration as a custom user template
  const handleSaveCustomTemplate = () => {
    const title = newTemplateName.trim() || `自定义模板 ${customTemplates.length + 1}`;
    const newTpl: CardTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      name: title,
      subtitle: `${template.patternType !== 'none' ? '含底纹' : '纯底'} · ${
        template.customBorderImage ? '自定义边框图' : template.borderFrameType
      }`,
      isCustom: true,
    };
    const nextList = [newTpl, ...customTemplates];
    setCustomTemplates(nextList);
    setTemplate(newTpl);
    setNewTemplateName('');
    try {
      localStorage.setItem('markcard_custom_templates_v1', JSON.stringify(nextList));
    } catch {
      // ignore quota error
    }
    setExportStatusMessage(`已保存模板「${title}」`);
    setTimeout(() => setExportStatusMessage(null), 2500);
  };

  const handleDeleteCustomTemplate = (id: string) => {
    const nextList = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(nextList);
    try {
      localStorage.setItem('markcard_custom_templates_v1', JSON.stringify(nextList));
    } catch {
      // ignore
    }
    if (template.id === id) {
      setTemplate(BUILTIN_TEMPLATES[0]);
    }
  };

  // Export single card as High-DPI PNG
  const handleExportSingleCard = async (cardIndex: number) => {
    const node = cardDomRefs.current[cardIndex];
    if (!node) return;
    setExportingIndex(cardIndex);
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: activePreset.exportScale,
        width: activePreset.width,
        height: activePreset.height,
      });
      const link = document.createElement('a');
      link.download = `MarkCard_${activePreset.id}_P${String(cardIndex).padStart(
        2,
        '0'
      )}.png`;
      link.href = dataUrl;
      link.click();
      setExportStatusMessage(
        `已导出第 ${cardIndex} 张卡片 (${activePreset.width * activePreset.exportScale}×${
          activePreset.height * activePreset.exportScale
        }px)`
      );
    } catch {
      setExportStatusMessage('导出图片失败，请检查自定义图片跨域设置');
    } finally {
      setExportingIndex(null);
      setTimeout(() => setExportStatusMessage(null), 3000);
    }
  };

  // Batch export all cards as a ZIP archive of High-DPI PNGs
  const handleExportAllCardsZip = async () => {
    if (cards.length === 0) return;
    setExportingIndex('all');
    setExportStatusMessage(`正在渲染 ${cards.length} 张高清卡片...`);
    try {
      const zip = new JSZip();
      const folder = zip.folder(`MarkCard_${activePreset.id}_${Date.now()}`);

      for (const card of cards) {
        const node = cardDomRefs.current[card.index];
        if (!node) continue;
        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: activePreset.exportScale,
          width: activePreset.width,
          height: activePreset.height,
        });
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        folder?.file(
          `Card_${String(card.index).padStart(2, '0')}_${
            activePreset.width * activePreset.exportScale
          }x${activePreset.height * activePreset.exportScale}.png`,
          base64Data,
          { base64: true }
        );
      }

      // Also include template & AST JSON manifest for backend/archival use
      folder?.file(
        'card_manifest.json',
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            platform: activePreset,
            template,
            meta,
            cards,
          },
          null,
          2
        )
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `MarkCard_${activePreset.platformLabel.replace(/\s+/g, '_')}_${
        cards.length
      }张图集.zip`;
      link.click();
      URL.revokeObjectURL(url);
      setExportStatusMessage(`成功导出全部 ${cards.length} 张高清卡片 ZIP 图集`);
    } catch {
      setExportStatusMessage('批量导出失败，请尝试单张导出');
    } finally {
      setExportingIndex(null);
      setTimeout(() => setExportStatusMessage(null), 3500);
    }
  };

  const allTemplates = useMemo(
    () => [...customTemplates, ...BUILTIN_TEMPLATES],
    [customTemplates]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6F2] text-stone-900">
      {/* Hidden file inputs for uploads */}
      <input
        ref={mdImageInputRef}
        type="file"
        accept="image/*"
        onChange={handleInsertLocalImageToMarkdown}
        className="hidden"
      />
      <input
        ref={bgTextureInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadBgTexture}
        className="hidden"
      />
      <input
        ref={borderOverlayInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadBorderImage}
        className="hidden"
      />

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-stone-200 sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#workspace"
          className="text-lg font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0"
        >
          MD2Card
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
          {PLATFORM_PRESETS.map((preset) => {
            const isActive = activeRatioId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPlatformPreset(preset.id)}
                className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
                  isActive
                    ? 'text-stone-900 border-rose-600 font-semibold'
                    : 'border-transparent hover:text-stone-900'
                }`}
              >
                {preset.name} ({preset.ratioLabel.replace(/\s+/g, '')})
              </button>
            );
          })}
          <button
            onClick={() => setIsBackendModalOpen(true)}
            className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 border-transparent"
          >
            前后端 API 契约
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportAllCardsZip}
            disabled={exportingIndex !== null}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            {exportingIndex === 'all'
              ? '正在打包图集...'
              : `批量导出图集 (${cards.length}张)`}
          </button>
        </div>
      </header>

      {/* Main 3-Column Studio Workspace (1440px+ full-width desktop layout) */}
      <main
        id="workspace"
        className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-57px)]"
      >
        {/* LEFT COLUMN (4 cols): Markdown Live Editor & Pagination Controls */}
        <section className="lg:col-span-4 flex flex-col border-b lg:border-b-0 lg:border-r border-stone-200 bg-white">
          {/* Editor Header & Sample Switcher */}
          <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between gap-2 bg-stone-50/70">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
              <span>Markdown 源文件</span>
              <span aria-hidden="true" className="text-stone-300">
                ·
              </span>
              <span className="font-mono tabular-nums font-normal text-stone-500">
                {markdown.length} 字符
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-500">范例:</span>
              {Object.entries(PRESET_MARKDOWN_SAMPLES).map(([key, sample]) => (
                <button
                  key={key}
                  onClick={() => setMarkdown(sample.content)}
                  className="px-2 py-1 text-[11px] font-medium text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 rounded transition-colors whitespace-nowrap shrink-0"
                >
                  {sample.label.slice(0, 4)}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Markdown Syntax & Asset Insertion Bar */}
          <div className="px-4 py-2 border-b border-stone-200 flex items-center gap-1.5 overflow-x-auto bg-white">
            <button
              onClick={() => insertMarkdownAtCursor('\n\n---\n\n## 新卡片章节标题\n\n在这里输入新卡片正文内容...\n')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition-colors whitespace-nowrap shrink-0"
              title="插入 --- 强制新建一张卡片"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              插入分页符 (---)
            </button>

            <button
              onClick={() => insertMarkdownAtCursor(' ==重点高亮文字== ')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded transition-colors whitespace-nowrap shrink-0"
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-600" />
              高亮标记
            </button>

            <button
              onClick={() =>
                insertMarkdownAtCursor(
                  '\n| 对比维度 | 方案 A | 方案 B |\n| :--- | :--- | :--- |\n| 核心优势 | 结构清晰 | 视觉吸睛 |\n| 转化效率 | +45% | +120% |\n'
                )
              }
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded transition-colors whitespace-nowrap shrink-0"
            >
              <Table className="w-3.5 h-3.5 text-stone-600" />
              插入表格
            </button>

            <button
              onClick={() => mdImageInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded transition-colors whitespace-nowrap shrink-0"
            >
              <ImagePlus className="w-3.5 h-3.5 text-emerald-600" />
              插入本地图片
            </button>
          </div>

          {/* Pagination Rule Mode Selector */}
          <div className="px-4 py-2.5 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-stone-600 whitespace-nowrap shrink-0">
              分卡策略:
            </span>
            <div className="flex items-center gap-1 p-0.5 bg-stone-200/75 rounded-lg flex-1">
              <button
                onClick={() => setPaginationMode('smart-auto')}
                className={`flex-1 py-1 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  paginationMode === 'smart-auto'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                智能高度分页
              </button>
              <button
                onClick={() => setPaginationMode('manual-hr')}
                className={`flex-1 py-1 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  paginationMode === 'manual-hr'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                仅按 --- 分页
              </button>
              <button
                onClick={() => setPaginationMode('by-h2')}
                className={`flex-1 py-1 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  paginationMode === 'by-h2'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                按二级标题分卡
              </button>
            </div>
          </div>

          {/* Markdown Textarea */}
          <div className="flex-1 relative flex flex-col">
            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="在此输入 Markdown 内容（支持 # 标题、**加粗**、==高亮==、![图片](url)、| 表格 |、> 引用、列表及 --- 分页符）..."
              className="flex-1 w-full p-4 font-mono text-[13px] leading-relaxed text-stone-800 bg-white resize-none focus:outline-none"
              spellCheck={false}
            />
          </div>

          {/* Editor Bottom Bar */}
          <div className="px-4 py-2.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <span>支持标准 Markdown 语法</span>
              <span aria-hidden="true">·</span>
              <span>
                已拆分为 <strong className="text-stone-900 tabular-nums">{cards.length}</strong> 张卡片
              </span>
            </div>
            <button
              onClick={() => setMarkdown(DEFAULT_MARKDOWN_CONTENT)}
              className="flex items-center gap-1 text-stone-600 hover:text-stone-900 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              重置示例
            </button>
          </div>
        </section>

        {/* CENTER COLUMN (5 cols): Live Fixed-Dimension Multi-Card Canvas Preview */}
        <section className="lg:col-span-5 flex flex-col bg-[#F1EFEA] border-b lg:border-b-0 lg:border-r border-stone-200 overflow-hidden">
          {/* Canvas Toolbar */}
          <div className="px-5 py-3 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
            {/* Unboxed Metadata Spec */}
            <div className="flex items-center gap-2 text-xs text-stone-600">
              <span className="font-semibold text-stone-900">
                {activePreset.platformLabel}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                画布 {activePreset.width}×{activePreset.height}px
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-rose-700 font-medium">
                导出 {activePreset.width * activePreset.exportScale}×
                {activePreset.height * activePreset.exportScale}px
              </span>
            </div>

            {/* Canvas View Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setMeta((prev) => ({
                    ...prev,
                    showSafeZoneGuide: !prev.showSafeZoneGuide,
                  }))
                }
                className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                  meta.showSafeZoneGuide
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                安全框线
              </button>

              <div className="flex items-center gap-0.5 p-0.5 bg-stone-100 rounded-md border border-stone-200">
                {[0.85, 1].map((z) => (
                  <button
                    key={z}
                    onClick={() => setPreviewZoom(z)}
                    className={`px-2 py-0.5 text-[11px] font-mono tabular-nums rounded transition-colors whitespace-nowrap shrink-0 ${
                      previewZoom === z
                        ? 'bg-white text-stone-900 font-semibold shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {Math.round(z * 100)}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Export Status Toast Banner (if active) */}
          {exportStatusMessage && (
            <div className="px-5 py-2 bg-stone-900 text-white text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                {exportStatusMessage}
              </span>
              <span className="font-mono text-[11px] opacity-75">3x HD PNG</span>
            </div>
          )}

          {/* Card Filter Bar (All cards vs Single card focus) */}
          <div className="px-5 py-2.5 border-b border-stone-200/80 bg-[#F7F6F2] flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedCardIdx(null)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                  selectedCardIdx === null
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                全部卡片 ({cards.length})
              </button>
              {cards.map((c) => (
                <button
                  key={c.index}
                  onClick={() => setSelectedCardIdx(c.index)}
                  className={`px-2.5 py-1 text-xs font-mono tabular-nums font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    selectedCardIdx === c.index
                      ? 'bg-stone-900 text-white'
                      : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
                  }`}
                >
                  P{String(c.index).padStart(2, '0')}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsBackendModalOpen(true)}
              className="text-xs font-mono text-stone-500 hover:text-stone-900 flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <Code2 className="w-3.5 h-3.5" />
              {engineMode === 'frontend' ? '引擎: 纯前端' : '引擎: /api/cards'}
            </button>
          </div>

          {/* Scrollable Multi-Card Gallery Canvas */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center gap-8">
            {cards.map((card) => {
              const isHidden =
                selectedCardIdx !== null && selectedCardIdx !== card.index;
              const heightRatio = Math.min(
                100,
                Math.round((card.estimatedUsedHeight / card.maxAvailableHeight) * 100)
              );

              return (
                <div
                  key={card.index}
                  className={`${
                    isHidden ? 'hidden' : 'flex'
                  } flex-col items-center gap-2.5`}
                >
                  {/* Card Top Meta Strip */}
                  <div
                    style={{ width: `${activePreset.width * previewZoom}px` }}
                    className="flex items-center justify-between text-xs text-stone-600 px-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-stone-900 tabular-nums">
                        CARD {String(card.index).padStart(2, '0')} /{' '}
                        {String(card.total).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11px] tabular-nums text-stone-500">
                        版面占用 {heightRatio}%
                      </span>
                      {card.isOverflowing && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-700 font-medium">
                            建议开启智能高度分页
                          </span>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => handleExportSingleCard(card.index)}
                      disabled={exportingIndex !== null}
                      className="flex items-center gap-1 text-xs font-medium text-stone-700 hover:text-rose-600 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {exportingIndex === card.index ? '导出中...' : '导出单张 PNG'}
                    </button>
                  </div>

                  {/* Fixed-Size Card Container with optional zoom transform */}
                  <div
                    style={{
                      width: `${activePreset.width * previewZoom}px`,
                      height: `${activePreset.height * previewZoom}px`,
                    }}
                    className="relative shadow-md border border-stone-300/80 bg-white transition-transform duration-150"
                  >
                    <div
                      style={{
                        transform: `scale(${previewZoom})`,
                        transformOrigin: 'top left',
                      }}
                    >
                      <CardCanvas
                        card={card}
                        preset={activePreset}
                        template={template}
                        meta={meta}
                        isExporting={exportingIndex !== null}
                        domRef={(el) => {
                          cardDomRefs.current[card.index] = el;
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT COLUMN (3 cols): Template Gallery, Pattern/Border Layer Customizer & Layout Inspector */}
        <aside className="lg:col-span-3 flex flex-col bg-white">
          {/* Inspector Segmented Navigation */}
          <div className="p-3 border-b border-stone-200 bg-stone-50/70">
            <div className="grid grid-cols-3 gap-1 p-1 bg-stone-200/70 rounded-lg">
              <button
                onClick={() => setRightPanelTab('templates')}
                className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1 ${
                  rightPanelTab === 'templates'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                模板库
              </button>
              <button
                onClick={() => setRightPanelTab('layers')}
                className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1 ${
                  rightPanelTab === 'layers'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                底纹与边框
              </button>
              <button
                onClick={() => setRightPanelTab('layout')}
                className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1 ${
                  rightPanelTab === 'layout'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                尺寸与页脚
              </button>
            </div>
          </div>

          {/* Inspector Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* TAB 1: TEMPLATES GALLERY & SAVE CUSTOM TEMPLATE */}
            {rightPanelTab === 'templates' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-stone-900">
                      视觉卡片模板 ({allTemplates.length})
                    </h2>
                    <span className="text-xs text-stone-500">点击实时切换</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {allTemplates.map((tpl) => {
                      const isSelected = template.id === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => setTemplate(tpl)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') setTemplate(tpl);
                          }}
                          className={`group p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-rose-600 bg-rose-50/25'
                              : 'border-stone-200 hover:border-stone-400 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Mini Swatch Preview */}
                            <div
                              style={{
                                background: tpl.bgStyle || tpl.bgColorHex,
                                borderColor: tpl.borderColor,
                              }}
                              className="w-10 h-12 rounded border shrink-0 relative flex items-center justify-center overflow-hidden"
                            >
                              <span
                                style={{ color: tpl.textColor }}
                                className="text-xs font-bold"
                              >
                                Aa
                              </span>
                              <span
                                style={{ backgroundColor: tpl.accentColor }}
                                className="absolute bottom-1 right-1 w-2 h-2 rounded-xs"
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="text-xs font-bold text-stone-900 truncate flex items-center gap-1.5">
                                <span>{tpl.name}</span>
                                {tpl.isCustom && (
                                  <span className="text-[10px] font-normal text-rose-600">
                                    · 自建
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-stone-500 truncate mt-0.5">
                                {tpl.subtitle}
                              </div>
                            </div>
                          </div>

                          {tpl.isCustom ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCustomTemplate(tpl.id);
                              }}
                              className="p-1.5 text-stone-400 hover:text-rose-600 rounded transition-colors shrink-0"
                              title="删除自定义模板"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            isSelected && (
                              <Check className="w-4 h-4 text-rose-600 shrink-0" />
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save Current Customized Style as New Template */}
                <div className="pt-4 border-t border-stone-200 space-y-2.5">
                  <label className="block text-xs font-semibold text-stone-800">
                    将当前底纹与边框保存为新模板
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="输入自定义模板名称..."
                      className="flex-1 px-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                    />
                    <button
                      onClick={handleSaveCustomTemplate}
                      className="px-3 py-1.5 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      保存
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: BACKGROUND TEXTURE, SVG PATTERNS & BORDER OVERLAY IMAGES */}
            {rightPanelTab === 'layers' && (
              <div className="space-y-6">
                {/* 1. Background Color & Custom Image */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-rose-600" />
                      1. 卡片背景与底图
                    </span>
                    <input
                      type="color"
                      value={template.bgColorHex}
                      onChange={(e) =>
                        setTemplate((prev) => ({
                          ...prev,
                          bgColorHex: e.target.value,
                          bgStyle: e.target.value,
                        }))
                      }
                      className="w-6 h-6 rounded cursor-pointer border border-stone-300"
                      title="自定义背景纯色"
                    />
                  </div>

                  {/* Quick Background Presets */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '宣纸白', bg: '#FAF7F0', text: '#231F1C' },
                      { label: '纯白', bg: '#FFFFFF', text: '#18181B' },
                      { label: '抹茶绿', bg: '#F1F5EE', text: '#1B2E22' },
                      { label: '曜石黑', bg: '#0D0D10', text: '#F5F3EF' },
                    ].map((presetBg) => (
                      <button
                        key={presetBg.label}
                        onClick={() =>
                          setTemplate((prev) => ({
                            ...prev,
                            bgStyle: presetBg.bg,
                            bgColorHex: presetBg.bg,
                            textColor: presetBg.text,
                          }))
                        }
                        className="py-1.5 px-2 text-[11px] font-medium border border-stone-200 rounded hover:border-stone-400 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-stone-300 shrink-0"
                          style={{ backgroundColor: presetBg.bg }}
                        />
                        {presetBg.label}
                      </button>
                    ))}
                  </div>

                  {/* Upload Custom Background Image */}
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={() => bgTextureInputRef.current?.click()}
                      className="flex-1 py-2 px-3 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {template.customBgImage ? '更换自定义背景图' : '上传自定义底纹背景图'}
                    </button>
                    {template.customBgImage && (
                      <button
                        onClick={() =>
                          setTemplate((prev) => ({ ...prev, customBgImage: undefined }))
                        }
                        className="px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        清除
                      </button>
                    )}
                  </div>

                  {template.customBgImage && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-stone-500">
                        <span>背景图透明度</span>
                        <span className="font-mono tabular-nums">
                          {Math.round((template.bgImageOpacity ?? 0.4) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="1"
                        step="0.05"
                        value={template.bgImageOpacity ?? 0.4}
                        onChange={(e) =>
                          setTemplate((prev) => ({
                            ...prev,
                            bgImageOpacity: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full accent-rose-600"
                      />
                    </div>
                  )}
                </div>

                {/* 2. SVG Pattern Overlay (几何底纹图层) */}
                <div className="pt-4 border-t border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-rose-600" />
                      2. 几何底纹肌理 (Pattern)
                    </span>
                    <input
                      type="color"
                      value={template.patternColor}
                      onChange={(e) =>
                        setTemplate((prev) => ({
                          ...prev,
                          patternColor: e.target.value,
                        }))
                      }
                      className="w-5 h-5 rounded cursor-pointer border border-stone-300"
                      title="底纹线条颜色"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {PATTERN_OPTIONS.map((pat) => (
                      <button
                        key={pat.id}
                        onClick={() =>
                          setTemplate((prev) => ({ ...prev, patternType: pat.id }))
                        }
                        className={`py-1.5 px-2.5 text-xs font-medium rounded border text-left transition-colors whitespace-nowrap shrink-0 ${
                          template.patternType === pat.id
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        {pat.label}
                      </button>
                    ))}
                  </div>

                  {template.patternType !== 'none' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-stone-500">
                        <span>底纹浓度</span>
                        <span className="font-mono tabular-nums">
                          {Math.round(template.patternOpacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.03"
                        max="0.35"
                        step="0.01"
                        value={template.patternOpacity}
                        onChange={(e) =>
                          setTemplate((prev) => ({
                            ...prev,
                            patternOpacity: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full accent-rose-600"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Border Frame & Custom Border Overlay PNG */}
                <div className="pt-4 border-t border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Frame className="w-3.5 h-3.5 text-rose-600" />
                      3. 边框画框与透明边框图
                    </span>
                    <input
                      type="color"
                      value={template.borderColor}
                      onChange={(e) =>
                        setTemplate((prev) => ({
                          ...prev,
                          borderColor: e.target.value,
                        }))
                      }
                      className="w-5 h-5 rounded cursor-pointer border border-stone-300"
                      title="边框颜色"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {BORDER_OPTIONS.map((bdr) => (
                      <button
                        key={bdr.id}
                        onClick={() =>
                          setTemplate((prev) => ({ ...prev, borderFrameType: bdr.id }))
                        }
                        className={`py-1.5 px-2.5 text-xs font-medium rounded border text-left transition-colors whitespace-nowrap shrink-0 ${
                          template.borderFrameType === bdr.id
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        {bdr.label}
                      </button>
                    ))}
                  </div>

                  {/* Upload Custom Transparent Border PNG/SVG */}
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={() => borderOverlayInputRef.current?.click()}
                      className="flex-1 py-2 px-3 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <FilePlus2 className="w-3.5 h-3.5" />
                      {template.customBorderImage
                        ? '已叠加自定义边框图 (点击更换)'
                        : '上传自定义透明边框 PNG/SVG'}
                    </button>
                    {template.customBorderImage && (
                      <button
                        onClick={() =>
                          setTemplate((prev) => ({
                            ...prev,
                            customBorderImage: undefined,
                          }))
                        }
                        className="px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        移除
                      </button>
                    )}
                  </div>

                  {/* Accent & Text Color Pickers */}
                  <div className="pt-2 grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-2 border border-stone-200 rounded-lg">
                      <span className="text-xs text-stone-600">正文颜色</span>
                      <input
                        type="color"
                        value={template.textColor}
                        onChange={(e) =>
                          setTemplate((prev) => ({
                            ...prev,
                            textColor: e.target.value,
                          }))
                        }
                        className="w-5 h-5 rounded cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 border border-stone-200 rounded-lg">
                      <span className="text-xs text-stone-600">高亮强调色</span>
                      <input
                        type="color"
                        value={template.accentColor}
                        onChange={(e) =>
                          setTemplate((prev) => ({
                            ...prev,
                            accentColor: e.target.value,
                            accentBgSoft: `${e.target.value}1F`,
                          }))
                        }
                        className="w-5 h-5 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DIMENSIONS, TYPOGRAPHY & HEADER/FOOTER METADATA */}
            {rightPanelTab === 'layout' && (
              <div className="space-y-6">
                {/* 1. Exact Pixel Dimensions */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-stone-900 block">
                    1. 严格画幅像素尺寸 (基准 1x / 导出 3x)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-stone-500 mb-1">
                        卡片宽度 (px)
                      </label>
                      <input
                        type="number"
                        min={280}
                        max={640}
                        value={customWidth}
                        onChange={(e) =>
                          setCustomWidth(
                            Math.max(280, Math.min(640, Number(e.target.value) || 360))
                          )
                        }
                        className="w-full px-3 py-1.5 text-xs font-mono tabular-nums border border-stone-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-500 mb-1">
                        卡片高度 (px)
                      </label>
                      <input
                        type="number"
                        min={320}
                        max={800}
                        value={customHeight}
                        onChange={(e) =>
                          setCustomHeight(
                            Math.max(320, Math.min(800, Number(e.target.value) || 480))
                          )
                        }
                        className="w-full px-3 py-1.5 text-xs font-mono tabular-nums border border-stone-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Font Pairing & Size Scale */}
                <div className="pt-4 border-t border-stone-200 space-y-3">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-rose-600" />
                    2. 字体气质与字号缩放
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'editorial-serif', label: '人文衬线' },
                        { id: 'modern-sans', label: '现代无衬线' },
                        { id: 'technical-mono', label: '极客等宽' },
                      ] as { id: FontPairingMode; label: string }[]
                    ).map((f) => (
                      <button
                        key={f.id}
                        onClick={() =>
                          setTemplate((prev) => ({ ...prev, fontMode: f.id }))
                        }
                        className={`py-1.5 px-2 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                          template.fontMode === f.id
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-stone-500">
                      <span>全局字号比例</span>
                      <span className="font-mono tabular-nums">
                        {Math.round(meta.fontSizeScale * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.85"
                      max="1.15"
                      step="0.05"
                      value={meta.fontSizeScale}
                      onChange={(e) =>
                        setMeta((prev) => ({
                          ...prev,
                          fontSizeScale: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full accent-rose-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-stone-500">
                      <span>四周安全留白 (Padding)</span>
                      <span className="font-mono tabular-nums">
                        {template.paddingX}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="44"
                      step="2"
                      value={template.paddingX}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setTemplate((prev) => ({
                          ...prev,
                          paddingX: val,
                          paddingY: val + 2,
                        }));
                      }}
                      className="w-full accent-rose-600"
                    />
                  </div>
                </div>

                {/* 3. Header & Footer Watermark Signatures */}
                <div className="pt-4 border-t border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">
                      3. 页眉与页脚账号签名
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={meta.showPageNumber}
                        onChange={(e) =>
                          setMeta((prev) => ({
                            ...prev,
                            showPageNumber: e.target.checked,
                          }))
                        }
                        className="accent-rose-600"
                      />
                      显示页码 (01/04)
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-stone-500">
                        顶部欄目名
                      </label>
                      <input
                        type="checkbox"
                        checked={meta.showHeader}
                        onChange={(e) =>
                          setMeta((prev) => ({
                            ...prev,
                            showHeader: e.target.checked,
                          }))
                        }
                        className="accent-rose-600"
                      />
                    </div>
                    {meta.showHeader && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={meta.headerLeft}
                          onChange={(e) =>
                            setMeta((prev) => ({
                              ...prev,
                              headerLeft: e.target.value,
                            }))
                          }
                          placeholder="左侧栏目名"
                          className="px-2.5 py-1.5 text-xs border border-stone-200 rounded"
                        />
                        <input
                          type="text"
                          value={meta.headerRight}
                          onChange={(e) =>
                            setMeta((prev) => ({
                              ...prev,
                              headerRight: e.target.value,
                            }))
                          }
                          placeholder="右侧期刊号"
                          className="px-2.5 py-1.5 text-xs border border-stone-200 rounded font-mono"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-stone-500">
                        底部创作者署名
                      </label>
                      <input
                        type="checkbox"
                        checked={meta.showFooter}
                        onChange={(e) =>
                          setMeta((prev) => ({
                            ...prev,
                            showFooter: e.target.checked,
                          }))
                        }
                        className="accent-rose-600"
                      />
                    </div>
                    {meta.showFooter && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={meta.authorHandle}
                          onChange={(e) =>
                            setMeta((prev) => ({
                              ...prev,
                              authorHandle: e.target.value,
                            }))
                          }
                          placeholder="@账号名称"
                          className="px-2.5 py-1.5 text-xs border border-stone-200 rounded"
                        />
                        <input
                          type="text"
                          value={meta.footerNote}
                          onChange={(e) =>
                            setMeta((prev) => ({
                              ...prev,
                              footerNote: e.target.value,
                            }))
                          }
                          placeholder="底部引导语"
                          className="px-2.5 py-1.5 text-xs border border-stone-200 rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel Bottom Action */}
          <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-2">
            <button
              onClick={() => setIsBackendModalOpen(true)}
              className="flex-1 py-2 px-3 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Code2 className="w-3.5 h-3.5" />
              查看后端 JSON 契约
            </button>
          </div>
        </aside>
      </main>

      {/* Backend API & JSON Schema Contract Modal */}
      <BackendContractModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        engineMode={engineMode}
        onChangeEngineMode={(mode) => {
          setEngineMode(mode);
          if (mode === 'backend-api') {
            syncWithBackendApi();
          }
        }}
        preset={activePreset}
        template={template}
        meta={meta}
        paginationMode={paginationMode}
        cards={cards}
        lastServerSyncAt={lastServerSyncAt}
        onTriggerServerTest={syncWithBackendApi}
        isSyncing={isSyncingServer}
      />
    </div>
  );
}
