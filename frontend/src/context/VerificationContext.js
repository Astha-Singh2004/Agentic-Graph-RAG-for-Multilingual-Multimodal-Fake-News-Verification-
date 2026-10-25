'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyClaim, checkBackendHealth } from '@/lib/api';

const VerificationContext = createContext(null);

export const SAMPLE_CLAIMS = [
  {
    title: "Viral Claim (Hindi Fake Scheme)",
    text: "बड़ा दावा: Madhya Pradesh के सभी लोगों को financial scheme का तुरंत लाभ। वायरल मैसेज में दावा किया जा रहा है कि तुरंत बैंक खाते में पैसे आएंगे।",
    lang: "hi",
    category: "Financial Scheme",
    expected: "CONTRADICTED"
  },
  {
    title: "Official Government Advisory (English)",
    text: "Government / Institution announced or implemented public health advisory in Madhya Pradesh. Official notification released by department.",
    lang: "en",
    category: "Public Health",
    expected: "SUPPORTED"
  },
  {
    title: "Regional Official Information (Marathi)",
    text: "Maharashtra मध्ये education programme बाबत अधिकृत माहिती जाहीर करण्यात आली आहे.",
    lang: "mr",
    category: "Education",
    expected: "SUPPORTED"
  },
  {
    title: "Viral Universal Benefit (Punjabi Fake)",
    text: "Viral claim: everyone in Punjab gets an immediate entertainment event benefit. Urgent notification for all citizens.",
    lang: "pa",
    category: "Entertainment",
    expected: "CONTRADICTED"
  },
  {
    title: "Farmer Subsidy Claim (Tamil Nadu)",
    text: "Official information released on farmer subsidy in Tamil Nadu. Applications accepted through agricultural portal.",
    lang: "ta",
    category: "Agriculture",
    expected: "SUPPORTED"
  }
];

export const VerificationProvider = ({ children }) => {
  const [activeVerdict, setActiveVerdict] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    const checkStatus = async () => {
      const res = await checkBackendHealth();
      setBackendStatus(res.status === 'healthy' ? 'online' : 'offline');
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async (text, options = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        text,
        language: options.language || null,
        image_path: options.image_path || null,
        article_id: options.article_id || null,
        platform: options.platform || 'Web'
      };
      const result = await verifyClaim(payload);
      setActiveVerdict(result);
      setHistory(prev => [result, ...prev.slice(0, 9)]);
      return result;
    } catch (err) {
      console.error("Verification error:", err);
      setError(err.response?.data?.detail || err.message || "Failed to verify claim");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VerificationContext.Provider
      value={{
        activeVerdict,
        setActiveVerdict,
        isLoading,
        error,
        history,
        backendStatus,
        handleVerify,
        sampleClaims: SAMPLE_CLAIMS
      }}
    >
      {children}
    </VerificationContext.Provider>
  );
};

export const useVerification = () => {
  const context = useContext(VerificationContext);
  if (!context) {
    throw new Error("useVerification must be used within a VerificationProvider");
  }
  return context;
};
