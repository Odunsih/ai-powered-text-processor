chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "INIT_TRANSLATOR":
      // Initialize Chrome AI translator
      chrome.ml.translator
        .create()
        .then((model) => sendResponse({ success: true, model }))
        .catch((error) => sendResponse({ success: false, error }));
      break;

    case "DETECT_LANGUAGE":
      chrome.i18n.detectLanguage(message.text, (result) => {
        sendResponse(result);
      });
      return true; // Required for async response

    case "TRANSLATE_TEXT":
      chrome.ml.translator
        .translate({
          text: message.text,
          targetLanguage: message.targetLanguage,
        })
        .then((result) =>
          sendResponse({ success: true, translation: result.translation })
        )
        .catch((error) => sendResponse({ success: false, error }));
      break;
  }
  return true; // Required for async response
});
