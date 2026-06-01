export interface SubmissionInfo {
  authorName: string;
  title: string;
  paperId: string;
  submittedBy: string;
  submissionDate: string;
  documentType: string;
  excludeQuotes: boolean;
  excludeBibliography: boolean;
  excludeSmallSources: boolean;
  dbStudentPapers: boolean;
  dbJournalsPublishers: boolean;
  dbInternetWeb: boolean;
  dbInstitutionRepository: boolean;
}

export interface MatchedSource {
  title: string;
  url?: string;
  similarity: number; // 0 to 100
  matchedText: string;
}

export interface SuspiciousSection {
  text: string;
  reason: string;
  sourceName: string;
  severity: "high" | "medium" | "low";
}

export interface DocumentStats {
  fileName: string;
  fileSize: number; // in bytes
  fileType: string;
  wordCount: number;
  charCount: number;
  pageCount: number;
}

export interface PlagiarismResult {
  plagiarismScore: number; // 0 to 100
  originalityScore: number; // 0 to 100
  aiScore?: number; // 0 to 100 (AI Probability / AI Written score)
  documentStats: DocumentStats;
  analysisSummary: string;
  matchedSources: MatchedSource[];
  suspiciousSections: SuspiciousSection[];
  reportDate: string;
  submissionInfo?: SubmissionInfo;
  fullText?: string;
}

export interface HistoryItem {
  id: string;
  fileName: string;
  date: string;
  score: number;
  stats: DocumentStats;
  result: PlagiarismResult;
}
