import { useState, useCallback, useRef } from 'react';
import { Canvas } from 'fabric';

export const useCanvasHistory = (canvas: Canvas | null) => {
  const [history, setHistory] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const isRestoring = useRef(false);

  const saveState = useCallback(() => {
    if (!canvas || isRestoring.current) return;

    const json = JSON.stringify(canvas.toJSON());

    setHistory((prev) => {
      // Remover todo lo que está después del paso actual
      const newHistory = prev.slice(0, currentStep + 1);
      // Agregar el nuevo estado
      newHistory.push(json);
      // Limitar a 50 estados para no consumir mucha memoria
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });

    setCurrentStep((prev) => {
      const newHistory = history.slice(0, prev + 1);
      newHistory.push(json);
      return Math.min(newHistory.length - 1, 49);
    });
  }, [canvas, currentStep, history]);

  const undo = useCallback(() => {
    if (!canvas || currentStep <= 0) return;

    isRestoring.current = true;
    const previousStep = currentStep - 1;
    const previousState = history[previousStep];

    canvas.loadFromJSON(JSON.parse(previousState), () => {
      canvas.requestRenderAll();
      setCurrentStep(previousStep);
      isRestoring.current = false;
    });
  }, [canvas, currentStep, history]);

  const redo = useCallback(() => {
    if (!canvas || currentStep >= history.length - 1) return;

    isRestoring.current = true;
    const nextStep = currentStep + 1;
    const nextState = history[nextStep];

    canvas.loadFromJSON(JSON.parse(nextState), () => {
      canvas.requestRenderAll();
      setCurrentStep(nextStep);
      isRestoring.current = false;
    });
  }, [canvas, currentStep, history]);

  const canUndo = currentStep > 0;
  const canRedo = currentStep < history.length - 1;

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
