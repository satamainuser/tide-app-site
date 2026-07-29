#!/usr/bin/env node
// Notion実装報告システム: docs/reports/ の報告を「実装報告」ページ(NOTION_REPORT_PAGE)配下の子ページとして投稿する。
// NOTION_TOKENの値はいかなる場合も console.log / エラーメッセージへ含めないこと。
// タイトルは "YYYY-MM-DD HH:MM DayN タスク名 [機種]" 形式。HH:MMは投稿時点のJST。

const NOTION_VERSION = "2026-03-11"; // https://developers.notion.com/reference/versioning
const NOTION_API = "https://api.notion.com/v1/pages";
const RICH_TEXT_CHUNK = 2000; // Notion 1テキストオブジェクトあたりの上限文字数

function usage() {
  console.error(
    [
      "使い方: node scripts/notion_report.js <report.json> [--dry-run]",
      "",
      "report.json の形式:",
      "{",
      '  "date": "2026-07-30",',
      '  "day": 3,',
      '  "task": "課金実装",',
      '  "device": "Mac",',
      '  "summary": ["何を実装したか", "どうなったか", "..."],',
      '  "results": [{ "item": "項目", "status": "成功|失敗|未実施" }],',
      '  "decisions": ["人間の判断が必要な事項（空配列可）"],',
      '  "unverified": ["検証していないこと"],',
      '  "compliance": ["禁止事項の遵守状況"],',
      '  "detailLog": ["詳細ログの行（文字列配列）"],',
      '  "handoff": "次タスクへの引き継ぎ"',
      "}",
      "",
      "--dry-run を付けると、Notionへ送信せず組み立てたペイロードを標準出力に表示するのみ。",
    ].join("\n")
  );
}

function chunkText(text) {
  const s = String(text ?? "");
  if (s.length === 0) return [{ type: "text", text: { content: "" } }];
  const chunks = [];
  for (let i = 0; i < s.length; i += RICH_TEXT_CHUNK) {
    chunks.push({ type: "text", text: { content: s.slice(i, i + RICH_TEXT_CHUNK) } });
  }
  return chunks;
}

function paragraph(text) {
  return { object: "block", type: "paragraph", paragraph: { rich_text: chunkText(text) } };
}

function heading2(text) {
  return { object: "block", type: "heading_2", heading_2: { rich_text: chunkText(text) } };
}

function calloutBlock(emoji, color, lines) {
  const body = (lines && lines.length ? lines : ["なし"]).join("\n");
  return {
    object: "block",
    type: "callout",
    callout: {
      rich_text: chunkText(body),
      icon: { type: "emoji", emoji },
      color,
    },
  };
}

function bulletList(lines) {
  const items = lines && lines.length ? lines : ["なし"];
  return items.map((line) => ({
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: { rich_text: chunkText(line) },
  }));
}

function tableRow(cells) {
  return { object: "block", type: "table_row", table_row: { cells: cells.map((c) => chunkText(c)) } };
}

function resultsTable(results) {
  const rows = results && results.length ? results : [{ item: "（結果未記入）", status: "未実施" }];
  return {
    object: "block",
    type: "table",
    table: {
      table_width: 2,
      has_column_header: true,
      has_row_header: false,
      children: [tableRow(["項目", "状態"]), ...rows.map((r) => tableRow([r.item, r.status]))],
    },
  };
}

function toggleBlock(title, childLines) {
  const lines = childLines && childLines.length ? childLines : ["（詳細ログなし）"];
  return {
    object: "block",
    type: "toggle",
    toggle: {
      rich_text: chunkText(title),
      children: lines.map((line) => paragraph(line)),
    },
  };
}

function dividerBlock() {
  return { object: "block", type: "divider", divider: {} };
}

function jstTimeHHMM() {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const hh = String(jst.getUTCHours()).padStart(2, "0");
  const mm = String(jst.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function buildTitle(report) {
  return `${report.date} ${jstTimeHHMM()} Day${report.day} ${report.task} [${report.device}]`;
}

function buildChildren(report) {
  const detailLog = Array.isArray(report.detailLog)
    ? report.detailLog
    : report.detailLog
    ? String(report.detailLog).split("\n")
    : [];

  return [
    calloutBlock("📋", "blue_background", report.summary),
    heading2("結果"),
    resultsTable(report.results),
    heading2("要判断"),
    calloutBlock("⚠️", "red_background", report.decisions),
    heading2("未確認の範囲"),
    ...bulletList(report.unverified),
    heading2("禁止事項の遵守状況"),
    ...bulletList(report.compliance),
    toggleBlock("詳細ログ", detailLog),
    dividerBlock(),
    heading2("次タスクへの引き継ぎ"),
    paragraph(report.handoff || "なし"),
  ];
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const reportPath = args.find((a) => !a.startsWith("--"));

  if (!reportPath) {
    usage();
    process.exit(1);
  }

  const fs = require("fs");
  let report;
  try {
    report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  } catch (err) {
    console.error(`report.jsonの読み込み/パースに失敗しました: ${err.message}`);
    process.exit(1);
  }

  for (const field of ["date", "day", "task", "device"]) {
    if (!report[field]) {
      console.error(`report.json に必須フィールド "${field}" がありません。`);
      process.exit(1);
    }
  }

  const payload = {
    parent: { page_id: process.env.NOTION_REPORT_PAGE },
    properties: {
      title: { title: [{ text: { content: buildTitle(report) } }] },
    },
    children: buildChildren(report),
  };

  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (!process.env.NOTION_TOKEN) {
    console.error(
      "環境変数 NOTION_TOKEN が設定されていません。~/.bashrc 等に export し、source してから再実行してください。"
    );
    process.exit(1);
  }
  if (!process.env.NOTION_REPORT_PAGE) {
    console.error("環境変数 NOTION_REPORT_PAGE が設定されていません。");
    process.exit(1);
  }

  const res = await fetch(NOTION_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Notion のエラーレスポンスにトークンは含まれないため、そのまま出力してよい。
    console.error(`Notion API エラー (HTTP ${res.status}):`);
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log("投稿成功:");
  console.log(`  ページID: ${body.id}`);
  console.log(`  URL: ${body.url}`);
}

main().catch((err) => {
  console.error(`予期しないエラーが発生しました: ${err.message}`);
  process.exit(1);
});
