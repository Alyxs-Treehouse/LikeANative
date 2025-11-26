import React, { useState, useCallback } from 'react';
import { TargetLanguage, SocialPlatform, AppState, SelectionState, SystemLanguage } from './types';
import { generateVariations } from './services/geminiService';
import { SelectionPopup } from './components/SelectionPopup';

const PLATFORMS_BY_LANG: Record<TargetLanguage, SocialPlatform[]> = {
  [TargetLanguage.English]: [SocialPlatform.Twitter, SocialPlatform.Reddit, SocialPlatform.Instagram, SocialPlatform.LinkedIn],
  [TargetLanguage.Chinese]: [SocialPlatform.RedNote, SocialPlatform.Weibo, SocialPlatform.WeChat],
  [TargetLanguage.Spanish]: [SocialPlatform.Twitter, SocialPlatform.Instagram, SocialPlatform.General],
  [TargetLanguage.Japanese]: [SocialPlatform.Twitter, SocialPlatform.Line, SocialPlatform.General],
  [TargetLanguage.Korean]: [SocialPlatform.KakaoTalk, SocialPlatform.Instagram, SocialPlatform.General],
  [TargetLanguage.French]: [SocialPlatform.Twitter, SocialPlatform.Instagram, SocialPlatform.General],
  [TargetLanguage.German]: [SocialPlatform.Twitter, SocialPlatform.Instagram, SocialPlatform.General],
};

const DEFAULT_PLATFORMS = [SocialPlatform.General, SocialPlatform.Twitter, SocialPlatform.Instagram];

const PREDEFINED_PERSONAS = [
  "Average Native Speaker",
  "Professional Expert",
  "Gen Z / Internet Native",
  "Witty & Sarcastic",
  "Warm & Empathetic",
  "Academic Professor",
  "Hype Influencer",
  "Poetic & Romantic"
];

const UI_STRINGS = {
  [SystemLanguage.English]: {
    subtitle: "Tailor your voice for any audience",
    targetLang: "Target Language",
    targetPlatform: "Target Platform",
    optional: "(Optional)",
    persona: "Persona / Vibe",
    personaPlaceholder: "Or describe a custom persona (e.g. '1920s detective')",
    inputLabel: "Your Input Text",
    inputPlaceholder: "Type anything here in any language...",
    generate: "Generate Variations",
    generating: "Translating & Styling...",
    results: "Results",
    highlightHint: "Highlight text to explain",
    emptyTitle: "Ready to transform your text",
    emptyDesc: "Enter your text on the left to get started.",
    generalPlatform: "General (No Specific Platform)",
    apiKeyLabel: "Your Google Gemini API Key",
    apiKeyPlaceholder: "Paste your API key here",
    apiKeyRequired: "API Key is required"
  },
  [SystemLanguage.Chinese]: {
    subtitle: "为您量身定制适合任何受众的声音",
    targetLang: "目标语言",
    targetPlatform: "目标平台",
    optional: "(可选)",
    persona: "人设 / 氛围",
    personaPlaceholder: "或描述自定义人设 (例如 '1920年代侦探')",
    inputLabel: "您的输入文本",
    inputPlaceholder: "在此输入任何语言的文本...",
    generate: "生成变体",
    generating: "翻译和风格化中...",
    results: "结果",
    highlightHint: "高亮文本以查看解释",
    emptyTitle: "准备转换您的文本",
    emptyDesc: "在左侧输入文本以开始。",
    generalPlatform: "通用 (无特定平台)",
    apiKeyLabel: "您的 Google Gemini API 密钥",
    apiKeyPlaceholder: "在此粘贴您的密钥",
    apiKeyRequired: "需要 API 密钥"
  },
  [SystemLanguage.Spanish]: {
    subtitle: "Adapta tu voz para cualquier audiencia",
    targetLang: "Idioma de destino",
    targetPlatform: "Plataforma de destino",
    optional: "(Opcional)",
    persona: "Persona / Estilo",
    personaPlaceholder: "O describe una persona personalizada",
    inputLabel: "Tu texto de entrada",
    inputPlaceholder: "Escribe algo aquí en cualquier idioma...",
    generate: "Generar variaciones",
    generating: "Traduciendo y estilizando...",
    results: "Resultados",
    highlightHint: "Resalta texto para ver explicación",
    emptyTitle: "Listo para transformar tu texto",
    emptyDesc: "Ingresa tu texto a la izquierda para comenzar.",
    generalPlatform: "General (Sin plataforma específica)",
    apiKeyLabel: "Tu clave API de Google Gemini",
    apiKeyPlaceholder: "Pega tu clave aquí",
    apiKeyRequired: "Se requiere clave API"
  },
  [SystemLanguage.Japanese]: {
    subtitle: "あらゆる視聴者に合わせて声を調整",
    targetLang: "ターゲット言語",
    targetPlatform: "ターゲットプラットフォーム",
    optional: "(任意)",
    persona: "ペルソナ / 雰囲気",
    personaPlaceholder: "またはカスタムペルソナを記述",
    inputLabel: "入力テキスト",
    inputPlaceholder: "ここに入力してください...",
    generate: "バリエーションを生成",
    generating: "翻訳とスタイル適用中...",
    results: "結果",
    highlightHint: "テキストをハイライトして説明を表示",
    emptyTitle: "テキストを変換する準備ができました",
    emptyDesc: "左側にテキストを入力して開始します。",
    generalPlatform: "一般 (特定のプラットフォームなし)",
    apiKeyLabel: "Google Gemini APIキー",
    apiKeyPlaceholder: "ここにキーを貼り付け",
    apiKeyRequired: "APIキーが必要です"
  },
  [SystemLanguage.Korean]: {
    subtitle: "모든 청중을 위한 맞춤형 목소리",
    targetLang: "대상 언어",
    targetPlatform: "대상 플랫폼",
    optional: "(선택 사항)",
    persona: "페르소나 / 분위기",
    personaPlaceholder: "또는 사용자 지정 페르소나 설명",
    inputLabel: "입력 텍스트",
    inputPlaceholder: "여기에 입력하세요...",
    generate: "변형 생성",
    generating: "번역 및 스타일 지정 중...",
    results: "결과",
    highlightHint: "설명을 보려면 텍스트 강조 표시",
    emptyTitle: "텍스트 변환 준비 완료",
    emptyDesc: "시작하려면 왼쪽에 텍스트를 입력하세요.",
    generalPlatform: "일반 (특정 플랫폼 없음)",
    apiKeyLabel: "Google Gemini API 키",
    apiKeyPlaceholder: "여기에 키 붙여넣기",
    apiKeyRequired: "API 키가 필요합니다"
  },
  [SystemLanguage.French]: {
    subtitle: "Adaptez votre voix à tout public",
    targetLang: "Langue cible",
    targetPlatform: "Plateforme cible",
    optional: "(Facultatif)",
    persona: "Personna / Ambiance",
    personaPlaceholder: "Ou décrivez un personna personnalisé",
    inputLabel: "Votre texte",
    inputPlaceholder: "Écrivez n'importe quoi ici...",
    generate: "Générer des variations",
    generating: "Traduction et stylisation...",
    results: "Résultats",
    highlightHint: "Surligner le texte pour expliquer",
    emptyTitle: "Prêt à transformer votre texte",
    emptyDesc: "Entrez votre texte à gauche pour commencer.",
    generalPlatform: "Général (Aucune plateforme spécifique)",
    apiKeyLabel: "Votre clé API Google Gemini",
    apiKeyPlaceholder: "Collez votre clé ici",
    apiKeyRequired: "Clé API requise"
  },
  [SystemLanguage.German]: {
    subtitle: "Passen Sie Ihre Stimme an jedes Publikum an",
    targetLang: "Zielsprache",
    targetPlatform: "Zielplattform",
    optional: "(Optional)",
    persona: "Persona / Stimmung",
    personaPlaceholder: "Oder beschreiben Sie eine benutzerdefinierte Persona",
    inputLabel: "Ihr Eingabetext",
    inputPlaceholder: "Geben Sie hier etwas ein...",
    generate: "Variationen generieren",
    generating: "Übersetzen & Stylen...",
    results: "Ergebnisse",
    highlightHint: "Text markieren für Erklärung",
    emptyTitle: "Bereit, Ihren Text zu verwandeln",
    emptyDesc: "Geben Sie links Ihren Text ein, um zu beginnen.",
    generalPlatform: "Allgemein (Keine bestimmte Plattform)",
    apiKeyLabel: "Ihr Google Gemini API-Schlüssel",
    apiKeyPlaceholder: "Schlüssel hier einfügen",
    apiKeyRequired: "API-Schlüssel erforderlich"
  }
};

const PERSONA_LABELS: Record<SystemLanguage, Record<string, string>> = {
  [SystemLanguage.English]: {
    "Average Native Speaker": "Average Native Speaker",
    "Professional Expert": "Professional Expert",
    "Gen Z / Internet Native": "Gen Z / Internet Native",
    "Witty & Sarcastic": "Witty & Sarcastic",
    "Warm & Empathetic": "Warm & Empathetic",
    "Academic Professor": "Academic Professor",
    "Hype Influencer": "Hype Influencer",
    "Poetic & Romantic": "Poetic & Romantic"
  },
  [SystemLanguage.Chinese]: {
    "Average Native Speaker": "普通母语者",
    "Professional Expert": "专业专家",
    "Gen Z / Internet Native": "Z世代 / 网络原住民",
    "Witty & Sarcastic": "机智 / 讽刺",
    "Warm & Empathetic": "温暖 / 共情",
    "Academic Professor": "学术教授",
    "Hype Influencer": "潮流网红",
    "Poetic & Romantic": "诗意 / 浪漫"
  },
  [SystemLanguage.Spanish]: {
    "Average Native Speaker": "Hablante nativo promedio",
    "Professional Expert": "Experto profesional",
    "Gen Z / Internet Native": "Gen Z / Nativo de internet",
    "Witty & Sarcastic": "Ingenioso y sarcástico",
    "Warm & Empathetic": "Cálido y empático",
    "Academic Professor": "Profesor académico",
    "Hype Influencer": "Influencer de moda",
    "Poetic & Romantic": "Poético y romántico"
  },
  [SystemLanguage.Japanese]: {
    "Average Native Speaker": "一般的なネイティブ",
    "Professional Expert": "専門家",
    "Gen Z / Internet Native": "Z世代 / ネット民",
    "Witty & Sarcastic": "機知に富んだ / 皮肉",
    "Warm & Empathetic": "温かい / 共感的",
    "Academic Professor": "大学教授",
    "Hype Influencer": "人気インフルエンサー",
    "Poetic & Romantic": "詩的 / ロマンチック"
  },
  [SystemLanguage.Korean]: {
    "Average Native Speaker": "일반 원어민",
    "Professional Expert": "전문가",
    "Gen Z / Internet Native": "Z세대 / 인터넷 네이티브",
    "Witty & Sarcastic": "재치 있고 비꼬는",
    "Warm & Empathetic": "따뜻하고 공감하는",
    "Academic Professor": "대학교수",
    "Hype Influencer": "인기 인플루언서",
    "Poetic & Romantic": "시적이고 낭만적인"
  },
  [SystemLanguage.French]: {
    "Average Native Speaker": "Locuteur natif moyen",
    "Professional Expert": "Expert professionnel",
    "Gen Z / Internet Native": "Gen Z / Natif d'Internet",
    "Witty & Sarcastic": "Spirituel et sarcastique",
    "Warm & Empathetic": "Chaleureux et empathique",
    "Academic Professor": "Professeur d'université",
    "Hype Influencer": "Influenceur tendance",
    "Poetic & Romantic": "Poétique et romantique"
  },
  [SystemLanguage.German]: {
    "Average Native Speaker": "Durchschnittlicher Muttersprachler",
    "Professional Expert": "Professioneller Experte",
    "Gen Z / Internet Native": "Gen Z / Internet-Native",
    "Witty & Sarcastic": "Witzig & Sarkastisch",
    "Warm & Empathetic": "Warm & Empathisch",
    "Academic Professor": "Akademischer Professor",
    "Hype Influencer": "Hype-Influencer",
    "Poetic & Romantic": "Poetisch & Romantisch"
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    input: '',
    targetLanguage: TargetLanguage.English,
    platform: SocialPlatform.General,
    persona: 'Average Native Speaker',
    systemLanguage: SystemLanguage.English,
    customApiKey: '',
    isLoading: false,
    results: [],
    error: null,
  });

  const [selection, setSelection] = useState<SelectionState>({
    text: '',
    context: '',
    top: 0,
    left: 0,
    visible: false,
  });

  const t = UI_STRINGS[state.systemLanguage] || UI_STRINGS[SystemLanguage.English];
  const personaMap = PERSONA_LABELS[state.systemLanguage] || PERSONA_LABELS[SystemLanguage.English];
  const availablePlatforms = PLATFORMS_BY_LANG[state.targetLanguage] || DEFAULT_PLATFORMS;

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as TargetLanguage;
    setState(prev => ({
      ...prev,
      targetLanguage: newLang,
      platform: PLATFORMS_BY_LANG[newLang]?.[0] || SocialPlatform.General,
    }));
  };

  const handleSystemLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(prev => ({
      ...prev,
      systemLanguage: e.target.value as SystemLanguage
    }));
  };

  const handleGenerate = async () => {
    if (!state.input.trim() || !state.customApiKey.trim()) return;

    setState(prev => ({ ...prev, isLoading: true, error: null, results: [] }));
    
    try {
      const results = await generateVariations(
        state.input,
        state.targetLanguage,
        state.platform,
        state.persona,
        state.customApiKey
      );
      setState(prev => ({ ...prev, results, isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, isLoading: false }));
    }
  };

  const handleTextSelection = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const winSelection = window.getSelection();
    if (!winSelection || winSelection.isCollapsed) {
       return; 
    }

    const text = winSelection.toString().trim();
    if (!text) return;

    let node = winSelection.anchorNode;
    if (node && node.nodeType === 3) {
      node = node.parentElement;
    }
    
    let target = node as HTMLElement;
    while (target && !target.dataset.resultId && target !== document.body) {
      target = target.parentElement as HTMLElement;
    }
    
    if (!target || !target.dataset.resultId) {
      return;
    }
    
    const context = target.dataset.content || "";
    const range = winSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelection({
      text,
      context,
      top: rect.bottom, 
      left: rect.left + (rect.width / 2), 
      visible: true,
    });
  }, []);

  const closeSelection = () => {
    setSelection(prev => ({ ...prev, visible: false }));
    window.getSelection()?.removeAllRanges();
  };

  const isApiKeyMissing = !state.customApiKey.trim();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              N
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              NativeFluency
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-sm text-slate-500">
              {t.subtitle}
            </div>
            
            {/* System Language Switcher */}
            <div className="relative">
              <select
                value={state.systemLanguage}
                onChange={handleSystemLanguageChange}
                className="appearance-none bg-slate-50 border border-slate-300 text-slate-600 text-xs font-medium py-1.5 pl-3 pr-7 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                {Object.values(SystemLanguage).map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="h-3 w-3 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input & Config */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
              
              {/* API Key Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex justify-between">
                  {t.apiKeyLabel}
                  <span className="text-red-500 text-xs font-normal bg-red-50 px-2 py-0.5 rounded border border-red-100">* {t.apiKeyRequired}</span>
                </label>
                <input
                  type="password"
                  value={state.customApiKey}
                  onChange={(e) => setState(prev => ({ ...prev, customApiKey: e.target.value }))}
                  placeholder={t.apiKeyPlaceholder}
                  className={`w-full bg-slate-50 border text-slate-700 py-2.5 px-4 rounded-xl focus:outline-none focus:bg-white focus:ring-2 transition-all placeholder-slate-400 text-sm font-mono
                    ${isApiKeyMissing 
                      ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-100' 
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'}`}
                  autoComplete="off"
                />
              </div>

              <div className="border-t border-slate-100 my-4"></div>

              {/* Language Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t.targetLang}
                </label>
                <div className="relative">
                  <select
                    value={state.targetLanguage}
                    onChange={handleLanguageChange}
                    className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  >
                    {Object.values(TargetLanguage).map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* Platform Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t.targetPlatform} <span className="text-slate-400 font-normal">{t.optional}</span>
                </label>
                <div className="relative">
                  <select
                    value={state.platform}
                    onChange={(e) => setState(prev => ({ ...prev, platform: e.target.value as SocialPlatform }))}
                    className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  >
                     <option value={SocialPlatform.General}>{t.generalPlatform}</option>
                    {availablePlatforms.filter(p => p !== SocialPlatform.General).map((plat) => (
                      <option key={plat} value={plat}>{plat}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* Persona Input with Quick Select */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t.persona}
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PREDEFINED_PERSONAS.map(p => {
                    // Use a safe fallback if the personaMap doesn't have the key
                    const defaultPersonaMap = PERSONA_LABELS[SystemLanguage.English];
                    const label = (personaMap && personaMap[p]) ? personaMap[p] : (defaultPersonaMap[p] || p);
                    
                    // Check if current persona matches either the ID (p) or the localized label
                    const isSelected = state.persona === p || state.persona === label;
                    
                    return (
                      <button
                        key={p}
                        onClick={() => setState(prev => ({ ...prev, persona: label }))}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200
                          ${isSelected 
                            ? 'bg-indigo-100 border-indigo-200 text-indigo-700 shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/50'
                          }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={state.persona}
                  onChange={(e) => setState(prev => ({ ...prev, persona: e.target.value }))}
                  placeholder={t.personaPlaceholder}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-700 py-3 px-4 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-slate-400"
                />
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t.inputLabel}
                </label>
                <textarea
                  value={state.input}
                  onChange={(e) => setState(prev => ({ ...prev, input: e.target.value }))}
                  placeholder={t.inputPlaceholder}
                  className="w-full h-40 bg-slate-50 border border-slate-300 text-slate-700 py-3 px-4 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none placeholder-slate-400"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={state.isLoading || !state.input.trim() || isApiKeyMissing}
                className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-md transition-all transform flex justify-center items-center gap-2
                  ${state.isLoading || !state.input.trim() || isApiKeyMissing
                    ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-lg hover:shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98]'}`}
                title={isApiKeyMissing ? t.apiKeyRequired : ""}
              >
                {state.isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.generating}
                  </>
                ) : (
                  t.generate
                )}
              </button>

              {state.error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
                  {state.error}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            <div className="flex flex-col h-full">
               <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">{t.results}</h2>
                {state.results.length > 0 && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    {t.highlightHint}
                  </span>
                )}
               </div>

               {state.results.length === 0 && !state.isLoading && (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300 p-12 min-h-[400px]">
                   <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                   </svg>
                   <p className="text-lg font-medium">{t.emptyTitle}</p>
                   <p className="text-sm">{t.emptyDesc}</p>
                 </div>
               )}

               <div className="space-y-6" onMouseUp={handleTextSelection}>
                 {state.results.map((result) => (
                   <div 
                    key={result.id} 
                    className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
                    data-result-id={result.id}
                    data-content={result.content}
                   >
                     <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                       <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                         {result.tone}
                       </span>
                       <button 
                        onClick={() => navigator.clipboard.writeText(result.content)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Copy to clipboard"
                       >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                         </svg>
                       </button>
                     </div>
                     <div className="p-6 text-slate-800 text-lg leading-relaxed whitespace-pre-wrap selection:bg-indigo-100 selection:text-indigo-900 cursor-text">
                       {result.content}
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Floating Explanation Popup */}
      <SelectionPopup 
        selectionState={selection} 
        targetLanguage={state.targetLanguage} 
        systemLanguage={state.systemLanguage}
        originalInput={state.input} 
        customApiKey={state.customApiKey}
        onClose={closeSelection} 
      />

    </div>
  );
};

export default App;