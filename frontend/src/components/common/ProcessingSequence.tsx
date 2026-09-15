'use client';

import { useState, useCallback } from 'react';
import type { ProcessingStep } from '@/types';

interface ProcessingSequenceProps {
  title: string;
  steps: string[];
  onComplete: () => void;
  completeLabel?: string;
  stepDuration?: number;
}

export default function ProcessingSequence({
  title,
  steps,
  onComplete,
  completeLabel = 'COMPLETE',
  stepDuration = 400,
}: ProcessingSequenceProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [started, setStarted] = useState(false);

  const startProcessing = useCallback(() => {
    if (started) return;
    setStarted(true);

    steps.forEach((_, idx) => {
      setTimeout(() => {
        setCurrentStep(idx + 1);
        if (idx === steps.length - 1) {
          setTimeout(() => {
            setIsComplete(true);
            setTimeout(onComplete, 600);
          }, stepDuration);
        }
      }, (idx + 1) * stepDuration);
    });
  }, [steps, stepDuration, onComplete, started]);

  // Auto-start
  if (!started) {
    setTimeout(startProcessing, 200);
  }

  return (
    <div className="processing-overlay">
      <div className="processing-card">
        <div className="processing-title">{title}</div>
        {steps.map((step, idx) => {
          const status =
            idx < currentStep ? 'complete' : idx === currentStep ? 'active' : '';
          return (
            <div key={idx} className={`processing-step ${status}`}>
              <span className="step-icon">
                {idx < currentStep ? (
                  <span style={{ color: 'var(--accent-green)' }}>✓</span>
                ) : idx === currentStep && started ? (
                  <span className="spinner" />
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>○</span>
                )}
              </span>
              {step}
            </div>
          );
        })}
        {isComplete && (
          <div className="processing-complete">{completeLabel}</div>
        )}
      </div>
    </div>
  );
}
