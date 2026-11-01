import { MarketInstrument, TimeframeConfig, TimeframeId } from '../types/market';

export const SUPPORTED_TIMEFRAMES: TimeframeConfig[] = [
  // Intraday
  { id: '1m', label: '1 Minute', category: 'intraday', minutes: 1, maxHistoricalDays: 7, description: '1-minute intraday bars (last 7 days on public feed)' },
  { id: '3m', label: '3 Minutes', category: 'intraday', minutes: 3, maxHistoricalDays: 14, description: '3-minute aggregated bars (last 14 days)' },
  { id: '5m', label: '5 Minutes', category: 'intraday', minutes: 5, maxHistoricalDays: 60, description: '5-minute intraday bars (last 60 days on public feed)' },
  { id: '10m', label: '10 Minutes', category: 'intraday', minutes: 10, maxHistoricalDays: 60, description: '10-minute aggregated bars (last 60 days)' },
  { id: '15m', label: '15 Minutes', category: 'intraday', minutes: 15, maxHistoricalDays: 60, description: '15-minute intraday bars (last 60 days)' },
  { id: '30m', label: '30 Minutes', category: 'intraday', minutes: 30, maxHistoricalDays: 60, description: '30-minute intraday bars (last 60 days)' },
  { id: '1h', label: '1 Hour', category: 'intraday', minutes: 60, maxHistoricalDays: 730, description: '1-hour intraday bars (up to 2 years)' },
  // Daily and higher
  { id: '1d', label: '1 Day', category: 'daily_plus', minutes: 1440, description: 'End of Day daily bars (multi-decade historical)' },
  { id: '1wk', label: '1 Week', category: 'daily_plus', minutes: 10080, description: 'Weekly aggregated bars (multi-decade historical)' },
  { id: '1mo', label: '1 Month', category: 'daily_plus', minutes: 43200, description: 'Monthly aggregated bars (multi-decade historical)' },
];

export const ALL_TIMEFRAME_IDS: TimeframeId[] = SUPPORTED_TIMEFRAMES.map(t => t.id);

export const MASTER_INSTRUMENTS: MarketInstrument[] = [
  // Primary Indices
  {
    id: 'NIFTY50',
    name: 'NIFTY 50',
    symbol: 'NIFTY',
    exchange: 'NSE',
    assetType: 'INDEX',
    supportedTimeframes: ALL_TIMEFRAME_IDS,
    providerSymbols: {
      yahoo: '^NSEI',
      stooq: '^NSEI',
      mock: 'NIFTY50',
    },
    description: 'National Stock Exchange benchmark index representing 50 blue-chip companies',
    currency: 'INR',
    lotSize: 25,
  },
  {
    id: 'BANKNIFTY',
    name: 'BANK NIFTY',
    symbol: 'BANKNIFTY',
    exchange: 'NSE',
    assetType: 'INDEX',
    supportedTimeframes: ALL_TIMEFRAME_IDS,
    providerSymbols: {
      yahoo: '^NSEBANK',
      stooq: '^NSEBANK',
      mock: 'BANKNIFTY',
    },
    description: 'NSE Banking sector index composed of 12 banking stocks',
    currency: 'INR',
    lotSize: 15,
  },
  {
    id: 'SENSEX',
    name: 'S&P BSE SENSEX',
    symbol: 'SENSEX',
    exchange: 'BSE',
    assetType: 'INDEX',
    supportedTimeframes: ALL_TIMEFRAME_IDS,
    providerSymbols: {
      yahoo: '^BSESN',
      stooq: '^BSESN',
      mock: 'SENSEX',
    },
    description: 'Bombay Stock Exchange flagship index of 30 well-established companies',
    currency: 'INR',
    lotSize: 10,
  },

  // Additional Sectoral & Broad Indices
  {
    id: 'FINNIFTY',
    name: 'NIFTY FINANCIAL SERVICES',
    symbol: 'FINNIFTY',
    exchange: 'NSE',
    assetType: 'INDEX',
    supportedTimeframes: ALL_TIMEFRAME_IDS,
    providerSymbols: {
      yahoo: 'NIFTY_FIN_SERVICE.NS',
      mock: 'FINNIFTY',
    },
    description: 'Financial services sector index including banks, insurance, and NBFCs',
    currency: 'INR',
    lotSize: 40,
  },
  {
    id: 'MIDCPNIFTY',
    name: 'NIFTY MIDCAP SELECT',
    symbol: 'MIDCPNIFTY',
    exchange: 'NSE',
    assetType: 'INDEX',
    supportedTimeframes: ALL_TIMEFRAME_IDS,
    providerSymbols: {
      yahoo: 'NIFTY_MIDCAP_100.NS',
      mock: 'MIDCPNIFTY',
    },
    description: 'Index tracking the performance of top mid-cap companies',
    currency: 'INR',
    lotSize: 50,
  },

  // Individual Stocks
  {
    id: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    symbol: 'RELIANCE',
    exchange: 'NSE',
    assetType: 'EQUITY',
    supportedTimeframes: ALL_TIMEFRAME_IDS,
    providerSymbols: {
      yahoo: 'RELIANCE.NS',
      mock: 'RELIANCE',
    },
    description: 'Energy, petrochemicals, telecommunications, retail and digital services conglomerate',
    currency: 'INR',
    lotSize: 250,
  },
  {
    id: 'TCS',
    name: 'Tata Consultancy Services Ltd',
    symbol: 'TCS',
    exchange: 'NSE',
    assetType: 'EQUITY',
    supportedTimeframes: ALL_TIMEFRAME_IDS,
    providerSymbols: {
      yahoo: 'TCS.NS',
      mock: 'TCS',
    },
    description: 'Global leader in IT services, consulting, and business solutions',
    currency: 'INR',
    lotSize: 175,
  },
  {
    id: 'INFY',
    name: 'Infosys Ltd',
    symbol: 'INFY',
    exchange: 'NSE',
    assetType: 'EQUITY',
    supportedTimeframes: ALL_TIMEFRAME_IDS,
    providerSymbols: {
      yahoo: 'INFY.NS',
      mock: 'INFY',
    },
    description: 'Next-generation digital services and technology consulting firm',
    currency: 'INR',
    lotSize: 300,
  },
  {
    id: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    symbol: 'HDFCBANK',
    exchange: 'NSE',
    assetType: 'EQUITY',
    supportedTimeframes: ALL_TIMEFRAME_IDS,
    providerSymbols: {
      yahoo: 'HDFCBANK.NS',
      mock: 'HDFCBANK',
    },
    description: "India's largest private sector bank by assets and market capitalization",
    currency: 'INR',
    lotSize: 550,
  },
  {
    id: 'ICICIBANK',
    name: 'ICICI Bank Ltd',
    symbol: 'ICICIBANK',
    exchange: 'NSE',
    assetType: 'EQUITY',
    supportedTimeframes: ALL_TIMEFRAME_IDS,
    providerSymbols: {
      yahoo: 'ICICIBANK.NS',
      mock: 'ICICIBANK',
    },
    description: 'Leading private sector banking and financial services company',
    currency: 'INR',
    lotSize: 700,
  },
  {
    id: 'TATASTEEL',
    name: 'Tata Steel Ltd',
    symbol: 'TATASTEEL',
    exchange: 'NSE',
    assetType: 'EQUITY',
    supportedTimeframes: ALL_TIMEFRAME_IDS,
    providerSymbols: {
      yahoo: 'TATASTEEL.NS',
      mock: 'TATASTEEL',
    },
    description: 'Global top-tier steel manufacturer with diversified industrial presence',
    currency: 'INR',
    lotSize: 5500,
  },

  // Commodities
  {
    id: 'CRUDEOIL',
    name: 'Crude Oil WTI Futures',
    symbol: 'CRUDEOIL',
    exchange: 'MCX',
    assetType: 'COMMODITY',
    supportedTimeframes: ALL_TIMEFRAME_IDS,
    providerSymbols: {
      yahoo: 'CL=F',
      mock: 'CRUDEOIL',
    },
    description: 'Light Sweet Crude Oil benchmark futures contract',
    currency: 'USD',
    lotSize: 100,
  },
  {
    id: 'GOLD',
    name: 'Gold Futures',
    symbol: 'GOLD',
    exchange: 'MCX',
    assetType: 'COMMODITY',
    supportedTimeframes: ALL_TIMEFRAME_IDS,
    providerSymbols: {
      yahoo: 'GC=F',
      mock: 'GOLD',
    },
    description: 'Standard 100 Troy Ounce Gold futures contract',
    currency: 'USD',
    lotSize: 1,
  },
  {
    id: 'GOLDM',
    name: 'Gold Mini Futures',
    symbol: 'GOLDM',
    exchange: 'MCX',
    assetType: 'COMMODITY',
    providerSymbols: {
      yahoo: 'MGC=F',
      mock: 'GOLDM',
    },
    supportedTimeframes: ALL_TIMEFRAME_IDS,
    description: 'Mini Gold futures contract suited for precision hedging',
    currency: 'USD',
    lotSize: 1,
  },
  {
    id: 'SILVER',
    name: 'Silver Futures',
    symbol: 'SILVER',
    exchange: 'MCX',
    assetType: 'COMMODITY',
    supportedTimeframes: ALL_TIMEFRAME_IDS,
    providerSymbols: {
      yahoo: 'SI=F',
      mock: 'SILVER',
    },
    description: 'Standard 5,000 Troy Ounces Silver futures contract',
    currency: 'USD',
    lotSize: 30,
  },
];

export function findInstrument(queryOrId: string): MarketInstrument | undefined {
  const normalized = queryOrId.trim().toUpperCase();
  return MASTER_INSTRUMENTS.find(
    inst => 
      inst.id.toUpperCase() === normalized || 
      inst.symbol.toUpperCase() === normalized ||
      inst.name.toUpperCase().includes(normalized) ||
      inst.providerSymbols.yahoo?.toUpperCase() === normalized
  );
}
