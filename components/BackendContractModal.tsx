'use client';

import React, { useState } from 'react';
import {
  CardMetaConfig,
  CardTemplate,
  PaginatedCard,
  PaginationMode,
  PlatformPreset,
} from '@/lib/card-types';
import { Check, Copy, Server, Terminal, X, Zap } from 'lucide-react';

interface BackendContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineMode: 'frontend' | 'backend-api';
  onChangeEngineMode: (mode: 'frontend' | 'backend-api') => void;
  preset: PlatformPreset;
  template: CardTemplate;
  meta: CardMetaConfig;
  paginationMode: PaginationMode;
  cards: PaginatedCard[];
  lastServerSyncAt: string | null;
  onTriggerServerTest: () => Promise<void>;
  isSyncing: boolean;
}

export function BackendContractModal({
  isOpen,
  onClose,
  engineMode,
  onChangeEngineMode,
  preset,
  template,
  meta,
  paginationMode,
  cards,
  lastServerSyncAt,
  onTriggerServerTest,
  isSyncing,
}: BackendContractModalProps) {
  const [activeTab, setActiveTab] = useState<'payload' | 'template-json' | 'node-code'>('payload');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const samplePayload = {
    endpoint: 'POST /api/cards',
    renderSpec: {
      platform: preset.platformLabel,
      ratio: preset.ratioLabel,
      domCanvasSize: `${preset.width}x${preset.height}px`,
      exportResolution: `${preset.width * preset.exportScale}x${preset.height * preset.exportScale}px`,
      exportScale: preset.exportScale,
      paginationMode,
    },
    meta,
    totalCards: cards.length,
    cardsPreview: cards.slice(0, 2),
  };

  const nodeBackendSnippet = `// 后端服务示例：接收前端提交的 TemplateJSON 与 PaginatedCards AST
// 方案 A：前端直接通过 html-to-image 导出 PNG（零服务器成本）
// 方案 B：后端通过 Playwright / Puppeteer 按固定宽高批量截图生成图片流

import { chromium } from 'playwright';

export async function renderCardsOnServer(payload) {
  const { renderSpec, cards, templateId } = payload;
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: {
      width: renderSpec.canvasWidth,   // 如 360px
      height: renderSpec.canvasHeight, // 如 480px (3:4 小红书)
    },
    deviceScaleFactor: renderSpec.exportScale || 3, // 3倍高清导出 -> 1080x1440px
  });

  await page.goto(\`\${process.env.APP_URL}/?template=\${templateId}&headless=1\`);
  const cardBuffers = [];

  for (let i = 0; i < cards.length; i++) {
    const locator = page.locator(\`[data-card-index="\${i + 1}"]\`);
    const buffer = await locator.screenshot({ type: 'png' });
    cardBuffers.push(buffer);
  }

  await browser.close();
  return cardBuffers;
}`;

  const currentCode =
    activeTab === 'payload'
      ? JSON.stringify(samplePayload, null, 2)
      : activeTab === 'template-json'
      ? JSON.stringify(template, null, 2)
      : nodeBackendSnippet;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-stone-200 rounded-xl w-full max-w-3xl max-h-[86vh] flex flex-col overflow-hidden shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-stone-800" />
            <div>
              <h2 className="text-base font-bold text-stone-900">
                前后端协同架构与 API 数据契约
              </h2>
              <p className="text-xs text-stone-500">
                支持「纯前端本地闭环」或「配合后端接口 `/api/cards` 协同处理模板与分页 AST」
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
            aria-label="关闭窗口"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-2 p-1 bg-stone-100 rounded-lg">
            <button
              onClick={() => onChangeEngineMode('frontend')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                engineMode === 'frontend'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-rose-600" />
              纯前端实时模式 (零延迟)
            </button>
            <button
              onClick={() => onChangeEngineMode('backend-api')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                engineMode === 'backend-api'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-blue-600" />
              后端 API 协同模式 (POST /api/cards)
            </button>
          </div>

          <div className="flex items-center gap-3">
            {lastServerSyncAt && (
              <span className="text-xs font-mono tabular-nums text-stone-500">
                最近同步: {lastServerSyncAt}
              </span>
            )}
            <button
              onClick={onTriggerServerTest}
              disabled={isSyncing}
              className="px-3.5 py-1.5 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              {isSyncing ? '请求 /api/cards 中...' : '立即测试后端接口'}
            </button>
          </div>
        </div>

        {/* Code Schema Tabs */}
        <div className="px-6 pt-3 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setActiveTab('payload')}
              className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'payload'
                  ? 'border-rose-600 text-stone-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              1. 分页 AST 响应结构 (/api/cards)
            </button>
            <button
              onClick={() => setActiveTab('template-json')}
              className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'template-json'
                  ? 'border-rose-600 text-stone-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              2. 当前模板 JSON 配置 (可存数据库)
            </button>
            <button
              onClick={() => setActiveTab('node-code')}
              className={`pb-2.5 border-b-2 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                activeTab === 'node-code'
                  ? 'border-rose-600 text-stone-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              3. 服务端無头渲染参考代码
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="mb-2 flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-stone-700 hover:text-stone-900 bg-white border border-stone-200 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                复制代码
              </>
            )}
          </button>
        </div>

        {/* Code Viewer */}
        <div className="flex-1 overflow-y-auto bg-stone-950 p-5 text-stone-100 font-mono text-xs leading-relaxed">
          <pre className="whitespace-pre-wrap break-all">{currentCode}</pre>
        </div>
      </div>
    </div>
  );
}
