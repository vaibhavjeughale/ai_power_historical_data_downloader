import { Router, Request, Response } from 'express';
import { MASTER_INSTRUMENTS, SUPPORTED_TIMEFRAMES, findInstrument } from '../../src/config/instruments';
import { providerRegistry } from '../providers/providerRegistry';
import { HistoricalDataRequest, TimeframeId } from '../../src/types/market';
import { generateExcelWorkbook, generateCsvString, buildDownloadFileName } from '../services/excelService';
import { parseMarketDataPrompt } from '../services/geminiService';

export const apiRouter = Router();

// GET /api/instruments - List all supported instruments & timeframe options
apiRouter.get('/instruments', (_req: Request, res: Response) => {
  res.json({
    success: true,
    instruments: MASTER_INSTRUMENTS,
    timeframes: SUPPORTED_TIMEFRAMES,
  });
});

// GET /api/providers - List data source providers
apiRouter.get('/providers', (_req: Request, res: Response) => {
  const providers = providerRegistry.getAllProviders();
  const defaultProvider = providerRegistry.getDefaultProviderId();
  res.json({
    success: true,
    providers,
    defaultProvider,
  });
});

// POST /api/historical-data - Fetch, clean, and validate historical OHLC data
apiRouter.post('/historical-data', async (req: Request, res: Response) => {
  try {
    const { instrument, timeframe, startDate, endDate, providerId } = req.body as HistoricalDataRequest;

    if (!instrument || !timeframe || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters. Please provide instrument, timeframe, startDate, and endDate.',
      });
    }

    const instrumentObj = findInstrument(instrument);
    if (!instrumentObj) {
      return res.status(400).json({
        success: false,
        error: `Instrument '${instrument}' is not supported or recognized. Please select a valid instrument.`,
      });
    }

    const provider = providerRegistry.getProvider(providerId);

    const result = await provider.fetchHistoricalData({
      instrument: instrumentObj.id,
      symbol: instrumentObj.symbol,
      exchange: instrumentObj.exchange,
      timeframe: timeframe as TimeframeId,
      startDate,
      endDate,
      instrumentObj,
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Error fetching historical data:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'An error occurred while fetching market data.',
    });
  }
});

// POST /api/download/excel - Download professional Excel workbook (.xlsx)
apiRouter.post('/download/excel', async (req: Request, res: Response) => {
  try {
    const { historicalData } = req.body;

    if (!historicalData || !historicalData.instrument || !historicalData.data) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: historicalData payload is required for Excel export.',
      });
    }

    const workbook = await generateExcelWorkbook(historicalData);
    const fileName = buildDownloadFileName(
      historicalData.instrument.id || historicalData.instrument.symbol,
      historicalData.timeframe,
      historicalData.startDate,
      historicalData.endDate,
      'xlsx'
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Error generating Excel file:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate Excel download.',
    });
  }
});

// POST /api/download/csv - Download clean CSV
apiRouter.post('/download/csv', async (req: Request, res: Response) => {
  try {
    const { historicalData } = req.body;

    if (!historicalData || !historicalData.instrument || !historicalData.data) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: historicalData payload is required for CSV export.',
      });
    }

    const csvData = generateCsvString(historicalData);
    const fileName = buildDownloadFileName(
      historicalData.instrument.id || historicalData.instrument.symbol,
      historicalData.timeframe,
      historicalData.startDate,
      historicalData.endDate,
      'csv'
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    return res.send(csvData);
  } catch (error: any) {
    console.error('Error generating CSV file:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate CSV download.',
    });
  }
});

// POST /api/ai-parse - Interpret natural language market queries
apiRouter.post('/ai-parse', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'A prompt string is required.',
      });
    }

    const parsed = await parseMarketDataPrompt(prompt);
    return res.json({
      success: true,
      parsed,
    });
  } catch (error: any) {
    console.error('Error parsing AI market query:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to parse market data query.',
    });
  }
});
