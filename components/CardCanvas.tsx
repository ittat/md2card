'use client';

import React, { useState } from 'react';
import {
  CardMetaConfig,
  CardTemplate,
  MarkdownBlock,
  PaginatedCard,
  PlatformPreset,
} from '@/lib/card-types';
import { CheckSquare, ImageIcon, Square } from 'lucide-react';

interface CardCanvasProps {
  card: PaginatedCard;
  preset: PlatformPreset;
  template: CardTemplate;
  meta: CardMetaConfig;
  domRef?: (el: HTMLDivElement | null) => void;
  isExporting?: boolean;
}

/**
 * Parses inline markdown syntax: **bold**, *italic*, `code`, ==highlight==, [text](url)
 */
function renderInlineMarkdown(
  text: string,
  template: CardTemplate
): React.ReactNode[] {
  const tokenRegex =
    /(\*\*[^*]+\*\*|==[^=]+==|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong
          key={idx}
          className="font-semibold"
          style={{ color: template.textColor }}
        >
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('==') && part.endsWith('==')) {
      return (
        <mark
          key={idx}
          className="px-1 py-0.5 rounded-sm font-medium"
          style={{
            backgroundColor: template.accentBgSoft,
            color: template.accentColor,
            boxShadow: `inset 0 -2px 0 ${template.accentColor}40`,
          }}
        >
          {part.slice(2, -2)}
        </mark>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="font-mono text-[0.88em] px-1.5 py-0.5 rounded border"
          style={{
            backgroundColor: template.cardSurfaceBg,
            borderColor: template.tableBorderColor,
            color: template.accentColor,
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className="italic opacity-90">
          {part.slice(1, -1)}
        </em>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <span
          key={idx}
          className="underline underline-offset-2 font-medium"
          style={{ color: template.accentColor }}
        >
          {linkMatch[1]}
        </span>
      );
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function PatternOverlay({
  template,
  width,
  height,
  cardIndex,
}: {
  template: CardTemplate;
  width: number;
  height: number;
  cardIndex: number;
}) {
  if (template.patternType === 'none') return null;

  const patId = `pat-${template.id}-${template.patternType}-${cardIndex}`;
  const stroke = template.patternColor;
  const opacity = template.patternOpacity;

  return (
    <svg
      className="pointer-events-none absolute inset-0 w-full h-full"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <defs>
        {template.patternType === 'grid' && (
          <pattern id={patId} width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke={stroke}
              strokeWidth="0.75"
            />
          </pattern>
        )}
        {template.patternType === 'dots' && (
          <pattern id={patId} width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="1.1" fill={stroke} />
          </pattern>
        )}
        {template.patternType === 'ruled-lines' && (
          <pattern id={patId} width="40" height="24" patternUnits="userSpaceOnUse">
            <line
              x1="0"
              y1="23.5"
              x2="40"
              y2="23.5"
              stroke={stroke}
              strokeWidth="0.8"
            />
          </pattern>
        )}
        {template.patternType === 'paper-grain' && (
          <pattern id={patId} width="32" height="32" patternUnits="userSpaceOnUse">
            <path
              d="M2 6h5M18 4l4 2M8 18h6M24 22l-5 2M4 28l3-2M26 12h4"
              stroke={stroke}
              strokeWidth="0.75"
              strokeLinecap="round"
            />
            <circle cx="14" cy="10" r="0.6" fill={stroke} />
            <circle cx="28" cy="28" r="0.6" fill={stroke} />
          </pattern>
        )}
        {template.patternType === 'crosshairs' && (
          <pattern id={patId} width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M20 16v8M16 20h8"
              stroke={stroke}
              strokeWidth="0.85"
              strokeLinecap="round"
            />
          </pattern>
        )}
        {template.patternType === 'diagonal' && (
          <pattern id={patId} width="14" height="14" patternUnits="userSpaceOnUse">
            <path
              d="M-2,2 l4,-4 M0,14 l14,-14 M12,16 l4,-4"
              stroke={stroke}
              strokeWidth="0.8"
            />
          </pattern>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patId})`} />
    </svg>
  );
}

function BorderFrameOverlay({
  template,
  width,
  height,
  cardIndex,
}: {
  template: CardTemplate;
  width: number;
  height: number;
  cardIndex: number;
}) {
  const inset = template.borderInset;
  const color = template.borderColor;
  const innerW = width - inset * 2;
  const innerH = height - inset * 2;

  return (
    <>
      {template.borderFrameType === 'double-editorial' && (
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full"
          viewBox={`0 0 ${width} ${height}`}
        >
          <rect
            x={inset}
            y={inset}
            width={innerW}
            height={innerH}
            fill="none"
            stroke={color}
            strokeWidth="1.25"
            opacity="0.7"
          />
          <rect
            x={inset + 4}
            y={inset + 4}
            width={innerW - 8}
            height={innerH - 8}
            fill="none"
            stroke={color}
            strokeWidth="0.6"
            opacity="0.45"
          />
          {/* Corner editorial knots */}
          <rect x={inset - 1.5} y={inset - 1.5} width="5" height="5" fill={color} opacity="0.8" />
          <rect x={width - inset - 3.5} y={inset - 1.5} width="5" height="5" fill={color} opacity="0.8" />
          <rect x={inset - 1.5} y={height - inset - 3.5} width="5" height="5" fill={color} opacity="0.8" />
          <rect x={width - inset - 3.5} y={height - inset - 3.5} width="5" height="5" fill={color} opacity="0.8" />
        </svg>
      )}

      {template.borderFrameType === 'viewfinder-corners' && (
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full"
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Subtle full perimeter hairline */}
          <rect
            x={inset}
            y={inset}
            width={innerW}
            height={innerH}
            fill="none"
            stroke={color}
            strokeWidth="0.6"
            opacity="0.22"
          />
          {/* 4 bold viewfinder L-brackets */}
          <path
            d={`
              M ${inset} ${inset + 18} L ${inset} ${inset} L ${inset + 18} ${inset}
              M ${width - inset - 18} ${inset} L ${width - inset} ${inset} L ${width - inset} ${inset + 18}
              M ${inset} ${height - inset - 18} L ${inset} ${height - inset} L ${inset + 18} ${height - inset}
              M ${width - inset - 18} ${height - inset} L ${width - inset} ${height - inset} L ${width - inset} ${height - inset - 18}
            `}
            fill="none"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="square"
          />
          {/* Center axis ticks */}
          <line x1={width / 2 - 6} y1={inset} x2={width / 2 + 6} y2={inset} stroke={color} strokeWidth="1.5" />
          <line x1={width / 2 - 6} y1={height - inset} x2={width / 2 + 6} y2={height - inset} stroke={color} strokeWidth="1.5" />
        </svg>
      )}

      {template.borderFrameType === 'stamp-perforated' && (
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full"
          viewBox={`0 0 ${width} ${height}`}
        >
          <rect
            x={inset}
            y={inset}
            width={innerW}
            height={innerH}
            rx="6"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="5 4"
            opacity="0.65"
          />
          <rect
            x={inset + 5}
            y={inset + 5}
            width={innerW - 10}
            height={innerH - 10}
            rx="3"
            fill="none"
            stroke={color}
            strokeWidth="0.75"
            opacity="0.35"
          />
        </svg>
      )}

      {template.borderFrameType === 'film-sprocket' && (
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full"
          viewBox={`0 0 ${width} ${height}`}
        >
          <rect
            x={22}
            y={inset}
            width={width - 44}
            height={innerH}
            fill="none"
            stroke={color}
            strokeWidth="1.1"
            opacity="0.45"
          />
          {/* Left & Right sprocket holes */}
          {Array.from({ length: Math.floor((height - 40) / 36) }).map((_, i) => {
            const yPos = 24 + i * 36;
            return (
              <g key={i} opacity="0.55">
                <rect x={7} y={yPos} width="9" height="13" rx="2" fill="none" stroke={color} strokeWidth="1.2" />
                <rect x={width - 16} y={yPos} width="9" height="13" rx="2" fill="none" stroke={color} strokeWidth="1.2" />
              </g>
            );
          })}
          <text
            x={width - 11}
            y={height - 10}
            fontSize="7"
            fontFamily="monospace"
            fill={color}
            textAnchor="middle"
            opacity="0.65"
          >
            {String(cardIndex).padStart(2, '0')}A
          </text>
        </svg>
      )}

      {template.borderFrameType === 'gallery-filigree' && (
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full"
          viewBox={`0 0 ${width} ${height}`}
        >
          <rect
            x={inset + 3}
            y={inset + 3}
            width={innerW - 6}
            height={innerH - 6}
            fill="none"
            stroke={color}
            strokeWidth="0.9"
            opacity="0.55"
          />
          {/* Ornate stepped corners */}
          <path
            d={`
              M ${inset} ${inset + 14} H ${inset + 14} V ${inset}
              M ${width - inset} ${inset + 14} H ${width - inset - 14} V ${inset}
              M ${inset} ${height - inset - 14} H ${inset + 14} V ${height - inset}
              M ${width - inset} ${height - inset - 14} H ${width - inset - 14} V ${height - inset}
            `}
            fill="none"
            stroke={color}
            strokeWidth="1.2"
            opacity="0.85"
          />
        </svg>
      )}

      {template.borderFrameType === 'swiss-grid' && (
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full"
          viewBox={`0 0 ${width} ${height}`}
        >
          <rect
            x={inset}
            y={inset}
            width={innerW}
            height={innerH}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            opacity="0.85"
          />
          <line
            x1={inset}
            y1={inset + 34}
            x2={width - inset}
            y2={inset + 34}
            stroke={color}
            strokeWidth="1"
            opacity="0.5"
          />
          <line
            x1={inset}
            y1={height - inset - 34}
            x2={width - inset}
            y2={height - inset - 34}
            stroke={color}
            strokeWidth="1"
            opacity="0.5"
          />
        </svg>
      )}

      {/* Optional Custom Border Overlay Image (透明边框图片) */}
      {template.customBorderImage && (
        <img
          src={template.customBorderImage}
          alt="Custom border frame"
          referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 w-full h-full object-fill z-20"
        />
      )}
    </>
  );
}

function ResilientCardImage({
  src,
  alt,
  template,
}: {
  src: string;
  alt?: string;
  template: CardTemplate;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="my-2">
      <div
        className="relative w-full h-[126px] rounded overflow-hidden border flex items-center justify-center"
        style={{
          borderColor: template.tableBorderColor,
          backgroundColor: template.cardSurfaceBg,
        }}
      >
        {!failed && src ? (
          <img
            src={src}
            alt={alt || 'Card visual asset'}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={() => setFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 px-4 text-center">
            <ImageIcon className="w-5 h-5 opacity-50" style={{ color: template.accentColor }} />
            <span className="text-[11px] font-medium" style={{ color: template.mutedColor }}>
              {alt || '图文插画预览占位'}
            </span>
          </div>
        )}
      </div>
      {alt && (
        <figcaption
          className="mt-1 text-[10px] text-center tracking-wide truncate"
          style={{ color: template.mutedColor }}
        >
          ▲ {alt}
        </figcaption>
      )}
    </figure>
  );
}

export function CardCanvas({
  card,
  preset,
  template,
  meta,
  domRef,
  isExporting = false,
}: CardCanvasProps) {
  const fontClass =
    template.fontMode === 'editorial-serif'
      ? 'font-serif'
      : template.fontMode === 'technical-mono'
      ? 'font-mono'
      : 'font-sans';

  const scale = meta.fontSizeScale || 1;

  return (
    <div
      ref={domRef}
      style={{
        width: `${preset.width}px`,
        height: `${preset.height}px`,
        background: template.bgStyle || template.bgColorHex,
        color: template.textColor,
        borderRadius: `${template.borderRadius}px`,
        paddingLeft: `${template.paddingX}px`,
        paddingRight: `${template.paddingX}px`,
        paddingTop: `${template.paddingY}px`,
        paddingBottom: `${template.paddingY}px`,
      }}
      className={`relative overflow-hidden select-none flex flex-col justify-between shrink-0 ${fontClass}`}
    >
      {/* 1. Optional Custom Background Image Layer */}
      {template.customBgImage && (
        <img
          src={template.customBgImage}
          alt="Card background texture"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          style={{ opacity: template.bgImageOpacity ?? 0.35 }}
          className="pointer-events-none absolute inset-0 w-full h-full object-cover z-0"
        />
      )}

      {/* 2. SVG Pattern Layer (底纹) */}
      <PatternOverlay
        template={template}
        width={preset.width}
        height={preset.height}
        cardIndex={card.index}
      />

      {/* 3. Border Frame & Ornaments Layer (边框装饰与边框图) */}
      <BorderFrameOverlay
        template={template}
        width={preset.width}
        height={preset.height}
        cardIndex={card.index}
      />

      {/* 4. Safe Zone Guide Overlay (Only in preview when toggled, never in export) */}
      {meta.showSafeZoneGuide && !isExporting && (
        <div
          className="pointer-events-none absolute z-30 border border-dashed border-rose-500/60"
          style={{
            left: `${template.paddingX}px`,
            right: `${template.paddingX}px`,
            top: `${template.paddingY}px`,
            bottom: `${template.paddingY}px`,
          }}
        >
          <span className="absolute -top-4 left-0 text-[9px] font-mono text-rose-500 bg-white/90 px-1">
            SAFE ZONE {preset.width - template.paddingX * 2}×{preset.height - template.paddingY * 2}px
          </span>
        </div>
      )}

      {/* 5. Top Card Header (Clean unboxed metadata per Zero-Pill rule) */}
      {meta.showHeader && (
        <header
          className="relative z-10 flex items-center justify-between pb-2 mb-2 border-b text-[10px] tracking-wider shrink-0"
          style={{
            borderColor: `${template.tableBorderColor}99`,
            color: template.mutedColor,
          }}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span
              className="inline-block w-1.5 h-1.5 rounded-xs shrink-0"
              style={{ backgroundColor: template.accentColor }}
            />
            <span className="font-medium truncate">{meta.headerLeft}</span>
          </div>
          <span className="font-mono tabular-nums opacity-80 shrink-0">
            {meta.headerRight}
          </span>
        </header>
      )}

      {/* 6. Main Markdown AST Blocks Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-start gap-2.5 overflow-hidden">
        {card.blocks.map((block: MarkdownBlock) => {
          switch (block.type) {
            case 'h1':
              return (
                <div key={block.id} className="pt-1 pb-1.5">
                  <div
                    className="w-7 h-1 mb-2 rounded-xs"
                    style={{ backgroundColor: template.accentColor }}
                  />
                  <h1
                    style={{
                      fontSize: `${Math.round(21 * scale)}px`,
                      lineHeight: 1.28,
                      color: template.textColor,
                    }}
                    className="font-bold tracking-tight text-balance"
                  >
                    {renderInlineMarkdown(block.content, template)}
                  </h1>
                </div>
              );

            case 'h2':
              return (
                <div key={block.id} className="pt-1 pb-0.5">
                  <h2
                    style={{
                      fontSize: `${Math.round(15.5 * scale)}px`,
                      lineHeight: 1.35,
                      color: template.textColor,
                    }}
                    className="font-bold tracking-tight flex items-baseline gap-1.5"
                  >
                    <span
                      className="font-mono text-[0.82em] font-semibold shrink-0"
                      style={{ color: template.accentColor }}
                    >
                      §
                    </span>
                    <span>{renderInlineMarkdown(block.content, template)}</span>
                  </h2>
                </div>
              );

            case 'h3':
              return (
                <h3
                  key={block.id}
                  style={{
                    fontSize: `${Math.round(13.5 * scale)}px`,
                    lineHeight: 1.4,
                    color: template.accentColor,
                  }}
                  className="font-semibold tracking-tight pt-0.5"
                >
                  {renderInlineMarkdown(block.content, template)}
                </h3>
              );

            case 'paragraph':
              return (
                <p
                  key={block.id}
                  style={{
                    fontSize: `${Math.round(12.5 * scale)}px`,
                    lineHeight: 1.62,
                    color: template.textColor,
                  }}
                  className=" font-normal break-words"
                >
                  {renderInlineMarkdown(block.content, template)}
                </p>
              );

            case 'blockquote':
              return (
                <blockquote
                  key={block.id}
                  style={{
                    backgroundColor: template.cardSurfaceBg,
                    borderColor: template.tableBorderColor,
                    fontSize: `${Math.round(11.8 * scale)}px`,
                    lineHeight: 1.58,
                    color: template.textColor,
                  }}
                  className="my-0.5 p-2.5 rounded border relative"
                >
                  <span
                    className="font-serif text-base leading-none mr-1 select-none font-bold"
                    style={{ color: template.accentColor }}
                  >
                    “
                  </span>
                  <span className="opacity-90">
                    {renderInlineMarkdown(block.content, template)}
                  </span>
                </blockquote>
              );

            case 'image':
              return (
                <ResilientCardImage
                  key={block.id}
                  src={block.imageUrl || ''}
                  alt={block.imageAlt}
                  template={template}
                />
              );

            case 'table':
              if (!block.table) return null;
              return (
                <div
                  key={block.id}
                  className="my-1 rounded border overflow-hidden"
                  style={{
                    borderColor: template.tableBorderColor,
                    backgroundColor: template.cardSurfaceBg,
                  }}
                >
                  <table className="w-full border-collapse text-left font-sans">
                    <thead>
                      <tr
                        style={{
                          backgroundColor: template.accentBgSoft,
                          borderBottom: `1px solid ${template.tableBorderColor}`,
                        }}
                      >
                        {block.table.headers.map((header, hIdx) => (
                          <th
                            key={hIdx}
                            style={{
                              fontSize: `${Math.round(10.5 * scale)}px`,
                              color: template.textColor,
                              borderRight:
                                hIdx < block.table!.headers.length - 1
                                  ? `1px solid ${template.tableBorderColor}`
                                  : undefined,
                            }}
                            className="py-1.5 px-2 font-semibold leading-tight"
                          >
                            {renderInlineMarkdown(header, template)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.table.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          style={{
                            borderBottom:
                              rIdx < block.table!.rows.length - 1
                                ? `1px solid ${template.tableBorderColor}`
                                : undefined,
                          }}
                        >
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              style={{
                                fontSize: `${Math.round(10.5 * scale)}px`,
                                color: template.textColor,
                                borderRight:
                                  cIdx < row.length - 1
                                    ? `1px solid ${template.tableBorderColor}`
                                    : undefined,
                              }}
                              className="py-1.5 px-2 tabular-nums leading-snug"
                            >
                              {renderInlineMarkdown(cell, template)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );

            case 'ul':
            case 'ol':
              return (
                <ul
                  key={block.id}
                  style={{
                    fontSize: `${Math.round(12 * scale)}px`,
                    lineHeight: 1.55,
                  }}
                  className="space-y-1.5 my-0.5"
                >
                  {(block.items || []).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      {typeof item.checked === 'boolean' ? (
                        item.checked ? (
                          <CheckSquare
                            className="w-3.5 h-3.5 mt-0.5 shrink-0"
                            style={{ color: template.accentColor }}
                          />
                        ) : (
                          <Square
                            className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-50"
                            style={{ color: template.mutedColor }}
                          />
                        )
                      ) : block.type === 'ol' ? (
                        <span
                          className="font-mono text-[10.5px] font-semibold tabular-nums mt-0.5 shrink-0"
                          style={{ color: template.accentColor }}
                        >
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                      ) : (
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-xs mt-2 shrink-0"
                          style={{ backgroundColor: template.accentColor }}
                        />
                      )}
                      <span className="flex-1 break-words">
                        {renderInlineMarkdown(item.text, template)}
                      </span>
                    </li>
                  ))}
                </ul>
              );

            case 'code':
              return (
                <div
                  key={block.id}
                  style={{
                    backgroundColor: template.cardSurfaceBg,
                    borderColor: template.tableBorderColor,
                  }}
                  className="my-1 rounded border p-2 font-mono"
                >
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-current/10 text-[9px] uppercase tracking-wider opacity-60">
                    <span>{block.language || 'code'}</span>
                    <span>UTF-8</span>
                  </div>
                  <pre className="text-[10px] leading-relaxed whitespace-pre-wrap break-all overflow-hidden">
                    {block.content}
                  </pre>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* 7. Bottom Card Footer & Page Number */}
      {(meta.showFooter || meta.showPageNumber) && (
        <footer
          className="relative z-10 flex items-center justify-between pt-2 mt-2 border-t text-[10px] shrink-0"
          style={{
            borderColor: `${template.tableBorderColor}99`,
            color: template.mutedColor,
          }}
        >
          {meta.showFooter ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-semibold" style={{ color: template.textColor }}>
                {meta.authorHandle}
              </span>
              {meta.footerNote && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{meta.footerNote}</span>
                </>
              )}
            </div>
          ) : (
            <span />
          )}

          {meta.showPageNumber && (
            <span
              className="font-mono text-[10.5px] font-medium tabular-nums shrink-0"
              style={{ color: template.textColor }}
            >
              {String(card.index).padStart(2, '0')}{' '}
              <span className="opacity-45">/ {String(card.total).padStart(2, '0')}</span>
            </span>
          )}
        </footer>
      )}
    </div>
  );
}
