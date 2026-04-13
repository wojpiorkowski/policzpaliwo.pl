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
  ReferenceLine,
  BarChart,
  Bar,
  Cell
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
  HelpCircle,
  Store,
  PieChart
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
              <span><strong>Koszt Surowca (Ropa Brent):</strong> Podstawowy koszt ropy na rynkach światowych, przeliczany z USD na PLN.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              <span><strong>Marża Rafineryjna:</strong> Koszty przetworzenia ropy na gotowe paliwo oraz zysk rafinerii.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              <span><strong>Logistyka i Blending:</strong> Koszty transportu, magazynowania oraz dodawania biokomponentów.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              <span><strong>Akcyza:</strong> Podatek kwotowy, ustalany przez państwo na litr paliwa.</span>
            </li>
          </ul>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              <span><strong>Opłata Paliwowa:</strong> Środki zasilające Krajowy Fundusz Drogowy i Kolejowy.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              <span><strong>Opłata Zapasowa i Emisyjna:</strong> Opłaty na utrzymanie rezerw paliw oraz fundusze niskoemisyjne.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              <span><strong>Marża Detaliczna:</strong> Narzut stacji benzynowej, pokrywający koszty funkcjonowania stacji i zysk.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              <span><strong>Podatek VAT (23%):</strong> Doliczany na samym końcu od sumy wszystkich kosztów i marż.</span>
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
          Nasz kalkulator pozwala zrozumieć mechanizmy kształtujące ceny paliw w Polsce. Model bierze pod uwagę notowania ropy Brent, kurs dolara, marże na każdym etapie oraz dokładne obciążenia podatkowe i opłaty.
        </p>
        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          Obliczenia opierają się na oficjalnych notowaniach giełdowych oraz zaawansowanym 10-składnikowym modelu cenowym.
        </p>
      </div>
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl" />
    </div>
  </div>
);

const ModelAssumptionsModal = ({ isOpen, onClose, fuelType }: { isOpen: boolean, onClose: () => void, fuelType: 'Pb95' | 'ON' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-500" />
              Założenia modelu
            </h2>
            <div className="space-y-3 text-sm text-slate-600 max-h-[60vh] overflow-y-auto pr-3 -mr-3">
                <p>
                    Szacowana cena z modelu stanowi analityczny punkt odniesienia (benchmark). Odzwierciedla ona teoretyczny poziom cen paliw przy założeniu długoterminowej równowagi rynkowej oraz standardowej efektywności kosztowej w łańcuchu dostaw. Model opiera się na 10-letnich danych historycznych, poddanych korekcie o wskaźniki makroekonomiczne.
                </p>
                <p className="font-bold pt-2">
                    Kalkulacja opiera się na czterech filarach:
                </p>
                <ol className="list-decimal list-inside space-y-3 pl-2">
                    <li><strong>Baza surowcowa i przerób (Crack Spread):</strong> Fundamentem wyliczeń są bieżące notowania ropy Brent, do których doliczana jest historyczna marża rafineryjna na poziomie 10 USD/bbl. Wartość ta stanowi średnią z lat 2016–2025, obejmującą pełen cykl koniunkturalny. Zastosowanie dolara amerykańskiego (USD) jest zgodne z globalnym standardem wyceny produktów naftowych i izoluje marżę produkcyjną od lokalnych wahań kursowych.</li>
                    <li><strong>Urealnione koszty dystrybucji i marża detaliczna:</strong> Model przyjmuje koszty logistyki i blendingu na poziomie 0,40 PLN/l oraz marżę detaliczną stacji paliw w wysokości 0,22 PLN/l. Wartości te zostały wyznaczone na podstawie rocznych raportów branżowych POPiHN z dekady 2016–2025. W celu zachowania rzetelności ekonomicznej, historyczne marże z poszczególnych lat zostały zwaloryzowane wskaźnikiem skumulowanej inflacji konsumenckiej (CPI) według danych GUS. Dzięki temu benchmark uwzględnia współczesne, realne koszty operacyjne stacji (m.in. koszty pracy i nośników energii).</li>
                    <li><strong>Obciążenia fiskalne i pozafiskalne:</strong> Do urealnionej ceny bazowej doliczane są sztywne, kwotowe obciążenia narzucone przez państwo: podatek akcyzowy, opłata paliwowa, opłata zapasowa oraz opłata emisyjna. Ich stawki wynikają z aktualnie obowiązujących obwieszczeń Ministerstwa Finansów.</li>
                    <li><strong>Podatek od towarów i usług (VAT):</strong> Finalnym etapem kalkulacji jest aplikacja obowiązującej stawki podatku VAT (23%) do sumy wszystkich składowych netto, co pozwala uzyskać szacowaną cenę detaliczną brutto.</li>
                </ol>
                <p className="font-bold pt-2">Interpretacja wyników:</p>
                <p>Różnica między aktualną średnią ceną rynkową a wyznaczoną ceną szacunkową wskazuje poziom anomalii rynkowej – najczęściej wynikającej z absorpcji nadmiarowych marż (tzw. premii rynkowej) przez sektor naftowy.</p>
            </div>
            <button onClick={onClose} className={cn(
              "mt-6 w-full font-bold py-3 px-4 rounded-xl transition-colors",
              "text-white",
              fuelType === 'Pb95' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-800 hover:bg-slate-900"
            )}>
              Zamknij
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  const [brentInput, setBrentInput] = useState(72);
  const [usdPlnInput, setUsdPlnInput] = useState(4.00);
  const [refineryMarginInput, setRefineryMarginInput] = useState(10);
  const [logisticsInput, setLogisticsInput] = useState(0.4);
  const [exciseInput, setExciseInput] = useState(1.5);
  const [fuelFeeInput, setFuelFeeInput] = useState(0.21);
  const [reserveFeeInput, setReserveFeeInput] = useState(0.10);
  const [emissionFeeInput, setEmissionFeeInput] = useState(0.08);
  const [retailMarginInput, setRetailMarginInput] = useState(0.22);
  const [vatInput, setVatInput] = useState(23);
  
  const [fuelType, setFuelType] = useState<'Pb95' | 'ON'>('Pb95');
  const [realTimeData, setRealTimeData] = useState<{ brent: number, usdPln: number, retailPb95: number, retailON: number, timestamp?: string, sourceUrl?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCustomKey, setHasCustomKey] = useState<boolean | null>(null);
  const [isModelAssumptionsModalOpen, setIsModelAssumptionsModalOpen] = useState(false);

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

  const calculatePrice = (
    brent: number, 
    usdPln: number, 
    refineryMargin: number, 
    logistics: number, 
    excise: number, 
    fuelFee: number, 
    reserveFee: number, 
    emissionFee: number, 
    retailMargin: number, 
    vat: number
  ) => {
    const rawOilPricePlnL = (brent / 159) * usdPln;
    const refMarginPlnL = (refineryMargin / 159) * usdPln;
    const basePricePlnL = rawOilPricePlnL + refMarginPlnL;
    const sumWithoutRetailMargin = basePricePlnL + logistics + excise + fuelFee + reserveFee + emissionFee;
    const priceWithRetailMargin = sumWithoutRetailMargin + retailMargin;
    const finalGrossPrice = priceWithRetailMargin * (1 + vat / 100);
    return finalGrossPrice;
  };

  const calculatedPrice = useMemo(() => calculatePrice(
    brentInput, usdPlnInput, refineryMarginInput, logisticsInput,
    exciseInput, fuelFeeInput, reserveFeeInput, emissionFeeInput,
    retailMarginInput, vatInput
  ), [brentInput, usdPlnInput, refineryMarginInput, logisticsInput, exciseInput, fuelFeeInput, reserveFeeInput, emissionFeeInput, retailMarginInput, vatInput]);

  const baseCalculatedPrice = useMemo(() => {
    const defaultExcise = fuelType === 'Pb95' ? 1.50 : 1.16;
    const defaultFuelFee = fuelType === 'Pb95' ? 0.21 : 0.42;
    const defaultRefineryMargin = 10.0;
    const defaultLogistics = 0.40;
    const defaultReserveFee = 0.10;
    const defaultEmissionFee = 0.08;
    const defaultRetailMargin = 0.22;
    const defaultVat = 23;

    return calculatePrice(
      brentInput, usdPlnInput, defaultRefineryMargin, defaultLogistics,
      defaultExcise, defaultFuelFee, defaultReserveFee, defaultEmissionFee,
      defaultRetailMargin, defaultVat
    );
  }, [brentInput, usdPlnInput, fuelType]);

  const priceStructure = useMemo(() => {
    const rawOilPricePlnL = (brentInput / 159) * usdPlnInput;
    const refMarginPlnL = (refineryMarginInput / 159) * usdPlnInput;
    const basePricePlnL = rawOilPricePlnL + refMarginPlnL;
    
    const sumWithoutRetailMargin = basePricePlnL + logisticsInput + exciseInput + fuelFeeInput + reserveFeeInput + emissionFeeInput;
    
    const retailMarginAmount = retailMarginInput;
    const priceWithRetailMargin = sumWithoutRetailMargin + retailMarginAmount;
    
    const vatAmount = priceWithRetailMargin * (vatInput / 100);
    
    const taxesNet = exciseInput + fuelFeeInput + reserveFeeInput + emissionFeeInput;
    const totalTaxes = taxesNet + vatAmount;
    const marginsAndLogistics = refMarginPlnL + logisticsInput + retailMarginAmount;
    const totalGross = rawOilPricePlnL + marginsAndLogistics + totalTaxes;

    return {
      taxes: (totalTaxes / totalGross) * 100,
      raw: (rawOilPricePlnL / totalGross) * 100,
      margins: (marginsAndLogistics / totalGross) * 100
    };
  }, [brentInput, usdPlnInput, refineryMarginInput, logisticsInput, exciseInput, fuelFeeInput, reserveFeeInput, emissionFeeInput, retailMarginInput, vatInput]);

  const detailedPriceStructure = useMemo(() => {
    const rawOilPricePlnL = (brentInput / 159) * usdPlnInput;
    const refMarginPlnL = (refineryMarginInput / 159) * usdPlnInput;
    const basePricePlnL = rawOilPricePlnL + refMarginPlnL;
    
    const sumWithoutRetailMargin = basePricePlnL + logisticsInput + exciseInput + fuelFeeInput + reserveFeeInput + emissionFeeInput;
    
    const retailMarginAmount = retailMarginInput;
    const priceWithRetailMargin = sumWithoutRetailMargin + retailMarginAmount;
    
    const vatAmount = priceWithRetailMargin * (vatInput / 100);

    return [
      { name: 'Ropa Brent', value: Number(rawOilPricePlnL.toFixed(2)), fill: '#3b82f6' },
      { name: 'Marża Raf.', value: Number(refMarginPlnL.toFixed(2)), fill: '#f97316' },
      { name: 'Logistyka', value: Number(logisticsInput.toFixed(2)), fill: '#64748b' },
      { name: 'Akcyza', value: Number(exciseInput.toFixed(2)), fill: '#10b981' },
      { name: 'Opł. Paliwowa', value: Number(fuelFeeInput.toFixed(2)), fill: '#34d399' },
      { name: 'Opł. Zapasowa', value: Number(reserveFeeInput.toFixed(2)), fill: '#6ee7b7' },
      { name: 'Opł. Emisyjna', value: Number(emissionFeeInput.toFixed(2)), fill: '#a7f3d0' },
      { name: 'Marża Detal.', value: Number(retailMarginAmount.toFixed(2)), fill: '#a855f7' },
      { name: 'VAT', value: Number(vatAmount.toFixed(2)), fill: '#c084fc' }
    ];
  }, [brentInput, usdPlnInput, refineryMarginInput, logisticsInput, exciseInput, fuelFeeInput, reserveFeeInput, emissionFeeInput, retailMarginInput, vatInput]);

  const marketComparison = useMemo(() => {
    if (!realTimeData) return null;
    const retail = fuelType === 'Pb95' ? realTimeData.retailPb95 : realTimeData.retailON;
    const diffPercent = ((retail - baseCalculatedPrice) / baseCalculatedPrice) * 100;
    
    return {
      text: diffPercent > 0 
        ? `+${Math.abs(diffPercent).toFixed(1)}%` 
        : `-${Math.abs(diffPercent).toFixed(1)}%`,
      type: diffPercent > 0 ? 'danger' : 'success'
    };
  }, [realTimeData, fuelType, baseCalculatedPrice]);

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

  // Configuration of sliders for dynamic rendering
  const sliders = [
    { label: 'Ropa Brent', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50', accent: 'accent-blue-600', value: brentInput, setter: setBrentInput, min: 10, max: 200, step: 1, unit: 'USD/bbl', prefix: '$', suffix: '' },
    { label: 'Kurs USD/PLN', icon: DollarSign, color: 'text-red-600', bg: 'bg-red-50', accent: 'accent-red-600', value: usdPlnInput, setter: setUsdPlnInput, min: 3.0, max: 5.0, step: 0.01, unit: 'PLN', prefix: '', suffix: ' zł' },
    { label: 'Marża Rafineryjna', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50', accent: 'accent-orange-600', value: refineryMarginInput, setter: setRefineryMarginInput, min: 2, max: 50, step: 1, unit: 'USD/bbl', prefix: '$', suffix: '' },
    { label: 'Logistyka i Blending', icon: RefreshCw, color: 'text-slate-600', bg: 'bg-slate-100', accent: 'accent-slate-600', value: logisticsInput, setter: setLogisticsInput, min: 0.1, max: 0.8, step: 0.01, unit: 'PLN/l', prefix: '', suffix: ' zł' },
    { label: 'Akcyza', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50', accent: 'accent-emerald-600', value: exciseInput, setter: setExciseInput, min: 0.0, max: 3.0, step: 0.01, unit: 'PLN/l', prefix: '', suffix: ' zł' },
    { label: 'Opłata Paliwowa', icon: Fuel, color: 'text-emerald-600', bg: 'bg-emerald-50', accent: 'accent-emerald-600', value: fuelFeeInput, setter: setFuelFeeInput, min: 0.0, max: 0.3, step: 0.01, unit: 'PLN/l', prefix: '', suffix: ' zł' },
    { label: 'Opłata Zapasowa', icon: History, color: 'text-emerald-600', bg: 'bg-emerald-50', accent: 'accent-emerald-600', value: reserveFeeInput, setter: setReserveFeeInput, min: 0.00, max: 0.15, step: 0.01, unit: 'PLN/l', prefix: '', suffix: ' zł' },
    { label: 'Opłata Emisyjna', icon: AlertCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', accent: 'accent-emerald-600', value: emissionFeeInput, setter: setEmissionFeeInput, min: 0.00, max: 0.15, step: 0.01, unit: 'PLN/l', prefix: '', suffix: ' zł' },
    { label: 'Marża Detaliczna', icon: Store, color: 'text-purple-600', bg: 'bg-purple-50', accent: 'accent-purple-600', value: retailMarginInput, setter: setRetailMarginInput, min: 0.1, max: 0.5, step: 0.01, unit: 'PLN/l', prefix: '', suffix: ' zł' },
    { label: 'Stawka VAT', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50', accent: 'accent-purple-600', value: vatInput, setter: setVatInput, min: 0, max: 23, step: 1, unit: '%', prefix: '', suffix: '%' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-y-2 py-3 md:h-16">
          <div className="flex items-center gap-2 justify-start">
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
          <div className="w-full md:w-auto flex justify-center order-last md:order-none">
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
              <button 
                onClick={() => {
                  setFuelType('Pb95');
                  setExciseInput(1.50);
                  setFuelFeeInput(0.21);
                }}
                className={cn(
                  "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                  fuelType === 'Pb95' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Benzyna Pb95
              </button>
              <button 
                onClick={() => {
                  setFuelType('ON');
                  setExciseInput(1.16);
                  setFuelFeeInput(0.42);
                }}
                className={cn(
                  "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                  fuelType === 'ON' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Diesel ON
              </button>
          </div>
          </div>
          <a href="https://fundacjapro.org/" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity md:order-last">
            <img
              src="/logo-pro.png"
              alt="Logo Fundacji Polskiego Rozwoju"
              className="h-8 md:h-14 w-auto"
            />
          </a>
      </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Real-time Stats */}
        <div className="space-y-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-8 sm:p-10 rounded-[2rem] text-white shadow-2xl relative overflow-hidden",
              fuelType === 'Pb95' 
                ? "bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900" 
                : "bg-gradient-to-br from-slate-800 via-slate-900 to-black"
            )}
          >
            {/* Background decoration */}
            <div className="absolute -top-24 -right-16 text-white/5 rotate-12 pointer-events-none">
              <Fuel className="w-96 h-96" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-white/80 font-bold uppercase tracking-widest text-xs sm:text-sm">
                  Porównanie cen {fuelType}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-white/20">
                {/* Left side - Calculated */}
                <div className="flex flex-col md:pr-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-medium text-white/90">Szacowana cena z modelu</h3>                    
                    <button 
                      onClick={() => setIsModelAssumptionsModalOpen(true)}
                      className="ml-2 text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 py-1 px-3 rounded-lg transition-all duration-200 border border-white/20 hover:border-white/30"
                    >
                      Założenia modelu
                    </button>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl sm:text-7xl font-black tracking-tighter">
                      {baseCalculatedPrice.toFixed(2)}
                    </span>
                    <span className="text-2xl font-bold text-white/60">PLN/l</span>
                  </div>
                  <p className="mt-4 text-sm text-white/60 leading-relaxed max-w-sm">
                    Cena wyliczona na podstawie aktualnych notowań ropy i walut przy stałych, standardowych stawkach podatków i opłat.
                  </p>
                </div>
                
                {/* Right side - Real market */}
                <div className="flex flex-col pt-10 md:pt-0 md:pl-10">
                  <div className="flex flex-wrap items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Store className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-lg font-medium text-white/90">Aktualna cena na stacjach</h3>
                    </div>
                    {marketComparison && (
                      <div className={cn(
                        "px-4 py-1.5 rounded-full font-black uppercase tracking-wider border flex items-baseline gap-1.5 shadow-lg",
                        marketComparison.type === 'danger' 
                          ? "bg-red-500/30 text-red-400 border-red-500/50" 
                          : "bg-emerald-500/30 text-emerald-100 border-emerald-500/50"
                      )}>
                        <span className="text-xl sm:text-2xl">{marketComparison.text}</span>
                        <span className="text-xs opacity-80"></span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl sm:text-7xl font-black tracking-tighter">
                      {fuelType === 'Pb95' ? (realTimeData?.retailPb95 || '---') : (realTimeData?.retailON || '---')}
                    </span>
                    <span className="text-2xl font-bold text-white/60">PLN/l</span>
                  </div>
                  <p className="mt-4 text-sm text-white/60 leading-relaxed max-w-sm">
                    {realTimeData?.timestamp ? `Średnia z dnia: ${realTimeData.timestamp}. ` : 'Brak danych o średniej cenie detalicznej. '}
                    {realTimeData?.sourceUrl && (
                      <a href={realTimeData.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">
                        Źródło: autocentrum.pl
                      </a>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={cn("p-2 rounded-xl", fuelType === 'Pb95' ? "bg-emerald-50" : "bg-slate-100")}>
                  <TrendingUp className={cn("w-6 h-6", fuelType === 'Pb95' ? "text-emerald-600" : "text-slate-900")} />
                </div>
                <h2 className="text-xl font-bold">Aktualne czynniki rynkowe</h2>
              </div>
              <button 
                onClick={fetchRealTimeData}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 text-white rounded-2xl text-sm font-bold hover:shadow-md transition-all disabled:opacity-50",
                  fuelType === 'Pb95' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-slate-800"
                )}
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                <span className="hidden sm:inline">{isLoading ? 'Aktualizuję dane...' : 'Aktualizuj dane'}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x sm:divide-slate-100 gap-6 sm:gap-0">
              <div className="sm:pr-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-50">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Ropa Brent</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-blue-600">{realTimeData?.brent || '---'}</span>
                    <span className="text-sm font-medium text-slate-400">USD/bbl</span>
                  </div>
                </div>
              </div>
              <div className="sm:pl-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-red-50">
                  <DollarSign className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Kurs USD/PLN</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-red-600">{realTimeData?.usdPln || '---'}</span>
                    <span className="text-sm font-medium text-slate-400">PLN</span>
                  </div>
                </div>
              </div>
            </div>
            {realTimeData?.timestamp && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">Dane z dnia: {realTimeData.timestamp}</p>
              </div>
            )}
          </div>
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

        <div className="space-y-8">
          {/* Calculator Section */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className={cn("p-2 rounded-xl", fuelType === 'Pb95' ? "bg-emerald-50" : "bg-slate-100")}>
                  <Calculator className={cn("w-6 h-6", fuelType === 'Pb95' ? "text-emerald-600" : "text-slate-900")} />
                </div>
                <h2 className="text-xl font-bold">Kalkulator {fuelType}</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {[
                  {
                    title: "Rynek, Koszty i Marże",
                    items: [sliders[0], sliders[1], sliders[2], sliders[3], sliders[8]]
                  },
                  {
                    title: "Podatki i Opłaty państwowe",
                    items: [sliders[4], sliders[5], sliders[6], sliders[7], sliders[9]]
                  }
                ].map((group, gIdx) => (
                  <div key={gIdx} className="space-y-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">
                      {group.title}
                    </h3>
                    <div className="space-y-4">
                      {group.items.map((s, i) => (
                        <div key={i} className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2">
                              <s.icon className={cn("w-4 h-4", s.color)} />
                              <label className="text-sm font-semibold text-slate-600">{s.label} ({s.unit})</label>
                            </div>
                            <span className={cn("text-lg font-bold", s.color)}>
                              {s.prefix}{s.value.toFixed(s.step >= 1 ? 0 : 2)}{s.suffix}
                            </span>
                          </div>
                          <input 
                            type="range" 
                            min={s.min} 
                            max={s.max} 
                            step={s.step}
                            value={s.value}
                            onChange={(e) => s.setter(Number(e.target.value))}
                            className={cn("w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer", s.accent)}
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>{s.prefix}{s.min.toFixed(s.step >= 1 ? 0 : 2)}{s.suffix}</span>
                            <span>{s.prefix}{s.max.toFixed(s.step >= 1 ? 0 : 2)}{s.suffix}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-slate-100 mt-6">
                  <div className="bg-slate-50 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-evenly gap-6">
                    <div className="text-center w-full">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">SZACOWANA CENA DETALICZNA</p>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className={cn(
                          "text-5xl font-black tracking-tighter",
                          fuelType === 'Pb95' ? "text-emerald-600" : "text-slate-900"
                        )}>
                          {calculatedPrice.toFixed(2)}
                        </span>
                        <span className="text-xl font-bold text-slate-400">PLN/l</span>
                      </div>
                    </div>

                    <div className="hidden md:block w-px h-16 bg-slate-200/50" />
                    <div className="w-full h-px md:hidden bg-slate-200/50" />

                    <div className="text-center w-full">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">AKTUALNA CENA DETALICZNA</p>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className={cn(
                          "text-5xl font-black tracking-tighter",
                          fuelType === 'Pb95' ? "text-emerald-600" : "text-slate-900"
                        )}>
                          {fuelType === 'Pb95' ? (realTimeData?.retailPb95 || '---') : (realTimeData?.retailON || '---')}
                        </span>
                        <span className="text-xl font-bold text-slate-400">PLN/l</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className={cn("p-2 rounded-xl", fuelType === 'Pb95' ? "bg-emerald-50" : "bg-slate-100")}>
                  <PieChart className={cn("w-6 h-6", fuelType === 'Pb95' ? "text-emerald-600" : "text-slate-900")} />
                </div>
                <h2 className="text-xl font-bold">Składowe i struktura ceny</h2>
              </div>
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                  Szczegółowe składowe (PLN/l)
                </h3>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={detailedPriceStructure}
                      layout="vertical"
                      margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis 
                        type="number" 
                        axisLine={{ stroke: '#e2e8f0' }} 
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 500, fill: '#64748b' }}
                        tickFormatter={(value) => `${value} zł`}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={{ stroke: '#e2e8f0' }} 
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#475569' }}
                        width={90}
                      />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          borderRadius: '12px', 
                          border: '1px solid #f1f5f9',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          padding: '8px 12px'
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}
                        formatter={(value: number) => [`${value.toFixed(2)} PLN`, 'Kwota']}
                        labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      >
                        {detailedPriceStructure.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                  Podsumowanie struktury ceny
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
          </div>

          {/* Chart Section */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl", fuelType === 'Pb95' ? "bg-emerald-50" : "bg-slate-100")}>
                    <BarChart3 className={cn("w-6 h-6", fuelType === 'Pb95' ? "text-emerald-600" : "text-slate-900")} />
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
              className="h-40 w-auto mt-6 mb-2 opacity-80 hover:opacity-100 transition-opacity"
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

      <ModelAssumptionsModal isOpen={isModelAssumptionsModalOpen} onClose={() => setIsModelAssumptionsModalOpen(false)} fuelType={fuelType} />
    </div>
  );
}
