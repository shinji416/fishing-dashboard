# 中部釣りコンディション

三重県、愛知県、静岡県の主要釣り場をまとめて比較できる静的サイトです。

公開URL:
https://shinji416.github.io/fishing-dashboard/

## できること

- 鈴鹿、四日市、長良川河口、田原市赤羽、伊古部、浜名湖、御前崎、天竜川河口を一覧表示
- 7日先までの予報取得
- 日付指定で24時間グラフを表示
- 潮位近似、波高、風速、気温を同時表示
- 月齢と大潮、中潮、小潮、長潮、若潮を表示
- スマホブラウザでも見やすいレイアウト

## 技術構成

- 静的HTML / CSS / JavaScript
- 天気、風: Open-Meteo Forecast API
- 波、海面高: Open-Meteo Marine API
- 潮位表リンク: 気象庁

## 公開手順

1. GitHub で新しい公開リポジトリを作成します。
2. このフォルダの中身をそのリポジトリにアップロードします。
3. `Settings` → `Pages` を開きます。
4. `Build and deployment` の `Source` を `Deploy from a branch` にします。
5. `Branch` は `main`、フォルダは `/ (root)` を選びます。
6. 数分待つと `https://<ユーザー名>.github.io/<リポジトリ名>/` で公開されます。

## 必要ファイル

- `index.html`
- `fishing-dashboard.css`
- `fishing-dashboard.js`
- `favicon.svg`
- `og-image.svg`

`fishing-dashboard.html` はローカル確認用として残していますが、GitHub Pages では `index.html` が入口になります。
