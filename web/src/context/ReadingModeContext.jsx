import { createContext, useContext, useState, useEffect } from "react";

const ReadingModeContext = createContext(null);

export const useReadingMode = () => {
  const context = useContext(ReadingModeContext);
  if (!context) {
    throw new Error("useReadingMode must be used within ReadingModeProvider");
  }
  return context;
};

export const ReadingModeProvider = ({ children }) => {
  const [readingMode, setReadingMode] = useState(() => {
    const stored = localStorage.getItem("nataltruth_reading_mode");
    return stored === "true";
  });

  const [fontSize, setFontSize] = useState(() => {
    const stored = localStorage.getItem("nataltruth_font_size");
    return stored ? parseInt(stored) : 16;
  });

  useEffect(() => {
    localStorage.setItem("nataltruth_reading_mode", readingMode.toString());
    
    // Apply reading mode styles to root
    const root = document.documentElement;
    if (readingMode) {
      root.style.setProperty("--reading-line-height", "1.9");
      root.style.setProperty("--reading-letter-spacing", "0.02em");
    } else {
      root.style.setProperty("--reading-line-height", "1.7");
      root.style.setProperty("--reading-letter-spacing", "0.01em");
    }
  }, [readingMode]);

  useEffect(() => {
    localStorage.setItem("nataltruth_font_size", fontSize.toString());
    document.documentElement.style.setProperty("--base-font-size", `${fontSize}px`);
  }, [fontSize]);

  const toggleReadingMode = () => setReadingMode(prev => !prev);
  
  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 24));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12));
  const resetFontSize = () => setFontSize(16);

  return (
    <ReadingModeContext.Provider value={{ 
      readingMode, 
      toggleReadingMode, 
      fontSize, 
      increaseFontSize, 
      decreaseFontSize, 
      resetFontSize 
    }}>
      {children}
    </ReadingModeContext.Provider>
  );
};
