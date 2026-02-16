
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateFamily = async (lastName: string, country: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a list of family members for a person with the surname "${lastName}" living in ${country}. Include a father, a mother, and maybe 1-2 siblings. Use culturally appropriate names.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            relation: { type: Type.STRING },
            name: { type: Type.STRING },
          },
          required: ["relation", "name"]
        }
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(text);
  } catch (e) {
    return [
      { relation: 'Pai', name: `João ${lastName}` },
      { relation: 'Mãe', name: `Maria ${lastName}` }
    ];
  }
};

export const generateSocialPostResult = async (platform: string, followers: number) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `O usuário postou um conteúdo no ${platform}. Ele tem ${followers} seguidores. 
    Gere um título criativo para o post/vídeo e o resultado (ganho de seguidores, curtidas e dinheiro). 
    Seja engraçado e use gírias da internet brasileira.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          narrative: { type: Type.STRING },
          gainFollowers: { type: Type.NUMBER },
          gainMoney: { type: Type.NUMBER },
          gainHappiness: { type: Type.NUMBER }
        },
        required: ["title", "narrative", "gainFollowers", "gainMoney", "gainHappiness"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const generateInteractiveEvent = async (char: any) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Gere um evento aleatório e inusitado para um simulador de vida. O personagem tem ${char.age} anos e mora em ${char.city}. 
    Exemplos: um estranho pedindo para criar canal no YouTube, encontrar um animal exótico, uma proposta de pirâmide financeira, etc.
    Retorne em JSON com título, descrição e duas opções de escolha (A e B).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                resultId: { type: Type.STRING }
              },
              required: ["label", "resultId"]
            }
          }
        },
        required: ["title", "description", "options"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const resolveEventChoice = async (event: any, choiceId: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `O usuário escolheu a opção "${choiceId}" para o evento: "${event.description}". 
    Descreva o resultado em uma frase curta e defina o impacto nos atributos (health, happiness, intellect, appearance, money). 
    Seja criativo e humorístico.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          narrative: { type: Type.STRING },
          impact: {
            type: Type.OBJECT,
            properties: {
              health: { type: Type.NUMBER },
              happiness: { type: Type.NUMBER },
              intellect: { type: Type.NUMBER },
              appearance: { type: Type.NUMBER },
              money: { type: Type.NUMBER }
            }
          }
        },
        required: ["narrative", "impact"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const generateYearNarrative = async (age: number, event: string, city: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Descreva eventos rápidos que aconteceram no ano de uma pessoa de ${age} anos em ${city}. O evento global é "${event}". 
    Inclua coisas triviais como "Seu irmão pegou gripe" ou "Você assistiu um filme bom". Máximo 3 itens curtos.`,
  });
  return response.text || "Um ano tranquilo se passou.";
};
