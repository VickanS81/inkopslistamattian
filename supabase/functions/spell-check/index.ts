import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { word } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Du är en svensk rättstavningsassistent för matvaror och livsmedel. 
Analysera ordet som användaren skriver och avgör:
1. Om det är felstavat, ge det korrekta svenska ordet
2. Om det är korrekt stavat, returnera null för correctedWord

Du måste ALLTID returnera ett JSON-objekt med exakt detta format:
{
  "isMisspelled": true/false,
  "correctedWord": "rättstavat ord" eller null,
  "category": "vegetables" | "dairy" | "meat" | "fish" | "pantry" | "spices" | "frozen" | "bakery" | "drinks" | "other"
}

Kategorier:
- vegetables: Frukt och grönsaker (äpplen, bananer, tomater, sallad, potatis, lök, etc.)
- dairy: Mejeri (mjölk, ost, smör, yoghurt, grädde, etc.)
- meat: Kött (nötkött, fläsk, kyckling, korv, bacon, etc.)
- fish: Fisk och skaldjur (lax, torsk, räkor, etc.)
- pantry: Skafferi (pasta, ris, mjöl, socker, olja, konserver, etc.)
- spices: Kryddor (salt, peppar, oregano, basilika, etc.)
- frozen: Fryst (glass, frysta grönsaker, frysta bär, etc.)
- bakery: Bröd och bageri (bröd, bullar, kakor, etc.)
- drinks: Drycker (juice, läsk, vatten, kaffe, te, etc.)
- other: Övrigt (städprodukter, hygien, etc.)

Var generös med att acceptera varianter och dialektala skillnader som korrekta. 
Fokusera bara på uppenbara stavfel.`
          },
          {
            role: "user",
            content: word
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "spell_check_result",
              description: "Return the spell check result for a Swedish food item",
              parameters: {
                type: "object",
                properties: {
                  isMisspelled: {
                    type: "boolean",
                    description: "Whether the word is misspelled"
                  },
                  correctedWord: {
                    type: "string",
                    description: "The corrected spelling, or null if correctly spelled",
                    nullable: true
                  },
                  category: {
                    type: "string",
                    enum: ["vegetables", "dairy", "meat", "fish", "pantry", "spices", "frozen", "bakery", "drinks", "other"],
                    description: "The category the item belongs to"
                  }
                },
                required: ["isMisspelled", "category"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "spell_check_result" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback if no tool call
    return new Response(JSON.stringify({ 
      isMisspelled: false, 
      correctedWord: null, 
      category: "other" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Spell check error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      isMisspelled: false,
      correctedWord: null,
      category: "other"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
