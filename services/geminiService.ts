
import { GoogleGenAI, Type } from "@google/genai";
import { JewelryAnalysis } from "../types";

export const analyzeBlueprint = async (base64Image: string): Promise<JewelryAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image,
          },
        },
        {
          text: `你是一位顶级珠宝陈设专家与道具工程师。请分析上传的2D道具图纸（如展示柜、托盘、陈列架、道具背景板等）。
          
          核心任务：
          1. 识别道具的几何类型（如：L型展示架、阶梯托盘、带有斜面的戒指台、弧形背景墙）。
          2. 提取决定该道具功能和视觉的核心工程参数（如：总高度、底座宽度、斜面角度、分层间距）。
          3. 将其描述为可编程的 2D 矢量结构。
          
          输出 JSON 必须严格遵循 schema：
          - structural_logic.parameters: 提供 3-5 个核心道具控制参数（如 Base_Width, Slope_Angle, Total_Height）。
          - optimized_prompt: 必须清晰描述道具的 2D 轮廓逻辑，例如 "A three-tier stepped jewelry display tray with total height H and step depth D"。`
        }
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          basic_info: {
            type: Type.OBJECT,
            properties: {
              material: { type: Type.STRING, description: "道具材质，如绒布、大理石、亚克力" },
              color: { type: Type.STRING },
              style_tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["material", "color", "style_tags"]
          },
          structural_logic: {
            type: Type.OBJECT,
            properties: {
              parameters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.NUMBER },
                    min: { type: Type.NUMBER },
                    max: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "value", "min", "max", "unit"]
                }
              },
              components: { type: Type.ARRAY, items: { type: Type.STRING } },
              layering: { type: Type.STRING }
            },
            required: ["parameters", "components", "layering"]
          },
          visual_cues: {
            type: Type.OBJECT,
            properties: {
              lighting: { type: Type.STRING, description: "建议的柜内灯光配置" },
              focal_point: { type: Type.STRING },
              props: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["lighting", "focal_point", "props"]
          },
          optimized_prompt: { type: Type.STRING }
        },
        required: ["basic_info", "structural_logic", "visual_cues", "optimized_prompt"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};
