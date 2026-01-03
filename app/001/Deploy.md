# デプロイ手順 (GitHub Pages)

このWebアプリケーションをGitHub Pagesを使用して公開する手順です。

## 前提条件
- GitHubアカウントを持っていること
- Gitがインストールされていること

## 手順

### 1. リポジトリの作成
1. GitHubにログインし、新しいリポジトリを作成します（例: `address-converter`）。
2. "Public" を選択し、"Create repository" をクリックします。

### 2. ファイルのアップロード
ローカルで作成した以下のファイルをGitを使ってプッシュします。

```bash
# プロジェクトフォルダでターミナルを開く
git init
git add index.html app.css app.js
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/[あなたのユーザー名]/address-converter.git
git push -u origin main