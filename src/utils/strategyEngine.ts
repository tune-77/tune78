import {
  RuleCondition,
  RuleGroup,
  IndicatorConfig,
  CandleData,
  Strategy,
  Position,
  ActionType,
} from '../types';

/**
 * Gets indicator numeric value for a specific candle index
 */
export function getIndicatorValue(
  config: IndicatorConfig,
  history: CandleData[],
  index: number
): number | undefined {
  if (index < 0 || index >= history.length) return undefined;
  const candle = history[index];

  switch (config.type) {
    case 'PRICE':
      return candle.close;
    case 'CONSTANT':
      return config.value ?? 0;
    case 'SMA':
      if (config.period === 5) return candle.sma5;
      if (config.period === 20) return candle.sma20;
      if (config.period === 50) return candle.sma50;
      if (config.period === 200) return candle.sma200;
      // fallback dynamically
      return candle.sma20;
    case 'EMA':
      if (config.period === 12) return candle.ema12;
      return candle.ema26;
    case 'RSI':
      return candle.rsi14;
    case 'MACD_MAIN':
      return candle.macdMain;
    case 'MACD_SIGNAL':
      return candle.macdSignal;
    case 'MACD_HIST':
      return candle.macdHist;
    case 'BOLLINGER_UPPER':
      return candle.bollingerUpper;
    case 'BOLLINGER_MIDDLE':
      return candle.bollingerMiddle;
    case 'BOLLINGER_LOWER':
      return candle.bollingerLower;
    case 'STOCH_K':
      return candle.stochK;
    case 'STOCH_D':
      return candle.stochD;
    case 'ML_CONFIDENCE':
      return candle.mlConfidence ?? 50;
    case 'ML_BULLISH_PROB':
      return candle.mlBullishProb ?? 50;
    default:
      return undefined;
  }
}

/**
 * Human readable indicator name string (e.g. "RSI(14)" or "終値" or "SMA(20)")
 */
export function formatIndicatorLabel(config: IndicatorConfig): string {
  switch (config.type) {
    case 'PRICE':
      return '株価(終値)';
    case 'CONSTANT':
      return `${config.value ?? 0}`;
    case 'SMA':
      return `SMA (${config.period ?? 20}日)`;
    case 'EMA':
      return `EMA (${config.period ?? 12}日)`;
    case 'RSI':
      return `RSI (${config.period ?? 14})`;
    case 'MACD_MAIN':
      return 'MACDライン';
    case 'MACD_SIGNAL':
      return 'MACDシグナル';
    case 'MACD_HIST':
      return 'MACDヒストグラム';
    case 'BOLLINGER_UPPER':
      return 'ボリンジャー上限 (+2σ)';
    case 'BOLLINGER_MIDDLE':
      return 'ボリンジャー中央 (SMA20)';
    case 'BOLLINGER_LOWER':
      return 'ボリンジャー下限 (-2σ)';
    case 'STOCH_K':
      return 'ストキャスティクス %K';
    case 'STOCH_D':
      return 'ストキャスティクス %D';
    case 'ML_CONFIDENCE':
      return '🤖 ML予測確信度 (%)';
    case 'ML_BULLISH_PROB':
      return '🤖 ML上昇確率 (%)';
    default:
      return '不明指標';
  }
}

export function formatOperatorLabel(op: string): string {
  switch (op) {
    case 'GREATER_THAN':
      return '＞ (上回る)';
    case 'LESS_THAN':
      return '＜ (下回る)';
    case 'CROSS_ABOVE':
      return '▲ ゴールデンクロス (上抜け)';
    case 'CROSS_BELOW':
      return '▼ デッドクロス (下抜け)';
    case 'EQUALS':
      return '＝ (一致)';
    default:
      return op;
  }
}

/**
 * Evaluates a single condition against current candle index
 */
export function evaluateCondition(
  condition: RuleCondition,
  history: CandleData[],
  currentIndex: number
): { isMet: boolean; leftVal?: number; rightVal?: number; reason: string } {
  if (currentIndex < 1) {
    return { isMet: false, reason: '十分な過去データがありません' };
  }

  const leftCurr = getIndicatorValue(condition.leftIndicator, history, currentIndex);
  const rightCurr = getIndicatorValue(condition.rightIndicator, history, currentIndex);

  const leftPrev = getIndicatorValue(condition.leftIndicator, history, currentIndex - 1);
  const rightPrev = getIndicatorValue(condition.rightIndicator, history, currentIndex - 1);

  const leftName = formatIndicatorLabel(condition.leftIndicator);
  const rightName = formatIndicatorLabel(condition.rightIndicator);

  if (leftCurr === undefined || rightCurr === undefined) {
    return {
      isMet: false,
      reason: `${leftName} または ${rightName} の計算データ不足`,
    };
  }

  let isMet = false;

  switch (condition.operator) {
    case 'GREATER_THAN':
      isMet = leftCurr > rightCurr;
      break;
    case 'LESS_THAN':
      isMet = leftCurr < rightCurr;
      break;
    case 'EQUALS':
      isMet = Math.abs(leftCurr - rightCurr) < 0.001;
      break;
    case 'CROSS_ABOVE':
      if (leftPrev !== undefined && rightPrev !== undefined) {
        isMet = leftPrev <= rightPrev && leftCurr > rightCurr;
      }
      break;
    case 'CROSS_BELOW':
      if (leftPrev !== undefined && rightPrev !== undefined) {
        isMet = leftPrev >= rightPrev && leftCurr < rightCurr;
      }
      break;
  }

  const reason = `${leftName} (${leftCurr}) が ${formatOperatorLabel(condition.operator)} ${rightName} (${rightCurr})`;

  return { isMet, leftVal: leftCurr, rightVal: rightCurr, reason };
}

/**
 * Evaluates a RuleGroup (AND/OR logic)
 */
export function evaluateRuleGroup(
  ruleGroup: RuleGroup,
  history: CandleData[],
  currentIndex: number
): { isMet: boolean; matchedReasons: string[]; allReasons: string[] } {
  if (!ruleGroup.conditions || ruleGroup.conditions.length === 0) {
    return { isMet: false, matchedReasons: [], allReasons: ['条件が設定されていません'] };
  }

  const results = ruleGroup.conditions.map((cond) => evaluateCondition(cond, history, currentIndex));
  const matchedReasons = results.filter((r) => r.isMet).map((r) => r.reason);
  const allReasons = results.map((r) => `${r.isMet ? '✅' : '❌'} ${r.reason}`);

  let isMet = false;
  if (ruleGroup.logic === 'AND') {
    isMet = results.every((r) => r.isMet);
  } else {
    isMet = results.some((r) => r.isMet);
  }

  return { isMet, matchedReasons, allReasons };
}

/**
 * Checks Risk Management (Stop Loss / Take Profit / Trailing Stop) for open position
 */
export function checkPositionRiskExit(
  position: Position,
  currentPrice: number
): { shouldExit: boolean; exitType?: 'STOP_LOSS' | 'TAKE_PROFIT' | 'TRAILING_STOP'; reason?: string } {
  // 1. Stop Loss
  if (currentPrice <= position.stopLossPrice) {
    const lossPct = (((currentPrice - position.entryPrice) / position.entryPrice) * 100).toFixed(2);
    return {
      shouldExit: true,
      exitType: 'STOP_LOSS',
      reason: `ストップロス（損切り）発動: 現在価格¥${currentPrice.toLocaleString()} <= 目標値¥${position.stopLossPrice.toLocaleString()} (${lossPct}%)`,
    };
  }

  // 2. Take Profit
  if (currentPrice >= position.takeProfitPrice) {
    const gainPct = (((currentPrice - position.entryPrice) / position.entryPrice) * 100).toFixed(2);
    return {
      shouldExit: true,
      exitType: 'TAKE_PROFIT',
      reason: `テイクプロフィット（利確）発動: 現在価格¥${currentPrice.toLocaleString()} >= 目標値¥${position.takeProfitPrice.toLocaleString()} (+${gainPct}%)`,
    };
  }

  return { shouldExit: false };
}
