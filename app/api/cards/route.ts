import { NextRequest, NextResponse } from 'next/server';
import {
  BUILTIN_TEMPLATES,
  CardMetaConfig,
  CardTemplate,
  PaginationMode,
  PLATFORM_PRESETS,
} from '@/lib/card-types';
import { paginateMarkdownToCards } from '@/lib/markdown-paginator';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    engine: 'MarkCard-Server-Paginator',
    presets: PLATFORM_PRESETS,
    builtinTemplatesCount: BUILTIN_TEMPLATES.length,
    templates: BUILTIN_TEMPLATES,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      markdown = '',
      presetId = 'xhs-3-4',
      customWidth,
      customHeight,
      templateId = 'editorial-paper',
      customTemplate,
      meta,
      paginationMode = 'smart-auto',
    } = body;

    const basePreset =
      PLATFORM_PRESETS.find((p) => p.id === presetId) || PLATFORM_PRESETS[0];

    const preset = {
      ...basePreset,
      width: customWidth ? Number(customWidth) : basePreset.width,
      height: customHeight ? Number(customHeight) : basePreset.height,
    };

    const template: CardTemplate =
      customTemplate ||
      BUILTIN_TEMPLATES.find((t) => t.id === templateId) ||
      BUILTIN_TEMPLATES[0];

    const safeMeta: CardMetaConfig = {
      showHeader: meta?.showHeader ?? true,
      headerLeft: meta?.headerLeft ?? '小红书 · 视觉笔记',
      headerRight: meta?.headerRight ?? '2026 EDITION',
      showFooter: meta?.showFooter ?? true,
      authorHandle: meta?.authorHandle ?? '@林间漫步',
      footerNote: meta?.footerNote ?? '滑动查看下一张',
      showPageNumber: meta?.showPageNumber ?? true,
      showSafeZoneGuide: meta?.showSafeZoneGuide ?? false,
      fontSizeScale: meta?.fontSizeScale ?? 1,
    };

    const cards = paginateMarkdownToCards(
      markdown,
      preset,
      template,
      safeMeta,
      paginationMode as PaginationMode
    );

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      renderSpec: {
        canvasWidth: preset.width,
        canvasHeight: preset.height,
        exportWidth: preset.width * preset.exportScale,
        exportHeight: preset.height * preset.exportScale,
        exportScale: preset.exportScale,
        ratioLabel: preset.ratioLabel,
        paginationMode,
      },
      template,
      meta: safeMeta,
      totalCards: cards.length,
      cards,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to parse markdown';
    return NextResponse.json({ status: 'error', message }, { status: 400 });
  }
}
