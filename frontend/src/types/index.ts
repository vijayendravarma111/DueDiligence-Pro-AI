export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface ExecutiveSummary {
  overview: string;
  key_findings: string[];
  important_risks: string[];
  financial_business_info: string;
  recommendations: string[];
}

export interface RiskBreakdown {
  financial_risk: number;
  operational_risk: number;
  market_risk: number;
  governance_risk: number;
  legal_risk: number;
}

export interface RiskAnalysis {
  executive_summary: string;
  overall_risk_score: number;
  risk_level: string;
  risk_breakdown: RiskBreakdown;
  key_risks: string[];
  recommendations: string[];
  final_consultant_opinion: string;
}

export interface InvestmentAnalysis {
  investment_score: number;
  recommendation: string;
  confidence_score: number;
  strengths: string[];
  weaknesses: string[];
  valuation_insight: string;
  final_analyst_opinion: string;
}

export interface DocumentAnalysis {
  id: number;
  document_id: number;
  summary: ExecutiveSummary;
  risk_analysis?: RiskAnalysis | null;
  investment_analysis?: InvestmentAnalysis | null;
  created_at: string;
}

export interface DocumentItem {
  id: number;
  user_id: number;
  filename: string;
  file_type: string;
  file_path: string;
  status: string;
  created_at: string;
  analysis?: DocumentAnalysis | null;
}

export interface ChatResponse {
  question: string;
  answer: string;
  supporting_evidence?: string;
  confidence_score: number;
  doc_source: string;
}

export interface ChatMessage {
  id: number;
  document_id: number;
  user_id: number;
  question: string;
  answer: string;
  supporting_evidence?: string;
  confidence_score: number;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
