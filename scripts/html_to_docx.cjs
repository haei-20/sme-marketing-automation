const fs = require("node:fs");
const path = require("node:path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} = require("../.doc-tools/node_modules/docx");

function decode(text) {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function textParagraph(text, options = {}) {
  const lines = String(text).split("\n");
  const children = [];
  lines.forEach((line, index) => {
    if (index) children.push(new TextRun({ break: 1 }));
    children.push(
      new TextRun({
        text: line,
        bold: Boolean(options.bold),
        font: options.font || "Times New Roman",
        size: options.size || 26,
        color: options.color,
      }),
    );
  });
  return new Paragraph({
    children,
    alignment: options.alignment,
    pageBreakBefore: options.pageBreakBefore,
    spacing: { after: options.after ?? 120, line: options.line ?? 360 },
    indent: options.indent,
    shading: options.shading
      ? { type: ShadingType.CLEAR, color: "auto", fill: options.shading }
      : undefined,
  });
}

function parseTable(source) {
  const rows = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(source))) {
    const cells = [];
    const cellRegex = /<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowMatch[1]))) {
      const isHeader = cellMatch[1].toLowerCase() === "th";
      const value = decode(cellMatch[2]);
      cells.push(
        new TableCell({
          verticalAlign: VerticalAlign.TOP,
          shading: isHeader
            ? { type: ShadingType.CLEAR, color: "auto", fill: "EDE9FE" }
            : undefined,
          children: [
            textParagraph(value, {
              bold: isHeader,
              size: 22,
              after: 40,
              line: 300,
            }),
          ],
        }),
      );
    }
    if (cells.length) rows.push(new TableRow({ children: cells }));
  }
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "6B7280" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "6B7280" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "6B7280" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "6B7280" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "9CA3AF" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "9CA3AF" },
    },
  });
}

function parseHtmlBlocks(rawHtml) {
  let html = rawHtml.replace(/<div class=["']cover["'][^>]*>[\s\S]*?<\/div>/i, "");
  html = html
    .replace(/<div class=["']note["'][^>]*>/gi, "<p>")
    .replace(/<div class=["']task["'][^>]*>/gi, "")
    .replace(/<\/div>/gi, "");

  const blocks = [];
  const blockRegex = /<(h1|h2|h3|p|pre|table|ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  let h1Count = 0;
  while ((match = blockRegex.exec(html))) {
    const tag = match[1].toLowerCase();
    const content = match[2];
    if (tag === "table") {
      blocks.push(parseTable(content));
      blocks.push(new Paragraph({ spacing: { after: 100 } }));
      continue;
    }
    if (tag === "ul" || tag === "ol") {
      const items = [];
      const itemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let item;
      while ((item = itemRegex.exec(content))) items.push(decode(item[1]));
      items.forEach((value, index) => {
        blocks.push(
          textParagraph(`${tag === "ol" ? `${index + 1}.` : "•"} ${value}`, {
            size: 26,
            indent: { left: 420, hanging: 240 },
            after: 60,
          }),
        );
      });
      continue;
    }
    if (tag === "pre") {
      blocks.push(
        textParagraph(decode(content), {
          font: "Consolas",
          size: 18,
          line: 260,
          shading: "F3F4F6",
          after: 160,
        }),
      );
      continue;
    }

    const value = decode(content);
    if (!value) continue;
    if (tag === "h1") {
      h1Count += 1;
      blocks.push(
        new Paragraph({
          text: value,
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          spacing: { before: 120, after: 180 },
        }),
      );
    } else if (tag === "h2") {
      blocks.push(
        new Paragraph({
          text: value,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        }),
      );
    } else if (tag === "h3") {
      blocks.push(
        new Paragraph({
          text: value,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 180, after: 80 },
        }),
      );
    } else {
      blocks.push(textParagraph(value));
    }
  }
  return blocks;
}

function cover(title, subtitle, version) {
  return [
    new Paragraph({ spacing: { before: 1800 } }),
    textParagraph(title, {
      bold: true,
      size: 48,
      color: "4C1D95",
      alignment: AlignmentType.CENTER,
      line: 480,
      after: 400,
    }),
    textParagraph(subtitle, {
      bold: true,
      size: 34,
      color: "374151",
      alignment: AlignmentType.CENTER,
      after: 300,
    }),
    textParagraph(`${version}\nCập nhật ngày 15/07/2026\nĐồ án tốt nghiệp — Nhóm 4 thành viên`, {
      size: 26,
      alignment: AlignmentType.CENTER,
      line: 360,
      after: 200,
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

async function convert(input, output, meta) {
  const html = fs.readFileSync(input, "utf8");
  const children = [...cover(meta.title, meta.subtitle, meta.version), ...parseHtmlBlocks(html)];
  const doc = new Document({
    creator: "SME Marketing Automation Team",
    title: meta.title,
    description: "Tài liệu kiến trúc Desktop 2.0 — Local AI + RAG",
    styles: {
      default: {
        document: { run: { font: "Times New Roman", size: 26 } },
        heading1: { run: { font: "Times New Roman", size: 40, bold: true, color: "4C1D95" } },
        heading2: { run: { font: "Times New Roman", size: 32, bold: true, color: "5B21B6" } },
        heading3: { run: { font: "Times New Roman", size: 28, bold: true, color: "6D28D9" } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1417 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ children: ["Trang ", PageNumber.CURRENT], size: 20, color: "6B7280" })],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(output, buffer);
  process.stdout.write(`${path.basename(output)}\t${buffer.length} bytes\n`);
}

async function main() {
  const temp = path.join(process.env.TEMP, "sme-desktop-docs");
  const root = "C:\\DoAn";
  await convert(
    path.join(temp, "srs-desktop.html"),
    path.join(root, "SRS_Phan_tich_thiet_ke.docx"),
    {
      title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)\nVÀ PHÂN TÍCH – THIẾT KẾ HỆ THỐNG",
      subtitle: "SME Marketing Automation Desktop — Local AI + RAG",
      version: "Phiên bản 2.0 — Windows Desktop",
    },
  );
  await convert(
    path.join(temp, "task-explanations-desktop.html"),
    path.join(root, "Giai_thich_dau_viec.docx"),
    {
      title: "GIẢI THÍCH CHI TIẾT ĐẦU VIỆC",
      subtitle: "SME Marketing Automation Desktop — 53 công việc / 12 tuần",
      version: "Phiên bản 2.0 — Windows Desktop",
    },
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
