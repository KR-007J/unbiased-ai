
const SUPABASE_URL = "https://xyvzkfqtatwcpddbipcr.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5dnprZnF0YXR3Y3BkZGJpcGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjUyMzQsImV4cCI6MjA5MTc0MTIzNH0.qV4VuxYlUC0xm0fzU4TAm0APWTOzfQ22ygni9biTIxw";

async function testChat() {
  const url = `${SUPABASE_URL}/functions/v1/chat`;
  const payload = {
    messages: [
      { role: "user", content: "Hello, who are you?" }
    ]
  };

  console.log("Testing Chat Function...");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const status = res.status;
    const data = await res.json();
    console.log(`Status: ${status}`);
    console.log("Response Data:", JSON.stringify(data, null, 2));

    if (status === 200 && data.response) {
      console.log("SUCCESS: Chat function is working!");
    } else {
      console.log("FAILURE: Chat function returned an error.");
    }
  } catch (err) {
    console.error("Fetch Error:", err.message);
  }
}

testChat();
