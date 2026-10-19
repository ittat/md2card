import {
  CardMetaConfig,
  CardTemplate,
  ListItemData,
  MarkdownBlock,
  PaginatedCard,
  PaginationMode,
  PlatformPreset,
  TableData,
} from './card-types';

/**
 * Estimates the rendered pixel height of a MarkdownBlock inside a card of fixed width
 */
function estimateBlockHeight(
  block: Omit<MarkdownBlock, 'estimatedHeight'>,
  contentWidth: number,
  fontSizeScale: number
): number {
  const charsPerLine = Math.max(12, Math.floor(contentWidth / (14.5 * fontSizeScale)));

  switch (block.type) {
    case 'h1': {
      const lines = Math.max(1, Math.ceil(block.content.length / Math.floor(charsPerLine * 0.62)));
      return Math.round((lines * 34 + 22) * fontSizeScale);
    }
    case 'h2': {
      const lines = Math.max(1, Math.ceil(block.content.length / Math.floor(charsPerLine * 0.75)));
      return Math.round((lines * 26 + 18) * fontSizeScale);
    }
    case 'h3': {
      const lines = Math.max(1, Math.ceil(block.content.length / Math.floor(charsPerLine * 0.85)));
      return Math.round((lines * 22 + 14) * fontSizeScale);
    }
    case 'paragraph': {
      const plainLength = block.content.replace(/(\*\*|\*|==|`)/g, '').length;
      const lines = Math.max(1, Math.ceil(plainLength / charsPerLine));
      return Math.round((lines * 22 + 12) * fontSizeScale);
    }
    case 'blockquote': {
      const plainLength = block.content.replace(/(\*\*|\*|==|`)/g, '').length;
      const lines = Math.max(1, Math.ceil(plainLength / Math.max(10, charsPerLine - 3)));
      return Math.round((lines * 21 + 26) * fontSizeScale);
    }
    case 'image': {
      // Fixed aspect container inside card + optional caption
      return Math.round(148 + (block.imageAlt ? 22 : 6));
    }
    case 'table': {
      if (!block.table) return 80;
      const rowCount = block.table.rows.length + 1; // +1 for header
      return Math.round(rowCount * 31 + 20);
    }
    case 'ul':
    case 'ol': {
      const items = block.items || [];
      let totalLines = 0;
      for (const item of items) {
        const plain = item.text.replace(/(\*\*|\*|==|`)/g, '').length;
        totalLines += Math.max(1, Math.ceil(plain / Math.max(10, charsPerLine - 2)));
      }
      return Math.round((totalLines * 21 + items.length * 6 + 12) * fontSizeScale);
    }
    case 'code': {
      const codeLines = block.content.split('\n').length;
      return Math.round(codeLines * 18 + 28);
    }
    default:
      return 40;
  }
}

interface RawSegment {
  blocks: MarkdownBlock[];
}

/**
 * Parses a raw markdown segment (without `---` page breaks) into structured MarkdownBlocks
 */
function parseSegmentBlocks(
  rawSegment: string,
  contentWidth: number,
  fontSizeScale: number,
  segmentIdx: number
): MarkdownBlock[] {
  const lines = rawSegment.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let i = 0;
  let blockCounter = 0;

  const nextId = () => `blk-${segmentIdx}-${blockCounter++}`;

  while (i < lines.length) {
    const line = lines[i].trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Code block ```
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim() || 'text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      const content = codeLines.join('\n');
      const partial: Omit<MarkdownBlock, 'estimatedHeight'> = {
        id: nextId(),
        type: 'code',
        content,
        language,
      };
      blocks.push({
        ...partial,
        estimatedHeight: estimateBlockHeight(partial, contentWidth, fontSizeScale),
      });
      continue;
    }

    // 2. Headings (#, ##, ###)
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const type = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
      const content = headingMatch[2].trim();
      const partial: Omit<MarkdownBlock, 'estimatedHeight'> = {
        id: nextId(),
        type,
        content,
      };
      blocks.push({
        ...partial,
        estimatedHeight: estimateBlockHeight(partial, contentWidth, fontSizeScale),
      });
      i++;
      continue;
    }

    // 3. Standalone Image ![alt](url)
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      const partial: Omit<MarkdownBlock, 'estimatedHeight'> = {
        id: nextId(),
        type: 'image',
        content: imageMatch[1],
        imageAlt: imageMatch[1],
        imageUrl: imageMatch[2].trim(),
      };
      blocks.push({
        ...partial,
        estimatedHeight: estimateBlockHeight(partial, contentWidth, fontSizeScale),
      });
      i++;
      continue;
    }

    // 4. Table (| ... |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (rowStr: string) =>
          rowStr
            .slice(1, -1)
            .split('|')
            .map((cell) => cell.trim());

        const headers = parseRow(tableLines[0]);
        // Check if row 1 is separator (e.g. | :--- | :--- |)
        const isSeparator = tableLines[1].replace(/[\s|:-]/g, '').length === 0;
        const dataStartIndex = isSeparator ? 2 : 1;
        const rows = tableLines.slice(dataStartIndex).map(parseRow);
        const table: TableData = { headers, rows };
        const partial: Omit<MarkdownBlock, 'estimatedHeight'> = {
          id: nextId(),
          type: 'table',
          content: '',
          table,
        };
        blocks.push({
          ...partial,
          estimatedHeight: estimateBlockHeight(partial, contentWidth, fontSizeScale),
        });
        continue;
      }
    }

    // 5. Blockquote (> ...)
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      const content = quoteLines.join(' ');
      const partial: Omit<MarkdownBlock, 'estimatedHeight'> = {
        id: nextId(),
        type: 'blockquote',
        content,
      };
      blocks.push({
        ...partial,
        estimatedHeight: estimateBlockHeight(partial, contentWidth, fontSizeScale),
      });
      continue;
    }

    // 6. Unordered List (- or * )
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: ListItemData[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        const rawItem = lines[i].trim().replace(/^[-*+]\s+/, '');
        const taskMatch = rawItem.match(/^\[([ xX])\]\s+(.+)$/);
        if (taskMatch) {
          items.push({
            checked: taskMatch[1].toLowerCase() === 'x',
            text: taskMatch[2].trim(),
          });
        } else {
          items.push({ text: rawItem });
        }
        i++;
      }
      const partial: Omit<MarkdownBlock, 'estimatedHeight'> = {
        id: nextId(),
        type: 'ul',
        content: '',
        items,
      };
      blocks.push({
        ...partial,
        estimatedHeight: estimateBlockHeight(partial, contentWidth, fontSizeScale),
      });
      continue;
    }

    // 7. Ordered List (1. )
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: ListItemData[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const rawItem = lines[i].trim().replace(/^\d+\.\s+/, '');
        items.push({ text: rawItem });
        i++;
      }
      const partial: Omit<MarkdownBlock, 'estimatedHeight'> = {
        id: nextId(),
        type: 'ol',
        content: '',
        items,
      };
      blocks.push({
        ...partial,
        estimatedHeight: estimateBlockHeight(partial, contentWidth, fontSizeScale),
      });
      continue;
    }

    // 8. Standard Paragraph (merge consecutive plain lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('|') &&
      !/^!\[([^\]]*)\]\(([^)]+)\)$/.test(lines[i].trim()) &&
      !/^[-*+]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    const content = paraLines.join(' ');
    if (content) {
      const partial: Omit<MarkdownBlock, 'estimatedHeight'> = {
        id: nextId(),
        type: 'paragraph',
        content,
      };
      blocks.push({
        ...partial,
        estimatedHeight: estimateBlockHeight(partial, contentWidth, fontSizeScale),
      });
    }
  }

  return blocks;
}

/**
 * Splits markdown content into multiple fixed-dimension cards according to platform preset, template padding, and pagination mode
 */
export function paginateMarkdownToCards(
  markdown: string,
  preset: PlatformPreset,
  template: CardTemplate,
  meta: CardMetaConfig,
  mode: PaginationMode
): PaginatedCard[] {
  const headerReserve = meta.showHeader ? 32 : 0;
  const footerReserve = meta.showFooter || meta.showPageNumber ? 34 : 0;
  const maxAvailableHeight = Math.max(
    160,
    preset.height - template.paddingY * 2 - headerReserve - footerReserve
  );
  const contentWidth = Math.max(180, preset.width - template.paddingX * 2);

  // Split first by explicit `---` horizontal rules on their own line
  const rawHrSegments = markdown
    .replace(/\r\n/g, '\n')
    .split(/\n\s*---+\s*\n/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const segments: RawSegment[] = rawHrSegments.map((seg, idx) => ({
    blocks: parseSegmentBlocks(seg, contentWidth, meta.fontSizeScale, idx),
  }));

  const rawPages: { blocks: MarkdownBlock[]; usedHeight: number }[] = [];

  if (mode === 'manual-hr') {
    // Strictly 1 card per `---` segment
    for (const seg of segments) {
      if (seg.blocks.length === 0) continue;
      const usedHeight = seg.blocks.reduce((acc, b) => acc + b.estimatedHeight, 0);
      rawPages.push({ blocks: seg.blocks, usedHeight });
    }
  } else if (mode === 'by-h2') {
    // Split on `---` AND whenever an H1/H2 appears (unless it's the first block of a page)
    for (const seg of segments) {
      let currentBlocks: MarkdownBlock[] = [];
      let currentHeight = 0;

      for (const block of seg.blocks) {
        if ((block.type === 'h1' || block.type === 'h2') && currentBlocks.length > 0) {
          rawPages.push({ blocks: currentBlocks, usedHeight: currentHeight });
          currentBlocks = [block];
          currentHeight = block.estimatedHeight;
        } else {
          currentBlocks.push(block);
          currentHeight += block.estimatedHeight;
        }
      }
      if (currentBlocks.length > 0) {
        rawPages.push({ blocks: currentBlocks, usedHeight: currentHeight });
      }
    }
  } else {
    // 'smart-auto': Respect explicit `---` breaks AND automatically flow overflowing blocks onto a new card
    for (const seg of segments) {
      let currentBlocks: MarkdownBlock[] = [];
      let currentHeight = 0;

      for (let idx = 0; idx < seg.blocks.length; idx++) {
        const block = seg.blocks[idx];
        const nextBlock = seg.blocks[idx + 1];

        // Avoid leaving an orphaned heading at the very bottom of a card
        const headingKeepWithNext =
          (block.type === 'h2' || block.type === 'h3') && nextBlock
            ? Math.min(60, nextBlock.estimatedHeight * 0.5)
            : 0;

        if (
          currentBlocks.length > 0 &&
          currentHeight + block.estimatedHeight + headingKeepWithNext > maxAvailableHeight
        ) {
          rawPages.push({ blocks: currentBlocks, usedHeight: currentHeight });
          currentBlocks = [block];
          currentHeight = block.estimatedHeight;
        } else {
          currentBlocks.push(block);
          currentHeight += block.estimatedHeight;
        }
      }

      if (currentBlocks.length > 0) {
        rawPages.push({ blocks: currentBlocks, usedHeight: currentHeight });
      }
    }
  }

  if (rawPages.length === 0) {
    rawPages.push({
      blocks: [
        {
          id: 'empty-placeholder',
          type: 'paragraph',
          content: '在左侧输入 Markdown 内容，这里将实时生成符合平台规范的固定尺寸卡片...',
          estimatedHeight: 48,
        },
      ],
      usedHeight: 48,
    });
  }

  const total = rawPages.length;
  return rawPages.map((page, idx) => ({
    index: idx + 1,
    total,
    isCover: idx === 0 && page.blocks.some((b) => b.type === 'h1'),
    blocks: page.blocks,
    estimatedUsedHeight: page.usedHeight,
    maxAvailableHeight,
    isOverflowing: page.usedHeight > maxAvailableHeight + 16,
  }));
}
