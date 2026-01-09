
export interface BlueprintParameter {
  name: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  description: string;
}

export interface JewelryAnalysis {
  basic_info: {
    material: string;
    color: string;
    style_tags: string[];
  };
  structural_logic: {
    parameters: BlueprintParameter[];
    components: string[];
    layering: string;
  };
  visual_cues: {
    lighting: string;
    focal_point: string;
    props: string[];
  };
  optimized_prompt: string;
}
