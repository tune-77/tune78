import { CandleData } from '../types';
import { enrichCandlesWithML } from './mlPredictor';

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(closes: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(undefined);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += closes[i - j];
      }
      result.push(Number((sum / period).toFixed(2)));
    }
  }
  return result;
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(closes: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  const multiplier = 2 / (period + 1);

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(undefined);
    } else if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += closes[j];
      }
      result.push(Number((sum / period).toFixed(2)));
    } else {
      const prevEMA = result[i - 1]!;
      const currentEMA = (closes[i] - prevEMA) * multiplier + prevEMA;
      result.push(Number(currentEMA.toFixed(2)));
    }
  }
  return result;
}

/**
 * Calculates Relative Strength Index (RSI)
 */
export function calculateRSI(closes: number[], period = 14): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  if (closes.length <= period) {
    return closes.map(() => undefined);
  }

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  result.push(undefined); // First element has no change

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = 1; i < closes.length; i++) {
    if (i < period) {
      result.push(undefined);
    } else if (i === period) {
      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - 100 / (1 + rs);
        result.push(Number(rsi.toFixed(2)));
      }
    } else {
      const currentGain = gains[i - 1];
      const currentLoss = losses[i - 1];

      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - 100 / (1 + rs);
        result.push(Number(rsi.toFixed(2)));
      }
    }
  }
  return result;
}

/**
 * Calculates MACD (12, 26, 9 default)
 */
export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): {
  macdLine: (number | undefined)[];
  signalLine: (number | undefined)[];
  histogram: (number | undefined)[];
} {
  const emaFast = calculateEMA(closes, fastPeriod);
  const emaSlow = calculateEMA(closes, slowPeriod);

  const macdLine: (number | undefined)[] = [];
  const validMacdValues: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (emaFast[i] === undefined || emaSlow[i] === undefined) {
      macdLine.push(undefined);
    } else {
      const val = Number((emaFast[i]! - emaSlow[i]!).toFixed(2));
      macdLine.push(val);
      validMacdValues.push(val);
    }
  }

  // Calculate signal line as EMA of MACD Line
  const macdValuesForEma = macdLine.map((v) => (v === undefined ? 0 : v));
  const rawSignal = calculateEMA(macdValuesForEma, signalPeriod);

  const signalLine: (number | undefined)[] = [];
  const histogram: (number | undefined)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] === undefined || i < slowPeriod + signalPeriod - 2) {
      signalLine.push(undefined);
      histogram.push(undefined);
    } else {
      const sig = rawSignal[i];
      signalLine.push(sig);
      if (sig !== undefined && macdLine[i] !== undefined) {
        histogram.push(Number((macdLine[i]! - sig).toFixed(2)));
      } else {
        histogram.push(undefined);
      }
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculates Bollinger Bands (20, 2 default)
 */
export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDevMultiplier = 2
): {
  upper: (number | undefined)[];
  middle: (number | undefined)[];
  lower: (number | undefined)[];
} {
  const middle = calculateSMA(closes, period);
  const upper: (number | undefined)[] = [];
  const lower: (number | undefined)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1 || middle[i] === undefined) {
      upper.push(undefined);
      lower.push(undefined);
    } else {
      let sumSqDiff = 0;
      const avg = middle[i]!;
      for (let j = 0; j < period; j++) {
        const diff = closes[i - j] - avg;
        sumSqDiff += diff * diff;
      }
      const stdDev = Math.sqrt(sumSqDiff / period);
      upper.push(Number((avg + stdDevMultiplier * stdDev).toFixed(2)));
      lower.push(Number((avg - stdDevMultiplier * stdDev).toFixed(2)));
    }
  }

  return { upper, middle, lower };
}

/**
 * Calculates Stochastic Oscillator (%K, %D)
 */
export function calculateStochastic(
  candles: { high: number; low: number; close: number }[],
  kPeriod = 14,
  dPeriod = 3
): {
  stochK: (number | undefined)[];
  stochD: (number | undefined)[];
} {
  const stochK: (number | undefined)[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < kPeriod - 1) {
      stochK.push(undefined);
    } else {
      let highestHigh = -Infinity;
      let lowestLow = Infinity;
      for (let j = 0; j < kPeriod; j++) {
        highestHigh = Math.max(highestHigh, candles[i - j].high);
        lowestLow = Math.min(lowestLow, candles[i - j].low);
      }
      const currentClose = candles[i].close;
      const range = highestHigh - lowestLow;
      if (range === 0) {
        stochK.push(50);
      } else {
        const k = ((currentClose - lowestLow) / range) * 100;
        stochK.push(Number(k.toFixed(2)));
      }
    }
  }

  // Calculate %D as SMA of %K
  const kValForSma = stochK.map((v) => (v === undefined ? 50 : v));
  const stochD = calculateSMA(kValForSma, dPeriod);

  return { stochK, stochD };
}

/**
 * Enriches candle series with all indicators populated
 */
export function enrichCandlesWithIndicators(candles: CandleData[]): CandleData[] {
  if (candles.length === 0) return [];

  const closes = candles.map((c) => c.close);

  const sma5 = calculateSMA(closes, 5);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);

  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);

  const rsi14 = calculateRSI(closes, 14);

  const macd = calculateMACD(closes, 12, 26, 9);
  const bollinger = calculateBollingerBands(closes, 20, 2);
  const stoch = calculateStochastic(candles, 14, 3);

  const enriched = candles.map((candle, idx) => ({
    ...candle,
    sma5: sma5[idx],
    sma20: sma20[idx],
    sma50: sma50[idx],
    sma200: sma200[idx],
    ema12: ema12[idx],
    ema26: ema26[idx],
    rsi14: rsi14[idx],
    macdMain: macd.macdLine[idx],
    macdSignal: macd.signalLine[idx],
    macdHist: macd.histogram[idx],
    bollingerUpper: bollinger.upper[idx],
    bollingerMiddle: bollinger.middle[idx],
    bollingerLower: bollinger.lower[idx],
    stochK: stoch.stochK[idx],
    stochD: stoch.stochD[idx],
  }));

  return enrichCandlesWithML(enriched, 'STOCK');
}
