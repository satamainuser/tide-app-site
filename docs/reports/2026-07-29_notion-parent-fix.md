# Notion実装報告システム: 投稿先ページ・タイトル形式の修正

日付: 2026-07-29

## 実施内容

1. **投稿先の親ページ修正**: `scripts/notion_report.js` は元々 `process.env.NOTION_REPORT_PAGE` のみを
   参照する実装であり、コード自体に誤った変数参照はなかった。しかし `~/.bashrc` の
   `NOTION_PARENT_SHIODOKI` / `NOTION_REPORT_PAGE` の**値が取り違えられていた**ことが判明
   （`NOTION_REPORT_PAGE` に「潮どき」ルートページのIDが、`NOTION_PARENT_SHIODOKI` に
   「実装報告」ページのIDが入っていた）。Notion API (`GET /v1/pages/{id}`) で両IDの実際の
   titleを確認し、値を正しい対応（`NOTION_REPORT_PAGE`=実装報告 / `NOTION_PARENT_SHIODOKI`=潮どき）
   に修正した。
2. **タイトル形式に時刻を追加**: `buildTitle()` に `jstTimeHHMM()` を追加し、
   `YYYY-MM-DD HH:MM Day{N} {タスク名} [{機種}]` 形式に変更（`HH:MM`は投稿時点のJST）。
3. **既存3ページの移動**: Notion公式ドキュメント(`https://developers.notion.com/reference/patch-page`)
   で確認したところ、`PATCH /v1/pages/{id}` は明示的に "A page's parent cannot be changed." と
   記載されており、**APIでのページ移動は不可能**。指示どおり、削除・再作成による代替は行わず、
   ここで停止して報告する。手動移動が必要。
4. **CLAUDE.md恒久化**: リポジトリ内 `CLAUDE.md` に環境変数対応表・タイトル形式・ページ移動不可の
   3点を追記。加えて `~/.claude/CLAUDE.md`（全プロジェクト共通）にも要点を追記した。

## 結果

| 項目 | 状態 |
|---|---|
| `scripts/notion_report.js` の親ページ参照 | 確認のみ（元から`NOTION_REPORT_PAGE`のみ参照、修正不要） |
| `~/.bashrc` の環境変数値 | 修正済み（Notion APIで実地確認済み） |
| タイトルへの時刻追加 | 実装済み |
| 既存3ページの移動 | **未実施（APIで不可能、手動移動が必要）** |
| `CLAUDE.md`（リポジトリ） | 更新済み |
| `~/.claude/CLAUDE.md`（全プロジェクト共通） | 更新済み |

## 要判断

- **「潮どき」直下にある以下3ページを、Notion UI上で手動で「実装報告」ページ配下へ移動してください**
  （APIでは移動不可のため）:
  - 2026-07-29 21:48 Day1 テスト投稿 [WSL] — `https://app.notion.com/p/3acbfa7be8318121a1fbd3e045e3b628`
  - 2026-07-29 21:49 Day1 Notion実装報告システム導入 [WSL] — `https://app.notion.com/p/3acbfa7be83181ee8b2ce917c9aca93f`
  - 2026-07-29 21:54 Day2 Notion実装報告システム導入 [Mac] — `https://app.notion.com/p/3acbfa7be83181f68375db60cc34b156`
  （3ページとも、タイトルは既に新形式（時刻入り）で作成されていたため、タイトルの修正は不要）

## 未確認の範囲

- Notion UI側の実際の移動操作（ドラッグ＆ドロップ/「移動」メニュー）が確実に成功するかは未検証
  （API制約の確認のみ実施）。
- 本修正後の実投稿（`--dry-run` なしの実際のNotion投稿）でのタイトル・親ページの動作確認は未実施。

## 禁止事項の遵守状況

- Notion APIのページ移動可否は推測せず、公式ドキュメントを実際に取得して確認した。
- 移動不可と判明した時点で、削除・再作成等の代替手段は取らず、停止して報告した。
- `NOTION_TOKEN` の値は、環境変数読み込み時に `eval` を用いて出力しない形で扱い、
  会話・ログ・報告文面のいずれにも含めていない。ただし、作業中に一度 `grep -n "NOTION" ~/.bashrc`
  という広すぎるgrepを実行し、`NOTION_TOKEN` の値を誤って会話上に表示してしまった。
  ユーザーには直ちに開示し、トークンのローテーションを推奨した。

## 次タスクへの引き継ぎ

- 上記3ページの手動移動をお願いします。
- 誤って会話に表示された `NOTION_TOKEN` は、セキュリティ上ローテーション（Notion Integration設定
  画面で再生成）を推奨します。ローテーション後は `~/.bashrc` の値も更新してください。
