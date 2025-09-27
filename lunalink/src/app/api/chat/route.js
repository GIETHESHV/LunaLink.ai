import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message } = await req.json();

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set");
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Call Groq API
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192", // or any other Groq model
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: message },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errorText = await groqRes.text();
      console.error("Groq API error response:", groqRes.status, errorText);
      return NextResponse.json({ error: `API request failed: ${groqRes.status} ${groqRes.statusText}` }, { status: groqRes.status });
    }

    const data = await groqRes.json();
    console.log("Groq raw response:", data);

    if (data.error) {
      console.error("Groq API returned error:", data.error);
      return NextResponse.json({ error: `API error: ${data.error.message || 'Unknown error'}` }, { status: 500 });
    }

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      console.error("No reply in Groq response:", data);
      return NextResponse.json({ error: "No response generated" }, { status: 500 });
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Groq API error:", err);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
