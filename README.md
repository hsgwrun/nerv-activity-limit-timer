# NERV // ACTIVITY LIMIT

端末のバッテリー状態から、いまの使い方を続けた場合の「予想活動限界時間」を算出する、エヴァンゲリオンのNERV司令室に着想を得たブラウザタイマーです。

## Features

- 対応ブラウザでは Battery Status API からバッテリー残量、充電状態、放電時間、充電完了までの時間を自動取得
- 非対応ブラウザでは、残量・満充電容量・消費電力を入力する手動フォールバック
- 活動限界時間を時間単位で少数第3位まで表示
- 活動限界までの残り時間をリアルタイムにカウントダウン
- NERV風の警報レベル、赤色アクセント、モノスペース表示、レスポンシブUI
- ラベル、キーボード操作、`aria-live`、`prefers-reduced-motion` に対応

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
