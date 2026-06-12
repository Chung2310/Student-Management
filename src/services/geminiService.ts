import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeStudentPerformance(student: Student) {
  try {
    const prompt = `
      Bạn là một cố vấn đào tạo lái xe chuyên nghiệp. Hãy phân tích hồ sơ học viên sau và đưa ra tư vấn lộ trình học tập, thi sát hạch:
      
      Học viên: ${student.fullName}
      Hạng bằng đăng ký: ${student.rank}
      Khu vực: ${student.area}
      Ngày đăng ký: ${student.registrationDate}
      Trạng thái hiện tại: ${student.status}
      Học phí: ${student.fee} VND

      Yêu cầu:
      1. Đưa ra nhận xét về tình trạng hồ sơ.
      2. Gợi ý các bước tiếp theo học viên cần thực hiện (ví dụ: KSK, nộp ảnh, học luật, tập xe chip).
      3. Đưa ra lời khuyên để tỷ lệ đậu cao nhất cho hạng bằng ${student.rank}.
      4. Trình bày ngắn gọn, chuyên nghiệp, khích lệ.
      
      Hãy phản hồi bằng tiếng Việt, định dạng Markdown, phong cách tinh tế và truyền cảm hứng.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    return response.text || "Xin lỗi, tôi không thể thực hiện phân tích lúc này.";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "Đã có lỗi xảy ra khi kết nối với AI Assistant.";
  }
}
