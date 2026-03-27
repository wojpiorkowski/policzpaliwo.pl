import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  ReferenceLine
} from 'recharts';
import { 
  Fuel, 
  TrendingUp, 
  DollarSign, 
  Droplets,
  Info, 
  Calculator, 
  History, 
  ArrowRight, 
  AlertCircle,
  RefreshCw,
  Globe,
  Zap,
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { cn } from './lib/utils';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey?: () => Promise<boolean>;
      openSelectKey?: () => Promise<void>;
    };
  }
}

// --- Constants & Types ---

const BARREL_LITERS = 158.987;
const DEFAULT_VAT = 0.23;
const EMISSION_FEE = 0.080;
const REFINING_COSTS = 0.55;
const REFINERY_MARGIN = 0.35;
const RETAIL_MARGIN = 0.22;

interface HistoricalData {
  date: string;
  brent: number;
  usdPln: number;
  pricePb95: number;
  priceON: number;
}

const HISTORICAL_DATA: HistoricalData[] = [
  // 2016
  { date: '2016-01', brent: 34.74, usdPln: 4.05, pricePb95: 4.15, priceON: 3.90 },
  { date: '2016-04', brent: 48.13, usdPln: 3.95, pricePb95: 4.30, priceON: 4.05 },
  { date: '2016-07', brent: 42.46, usdPln: 3.90, pricePb95: 4.35, priceON: 4.10 },
  { date: '2016-10', brent: 48.30, usdPln: 3.85, pricePb95: 4.50, priceON: 4.25 },
  // 2017
  { date: '2017-01', brent: 55.70, usdPln: 4.10, pricePb95: 4.65, priceON: 4.55 },
  { date: '2017-04', brent: 51.73, usdPln: 3.95, pricePb95: 4.60, priceON: 4.45 },
  { date: '2017-07', brent: 52.65, usdPln: 3.70, pricePb95: 4.55, priceON: 4.40 },
  { date: '2017-10', brent: 61.37, usdPln: 3.65, pricePb95: 4.75, priceON: 4.65 },
  // 2018
  { date: '2018-01', brent: 67.78, usdPln: 3.45, pricePb95: 4.85, priceON: 4.75 },
  { date: '2018-04', brent: 75.92, usdPln: 3.40, pricePb95: 5.05, priceON: 4.95 },
  { date: '2018-07', brent: 74.16, usdPln: 3.70, pricePb95: 5.15, priceON: 5.05 },
  { date: '2018-10', brent: 74.84, usdPln: 3.75, pricePb95: 5.20, priceON: 5.15 },
  // 2019
  { date: '2019-01', brent: 62.46, usdPln: 3.75, pricePb95: 4.95, priceON: 4.90 },
  { date: '2019-04', brent: 72.19, usdPln: 3.80, pricePb95: 5.15, priceON: 5.10 },
  { date: '2019-07', brent: 64.07, usdPln: 3.85, pricePb95: 5.25, priceON: 5.15 },
  { date: '2019-10', brent: 59.30, usdPln: 3.95, pricePb95: 5.10, priceON: 5.05 },
  // 2020
  { date: '2020-01', brent: 57.77, usdPln: 3.80, pricePb95: 4.90, priceON: 4.95 },
  { date: '2020-04', brent: 18.11, usdPln: 4.20, pricePb95: 3.95, priceON: 4.05 },
  { date: '2020-07', brent: 43.13, usdPln: 3.95, pricePb95: 4.25, priceON: 4.30 },
  { date: '2020-10', brent: 36.33, usdPln: 3.90, pricePb95: 4.40, priceON: 4.45 },
  // 2021
  { date: '2021-01', brent: 55.25, usdPln: 3.75, pricePb95: 4.75, priceON: 4.70 },
  { date: '2021-04', brent: 67.73, usdPln: 3.80, pricePb95: 5.25, priceON: 5.20 },
  { date: '2021-07', brent: 77.72, usdPln: 3.90, pricePb95: 5.65, priceON: 5.60 },
  { date: '2021-10', brent: 83.10, usdPln: 4.00, pricePb95: 5.95, priceON: 5.90 },
  // 2022
  { date: '2022-01', brent: 92.35, usdPln: 4.05, pricePb95: 5.90, priceON: 5.95 },
  { date: '2022-04', brent: 108.36, usdPln: 4.30, pricePb95: 6.45, priceON: 7.10 },
  { date: '2022-07', brent: 111.51, usdPln: 4.75, pricePb95: 7.35, priceON: 7.60 },
  { date: '2022-10', brent: 93.30, usdPln: 4.85, pricePb95: 6.85, priceON: 8.05 },
  // 2023
  { date: '2023-01', brent: 83.42, usdPln: 4.40, pricePb95: 6.55, priceON: 7.65 },
  { date: '2023-04', brent: 81.32, usdPln: 4.20, pricePb95: 6.75, priceON: 6.70 },
  { date: '2023-07', brent: 85.22, usdPln: 4.05, pricePb95: 6.50, priceON: 6.30 },
  { date: '2023-10', brent: 86.82, usdPln: 4.25, pricePb95: 6.10, priceON: 6.15 },
  // 2024
  { date: '2024-01', brent: 82.98, usdPln: 4.00, pricePb95: 6.25, priceON: 6.45 },
  { date: '2024-04', brent: 88.23, usdPln: 4.05, pricePb95: 6.65, priceON: 6.70 },
  { date: '2024-07', brent: 81.39, usdPln: 3.95, pricePb95: 6.45, priceON: 6.50 },
  { date: '2024-10', brent: 73.25, usdPln: 4.05, pricePb95: 6.05, priceON: 6.10 },
  // 2025
  { date: '2025-01', brent: 77.11, usdPln: 4.00, pricePb95: 6.15, priceON: 6.25 },
  { date: '2025-04', brent: 63.37, usdPln: 3.85, pricePb95: 5.95, priceON: 6.05 },
  { date: '2025-07', brent: 73.43, usdPln: 3.95, pricePb95: 6.25, priceON: 6.35 },
  { date: '2025-10', brent: 65.44, usdPln: 4.05, pricePb95: 5.85, priceON: 5.95 },
  // 2026
  { date: '2026-01', brent: 72.25, usdPln: 3.95, pricePb95: 5.65, priceON: 5.75 },
  { date: '2026-03', brent: 101.04, usdPln: 3.65, pricePb95: 6.85, priceON: 7.75 },
];

// --- Components ---

const StatCard = ({ title, value, unit, icon: Icon, description, variant = 'default', badge, tooltip, extra }: any) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const variants: Record<string, any> = {
    default: { iconBg: 'bg-slate-50', iconText: 'text-slate-600', valueText: 'text-slate-900' },
    blue: { iconBg: 'bg-blue-50', iconText: 'text-blue-600', valueText: 'text-blue-600' },
    emerald: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', valueText: 'text-emerald-600' },
    orange: { iconBg: 'bg-orange-50', iconText: 'text-orange-600', valueText: 'text-orange-600' },
    black: { iconBg: 'bg-slate-100', iconText: 'text-slate-900', valueText: 'text-slate-900' },
    red: { iconBg: 'bg-red-50', iconText: 'text-red-600', valueText: 'text-red-600' },
  };
  const theme = variants[variant] || variants.default;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-2 rounded-lg", theme.iconBg)}>
          <Icon className={cn("w-5 h-5", theme.iconText)} />
        </div>
        {badge && (
          <span className={cn(
            "text-sm font-black px-3 py-1 rounded-full uppercase tracking-tight shadow-sm border",
            badge.type === 'danger' ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
          )}>
            {badge.text}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-2xl font-bold", theme.valueText)}>{value}</span>
        <span className="text-sm font-medium text-slate-400">{unit}</span>
      </div>
      
      {extra && (
        <div className="mt-1 mb-2">
          {extra}
        </div>
      )}

      {description && (
        <div className="mt-2 flex items-center gap-1.5">
          <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
          {tooltip && (
            <div className="relative flex items-center">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-slate-300 hover:text-emerald-500 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute top-full right-0 mt-2 w-72 p-4 bg-slate-900 text-white text-[10px] leading-normal rounded-xl shadow-2xl z-[100] pointer-events-none"
                  >
                    <div className="whitespace-pre-wrap font-medium">
                      {tooltip}
                    </div>
                    <div className="absolute bottom-full right-4 border-8 border-transparent border-b-slate-900" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

const InfoSection = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
    <div className="p-6 bg-white text-slate-900 rounded-3xl lg:col-span-2 border border-slate-200 shadow-sm overflow-hidden relative">
      <div className="relative z-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-yellow-500" />
          Co składa się na cenę paliwa?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              <span><strong>Podatek VAT (23%):</strong> Największy składnik podatkowy, naliczany od sumy wszystkich kosztów.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              <span><strong>Akcyza:</strong> Podatek kwotowy, ustalany przez państwo na 1000 litrów paliwa.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              <span><strong>Opłata Paliwowa:</strong> Środki zasilające Krajowy Fundusz Drogowy i Kolejowy.</span>
            </li>
          </ul>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              <span><strong>Marża Rafineryjna:</strong> Zysk rafinerii oraz koszty przetworzenia ropy na gotowe paliwo.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              <span><strong>Marża Detaliczna:</strong> Zysk stacji benzynowej, zazwyczaj najmniejszy element ceny.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              <span><strong>Opłata Emisyjna:</strong> Wprowadzona w 2019 r., wspiera fundusze niskoemisyjne.</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl" />
    </div>
    <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
      <div className="relative z-10">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-emerald-500" />
          O kalkulatorze
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Nasz kalkulator pozwala zrozumieć mechanizmy kształtujące ceny paliw w Polsce. Model bierze pod uwagę notowania ropy Brent na rynkach światowych, aktualny kurs dolara oraz stałe obciążenia podatkowe i marże rafineryjne.
        </p>
        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          Obliczenia opierają się na oficjalnych notowaniach giełdowych oraz danych z serwisu autocentrum.pl.
        </p>
      </div>
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl" />
    </div>
  </div>
);

export default function App() {
  const [brentInput, setBrentInput] = useState(80);
  const [usdPlnInput, setUsdPlnInput] = useState(4.00);
  const [exciseInput, setExciseInput] = useState(1.53);
  const [vatInput, setVatInput] = useState(23);
  const [fuelType, setFuelType] = useState<'Pb95' | 'ON'>('Pb95');
  const [realTimeData, setRealTimeData] = useState<{ brent: number, usdPln: number, retailPb95: number, retailON: number, timestamp?: string, sourceUrl?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCustomKey, setHasCustomKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkApiKey = async (retries = 3) => {
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasCustomKey(hasKey);
      } else if (retries > 0) {
        // Platform might take a moment to inject window.aistudio
        setTimeout(() => checkApiKey(retries - 1), 300);
      } else {
        setHasCustomKey(false);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasCustomKey(hasKey);
        if (hasKey) {
          fetchRealTimeData();
        }
      }
    }
  };

  const calculatePrice = (brent: number, usdPln: number, type: 'Pb95' | 'ON', excise: number, vat: number) => {
    const rawOilPricePerLiter = (brent * usdPln) / BARREL_LITERS;
    const fuelFee = type === 'Pb95' ? 0.210 : 0.422;
    
    const netPrice = rawOilPricePerLiter + REFINING_COSTS + REFINERY_MARGIN + excise + fuelFee + EMISSION_FEE + RETAIL_MARGIN;
    return netPrice * (1 + vat / 100);
  };

  const calculatedPrice = useMemo(() => calculatePrice(brentInput, usdPlnInput, fuelType, exciseInput, vatInput), [brentInput, usdPlnInput, fuelType, exciseInput, vatInput]);

  const priceStructure = useMemo(() => {
    const rawOilPricePerLiter = (brentInput * usdPlnInput) / BARREL_LITERS;
    const fuelFee = fuelType === 'Pb95' ? 0.210 : 0.422;
    
    const taxesNet = exciseInput + fuelFee + EMISSION_FEE;
    const margins = REFINING_COSTS + REFINERY_MARGIN + RETAIL_MARGIN;
    const totalNet = rawOilPricePerLiter + taxesNet + margins;
    const vatAmount = totalNet * (vatInput / 100);
    const totalGross = totalNet + vatAmount;

    return {
      taxes: ((taxesNet + vatAmount) / totalGross) * 100,
      raw: (rawOilPricePerLiter / totalGross) * 100,
      margins: (margins / totalGross) * 100
    };
  }, [brentInput, usdPlnInput, fuelType, exciseInput, vatInput]);

  const marketComparison = useMemo(() => {
    if (!realTimeData) return null;
    const retail = fuelType === 'Pb95' ? realTimeData.retailPb95 : realTimeData.retailON;
    const model = calculatePrice(realTimeData.brent, realTimeData.usdPln, fuelType, fuelType === 'Pb95' ? 1.53 : 1.16, 23);
    const diffPercent = ((retail - model) / model) * 100;
    
    return {
      text: diffPercent > 0 
        ? `+${Math.abs(diffPercent).toFixed(1)}%` 
        : `-${Math.abs(diffPercent).toFixed(1)}%`,
      type: diffPercent > 0 ? 'danger' : 'success'
    };
  }, [realTimeData, fuelType]);

  const fetchRealTimeData = async (retryCount = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      // Re-check key state just before fetching
      let currentHasCustomKey = hasCustomKey;
      if (window.aistudio?.hasSelectedApiKey) {
        currentHasCustomKey = await window.aistudio.hasSelectedApiKey();
        setHasCustomKey(currentHasCustomKey);
      }

      // Use process.env.API_KEY if a custom key is selected, otherwise fallback to GEMINI_API_KEY
      const apiKey = (currentHasCustomKey && process.env.API_KEY) ? process.env.API_KEY : import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error("Brak klucza API Gemini. Podłącz klucz, aby pobrać aktualne dane.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Pobierz DOKŁADNE aktualne średnie ceny paliw w Polsce bezpośrednio ze strony https://www.autocentrum.pl/paliwa/ceny-paliw. 
        Zlokalizuj sekcję "CENY PALIW W CAŁEJ POLSCE" i odczytaj wartości z głównych boksów:
        - Dla benzyny '95' (zielony boks)
        - Dla oleju napędowego 'ON' (ciemnoszary boks)
        
        Dodatkowo podaj aktualną cenę ropy Brent (USD/bbl) oraz aktualny kurs USD/PLN.
        
        Zwróć dane DOKŁADNIE w formacie JSON: 
        { 
          "brent": liczba, 
          "usdPln": liczba, 
          "retailPb95": liczba, 
          "retailON": liczba, 
          "timestamp": "data i godzina odczytu", 
          "sourceUrl": "https://www.autocentrum.pl/paliwa/ceny-paliw" 
        }`,
        config: {
          tools: [{ googleSearch: {} }, { urlContext: {} }],
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text || "{}");
      if (data.brent && data.usdPln) {
        setRealTimeData(data);
        setBrentInput(data.brent);
        setUsdPlnInput(data.usdPln);
      } else {
        throw new Error("Nie udało się pobrać danych.");
      }
    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message || "Wystąpił nieoczekiwany błąd.";
      
      // Try to parse JSON error from API
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.error?.message) {
          errorMessage = parsed.error.message;
        }
      } catch (e) {
        // Not a JSON string
      }

      // Retry logic for transient errors on initial load
      if (retryCount < 1 && (errorMessage.includes("API key not valid") || errorMessage.includes("INVALID_ARGUMENT") || errorMessage.includes("fetch"))) {
        setTimeout(() => fetchRealTimeData(retryCount + 1), 1000);
        return;
      }

      if (errorMessage.includes("quota") || errorMessage.includes("429")) {
        setError("Przekroczono limit bezpłatnych zapytań (Quota Exceeded). Podłącz własny płatny klucz API Gemini, aby kontynuować.");
      } else if (errorMessage.includes("API key not valid") || errorMessage.includes("INVALID_ARGUMENT")) {
        setHasCustomKey(false);
        setError("Klucz API jest nieprawidłowy lub wygasł. Podłącz poprawny klucz API Gemini.");
      } else if (errorMessage.includes("Requested entity was not found")) {
        setHasCustomKey(false);
        setError("Wybrany klucz API jest nieprawidłowy. Wybierz go ponownie.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasCustomKey !== null) {
      // Delay initial fetch to ensure environment is fully ready
      const timer = setTimeout(() => {
        fetchRealTimeData();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasCustomKey === null]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-300",
              fuelType === 'Pb95' ? "bg-emerald-500 shadow-emerald-100" : "bg-slate-900 shadow-slate-200"
            )}>
              <Fuel className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                <span className="text-slate-900">POLICZ</span>
                <span className="text-emerald-600">PALIWO.PL</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
              <button 
                onClick={() => {
                  setFuelType('Pb95');
                  setExciseInput(1.53);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  fuelType === 'Pb95' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Benzyna Pb95
              </button>
              <button 
                onClick={() => {
                  setFuelType('ON');
                  setExciseInput(1.16);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  fuelType === 'ON' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Diesel ON
              </button>
            </div>
            <button 
              onClick={fetchRealTimeData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              <span className="hidden sm:inline">Aktualizuj Dane</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Real-time Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Ropa Brent" 
            value={realTimeData?.brent || '---'} 
            unit="USD/bbl" 
            icon={Globe}
            variant="blue"
            description={realTimeData?.timestamp ? `Dane z dnia: ${realTimeData.timestamp}` : "Aktualna cena baryłki ropy na rynkach światowych."}
          />
          <StatCard 
            title="Kurs USD/PLN" 
            value={realTimeData?.usdPln || '---'} 
            unit="PLN" 
            icon={DollarSign}
            variant="red"
            description={realTimeData?.timestamp ? `Dane z dnia: ${realTimeData.timestamp}` : "Aktualny kurs wymiany dolara amerykańskiego."}
          />
          <StatCard 
            title="Szacowana cena" 
            value={calculatePrice(realTimeData?.brent || 80, realTimeData?.usdPln || 4, fuelType, exciseInput, vatInput).toFixed(2)} 
            unit="PLN/l" 
            icon={Zap}
            variant={fuelType === 'Pb95' ? 'emerald' : 'black'}
            description={`Wyliczona cena detaliczna ${fuelType} na podstawie modelu.`}
            tooltip={`Model wyliczania szacowanej ceny detalicznej opiera się na sumowaniu kosztów surowca, podatków oraz marż. Cały proces można podzielić na cztery główne etapy:

1. Przeliczenie ceny ropy na litr (w PLN)
Ropa Brent jest notowana w dolarach za baryłkę. Aby uzyskać cenę surowca w jednym litrze paliwa, aplikacja wykonuje następujące działanie:
Cena baryłki (USD) × Kurs USD/PLN: Zamiana ceny na złotówki.
Wynik ÷ 158,987: Podział przez liczbę litrów w jednej baryłce ropy.
Przykład: Przy ropie za 80$ i kursie 4,00 zł, koszt samej ropy to ok. 2,01 zł za litr.

2. Stałe obciążenia podatkowe (Akcyza i Opłaty)
Do ceny surowca doliczane są podatki kwotowe, które są stałe (nie zależą od ceny ropy, ale różnią się dla typu paliwa):
Akcyza: ok. 1,53 zł (Pb95) lub 1,16 zł (ON).
Opłata paliwowa: ok. 0,210 zł (Pb95) lub 0,422 zł (ON).
Opłata emisyjna: stałe 0,080 zł dla obu paliw.

3. Koszty operacyjne i marże
Następnie doliczane są koszty związane z przetworzeniem i sprzedażą:
Koszty rafineryjne: 0,55 zł (koszt przerobu ropy).
Marża rafineryjna: 0,35 zł (zysk rafinerii).
Marża detaliczna: 0,22 zł (zysk stacji benzynowej).

4. Podatek VAT (23%)
Na samym końcu, od sumy wszystkich powyższych składników (cena netto), naliczany jest podatek VAT:
Cena Detaliczna = Cena Netto × 1,23

Podsumowanie struktury (Wzór):
Cena = [(Ropa_Litr + Akcyza + Opłata_Paliwowa + Opłata_Emisyjna + Koszty_Przerobu + Marże) × 1,23]`}
          />
          <StatCard 
            title="Aktualna cena detaliczna" 
            value={fuelType === 'Pb95' ? (realTimeData?.retailPb95 || '---') : (realTimeData?.retailON || '---')} 
            unit="PLN/l" 
            icon={Fuel}
            variant={fuelType === 'Pb95' ? 'emerald' : 'black'}
            badge={marketComparison}
            description={
              <span className="block">
                {realTimeData?.timestamp ? `Dane z dnia: ${realTimeData.timestamp}. ` : ''}
                Średnia cena detaliczna {fuelType} na stacjach w Polsce.
                {realTimeData?.sourceUrl && (
                  <a 
                    href={realTimeData.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={cn(
                      "block mt-1 hover:underline font-medium",
                      fuelType === 'Pb95' ? "text-emerald-600" : "text-slate-900"
                    )}
                  >
                    Źródło: autocentrum.pl
                  </a>
                )}
              </span>
            }
          />
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col gap-3 text-red-700 text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
            {(error.includes("Quota") || error.includes("Klucz API")) && (
              <div className="ml-8 flex flex-col gap-2">
                <p className="text-xs opacity-80">
                  {error.includes("Quota") 
                    ? "Darmowe limity Gemini zostały wyczerpane. Aby korzystać z aplikacji bez ograniczeń, podłącz własny klucz API z włączonym bilingiem."
                    : "Obecny klucz API nie działa lub jest nieprawidłowy. Podłącz własny klucz API Gemini, aby korzystać z aplikacji."}
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={fetchRealTimeData}
                    className="text-xs font-bold underline hover:no-underline flex items-center gap-1"
                  >
                    Spróbuj ponownie <RefreshCw className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={handleSelectKey}
                    className="text-xs font-bold underline hover:no-underline"
                  >
                    Podłącz klucz teraz
                  </button>
                  {error.includes("Quota") && (
                    <a 
                      href="https://ai.google.dev/gemini-api/docs/billing" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-bold underline hover:no-underline flex items-center gap-1"
                    >
                      Jak włączyć biling? <Globe className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calculator Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className={cn("p-2 rounded-xl", fuelType === 'Pb95' ? "bg-emerald-50" : "bg-slate-100")}>
                  <Calculator className={cn("w-6 h-6", fuelType === 'Pb95' ? "text-emerald-600" : "text-slate-900")} />
                </div>
                <h2 className="text-xl font-bold">Kalkulator {fuelType}</h2>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-600" />
                      <label className="text-sm font-semibold text-slate-600">Cena Brent (USD)</label>
                    </div>
                    <span className="text-lg font-bold text-blue-600">${brentInput}</span>
                  </div>
                  <input 
                    type="range" 
                    min="20" 
                    max="150" 
                    step="1"
                    value={brentInput}
                    onChange={(e) => setBrentInput(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>$20</span>
                    <span>$150</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-red-600" />
                      <label className="text-sm font-semibold text-slate-600">Kurs USD/PLN</label>
                    </div>
                    <span className="text-lg font-bold text-red-600">{usdPlnInput} zł</span>
                  </div>
                  <input 
                    type="range" 
                    min="3.00" 
                    max="5.50" 
                    step="0.01"
                    value={usdPlnInput}
                    onChange={(e) => setUsdPlnInput(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>3.00 zł</span>
                    <span>5.50 zł</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <label className="text-sm font-semibold text-slate-600">Akcyza (PLN/l)</label>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">{exciseInput.toFixed(2)} zł</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.00" 
                    max="2.50" 
                    step="0.01"
                    value={exciseInput}
                    onChange={(e) => setExciseInput(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>0.00 zł</span>
                    <span>2.50 zł</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                      <label className="text-sm font-semibold text-slate-600">Stawka VAT (%)</label>
                    </div>
                    <span className="text-lg font-bold text-purple-600">{vatInput}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="25" 
                    step="1"
                    value={vatInput}
                    onChange={(e) => setVatInput(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>0%</span>
                    <span>25%</span>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <div className="bg-slate-50 p-6 rounded-2xl text-center space-y-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">SZACOWANA CENA DETALICZNA</p>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className={cn(
                          "text-3xl font-black tracking-tighter",
                          fuelType === 'Pb95' ? "text-emerald-600" : "text-slate-900"
                        )}>
                          {calculatedPrice.toFixed(2)}
                        </span>
                        <span className="text-lg font-bold text-slate-400">PLN/l</span>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">AKTUALNA CENA DETALICZNA</p>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className={cn(
                          "text-3xl font-black tracking-tighter",
                          fuelType === 'Pb95' ? "text-emerald-600" : "text-slate-900"
                        )}>
                          {fuelType === 'Pb95' ? (realTimeData?.retailPb95 || '---') : (realTimeData?.retailON || '---')}
                        </span>
                        <span className="text-lg font-bold text-slate-400">PLN/l</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                Struktura ceny (%)
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-slate-600">Podatki i opłaty</span>
                    <span className="text-slate-900">{priceStructure.taxes.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full transition-all duration-500" 
                      style={{ width: `${priceStructure.taxes}%` }} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-slate-600">Koszt surowca</span>
                    <span className="text-slate-900">{priceStructure.raw.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                      style={{ width: `${priceStructure.raw}%` }} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-slate-600">Marże i rafineria</span>
                    <span className="text-slate-900">{priceStructure.margins.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-400 rounded-full transition-all duration-500" 
                      style={{ width: `${priceStructure.margins}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Zmienność cenowa (10 lat)</h2>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-10 h-4 rounded-sm border-2 border-emerald-500 bg-emerald-50" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Cena Pb95 (PLN/l)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-10 h-4 rounded-sm border-2 border-slate-900 bg-slate-100" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Cena ON (PLN/l)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-0 border-t-2 border-dashed border-blue-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Ropa Brent (USD/bbl)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-0 border-t-2 border-dotted border-red-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Kurs USD/PLN</span>
                  </div>
                </div>
              </div>

              <div className="h-[300px] sm:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={HISTORICAL_DATA} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPb95" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorON" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={{ stroke: '#e2e8f0' }} 
                      tickLine={true} 
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#475569' }}
                      dy={10}
                      minTickGap={30}
                      tickFormatter={(value) => value.split('-')[0]}
                    />
                    <YAxis 
                      yAxisId="left"
                      axisLine={{ stroke: '#e2e8f0' }} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 500, fill: '#64748b' }}
                      domain={[3.5, 8.5]}
                      width={40}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      axisLine={{ stroke: '#e2e8f0' }} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 500, fill: '#64748b' }}
                      domain={[10, 120]}
                      width={40}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '16px', 
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        padding: '12px'
                      }}
                      labelStyle={{ fontWeight: 700, marginBottom: '4px', color: '#1e293b' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 600, padding: '2px 0' }}
                      labelFormatter={(label) => {
                        const [year, month] = label.split('-');
                        const months: { [key: string]: string } = {
                          '01': 'Styczeń', '04': 'Kwiecień', '07': 'Lipiec', '10': 'Październik', '03': 'Marzec'
                        };
                        return `${months[month] || month} ${year}`;
                      }}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="pricePb95" 
                      name="Cena Pb95"
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPb95)" 
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="priceON" 
                      name="Cena ON"
                      stroke="#0f172a" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorON)" 
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#0f172a' }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="brent" 
                      name="Ropa Brent"
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="usdPln" 
                      name="Kurs USD/PLN"
                      stroke="#ef4444" 
                      strokeWidth={2}
                      strokeDasharray="2 2"
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 md:p-6 bg-white border border-slate-100 rounded-2xl transition-all hover:shadow-md hover:border-emerald-100 text-center">
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Najniższa cena (10 lat)</p>
                  <p className={cn(
                    "text-lg md:text-3xl font-bold transition-colors duration-300",
                    fuelType === 'Pb95' ? "text-emerald-600" : "text-slate-900"
                  )}>
                    {fuelType === 'Pb95' ? '3.80 zł' : '3.70 zł'}
                  </p>
                </div>
                <div className="p-4 md:p-6 bg-white border border-slate-100 rounded-2xl transition-all hover:shadow-md hover:border-emerald-100 text-center">
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Najwyższa cena (10 lat)</p>
                  <p className={cn(
                    "text-lg md:text-3xl font-bold transition-colors duration-300",
                    fuelType === 'Pb95' ? "text-emerald-600" : "text-slate-900"
                  )}>
                    {fuelType === 'Pb95' 
                      ? `${Math.max(7.95, realTimeData?.retailPb95 || 0).toFixed(2)} zł` 
                      : `${Math.max(8.08, realTimeData?.retailON || 0).toFixed(2)} zł`}
                  </p>
                </div>
                <div className="p-4 md:p-6 bg-white border border-slate-100 rounded-2xl transition-all hover:shadow-md hover:border-emerald-100 text-center">
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Średnia Cena Ropy Brent</p>
                  <p className="text-lg md:text-3xl font-bold text-blue-600">$72.50</p>
                </div>
                <div className="p-4 md:p-6 bg-white border border-slate-100 rounded-2xl transition-all hover:shadow-md hover:border-emerald-100 text-center">
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Średni Kurs USD/PLN</p>
                  <p className="text-lg md:text-3xl font-bold text-red-600">3.95 zł</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <InfoSection />

        {/* Footer */}
        <footer className="mt-16 pt-12 pb-8 border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 flex flex-col items-center text-center">
            <div className="space-y-2">
              <p className="text-xs text-slate-400 leading-relaxed">
                Aplikacja przygotowana przez Fundację Polskiego Rozwoju 🇵🇱. Dane mają charakter poglądowy i informacyjny.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rzeczywiste ceny na stacjach paliw mogą się różnić w zależności od lokalizacji i polityki cenowej operatorów.
              </p>
            </div>
            <img
              src="/logo-pro.png"
              alt="Logo PRO"
              className="h-80 w-auto mt-2 opacity-80 hover:opacity-100 transition-opacity"
              referrerPolicy="no-referrer"
            />            <a 
              href="https://fundacjapro.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-2 text-xs font-medium text-slate-400 hover:text-slate-500 transition-colors"
            >
              fundacjapro.org
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
