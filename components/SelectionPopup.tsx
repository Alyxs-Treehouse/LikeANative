import React, { useEffect, useState, useRef } from 'react';
import { TargetLanguage, SystemLanguage } from '../types';
import { explainSelection } from '../services/geminiService';

interface SelectionPopupProps {
  selectionState: {
    text: string;
    context: string;
    top: number;
    left: number;
    visible: boolean;
  };
  targetLanguage: TargetLanguage;
  systemLanguage: SystemLanguage;
  originalInput: string;
  customApiKey?: string;
  onClose: () => void;
}

const UI_TEXT = {
  [SystemLanguage.English]: {
    label: "Selected Text",
    explainBtn: "Explain Nuance",
    analyzing: "Analyzing...",
    explanationLabel: "Explanation",
    error: "Sorry, I couldn't explain that right now."
  },
  [SystemLanguage.Chinese]: {
    label: "选中文本",
    explainBtn: "解释细微差别",
    analyzing: "分析中...",
    explanationLabel: "解释",
    error: "抱歉，暂时无法解释。"
  },
  [SystemLanguage.Spanish]: {
    label: "Texto seleccionado",
    explainBtn: "Explicar matiz",
    analyzing: "Analizando...",
    explanationLabel: "Explicación",
    error: "Lo siento, no puedo explicar eso ahora."
  },
  [SystemLanguage.Japanese]: {
    label: "選択されたテキスト",
    explainBtn: "ニュアンスを説明",
    analyzing: "分析中...",
    explanationLabel: "説明",
    error: "申し訳ありませんが、今は説明できません。"
  },
  [SystemLanguage.Korean]: {
    label: "선택된 텍스트",
    explainBtn: "뉘앙스 설명",
    analyzing: "분석 중...",
    explanationLabel: "설명",
    error: "죄송합니다. 지금은 설명할 수 없습니다."
  },
  [SystemLanguage.French]: {
    label: "Texte sélectionné",
    explainBtn: "Expliquer la nuance",
    analyzing: "Analyse...",
    explanationLabel: "Explication",
    error: "Désolé, je ne peux pas expliquer cela pour le moment."
  },
  [SystemLanguage.German]: {
    label: "Ausgewählter Text",
    explainBtn: "Nuance erklären",
    analyzing: "Analysieren...",
    explanationLabel: "Erklärung",
    error: "Entschuldigung, ich kann das gerade nicht erklären."
  }
};

export const SelectionPopup: React.FC<SelectionPopupProps> = ({ 
  selectionState, 
  targetLanguage, 
  systemLanguage, 
  originalInput, 
  customApiKey,
  onClose 
}) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const t = UI_TEXT[systemLanguage] || UI_TEXT[SystemLanguage.English];

  useEffect(() => {
    if (selectionState.visible && selectionState.text) {
      setExplanation(null); // Reset prev explanation
    }
  }, [selectionState.text, selectionState.visible]);

  // Close if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (selectionState.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectionState.visible, onClose]);

  const handleExplain = async () => {
    setLoading(true);
    try {
      const result = await explainSelection(
        selectionState.text, 
        selectionState.context, 
        targetLanguage, 
        originalInput,
        systemLanguage,
        customApiKey
      );
      setExplanation(result);
    } catch (e) {
      setExplanation(t.error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectionState.visible) return null;

  // Calculate position to center the popup and keep it on screen
  const popupWidth = 288; // Equivalent to w-72 (18rem)
  const windowWidth = window.innerWidth;
  const docWidth = document.documentElement.scrollWidth;
  
  // Calculate left position (centered relative to selection)
  // selectionState.left is viewport-relative. We add scrollX for absolute positioning.
  let leftPos = selectionState.left + window.scrollX - (popupWidth / 2);
  
  // Clamp to screen bounds (with 10px padding)
  const maxLeft = docWidth - popupWidth - 10;
  leftPos = Math.max(10, Math.min(leftPos, maxLeft));

  // Top position (below selection)
  const topPos = selectionState.top + window.scrollY + 10;

  return (
    <div
      ref={popupRef}
      className="absolute z-50 bg-white shadow-xl rounded-lg border border-gray-200 p-4 w-72 transition-all duration-200 animate-in fade-in zoom-in-95"
      style={{
        top: topPos,
        left: leftPos,
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          {t.label}
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <p className="text-sm font-medium text-gray-900 mb-3 bg-gray-50 p-2 rounded border border-gray-100 italic break-words">
        "{selectionState.text}"
      </p>

      {!explanation && !loading && (
        <button
          onClick={handleExplain}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t.explainBtn}
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center py-2 text-indigo-600">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {t.analyzing}
        </div>
      )}

      {explanation && (
        <div className="animate-in fade-in slide-in-from-top-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">{t.explanationLabel}</h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
};