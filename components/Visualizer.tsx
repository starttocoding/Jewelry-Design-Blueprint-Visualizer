
import React, { useEffect, useRef } from 'react';
import { BlueprintParameter } from '../types';

interface VisualizerProps {
  parameters: BlueprintParameter[];
  description?: string;
}

declare const paper: any;

const Visualizer: React.FC<VisualizerProps> = ({ parameters, description }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const projectRef = useRef<any>(null);

  const getVal = (name: string, def: number) => {
    const p = parameters.find(p => p.name.toLowerCase().includes(name.toLowerCase().replace('_', ' ')));
    return p ? p.value : def;
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    if (!projectRef.current) {
      paper.setup(canvasRef.current);
      projectRef.current = paper.project;
    }

    const drawPropBlueprint = () => {
      const { view, Path, Group, PointText } = paper;
      projectRef.current.activeLayer.removeChildren();
      const center = view.center;
      const propGroup = new Group();

      const mainStroke = { strokeColor: '#1a1a1a', strokeWidth: 1.5 };
      const guideStroke = { strokeColor: '#cbd5e1', strokeWidth: 1, dashArray: [4, 4] };
      const labelStyle = { fillColor: '#475569', fontSize: 10, fontFamily: 'monospace' };

      const desc = (description || "").toLowerCase();

      // --- 核心绘图逻辑：识别道具类型 ---
      
      if (desc.includes('step') || desc.includes('tier')) {
        // 1. 阶梯式展示台 (Stepped Display)
        const stepW = getVal('width', 150);
        const stepH = getVal('height', 40);
        const tiers = Math.round(getVal('tier', 3)) || 3;
        
        for (let i = 0; i < tiers; i++) {
          const rect = new Path.Rectangle({
            point: [center.x - stepW/2 + (i * 15), center.y + (i * stepH) - (tiers * stepH / 2)],
            size: [stepW - (i * 30), stepH],
            ...mainStroke,
            fillColor: i % 2 === 0 ? '#ffffff' : '#fcfcfc'
          });
          propGroup.addChild(rect);
        }
      } else if (desc.includes('slope') || desc.includes('angle') || desc.includes('stand')) {
        // 2. 斜面展示架 (Sloped Stand - 如戒指架或项链台)
        const baseW = getVal('base', 120);
        const totalH = getVal('height', 100);
        const angleVal = getVal('angle', 30);
        
        // 侧视图逻辑
        const slopePath = new Path({
          segments: [
            [center.x - baseW/2, center.y + totalH/2],
            [center.x + baseW/2, center.y + totalH/2],
            [center.x + baseW/2, center.y - totalH/2 + (angleVal)],
            [center.x - baseW/2, center.y - totalH/2]
          ],
          closed: true,
          ...mainStroke,
          fillColor: '#ffffff'
        });
        propGroup.addChild(slopePath);
      } else {
        // 3. 通用陈列柜/托盘轮廓 (Box/Tray)
        const w = getVal('width', 180);
        const h = getVal('height', 120);
        const d = getVal('depth', 20) || 15;

        // 绘制带厚度的托盘 (2.5D 效果的 2D 平面图)
        const outer = new Path.Rectangle({
          point: [center.x - w/2, center.y - h/2],
          size: [w, h],
          ...mainStroke
        });
        const inner = new Path.Rectangle({
          point: [center.x - w/2 + d, center.y - h/2 + d],
          size: [w - d*2, h - d*2],
          ...mainStroke,
          strokeWidth: 1
        });
        // 绘制连接线表示深度
        const corners = [
          [[center.x - w/2, center.y - h/2], [center.x - w/2 + d, center.y - h/2 + d]],
          [[center.x + w/2, center.y - h/2], [center.x + w/2 - d, center.y - h/2 + d]],
          [[center.x - w/2, center.y + h/2], [center.x - w/2 + d, center.y + h/2 - d]],
          [[center.x + w/2, center.y + h/2], [center.x + w/2 - d, center.y + h/2 - d]],
        ];
        corners.forEach(([p1, p2]) => {
          propGroup.addChild(new Path.Line({ from: p1, to: p2, ...mainStroke, strokeWidth: 1 }));
        });
        propGroup.addChildren([outer, inner]);
      }

      // --- 自动标注线 ---
      const bounds = propGroup.bounds;
      const margin = 30;

      // 宽度标注
      new Path.Line({ from: [bounds.left, bounds.top - margin], to: [bounds.right, bounds.top - margin], ...guideStroke });
      new PointText({ point: [center.x, bounds.top - margin - 10], content: `W: ${bounds.width.toFixed(1)}mm`, justification: 'center', ...labelStyle });

      // 高度标注
      new Path.Line({ from: [bounds.right + margin, bounds.top], to: [bounds.right + margin, bounds.bottom], ...guideStroke });
      new PointText({ point: [bounds.right + margin + 10, center.y], content: `H: ${bounds.height.toFixed(1)}mm`, ...labelStyle, rotation: 90 });

      // 居中与缩放
      const scale = (view.size.height * 0.6) / bounds.height;
      propGroup.scale(Math.min(scale, 1.2), center);

      view.draw();
    };

    drawPropBlueprint();
    
    const handleResize = () => {
      if (canvasRef.current) {
        paper.view.viewSize = new paper.Size(canvasRef.current.parentElement?.clientWidth, canvasRef.current.parentElement?.clientHeight);
        drawPropBlueprint();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [parameters, description]);

  return (
    <div className="w-full h-full min-h-[550px] bg-white rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
      <div className="absolute top-6 left-8 z-10">
        <div className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">Display Prop Reconstruction</div>
        <div className="text-[9px] text-slate-400 font-mono italic">UNIT: MILLIMETER | VIEW: ORTHOGRAPHIC</div>
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute bottom-6 left-8">
        <div className="flex gap-4 opacity-30">
          <div className="w-12 h-[1px] bg-slate-900"></div>
          <div className="w-12 h-[1px] bg-slate-900"></div>
          <div className="w-12 h-[1px] bg-slate-900"></div>
        </div>
      </div>
    </div>
  );
};

export default Visualizer;
