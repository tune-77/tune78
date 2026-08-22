export type IndicatorType = 
  | 'PRICE' 
  | 'SMA' 
  | 'EMA' 
  | 'RSI' 
  | 'MACD_MAIN' 
  | 'MACD_SIGNAL' 
  | 'MACD_HIST' 
  | 'BOLLINGER_UPPER' 
  | 'BOLLINGER_MIDDLE' 
  | 'BOLLINGER_LOWER' 
  | 'STOCH_K' 
  | 'STOCH_D'
  | 'ML_CONFIDENCE'
  | 'ML_BULLISH_PROB'
  | 'CONSTANT';

export type ComparisonOperator = 
  | 'GREATER_THAN' 
  | 'LESS_THAN' 
  | 'CROSS_ABOVE' 
  | 'CROSS_BELOW' 
  | 'EQUALS';

export type ActionType = 'BUY' | 'SELL';

export interface IndicatorConfig {
  type: IndicatorType;
  period?: number;
  period2?: number; // for MACD / Stoch
  signalPeriod?: number; // for MACD
  stdDevMultiplier?: number; // for Bollinger
  value?: number; // for CONSTANT
}

export interface RuleCondition {
  id: string;
  leftIndicator: IndicatorConfig;
  operator: ComparisonOperator;
  rightIndicator: IndicatorConfig;
}

export interface RuleGroup {
  logic: 'AND' | 'OR';
  conditions: RuleCondition[];
}

export interface RiskManagement {
  stopLossPercent: number; // e.g., 2.5 means 2.5% loss
  takeProfitPercent: number; // e.g., 5.0 means 5% profit
  trailingStopPercent?: number; // e.g., 1.5%
  positionSizingType: 'FIXED_AMOUNT' | 'PERCENT_CAPITAL' | 'FIXED_SHARES';
  positionSizingValue: number; // e.g. 100000 JPY or 10% capital or 100 shares
  maxPositionsPerStock: number;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  targetSymbol: string; // Ticker or "ALL"
  buyRules: RuleGroup; // Conditions to enter LONG
  sellRules: RuleGroup; // Conditions to exit or SELL
  riskManagement: RiskManagement;
  createdAt: string;
  isPreset?: boolean;
}

export interface CandleData {
  time: string; // ISO string or timestamp
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // Calculated technical indicators
  sma5?: number;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema12?: number;
  ema26?: number;
  rsi14?: number;
  macdMain?: number;
  macdSignal?: number;
  macdHist?: number;
  bollingerUpper?: number;
  bollingerMiddle?: number;
  bollingerLower?: number;
  stochK?: number;
  stochD?: number;
  mlBullishProb?: number; // Machine Learning bullish probability (0-100%)
  mlConfidence?: number;  // ML Signal confidence score (0-100%)
}

export interface StockInfo {
  symbol: string;
  name: string;
  category: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  history: CandleData[];
  isActive?: boolean; // Controls whether the bot actively monitors and trades this stock
}

export interface Position {
  id: string;
  symbol: string;
  stockName: string;
  strategyId: string;
  strategyName: string;
  type: 'BUY';
  shares: number;
  entryPrice: number;
  currentPrice: number;
  entryTime: string;
  stopLossPrice: number;
  takeProfitPrice: number;
  highestPriceSinceEntry: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface Trade {
  id: string;
  symbol: string;
  stockName: string;
  strategyName: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  totalAmount: number;
  timestamp: string;
  triggerReason: string;
  realizedPnL?: number;
  realizedPnLPercent?: number;
}

export interface BotLog {
  id: string;
  timestamp: string;
  symbol: string;
  level: 'INFO' | 'TRIGGER' | 'WARN' | 'ERROR' | 'EXECUTION';
  message: string;
  details?: string;
}

export interface BacktestResult {
  strategyName: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalReturnPercent: number;
  benchmarkReturnPercent: number; // Buy & Hold return
  winRatePercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  avgProfitPerTrade: number;
  trades: Trade[];
  equityCurve: { time: string; equity: number; benchmark: number }[];
}

export interface AccountState {
  initialCapital: number;
  availableCash: number;
  investedCapital: number;
  totalAssetValue: number;
  totalRealizedPnL: number;
  isBotRunning: boolean;
  activeStrategyId: string;
  tickSpeedMs: number; // e.g. 1500 ms per price tick
}
