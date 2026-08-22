import { Strategy } from '../types';

export const PRESET_STRATEGIES: Strategy[] = [
  {
    id: 'preset_ma_cross',
    name: 'ゴールデンクロス＆デッドクロス (王道トレンド追従)',
    description: '短期移動平均線(SMA5)が中期移動平均線(SMA20)を上抜けた時に買い、下抜けた時に売り決済します。',
    targetSymbol: 'ALL',
    isPreset: true,
    createdAt: new Date().toISOString(),
    buyRules: {
      logic: 'AND',
      conditions: [
        {
          id: 'c1',
          leftIndicator: { type: 'SMA', period: 5 },
          operator: 'CROSS_ABOVE',
          rightIndicator: { type: 'SMA', period: 20 },
        },
      ],
    },
    sellRules: {
      logic: 'AND',
      conditions: [
        {
          id: 'c2',
          leftIndicator: { type: 'SMA', period: 5 },
          operator: 'CROSS_BELOW',
          rightIndicator: { type: 'SMA', period: 20 },
        },
      ],
    },
    riskManagement: {
      stopLossPercent: 2.5,
      takeProfitPercent: 6.0,
      positionSizingType: 'PERCENT_CAPITAL',
      positionSizingValue: 20, // Allocate 20% of capital per trade
      maxPositionsPerStock: 1,
    },
  },
  {
    id: 'preset_rsi_reversion',
    name: 'RSI 逆張りスキャルピング (過熱感トレーディング)',
    description: 'RSI(14)が30以下（売られすぎ）まで低下した時に押し目買い。RSIが70以上（買われすぎ）で利確します。',
    targetSymbol: 'ALL',
    isPreset: true,
    createdAt: new Date().toISOString(),
    buyRules: {
      logic: 'AND',
      conditions: [
        {
          id: 'c1',
          leftIndicator: { type: 'RSI', period: 14 },
          operator: 'LESS_THAN',
          rightIndicator: { type: 'CONSTANT', value: 30 },
        },
      ],
    },
    sellRules: {
      logic: 'AND',
      conditions: [
        {
          id: 'c2',
          leftIndicator: { type: 'RSI', period: 14 },
          operator: 'GREATER_THAN',
          rightIndicator: { type: 'CONSTANT', value: 70 },
        },
      ],
    },
    riskManagement: {
      stopLossPercent: 2.0,
      takeProfitPercent: 4.5,
      positionSizingType: 'PERCENT_CAPITAL',
      positionSizingValue: 25,
      maxPositionsPerStock: 1,
    },
  },
  {
    id: 'preset_bollinger_break',
    name: 'ボリンジャーバンド・バンドブレイクアウト',
    description: '価格がボリンジャーバンド上限(+2σ)を上抜けた勢いで買いエントリー。下限(-2σ)割り込みでロスカット。',
    targetSymbol: 'ALL',
    isPreset: true,
    createdAt: new Date().toISOString(),
    buyRules: {
      logic: 'AND',
      conditions: [
        {
          id: 'c1',
          leftIndicator: { type: 'PRICE' },
          operator: 'CROSS_ABOVE',
          rightIndicator: { type: 'BOLLINGER_UPPER', period: 20, stdDevMultiplier: 2 },
        },
      ],
    },
    sellRules: {
      logic: 'AND',
      conditions: [
        {
          id: 'c2',
          leftIndicator: { type: 'PRICE' },
          operator: 'CROSS_BELOW',
          rightIndicator: { type: 'BOLLINGER_LOWER', period: 20, stdDevMultiplier: 2 },
        },
      ],
    },
    riskManagement: {
      stopLossPercent: 3.0,
      takeProfitPercent: 8.0,
      positionSizingType: 'PERCENT_CAPITAL',
      positionSizingValue: 30,
      maxPositionsPerStock: 1,
    },
  },
  {
    id: 'preset_macd_trend',
    name: 'MACD トレンドスナイパー',
    description: 'MACDラインがシグナルラインを上抜けし、かつMACDヒストグラムがプラスに転じた強気トレンドで買い。',
    targetSymbol: 'ALL',
    isPreset: true,
    createdAt: new Date().toISOString(),
    buyRules: {
      logic: 'AND',
      conditions: [
        {
          id: 'c1',
          leftIndicator: { type: 'MACD_MAIN' },
          operator: 'CROSS_ABOVE',
          rightIndicator: { type: 'MACD_SIGNAL' },
        },
      ],
    },
    sellRules: {
      logic: 'AND',
      conditions: [
        {
          id: 'c2',
          leftIndicator: { type: 'MACD_MAIN' },
          operator: 'CROSS_BELOW',
          rightIndicator: { type: 'MACD_SIGNAL' },
        },
      ],
    },
    riskManagement: {
      stopLossPercent: 2.5,
      takeProfitPercent: 7.0,
      positionSizingType: 'PERCENT_CAPITAL',
      positionSizingValue: 25,
      maxPositionsPerStock: 1,
    },
  },
  {
    id: 'preset_triple_filter',
    name: 'トリプルフィルター・高勝率モメンタム',
    description: '1. 株価がSMA(50)より上（上昇トレンド）かつ 2. RSI(14)が45を上抜け 3. ストキャスティクス%Kが20以下からの反転。3つのフィルタを同時に満たす高精度エントリー。',
    targetSymbol: 'ALL',
    isPreset: true,
    createdAt: new Date().toISOString(),
    buyRules: {
      logic: 'AND',
      conditions: [
        {
          id: 'c1',
          leftIndicator: { type: 'PRICE' },
          operator: 'GREATER_THAN',
          rightIndicator: { type: 'SMA', period: 50 },
        },
        {
          id: 'c2',
          leftIndicator: { type: 'RSI', period: 14 },
          operator: 'GREATER_THAN',
          rightIndicator: { type: 'CONSTANT', value: 45 },
        },
      ],
    },
    sellRules: {
      logic: 'OR',
      conditions: [
        {
          id: 'c3',
          leftIndicator: { type: 'PRICE' },
          operator: 'LESS_THAN',
          rightIndicator: { type: 'SMA', period: 20 },
        },
        {
          id: 'c4',
          leftIndicator: { type: 'RSI', period: 14 },
          operator: 'GREATER_THAN',
          rightIndicator: { type: 'CONSTANT', value: 75 },
        },
      ],
    },
    riskManagement: {
      stopLossPercent: 2.0,
      takeProfitPercent: 5.5,
      positionSizingType: 'PERCENT_CAPITAL',
      positionSizingValue: 20,
      maxPositionsPerStock: 1,
    },
  },
];
