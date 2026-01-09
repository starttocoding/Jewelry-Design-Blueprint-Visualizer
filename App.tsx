
import React, { useState } from 'react';
import { analyzeBlueprint } from './services/geminiService';
import { JewelryAnalysis, BlueprintParameter } from './types';
import Visualizer from './components/Visualizer';

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<JewelryAnalysis | null>(null);
  const [activeParams, setActiveParams] = useState<BlueprintParameter[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setImage(reader.result as string);
      setLoading(true);
      try {
        const result = await analyzeBlueprint(base64);
        setAnalysis(result);
        setActiveParams(result.structural_logic.parameters);
      } catch (error) {
        console.error("Analysis failed", error);
        alert("道具图纸识别失败，请确保上传清晰的 2D 道具工程图。");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateParam = (index: number, newValue: number) => {
    setActiveParams(prev => {
      const next = [...prev];
      next[index] = { ...next[index], value: newValue };
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 px-10 py-5 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border-2 border-slate-900 flex items-center justify-center font-black text-xs">PROP</div>
          <div>
            <h1 className="text-sm font-black tracking-widest uppercase">Jewelry Display Prop AI</h1>
            <p className="text-[9px] text-slate-400 font-mono">DYNAMIC RECONSTRUCTION SYSTEM</p>
          </div>
        </div>
        <label className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 text-[10px] font-black tracking-widest rounded-none cursor-pointer transition-all uppercase">
          Scan Prop Drawing
          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
        </label>
      </header>

      <main className="flex-1 p-10 grid grid-cols-1 xl:grid-cols-12 gap-10 max-w-[1600px] mx-auto w-full">
        {/* 参数控制栏 */}
        <div className="xl:col-span-4 space-y-8">
          <section className="bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-1 h-3 bg-slate-900"></span> Source Sketch
            </h3>
            <div className="aspect-square bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
              {image ? (
                <img src={image} className="max-h-full max-w-full object-contain" alt="Original Drawing" />
              ) : (
                <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">No Input</p>
              )}
            </div>
          </section>

          <section className="bg-white border border-slate-200 p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 border-b border-slate-100 pb-3">Engineering Parameters</h3>
            <div className="space-y-10">
              {activeParams.length > 0 ? activeParams.map((param, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-baseline mb-4">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">{param.name}</label>
                    <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-1">
                      {param.value}<span className="text-[9px] text-slate-400 ml-1">{param.unit}</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step="1"
                    value={param.value}
                    onChange={(e) => updateParam(idx, parseFloat(e.target.value))}
                    className="w-full h-[2px] bg-slate-100 appearance-none cursor-pointer accent-slate-900"
                  />
                </div>
              )) : (
                <div className="py-10 text-center text-slate-300 text-[10px] font-bold uppercase italic">Awaiting technical scan...</div>
              )}
            </div>
          </section>
        </div>

        {/* 2D 动态生成区 */}
        <div className="xl:col-span-8 flex flex-col gap-8">
          <Visualizer parameters={activeParams} description={analysis?.optimized_prompt} />
          
          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-slate-200 p-8 shadow-sm">
                <h4 className="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest">Material & Finish</h4>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-[10px] text-slate-400 uppercase">Substrate</span>
                    <span className="text-xs font-bold uppercase">{analysis.basic_info.material}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-[10px] text-slate-400 uppercase">Colorway</span>
                    <span className="text-xs font-bold uppercase">{analysis.basic_info.color}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-8 shadow-sm">
                <h4 className="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest">Display Optimization</h4>
                <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                  Recommended Lighting: {analysis.visual_cues.lighting}<br/>
                  Focal Point: {analysis.visual_cues.focal_point}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {loading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-2 border-slate-900 border-t-transparent animate-spin mb-6"></div>
          <div className="text-[10px] font-black tracking-[0.5em] uppercase animate-pulse">Reconstructing Geometry</div>
        </div>
      )}
    </div>
  );
};

export default App;
