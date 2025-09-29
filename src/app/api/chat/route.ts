import { NextRequest, NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, attachments, conversationHistory = [] } = await request.json();

    if (!process.env.MISTRAL_API_KEY) {
      throw new Error("MISTRAL_API_KEY n'est pas configurée");
    }

    // Préparer les messages pour Mistral
    const messages = [
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // Construire le message utilisateur avec images si présentes
    let userContent = message;
    
    if (attachments && attachments.length > 0) {
      // Pour Mistral, on décrit les images dans le prompt
      // Note: Mistral AI ne supporte pas encore nativement les images comme GPT-4V
      // On peut soit convertir en base64 soit décrire l'image
      const imageDescriptions = attachments
        .map((att: any) => `[Image jointe: ${att.name}]`)
        .join(" ");
      userContent = `${message} ${imageDescriptions}`;
    }

    messages.push({
      role: "user",
      content: userContent,
    });

    // Créer un stream pour la réponse
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Appel à Mistral AI avec streaming
          const mistralStream = await mistral.chat.stream({
            model: "mistral-large-latest",
            messages: messages as any,
            maxTokens: 10000,
            temperature: 0.7,
          });

          let fullResponse = "";
          
          for await (const chunk of mistralStream) {
            const content = chunk.data?.choices?.[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              const data = JSON.stringify({ content });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Signaler la fin du stream
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Erreur dans le stream Mistral:", error);
          
          // En cas d'erreur, envoyer un message d'erreur
          const errorData = JSON.stringify({ 
            content: "Désolé, une erreur s'est produite. Veuillez réessayer plus tard." 
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Erreur API chat:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
