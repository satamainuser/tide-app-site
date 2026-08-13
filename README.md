# 潮どき 公開ページ（GitHub Pages）

審査提出用の公開ページ一式です。素のHTML/CSS（Jekyll標準機能のみ使用、重いJS・フレームワーク不使用）で構成しています。

## ページ構成

| ファイル | 内容 |
|---|---|
| `index.html` | アプリ紹介ページ |
| `terms.html` | 利用規約 |
| `privacy.html` | プライバシーポリシー |
| `support.html` | サポート（よくある質問） |
| `tokushoho.html` | 特定商取引法に基づく表記 |
| `assets/css/style.css` | 共通スタイルシート |
| `_config.yml` | アプリ名等の設定（`app_name` を変更すると全ページに反映されます） |

アプリ名は `_config.yml` の `app_name` に集約しており、各ページでは Liquid の `{{ site.app_name }}` を参照しています。名称変更時はここを書き換えるだけで全ページに反映されます。

## GitHub Pages の公開設定手順

1. このリポジトリを GitHub にpushする（`main` ブランチ、リポジトリ直下にファイルを配置。`gh-pages` ブランチは使用しない）。
2. GitHubリポジトリの **Settings** タブを開く。
3. 左メニューの **Pages** を選択する。
4. **Build and deployment** の **Source** で `Deploy from a branch` を選択する。
5. **Branch** で `main` ブランチ・フォルダは `/ (root)` を選択し、**Save** をクリックする。
6. 数分待つと、`https://<ユーザー名>.github.io/<リポジトリ名>/` で公開される。

## ローカルでの確認（任意）

Jekyllがインストールされている場合、以下のコマンドでローカルプレビューできます。

```
bundle exec jekyll serve
```

## Notion実装報告システム

タスク完了時の報告を、`docs/reports/` へのmd保存・git push に加えてNotionにも自動投稿する仕組みです。全プロジェクト共通の恒久ルールとして [CLAUDE.md](./CLAUDE.md) にも記載しています。

### 事前準備（環境変数）

以下3つをシェルの起動ファイル（WSL/Linuxは `~/.bashrc`、Macは `~/.zshrc`）に設定し、`source` して有効化します。

| 変数名 | 内容 | 秘密情報か |
|---|---|---|
| `NOTION_TOKEN` | Notion Integration Token | **秘密情報。リポジトリ内のいかなるファイルにも書き込まない・コミットしない・出力しない** |
| `NOTION_PARENT_SHIODOKI` | 本プロジェクト（潮どき）のNotion親ページID | 非秘密 |
| `NOTION_REPORT_PAGE` | 報告を投稿する親ページID（`notion_report.js` が子ページを作成する先） | 非秘密 |

`NOTION_TOKEN` は会話ログ等に残らないよう、必ず利用者自身のシェル操作で設定してください（AIエージェントに値を渡さない）。

```bash
echo 'export NOTION_TOKEN="実際のトークン値"' >> ~/.bashrc
source ~/.bashrc
```

### 実行方法

1. 報告内容をJSONファイルとして用意する（例: `docs/reports/_drafts/2026-07-30_day3.json`。このディレクトリは `.gitignore` 対象）。

   ```json
   {
     "date": "2026-07-30",
     "day": 3,
     "task": "課金実装",
     "device": "Mac",
     "summary": ["何を実装したか（1行目）", "どうなったか（2行目）", "補足（3行目まで）"],
     "results": [{ "item": "課金フロー実装", "status": "成功" }],
     "decisions": [],
     "unverified": ["実機での購入テスト"],
     "compliance": ["トークンを出力・コミットしていない"],
     "detailLog": ["実行したコマンドや詳細ログの各行"],
     "handoff": "次に着手すべき内容"
   }
   ```

   - `decisions`（要判断）が空配列の場合は自動的に「なし」と表示されます。
   - タイトルは自動的に `YYYY-MM-DD DayN タスク名 [機種]` の形式で生成されます。

2. 投稿内容を事前確認したい場合（Notionへは送信されません）:

   ```bash
   node scripts/notion_report.js docs/reports/_drafts/2026-07-30_day3.json --dry-run
   ```

3. 実際に投稿する:

   ```bash
   node scripts/notion_report.js docs/reports/_drafts/2026-07-30_day3.json
   ```

   成功すると作成されたページのIDとURLが標準出力に表示されます。

### トラブルシューティング

| 症状 | 対処 |
|---|---|
| `環境変数 NOTION_TOKEN が設定されていません` | `~/.bashrc`（または`~/.zshrc`）に追記後、`source` し忘れていないか確認。新しいシェル/ターミナルを開き直すのも有効。 |
| `Notion API エラー (HTTP 401)` | トークンが無効、またはIntegrationがそのページ・データベースに接続（Share）されていない。Notion側でIntegrationをページに招待し直す。 |
| `Notion API エラー (HTTP 404)` | `NOTION_REPORT_PAGE` のページIDが誤っている、またはIntegrationがそのページにアクセスできていない。 |
| `Notion API エラー (HTTP 400)` | payloadの形式不備。まず `--dry-run` で出力されたJSONを確認する。 |
| `body.children[N].toggle.children.length should be ≤ 100` | Notion APIは1ブロックが直接持てる子ブロックを100個までに制限している。`detailLog` が100行を超えると発生していた。2026-08-13以降、`notion_report.js` が「詳細ログ（1/2）」「（2/2）」のようにトグルを自動分割するため、ログを削る必要はない。 |
| レスポンスのエラー内容が不明 | 独自判断で回避せず、エラー全文をそのまま報告して停止する（CLAUDE.md参照）。 |

`Notion-Version` ヘッダーは [公式ドキュメント](https://developers.notion.com/reference/versioning) 記載の最新値（本スクリプト作成時点: `2026-03-11`）を `scripts/notion_report.js` 内で固定値として使用しています。Notion側でバージョンが更新された場合は、この値を更新してください。
