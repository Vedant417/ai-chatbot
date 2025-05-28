const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessage = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = fileUploadWrapper.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

// This is the API key for generating the messages I have used gemini ai for developers
const API_KEY = "AIzaSyBS6a7CyMd0HU7i5jL6n-EsJp5EUGDxCGY";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// This is the API key for generating the Weather I have used WeatherAPI
const WEATHER_API_KEY = "6abddc9e63684a52885171816252605";

// This is the API key for generating the Time I have used TimeZoneDB
const TIMEZONE_API_KEY = "NRCSESQ8DPV8";
// This is the API key for generating the Time I have used Opencage data for other countries time
const OPENCAGE_API_KEY = "9b7d6ba94d49408e8e351f2c3eeb1d97";

const GNEWS_API_KEY = "bce7f8325636958d225a1af493bd0460";
const fetchNews = async (query = "latest") => {
  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=5&apikey=${GNEWS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.articles || data.articles.length === 0) {
      return "Sorry, I couldn't find any news at the moment.";
    }

    const newsList = data.articles
      .map((article, i) => `${i + 1}. <a href="${article.url}" target="_blank">${article.title}</a>`)
      .join("<br>");

    return `📰 Here are the top news headlines:<br>${newsList}`;
  } catch (error) {
    console.error("News Error:", error);
    return "Something went wrong while fetching the news.";
  }
};

const fetchWeather = async (city = "Delhi") => {
  const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}&aqi=no`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data || !data.current) return "Sorry, I couldn't get the weather info.";

    const { temp_c, condition, humidity, wind_kph } = data.current;
    return `🌤️ Weather in ${data.location.name}, ${data.location.country}:
    • Condition: ${condition.text}
    • Temperature: ${temp_c}°C
    • Humidity: ${humidity}%
    • Wind: ${wind_kph} km/h`;
  } catch (err) {
    console.error("Weather Error:", err);
    return "Failed to fetch weather.";
  }
};

const fetchTime = async (city = "Delhi") => {
  try {
    const geoUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${OPENCAGE_API_KEY}`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    console.log("📍 Geocode Data:", geoData); //

    if (!geoData.results || geoData.results.length === 0) {
      return "Couldn't find location.";
    }

    const { lat, lng } = geoData.results[0].geometry;

    const timeUrl = `https://api.timezonedb.com/v2.1/get-time-zone?key=${TIMEZONE_API_KEY}&format=json&by=position&lat=${lat}&lng=${lng}`;
    const timeRes = await fetch(timeUrl);
    const timeData = await timeRes.json();
    console.log("⏰ Timezone Data:", timeData); // 

    if (timeData.status !== "OK") {
      return `Failed to get time zone: ${timeData.message}`;
    }

    const localTime = new Date(timeData.formatted).toLocaleTimeString();
    return `🕒 Current time in ${city} is ${localTime}`;
  } catch (err) {
    console.error("Time Fetch Error:", err); //
    return "Error fetching time.";
  }
};

// Initialize user message and file data
const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null,
  },
};

// This will Store chat history based on the previous input message
const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;
// Create message element with dynamic classes and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// By the help of API key this will Generate responses
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");

  if (!userData.message || typeof userData.message !== "string") {
    messageElement.innerText = "Please enter a valid message.";
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    return;
  }

  const lowerMsg = userData.message.toLowerCase();

  try {
    // This is the default bot name
    if (
      lowerMsg.includes("your name") ||
      lowerMsg.includes("what's your name") ||
      lowerMsg.includes("who are you")
    ) {
      const botNameResponse = "My name is Novachat, and I was built by Vedant.";
      messageElement.innerText = botNameResponse;
      chatHistory.push({
        role: "model",
        parts: [{ text: botNameResponse }],
      });
      incomingMessageDiv.classList.remove("thinking");
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
      return;
    }

    // This is the news section 
    if (
      lowerMsg.includes("news") ||
      lowerMsg.includes("headlines") ||
      lowerMsg.includes("latest news")
    ) {
      const topicMatch = lowerMsg.match(/(technology|sports|business|health|entertainment)/);
      const topic = topicMatch ? topicMatch[0] : "latest";
      const newsResponse = await fetchNews(topic);
      messageElement.innerHTML = newsResponse;
      incomingMessageDiv.classList.remove("thinking");
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
      return;
    }

    // This is Weather section
    if (lowerMsg.includes("weather")) {
    // This will Try to extract a city from the user's message for e.g What's the Weather in Singapore?
    const match = lowerMsg.match(/in\s+([a-z\s]+)/i);
    const city = match ? match[1].trim() : "Delhi"; // Default to Delhi if no city found

    const weatherResponse = await fetchWeather(city);
    messageElement.innerHTML = weatherResponse;
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    return;
    }

    // This is Time Section
    if (lowerMsg.includes("time")) {
  // Try to extract city from message like: "What's the time in London?"
  const match = lowerMsg.match(/time\s(in\s)?([a-z\s]+)/i);
  const city = match ? match[2].trim() : "Delhi"; // Default to Delhi
  const timeResponse = await fetchTime(city);
  messageElement.innerHTML = timeResponse;
  incomingMessageDiv.classList.remove("thinking");
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  return;
    }

    // This is Gemini AI
    chatHistory.push({
      role: "user",
      parts: [{ text: userData.message }, ...(userData.file.data ? [{ inline_data: userData.file }] : [])],
    });

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
    };

    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error?.message || "Gemini API error");

    const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
    messageElement.innerText = apiResponseText;

    chatHistory.push({
      role: "model",
      parts: [{ text: apiResponseText }],
    });
  } catch (error) {
    console.error("Bot Error:", error);
    messageElement.innerText = "Something went wrong: " + error.message;
    messageElement.style.color = "#ff0000";
  } finally {
    userData.file = {};
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }
};

// This will handle outgoing user messages
const handleOutgoingMessage = (e) => {
  e.preventDefault();
  userData.message = messageInput.value.trim();
  messageInput.value = "";
  messageInput.dispatchEvent(new Event("input"));
  fileUploadWrapper.classList.remove("file-uploaded");
  // This will create and display user message
  const messageContent = `<div class="message-text"></div>
                          ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />` : ""}`;
  const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
  outgoingMessageDiv.querySelector(".message-text").innerText = userData.message;
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  // This is the section for bot thinking indicator after a delay more like of loading section
  setTimeout(() => {
    const messageContent = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
            <path
              d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"/></svg>
          <div class="message-text">
            <div class="thinking-indicator">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>`;
    const incomingMessageDiv = createMessageElement(messageContent, "bot-message", "thinking");
    chatBody.appendChild(incomingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(incomingMessageDiv);
  }, 600);
};

// Adjust input field height dynamically
messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;
  document.querySelector(".chat-form").style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

// By this we can send text by pressing enter key on keyboard 
messageInput.addEventListener("keydown", (e) => {
  const userMessage = e.target.value.trim();
  if (e.key === "Enter" && !e.shiftKey && userMessage && window.innerWidth > 768) {
    handleOutgoingMessage(e);
  }
});

// This handle file preview and give the output
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    fileInput.value = "";
    fileUploadWrapper.querySelector("img").src = e.target.result;
    fileUploadWrapper.classList.add("file-uploaded");
    const base64String = e.target.result.split(",")[1];
    // Store file data in userData
    userData.file = {
      data: base64String,
      mime_type: file.type,
    };
  };
  reader.readAsDataURL(file);
});

// This is the cancel button for file upload
fileCancelButton.addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("file-uploaded");
});

// This initialize emoji picker and handle emoji selection
const picker = new EmojiMart.Picker({
  theme: "light",
  skinTonePosition: "none",
  previewPosition: "none",
  onEmojiSelect: (emoji) => {
    const { selectionStart: start, selectionEnd: end } = messageInput;
    messageInput.setRangeText(emoji.native, start, end, "end");
    messageInput.focus();
  },
  onClickOutside: (e) => {
    if (e.target.id === "emoji-picker") {
      document.body.classList.toggle("show-emoji-picker");
    } else {
      document.body.classList.remove("show-emoji-picker");
    }
  },
});

document.querySelector(".chat-form").appendChild(picker);
sendMessage.addEventListener("click", (e) => handleOutgoingMessage(e));
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));