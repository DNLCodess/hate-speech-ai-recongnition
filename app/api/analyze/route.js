import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const HF_TOKEN = process.env.NEXT_PUBLIC_HF_TOKEN;

    const { text } = await request.json();

    // Validation
    if (!text || typeof text !== "string") {
      console.error("❌ Validation failed: Invalid text parameter");
      console.error("   - text type:", typeof text);
      console.error("   - text value:", text);
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      console.error("❌ Validation failed: Text too long");
      console.error("   - length:", text.length);
      console.error("   - max allowed:", 5000);
      return NextResponse.json(
        { error: "Text exceeds maximum length of 5000 characters" },
        { status: 400 }
      );
    }

    console.log("✅ Validation passed");

    // Get Hugging Face API token

    const model = "ProsusAI/finbert";
    console.log("🤖 Using model:", model);

    const apiUrl = `https://router.huggingface.co/hf-inference/models/${model}`;
    console.log("🌐 API URL:", apiUrl);

    // Prepare request payload
    const payload = {
      inputs: text,
      options: {
        wait_for_model: true,
      },
    };
    console.log("📦 Request payload:", JSON.stringify(payload, null, 2));

    // Call Hugging Face API
    console.log("📤 Sending request to Hugging Face...");
    const startTime = performance.now();

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const endTime = performance.now();
    console.log(
      `⏱️ Hugging Face API responded in ${(endTime - startTime).toFixed(2)}ms`
    );
    console.log("📡 Response status:", response.status);
    console.log("📡 Response status text:", response.statusText);
    console.log("📡 Response OK:", response.ok);

    // Log response headers
    console.log("📋 Response headers:");
    response.headers.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ Hugging Face API error:");
      console.error("   - Status:", response.status);
      console.error("   - Status text:", response.statusText);
      console.error("   - Error data:", errorData);

      // Specific error messages for different status codes
      if (response.status === 503) {
        console.warn("⚠️ Model is loading, user should retry");
        return NextResponse.json(
          { error: "Model is loading. Please try again in a moment." },
          { status: 503 }
        );
      }

      if (response.status === 410) {
        console.error("❌ Model is gone/unavailable (410)");
        return NextResponse.json(
          {
            error:
              "This model is no longer available. Please update the model name in the API route.",
            details:
              'Edit app/api/analyze/route.js and try: "cardiffnlp/twitter-roberta-base-hate-latest"',
          },
          { status: 410 }
        );
      }

      if (response.status === 401 || response.status === 403) {
        console.error("❌ Authentication error - check your HF_TOKEN");
        return NextResponse.json(
          {
            error:
              "Authentication failed. Please check your Hugging Face API token.",
          },
          { status: response.status }
        );
      }

      return NextResponse.json(
        {
          error: `API error (${response.status}): ${response.statusText}`,
          details: errorData,
        },
        { status: response.status }
      );
    }

    console.log("📥 Parsing response data...");
    const data = await response.json();
    console.log("📊 Raw response data:", JSON.stringify(data, null, 2));
    console.log("📊 Data type:", Array.isArray(data) ? "Array" : typeof data);
    console.log("📊 Data length:", data?.length || 0);

    // Handle both nested array [[...]] and flat array [...] responses
    let results = data;

    // If data is nested array, flatten it
    if (Array.isArray(data) && Array.isArray(data[0])) {
      console.log("🔄 Detected nested array, flattening...");
      results = data[0];
    }

    console.log("📊 Flattened results:", results);
    console.log("📊 Number of results:", results?.length || 0);

    // Multiply scores by 100 for percentage display
    const resultsWithPercentages = results.map((item) => ({
      ...item,
      score: item.score * 100,
    }));
    console.log("💯 Scores converted to percentages");

    // Sort results by score (now in percentage)
    const sortedResults = [...resultsWithPercentages].sort(
      (a, b) => b.score - a.score
    );
    console.log("🔄 Results sorted by score (descending)");
    console.log("🏆 Top result:", sortedResults[0]);

    const responsePayload = {
      results: sortedResults,
      model: model,
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Success! Sending response to client");
    console.log(
      "📤 Response payload:",
      JSON.stringify(responsePayload, null, 2)
    );
    console.log("=== API ROUTE END ===\n");

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("\n❌❌❌ CRITICAL ERROR IN API ROUTE ❌❌❌");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    if (error.cause) {
      console.error("Error cause:", error.cause);
    }

    console.error("=== API ROUTE END WITH ERROR ===\n");

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
