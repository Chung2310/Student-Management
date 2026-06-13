import { apiFetch } from "../lib/api";
import { Student } from "../types";

export async function analyzeStudentPerformance(student: Student): Promise<string> {
  try {
    const response = await apiFetch("/ai/analyze", {
      method: "POST",
      body: JSON.stringify(student),
    });

    if (response && response.success && response.analysis) {
      return response.analysis;
    }

    return response.error || "Xin lỗi, tôi không thể thực hiện phân tích lúc này.";
  } catch (error: unknown) {
    console.error("AI Service Error:", error);
    const msg = error instanceof Error ? error.message : "Đã có lỗi xảy ra khi kết nối với AI Assistant.";
    return msg;
  }
}
