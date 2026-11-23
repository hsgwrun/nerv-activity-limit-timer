# NERV // ACTIVITY LIMIT

端末のバッテリー状態から、いまの使い方を続けた場合の「予想活動限界時間」を算出する、エヴァンゲリオンのNERV司令室に着想を得たブラウザタイマーです。

## Features

- 対応ブラウザでは Battery Status API からバッテリー残量、充電状態、放電時間、充電完了までの時間を自動取得
- 非対応ブラウザでは、残量・満充電容量・消費電力を入力する手動フォールバック
- 活動限界時間を`XX:YY:ZZ.NN`（NNは1/100秒）形式で表示
- 活動限界までの残り時間をリアルタイムにカウントダウン
- NERV風の警報レベル、赤色アクセント、モノスペース表示、レスポンシブUI
- 充電中は外部電力（EXTERNAL）の黄・黒表示、放電中は内部電力（INTERNAL）の赤・黒表示に切り替え
- 下部の速度帯は状態連動で、充電中は`STOP`、残量20%以下または推定消費電力3W以下は`SLOW`、それ以外は`NORMAL`を点灯
- ラベル、キーボード操作、`aria-live`、`prefers-reduced-motion` に対応

## Power supply display

画面は斜めの参考画像をそのまま使用せず、正面から見た大型の電力供給盤として構成しています。Battery Status APIの`charging`が`true`のときは、外部電力供給中であることを黄色と`EXTERNAL`のラベルで強調します。放電中は端末の内部電力で動作していることを赤色と`INTERNAL`のラベルで強調します。状態は上部のチップ、メイン表示盤、テレメトリの3箇所で同時に確認できます。

## Estimate model

Battery Status API の `dischargingTime` が有限値を返すときは、その値を優先します。値が利用できない場合、次の簡易モデルに切り替えます。

```text
予想活動限界時間 [h] = (満充電容量 [Wh] × 現在残量 [%] ÷ 100) ÷ 消費電力 [W]
```

ブラウザが Battery Status API を実装していない場合でも、手動入力だけで動作します。表示値は近似値であり、画面輝度、通信、温度、バックグラウンド処理、バッテリー劣化などにより実際の時間とは異なります。

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Research notes

実装の前提は、`navigator.getBattery()` が `BatteryManager` を返し、`level`、`charging`、`chargingTime`、`dischargingTime` と関連イベントを提供するという仕様です。Battery Status API は Secure Context 限定かつ主要ブラウザすべてで利用できるわけではないため、手動フォールバックを組み込んでいます。

- [MDN — Battery Status API](https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API)
- [W3C — Battery Status API](https://www.w3.org/TR/battery-status/)
- [YouTube — Create a Real Time Battery Status Indicator with HTML, CSS & JavaScript using the Battery Status API](https://www.youtube.com/watch?v=kB7Bx4HfvWc)

## Original design note

本アプリは作品の公式ロゴや素材を使用せず、警報盤、斜線、赤い警告灯、黒い端末画面というモチーフからオリジナルのUIを構成しています。ファン向けの非公式コンセプト実装です。
