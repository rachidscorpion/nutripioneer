import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, AlertTriangle, CheckCircle, AlertCircle, ChefHat, ChevronDown, Plus, ScanBarcode, Utensils, ShoppingBasket } from 'lucide-react';
import { api } from '@/lib/api-client';
import styles from '@/styles/FoodCheckModal.module.css';
import { toast } from 'sonner';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import ProGate from '@/components/pro/ProGate';

interface FoodCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    conditions: string[];
    planId?: string;
    isPro?: boolean;
}

type SearchMode = 'Generic' | 'Brand';

export default function FoodCheckModal({ isOpen, onClose, conditions, planId, isPro = false }: FoodCheckModalProps) {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showRecipe, setShowRecipe] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [activeTab, setActiveTab] = useState<SearchMode>('Generic');
    const [suggestions, setSuggestions] = useState<any[]>([]);

    const handleDisplayResult = (res: any) => {
        setResult(res);
        setIsLoading(false);
        setIsScanning(false);
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setShowRecipe(false); // Reset recipe view on new search
        try {
            const res = await api.food.analyze(query, activeTab);
            // Handle response structure { data: { ... }, success: true }
            const responseData = res.data || res;
            const finalResult = responseData.data || responseData;
            setResult(finalResult);
        } catch (e) {
            toast.error('Search failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToPlan = async (type: 'breakfast' | 'lunch' | 'dinner') => {
        if (!planId || !result) return;
        setIsAdding(true);
        try {
            // Construct the data payload
            const mealData = {
                planId, // API might need planId in body or URL
                type,
                name: result.name || query,
                image: result.image,
                instructions: result.instructions,
                ingredients: result.ingredients,
                nutrition: result.nutrition,
                externalId: result.originalId,
                source: result.source,
            };

            await api.plans.addExternalMeal(mealData);
            toast.success(`Allocated for ${type}`);
            onClose();
        } catch (e) {
            console.error(e);
            toast.error("Failed to add meal");
        } finally {
            setIsAdding(false);
        }
    };

    const formatInstructions = (text: string) => {
        if (!text) return [];
        let cleanText = text.replace(/Step\s+\d+[:.]?/gi, '');
        const rawLines = cleanText.split(/\r?\n/);
        const steps: string[] = [];
        rawLines.forEach(line => {
            let trimmed = line.trim();
            if (!trimmed) return;
            trimmed = trimmed.replace(/^\d+[\).]\s*/, '');
            if (!trimmed) return;
            if (/^\d+$/.test(trimmed)) return;
            steps.push(trimmed);
        });
        if (steps.length <= 1 && text.length > 200) {
            return text.split('. ').filter(s => s.trim().length > 10).map(s => s.trim() + '.');
        }
        return steps;
    };

    return (
        <AnimatePresence>
            {isOpen && (

                <>
                    {/* Backdrop */}
                    <motion.div
                        className={styles.backdrop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal Wrapper */}
                    <motion.div
                        className={styles.modalWrapper}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", duration: 0.5 }}
                    >
                        <div className={styles.modalContent}>
                            <ProGate
                                isPro={isPro}
                                feature="On-Demand Food Analysis"
                                description="Check any food or scan barcodes for instant safety analysis"
                                benefits={[
                                    "Unlimited food searches",
                                    "Barcode scanning",
                                    "AI-powered conflict detection",
                                    "Add meals directly to your plan"
                                ]}
                                mode="overlay"
                                rootStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                            >

                                {/* Search Header */}
                                <div className={styles.header}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 className={styles.title}>On-Demand Check</h3>
                                        <button
                                            onClick={onClose}
                                            className={styles.closeButton}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    {/* Tabs */}
                                    <div className={styles.tabContainer}>
                                        <button
                                            onClick={() => { setActiveTab('Generic'); setSuggestions([]); }}
                                            className={`${styles.tabButton} ${activeTab === 'Generic' ? styles.tabButtonActive : ''}`}
                                        >
                                            <ShoppingBasket size={16} />
                                            General
                                        </button>
                                        <button
                                            onClick={() => { setActiveTab('Brand'); setSuggestions([]); }}
                                            className={`${styles.tabButton} ${activeTab === 'Brand' ? styles.tabButtonActive : ''}`}
                                        >
                                            <Utensils size={16} />
                                            Restaurants
                                        </button>
                                    </div>

                                    <div style={{ position: 'relative' }}>
                                        <form onSubmit={handleSearch} className={styles.searchForm}>
                                            <input
                                                type="text"
                                                placeholder={activeTab === 'Generic' ? "e.g. Apple, Chicken Breast" : "e.g. Chick-fil-A, Chipotle"}
                                                value={query}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setQuery(val);
                                                    // Trigger suggestion fetch
                                                    if (val.length > 2) {
                                                        // Simple debounce could happen here, but for now direct call
                                                        // Consider using a proper useDebounce hook in production
                                                        api.food.search(val, activeTab).then(res => {
                                                            setSuggestions(res.data?.data || []);
                                                        });
                                                    } else {
                                                        setSuggestions([]);
                                                    }
                                                }}
                                                className={styles.searchInput}
                                                autoFocus
                                            />
                                            <Search className={styles.searchIcon} size={20} />

                                            <button
                                                type="button"
                                                onClick={() => setIsScanning(!isScanning)}
                                                className={styles.scanTrigger}
                                                title="Scan Barcode"
                                            >
                                                <ScanBarcode size={20} />
                                            </button>

                                            <button
                                                type="submit"
                                                disabled={isLoading || !query}
                                                className={styles.checkButton}
                                            >
                                                {isLoading ? '...' : 'Check'}
                                            </button>
                                        </form>

                                        {/* Suggestions Dropdown */}
                                        {suggestions.length > 0 && !result && !isLoading && (
                                            <div className={styles.suggestionsDropdown}>
                                                {suggestions.map((item, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            setQuery(item.name);
                                                            setSuggestions([]);
                                                            handleSearch(undefined); // Trigger analysis
                                                        }}
                                                        className={styles.suggestionItem}
                                                    >
                                                        {item.image ? (
                                                            <img src={item.image} alt="" className={styles.suggestionImage} />
                                                        ) : (
                                                            <div className={styles.suggestionPlaceholder}>
                                                                {activeTab === 'Brand' ? <Utensils size={16} /> : <ShoppingBasket size={16} />}
                                                            </div>
                                                        )}
                                                        <div className={styles.suggestionContent}>
                                                            <div className={styles.suggestionName}>{item.name}</div>
                                                            {item.brand && <div className={styles.suggestionBrand}>{item.brand}</div>}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Scanner Area */}
                                <AnimatePresence>
                                    {isScanning && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className={styles.scannerWrapper}
                                            style={{ overflow: 'hidden', padding: '0 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                        >
                                            <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', position: 'relative', aspectRatio: '4/3', background: '#000' }}>
                                                {/* Scanner Component */}
                                                <BarcodeScanner
                                                    onResult={(result) => {
                                                        setIsScanning(false);
                                                        setIsLoading(true);
                                                        api.food.analyzeBarcode(result)
                                                            .then(res => {
                                                                // Handle response structure { data: { ... }, success: true }
                                                                const responseData = res.data || res;
                                                                const finalResult = responseData.data || responseData;
                                                                handleDisplayResult(finalResult);
                                                            })
                                                            .catch(e => {
                                                                console.error(e);
                                                                setIsLoading(false);
                                                                toast.error("Failed to analyze barcode");
                                                            });
                                                    }}
                                                />
                                                <div style={{
                                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                                    border: '2px solid rgba(255,255,255,0.5)', borderRadius: '12px',
                                                    pointerEvents: 'none',
                                                    zIndex: 10
                                                }} />
                                            </div>
                                            <button
                                                onClick={() => setIsScanning(false)}
                                                style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.9rem', textDecoration: 'underline' }}
                                            >
                                                Cancel Scan
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>



                                {/* Result Area */}
                                <div className={styles.resultArea} style={{ padding: result?.image ? '0' : '1.5rem' }}>
                                    {(!result || !result.nutrition) && !isLoading && !isScanning && (
                                        <div className={styles.emptyState} style={{ padding: '2rem' }}>
                                            <p>{result?.message || "Type a food or scan a barcode to check."}</p>
                                        </div>
                                    )}
                                    {isLoading && (
                                        <div className={styles.loadingState}>
                                            <div className={styles.spinner}></div>
                                            <p style={{ color: '#64748b', fontWeight: 500 }}>Analyzing metabolic impact...</p>
                                        </div>
                                    )}

                                    {result && result.source && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            {/* Image Header */}
                                            <div className={styles.modalImageWrapper}>
                                                {result.image ? (
                                                    <img
                                                        src={result.image}
                                                        alt={result.name || query}
                                                        className={styles.foodImage}
                                                    />
                                                ) : (
                                                    <div className={styles.imagePlaceholder}>
                                                        {activeTab === 'Brand' ? <Utensils size={48} /> : <ShoppingBasket size={48} />}
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ flex: 1, justifyContent: 'center', alignItems: "center" }}>
                                                <h3 style={{ display: 'flex', justifyContent: 'center', alignItems: "center" }}>{result.name}</h3>
                                            </div>

                                            <div style={{ padding: '1.5rem' }} className="space-y-6">
                                                {/* Status Card */}
                                                <div className={`${styles.statusCard} ${result.bioavailability ?
                                                    (result.bioavailability.color === 'Red' ? styles.statusAvoid :
                                                        result.bioavailability.color === 'Yellow' ? styles.statusCaution : styles.statusSafe)
                                                    : (result.status === 'Safe' ? styles.statusSafe : result.status === 'Caution' ? styles.statusCaution : styles.statusAvoid)
                                                    }`}>
                                                    <div className={styles.statusIconWrapper}>
                                                        {(!result.bioavailability && result.status === 'Safe') || (result.bioavailability?.color === 'Green') ? <CheckCircle size={48} className={styles.textSafe} /> : null}
                                                        {(!result.bioavailability && result.status === 'Caution') || (result.bioavailability?.color === 'Yellow') ? <AlertCircle size={48} className={styles.textCaution} /> : null}
                                                        {(!result.bioavailability && result.status === 'Avoid') || (result.bioavailability?.color === 'Red') ? <AlertTriangle size={48} className={styles.textAvoid} /> : null}
                                                    </div>

                                                    <h2 className={`${styles.statusTitle} ${result.bioavailability ?
                                                        (result.bioavailability.color === 'Red' ? styles.textAvoid :
                                                            result.bioavailability.color === 'Yellow' ? styles.textCaution : styles.textSafe)
                                                        : (result.status === 'Safe' ? styles.textSafe : result.status === 'Caution' ? styles.textCaution : styles.textAvoid)
                                                        }`}>
                                                        {result.bioavailability ? `Bioavailability: ${result.bioavailability.score}/100` : result.status}
                                                    </h2>

                                                    <p className={`${styles.statusReason} ${result.bioavailability ?
                                                        (result.bioavailability.color === 'Red' ? styles.textAvoid :
                                                            result.bioavailability.color === 'Yellow' ? styles.textCaution : styles.textSafe)
                                                        : (result.status === 'Safe' ? styles.textSafe : result.status === 'Caution' ? styles.textCaution : styles.textAvoid)
                                                        }`}>
                                                        {result.bioavailability ? result.bioavailability.reasoning : result.reason}
                                                    </p>
                                                </div>
                                                {/* Modifications */}
                                                {result.modification && (
                                                    <div className={styles.modifications}>
                                                        <h4 className={styles.modTitle}>How to make it safer</h4>
                                                        <p className={styles.modText}>
                                                            {result.modification}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Nutrition Mini-Grid */}
                                                <div className={styles.nutritionGrid}>
                                                    <div className={styles.nutritionItem}>
                                                        <div className={styles.nutritionLabel}>Cal</div>
                                                        <div className={styles.nutritionValue}>{result.nutrition.calories}</div>
                                                    </div>
                                                    <div className={styles.nutritionItem}>
                                                        <div className={styles.nutritionLabel}>Carb</div>
                                                        <div className={styles.nutritionValue}>{result.nutrition.carbs}g</div>
                                                    </div>
                                                    <div className={styles.nutritionItem}>
                                                        <div className={styles.nutritionLabel}>Prot</div>
                                                        <div className={styles.nutritionValue}>{result.nutrition.protein}g</div>
                                                    </div>
                                                    <div className={styles.nutritionItem}>
                                                        <div className={styles.nutritionLabel}>Fat</div>
                                                        <div className={styles.nutritionValue}>{result.nutrition.fat}g</div>
                                                    </div>
                                                    <div className={styles.nutritionItem}>
                                                        <div className={styles.nutritionLabel}>Total Sug</div>
                                                        <div className={styles.nutritionValue}>{(result.nutrition.addedSugar + result.nutrition.sugar)}g</div>
                                                    </div>
                                                </div>

                                                {/* Recipe / Instructions Button */}
                                                {result.mealDbInfo?.instructions && (
                                                    <>
                                                        <button
                                                            className={styles.viewRecipeBtn}
                                                            onClick={() => setShowRecipe(!showRecipe)}
                                                        >
                                                            <ChefHat size={18} />
                                                            {showRecipe ? 'Hide Instructions' : 'View Instructions'}
                                                            {showRecipe ? <ChevronDown size={16} style={{ transform: 'rotate(180deg)' }} /> : <ChevronDown size={16} />}
                                                        </button>

                                                        <AnimatePresence>
                                                            {showRecipe && (
                                                                <motion.div
                                                                    className={styles.instructionsArea}
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    style={{ overflow: 'hidden' }}
                                                                >
                                                                    {formatInstructions(result.mealDbInfo.instructions).map((step: string, idx: number) => (
                                                                        <div key={idx} className={styles.instructionStep}>
                                                                            <div className={styles.stepNumber}>
                                                                                {idx + 1}
                                                                            </div>
                                                                            <p className={styles.stepText}>{step}</p>
                                                                        </div>
                                                                    ))}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </>
                                                )}

                                                {/* Add To Plan Section */}
                                                {planId && (
                                                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                                                        <h4 style={{
                                                            fontSize: '0.75rem', fontWeight: 700,
                                                            color: '#64748b', textTransform: 'uppercase',
                                                            marginBottom: '0.75rem', letterSpacing: '0.05em'
                                                        }}>
                                                            Eat this for...
                                                        </h4>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                                            {(['breakfast', 'lunch', 'dinner'] as const).map((type) => (
                                                                <button
                                                                    key={type}
                                                                    onClick={() => handleAddToPlan(type)}
                                                                    disabled={isAdding}
                                                                    className={styles.addToPlanButton}
                                                                >
                                                                    {isAdding ? <div className={styles.spinner} style={{ width: 16, height: 16, borderTopColor: 'var(--foreground)', margin: 0 }} /> : <Plus size={16} />}
                                                                    {type}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </ProGate>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

const BarcodeScanner = ({ onResult }: { onResult: (result: string) => void }) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        const regionId = "reader";

        // Initialize scanner
        // We use verbose: false to reduce console noise
        const html5QrCode = new Html5Qrcode(regionId, false);
        scannerRef.current = html5QrCode;

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            formatsToSupport: [
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.QR_CODE
            ]
        };

        html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                if (mountedRef.current) {
                    onResult(decodedText);
                    // Stop scanning after success to prevent multiple triggers
                    html5QrCode.stop().catch(console.error);
                }
            },
            (errorMessage) => {
                // ignore
            }
        ).catch((err) => {
            console.error("Error starting scanner:", err);
            if (mountedRef.current) {
                toast.error("Could not start camera. Please ensure permissions are granted.");
            }
        });

        return () => {
            mountedRef.current = false;
            if (html5QrCode.isScanning) {
                html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
            } else {
                html5QrCode.clear();
            }
        };
    }, []);

    return (
        <div id="reader" style={{ width: '100%', height: '100%', overflow: 'hidden' }} />
    );
};
