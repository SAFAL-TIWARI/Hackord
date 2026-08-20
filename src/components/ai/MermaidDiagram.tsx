import React from 'react';
import { InteractiveFlowchart } from './InteractiveFlowchart';

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  return <InteractiveFlowchart chart={chart} />;
}
