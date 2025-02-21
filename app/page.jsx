'use client'
import React, { useState, useEffect } from "react";

const LANGUAGE_OPTIONS = {
  en: "English",
  pt: "Portuguese",
  es: "Spanish",
  ru: "Russian",
  tr: "Turkish",
  fr: "French"
};

const Page = () => {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]); // Replace displayedText with messages array
  const [detectedLanguage, setDetectedLanguage] = useState("Unknown");
  const [translatedText, setTranslatedText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [translator, setTranslator] = useState(null);

  useEffect(() => {
    const checkAISupport = async () => {
      // Check if running in extension context
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
        console.log("Running in web context - using fallback service");
        return;
      }
      
      try {
        const response = await chrome.runtime.sendMessage({ type: 'INIT_TRANSLATOR' });
        if (response.success) {
          setTranslator(response.model);
        }
      } catch (error) {
        console.error("Failed to initialize translator:", error);
      }
    };
    
    checkAISupport();
  }, []);

  const detectLanguage = async (text) => {
    if (!text) return "Unknown";
    
    try {
      // Check if chrome.i18n is available
      if (!chrome?.i18n) {
        console.error("Chrome i18n API not available");
        return "Unknown";
      }

      // Use Chrome's language detection API with proper error handling
      const result = await new Promise((resolve, reject) => {
        try {
          chrome.i18n.detectLanguage(text, (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(result);
            }
          });
        } catch (error) {
          reject(error);
        }
      });

      // Check if the result contains valid language data
      if (result?.languages?.length > 0) {
        const detectedLangs = result.languages
          .filter(lang => lang.language in LANGUAGE_OPTIONS) // Only consider supported languages
          .sort((a, b) => b.percentage - a.percentage);
        
        if (detectedLangs.length > 0) {
          return detectedLangs[0].language;
        }
      }
      
      return "Unknown";
    } catch (error) {
      console.error("Language detection failed:", error);
      return "Unknown";
    }
  };

  const translateText = async (text, targetLang) => {
    if (!text || !targetLang) return "";

    // Fallback simple translation (just append language code for demo)
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      return `[${targetLang}] ${text}`;
    }

    try {
      const result = await chrome.runtime.sendMessage({
        type: 'TRANSLATE_TEXT',
        text: text,
        targetLanguage: targetLang
      });
      return result.translation;
    } catch (error) {
      console.error("Translation failed:", error);
      return "";
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const detectedLang = await detectLanguage(inputText);
    const newMessage = {
      text: inputText,
      language: detectedLang,
      translation: "",
      showSummary: inputText.length > 150,
      summary: inputText.length > 150 ? inputText.substring(0, 150) + "..." : ""
    };

    setMessages(prev => [...prev, newMessage]);
    setDetectedLanguage(detectedLang);
    setInputText(""); // Clear input after sending
  };

  const handleTranslate = async (index) => {
    const message = messages[index];
    const translation = await translateText(message.text, selectedLanguage);
    
    setMessages(prev => prev.map((msg, i) => 
      i === index ? { ...msg, translation } : msg
    ));
    setTranslatedText(translation);
  };

  return (
    <>
      <header className="w-full p-5 text-xl font-semibold bg-white text-gray-500">
        <h1 className="cursor-pointer">Text Processor</h1>
      </header>

      <main className="flex justify-center p-5 mb-32"> {/* Added margin bottom for footer space */}
        <div className="bg-white p-5 text-lg rounded-lg md:w-3/4 sm:w-5/6 w-11/12">
          {messages.map((message, index) => (
            <div key={index} className="mb-8">
              <div className="bg-gray-100 p-3 my-3 rounded-lg">
                <p>{message.text}</p>
              </div>
              
              <div className="bg-gray-200 p-2 my-2 rounded-full w-40 text-center text-gray-600 text-sm">
                <h3>Detected: {message.language}</h3>
              </div>

              {message.showSummary && (
                <div className="w-11/12 bg-purple-100 my-2 p-2 rounded-lg">
                  <p>Summary: "{message.summary}"</p>
                </div>
              )}

              <div className="flex items-center gap-2 my-2">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(LANGUAGE_OPTIONS).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
                
                <button 
                  onClick={() => handleTranslate(index)} 
                  className="bg-green-100 p-2 rounded-full hover:bg-green-200"
                >
                  Translate
                </button>
              </div>

              {message.translation && (
                <div className="bg-green-100 my-2 p-2 rounded-lg">
                  <h3 className="font-medium">{LANGUAGE_OPTIONS[selectedLanguage]}</h3>
                  <p>Translated: {message.translation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <footer className="flex justify-center fixed bottom-0 w-full bg-white">
        <textarea 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="md:w-3/4 sm:w-5/6 w-11/12 rounded-xl border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm h-24 m-5 p-2 pr-16 text-lg"
          placeholder="Type text here..."
        ></textarea>
        <button 
          onClick={handleSend} 
          className="self-end p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm m-5">
          Send
        </button>
      </footer>
    </>
  );
};

export default Page;
