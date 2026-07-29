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
