import { CandleData } from '../types';

export interface MLPredictionResult {
  symbol: string;
  bullishProbPercent: number; // 0 - 100%
  confidenceScore: number;    // 0 - 100%
  signalDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  predictedTargetPrice: number;
  featureImportance: {
    featureName: string;
    weight: number;
    value: string;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  }[];
  aiExplanation?: string;
}

/**
 * Feature Engineering & ML Ensemble Model for Stock Price Trend Forecasting
 * Computes a weighted logistic score combining momentum, mean reversion, and volatility
 */
export function calculateMLPrediction(candles: CandleData[], symbol: string): MLPredictionResult {
  if (!candles || candles.length < 10) {
    return {
      symbol,
      bullishProbPercent: 50,
      confidenceScore: 30,
      signalDirection: 'NEUTRAL',
      predictedTargetPrice: candles.length > 0 ? candles[candles.length - 1].close : 1000,
      featureImportance: [],
    };
  }

  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  const close = lastCandle.close;

  // Feature 1: RSI (Mean Reversion & Momentum)
  const rsi = lastCandle.rsi14 ?? 50;
  let rsiScore = 0; // -1 to +1
  if (rsi < 30) rsiScore = 0.8; // Oversold -> Bullish
  else if (rsi > 70) rsiScore = -0.8; // Overbought -> Bearish
  else rsiScore = (50 - rsi) / 25;

  // Feature 2: MACD Histogram & Signal Trend
  const macdHist = lastCandle.macdHist ?? 0;
  const prevMacdHist = prevCandle.macdHist ?? 0;
  const macdDiff = macdHist - prevMacdHist;
  const macdScore = Math.max(-1, Math.min(1, macdDiff * 0.5 + (macdHist > 0 ? 0.3 : -0.3)));

  // Feature 3: Moving Average Trend Alignment (SMA5 vs SMA20)
  const sma5 = lastCandle.sma5 ?? close;
  const sma20 = lastCandle.sma20 ?? close;
  const smaSpread = ((sma5 - sma20) / sma20) * 100;
  const smaScore = Math.max(-1, Math.min(1, smaSpread / 2));

  // Feature 4: Bollinger Band %B
  const bUpper = lastCandle.bollingerUpper ?? close * 1.05;
  const bLower = lastCandle.bollingerLower ?? close * 0.95;
  const percentB = bUpper !== bLower ? (close - bLower) / (bUpper - bLower) : 0.5;
  let bollingerScore = 0;
  if (percentB < 0.1) bollingerScore = 0.9; // Touched lower band
  else if (percentB > 0.9) bollingerScore = -0.9; // Touched upper band
  else bollingerScore = (0.5 - percentB) * 1.5;

  // Feature 5: Recent Price Return Momentum (5-period Rate of Change)
  const candle5Ago = candles[Math.max(0, candles.length - 6)];
  const roc5 = ((close - candle5Ago.close) / candle5Ago.close) * 100;
  const rocScore = Math.max(-1, Math.min(1, roc5 / 3));

  // Logistic Ensemble Weights
  const weights = {
    rsi: 0.25,
    macd: 0.25,
    sma: 0.20,
    bollinger: 0.15,
    roc: 0.15,
  };

  const rawScore =
    rsiScore * weights.rsi +
    macdScore * weights.macd +
    smaScore * weights.sma +
    bollingerScore * weights.bollinger +
    rocScore * weights.roc;

  // Sigmoid Transformation -> Probability (0.0 to 1.0)
  const bullishProb = 1 / (1 + Math.exp(-rawScore * 2.5));
  const bullishProbPercent = Math.round(bullishProb * 100);

  // Confidence level based on signal strength agreement
  const agreement = Math.abs(bullishProb - 0.5) * 2; // 0 to 1
  const confidenceScore = Math.round(50 + agreement * 45);

  let signalDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (bullishProbPercent >= 58) signalDirection = 'BULLISH';
  else if (bullishProbPercent <= 42) signalDirection = 'BEARISH';

  // Projected Target Price (Expected 5-tick forecast)
  const expectedReturnPercent = (bullishProb - 0.5) * 0.04;
  const predictedTargetPrice = Math.round(close * (1 + expectedReturnPercent) * 10) / 10;

  const featureImportance = [
    {
      featureName: 'RSI(14) モメンタム/買われ過ぎ指標',
      weight: weights.rsi,
      value: `${rsi.toFixed(1)}`,
      impact: rsiScore > 0.2 ? ('POSITIVE' as const) : rsiScore < -0.2 ? ('NEGATIVE' as const) : ('NEUTRAL' as const),
    },
    {
      featureName: 'MACD ヒストグラム推移',
      weight: weights.macd,
      value: `${macdHist > 0 ? '+' : ''}${macdHist.toFixed(2)}`,
      impact: macdScore > 0.1 ? ('POSITIVE' as const) : macdScore < -0.1 ? ('NEGATIVE' as const) : ('NEUTRAL' as const),
    },
    {
      featureName: 'SMA(5/20) 移動平均線乖離率',
      weight: weights.sma,
      value: `${smaSpread > 0 ? '+' : ''}${smaSpread.toFixed(2)}%`,
      impact: smaScore > 0.1 ? ('POSITIVE' as const) : smaScore < -0.1 ? ('NEGATIVE' as const) : ('NEUTRAL' as const),
    },
    {
      featureName: 'ボリンジャーバンド %B 位置',
      weight: weights.bollinger,
      value: `${(percentB * 100).toFixed(1)}%`,
      impact: bollingerScore > 0.2 ? ('POSITIVE' as const) : bollingerScore < -0.2 ? ('NEGATIVE' as const) : ('NEUTRAL' as const),
    },
    {
      featureName: '直近5期間 騰落率 (ROC)',
      weight: weights.roc,
      value: `${roc5 > 0 ? '+' : ''}${roc5.toFixed(2)}%`,
      impact: rocScore > 0.1 ? ('POSITIVE' as const) : rocScore < -0.1 ? ('NEGATIVE' as const) : ('NEUTRAL' as const),
    },
  ];

  return {
    symbol,
    bullishProbPercent,
    confidenceScore,
    signalDirection,
    predictedTargetPrice,
    featureImportance,
  };
}

/**
 * Enriches candle history with calculated ML Bullish Probability and Confidence
 */
export function enrichCandlesWithML(candles: CandleData[], symbol: string): CandleData[] {
  return candles.map((candle, idx) => {
    if (idx < 5) {
      return { ...candle, mlBullishProb: 50, mlConfidence: 50 };
    }
    const subHistory = candles.slice(0, idx + 1);
    const pred = calculateMLPrediction(subHistory, symbol);
    return {
      ...candle,
      mlBullishProb: pred.bullishProbPercent,
      mlConfidence: pred.confidenceScore,
    };
  });
}
