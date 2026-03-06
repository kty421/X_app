# FocusX（仮）- README

X（旧Twitter）で情報収集するときに、関係ない話題が流れてきて集中が途切れる問題を解決する「集中フィード」アプリです。  
**X公式アプリのタイムラインを改変するものではありません**。X APIで取得した投稿を、アプリ内の独自フィードとして表示し、テーマ（Include/Exclude）でフィルタします。  
スクレイピングや規約違反になり得る実装はしません。

---

## 機能（MVP）

- **テーマ（フィルタセット）管理**
  - テーマの作成/編集/削除/複製
  - includeKeywords / excludeKeywords
  - includeAccounts（可能な範囲で `from:` 演算子利用）
  - language（ja/en/all）
  - hideRetweets / hideReplies / safeMode
  - 現在テーマの即時切り替え

- **フォーカスフィード**
  - 現在テーマ条件で投稿を取得して一覧表示
  - Pull to refresh / 無限スクロール
  - 投稿タップ → 詳細 → **「Xで開く」**

- **クエリビルダー**
  - テーマ条件 → X検索クエリ文字列を生成（テスト対象）
  - exclude は **API検索 + ローカル二重チェック** で確実に除外

---

## 重要な制約 / 方針

- Expo（Managed） + TypeScript
- 認証：OAuth 2.0（PKCE）  
  **クライアントシークレットはアプリに埋め込まない**
- トークンは `expo-secure-store` に保存
- X API のアクセスレベル/課金状況で使えるAPIが変わるため、取得不可な場合は **フォールバック**：
  - **検索ベース（Recent Search 等）でフォーカスフィードを構築**（MVPはこれで成立させる）
  - ホームTL置換を前提にしない

---

## 技術スタック

- Expo SDK（最新版想定）
- React Native + TypeScript
- ルーティング：`expo-router`
- データ取得・キャッシュ：TanStack Query（react-query）
- 状態管理：Zustand
- OAuth：`expo-auth-session`（PKCE）
- セキュア保存：`expo-secure-store`
- バリデーション：zod
- テスト：Jest

---

## セットアップ

### 1) 前提

- Node.js（LTS推奨）
- pnpm / npm / yarn（どれでも可。以下は pnpm 例）
- X Developer アカウント（プロジェクト/アプリ作成ができること）

---

### 2) インストール

```bash
pnpm install
```
