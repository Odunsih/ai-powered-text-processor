chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "DETECT_LANGUAGE") {
    chrome.i18n.detectLanguage(request.text, (result) => {
      sendResponse(result);
    });
    return true;
  }
});
