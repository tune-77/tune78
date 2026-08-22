import { StockInfo, CandleData } from '../types';
import { enrichCandlesWithIndicators } from '../utils/technicalIndicators';

export function generateHistoricalCandles(basePrice: number, days = 120, volatility = 0.02): CandleData[] {
  const candles: CandleData[] = [];
  let currentPrice = basePrice * 0.85; // start lower so there's an overall trend
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];

    // random daily return with slight upward bias
    const changePercent = (Math.random() - 0.48) * volatility;
    const open = Math.round(currentPrice * 10) / 10;
    const close = Math.round(open * (1 + changePercent) * 10) / 10;
    const high = Math.round(Math.max(open, close) * (1 + Math.random() * volatility * 0.5) * 10) / 10;
    const low = Math.round(Math.min(open, close) * (1 - Math.random() * volatility * 0.5) * 10) / 10;
    const volume = Math.floor(10000 + Math.random() * 500000);

    candles.push({
      time: dateStr,
      timestamp: d.getTime(),
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  return enrichCandlesWithIndicators(candles);
}

export const INITIAL_STOCKS: StockInfo[] = [
  {
    symbol: '7203.T',
    name: 'トヨタ自動車 (Toyota)',
    category: '輸送用機器',
    currentPrice: 2750,
    change: 42.5,
    changePercent: 1.57,
    high24h: 2780,
    low24h: 2710,
    volume24h: 12450000,
    isActive: true,
    history: generateHistoricalCandles(2750, 150, 0.018),
  },
  {
    symbol: '9984.T',
    name: 'ソフトバンクグループ (SoftBank G)',
    category: '情報・通信',
    currentPrice: 8920,
    change: -110,
    changePercent: -1.22,
    high24h: 9100,
    low24h: 8850,
    volume24h: 8920000,
    isActive: true,
    history: generateHistoricalCandles(8920, 150, 0.028),
  },
  {
    symbol: '6758.T',
    name: 'ソニーグループ (Sony Group)',
    category: '電気機器',
    currentPrice: 3240,
    change: 65,
    changePercent: 2.05,
    high24h: 3260,
    low24h: 3180,
    volume24h: 6540000,
    isActive: true,
    history: generateHistoricalCandles(3240, 150, 0.022),
  },
  {
    symbol: '6861.T',
    name: 'キーエンス (Keyence)',
    category: '電気機器',
    currentPrice: 68400,
    change: 1200,
    changePercent: 1.79,
    high24h: 68900,
    low24h: 67100,
    volume24h: 820000,
    isActive: true,
    history: generateHistoricalCandles(68400, 150, 0.02),
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    category: '米国ハイテク',
    currentPrice: 128.5,
    change: 3.4,
    changePercent: 2.72,
    high24h: 130.2,
    low24h: 125.1,
    volume24h: 45200000,
    isActive: true,
    history: generateHistoricalCandles(128.5, 150, 0.035),
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    category: '米国ハイテク',
    currentPrice: 224.8,
    change: -0.9,
    changePercent: -0.40,
    high24h: 226.5,
    low24h: 223.2,
    volume24h: 28400000,
    isActive: true,
    history: generateHistoricalCandles(224.8, 150, 0.016),
  },
];

export interface PresetStockCandidate {
  symbol: string;
  name: string;
  category: string;
  region: 'JP' | 'US';
  defaultPrice: number;
}

export const PRESET_STOCK_CATALOG: PresetStockCandidate[] = [
  // 日本株 (JP)
  { symbol: '8306.T', name: '三菱UFJフィナンシャルG', category: '銀行業', region: 'JP', defaultPrice: 1560 },
  { symbol: '6920.T', name: 'レーザーテック', category: '電気機器 (半導体)', region: 'JP', defaultPrice: 24500 },
  { symbol: '6857.T', name: 'アドバンテスト', category: '電気機器 (半導体)', region: 'JP', defaultPrice: 6820 },
  { symbol: '9983.T', name: 'ファーストリテイリング (ユニクロ)', category: '小売業', region: 'JP', defaultPrice: 43200 },
  { symbol: '8035.T', name: '東京エレクトロン', category: '電気機器', region: 'JP', defaultPrice: 27800 },
  { symbol: '7974.T', name: '任天堂 (Nintendo)', category: 'その他製品', region: 'JP', defaultPrice: 8250 },
  { symbol: '4755.T', name: '楽天グループ', category: 'サービス業', region: 'JP', defaultPrice: 890 },
  { symbol: '6501.T', name: '日立製作所', category: '電気機器', region: 'JP', defaultPrice: 3450 },
  { symbol: '7267.T', name: 'ホンダ (本田技研工業)', category: '輸送用機器', region: 'JP', defaultPrice: 1620 },
  { symbol: '9101.T', name: '日本郵船', category: '海運業', region: 'JP', defaultPrice: 4850 },
  { symbol: '8316.T', name: '三井住友フィナンシャルG', category: '銀行業', region: 'JP', defaultPrice: 3280 },
  
  // 米国株 (US)
  { symbol: 'TSLA', name: 'Tesla, Inc.', category: '米国ハイテク / EV', region: 'US', defaultPrice: 215.4 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', category: '米国ハイテク', region: 'US', defaultPrice: 422.5 },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', category: '米国EC・クラウド', region: 'US', defaultPrice: 186.2 },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)', category: '米国ハイテク', region: 'US', defaultPrice: 174.8 },
  { symbol: 'META', name: 'Meta Platforms, Inc.', category: '米国SNS・AI', region: 'US', defaultPrice: 512.0 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', category: '米国半導体', region: 'US', defaultPrice: 154.3 },
  { symbol: 'PLTR', name: 'Palantir Technologies', category: '米国AI・防衛', region: 'US', defaultPrice: 31.8 },
  { symbol: 'COIN', name: 'Coinbase Global, Inc.', category: '米国暗号資産', region: 'US', defaultPrice: 208.5 },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', category: '米国指数ETF', region: 'US', defaultPrice: 554.2 },
];

