import { logger } from "../config/logger";

export class AIService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async analyzeStudent(student: any): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

    if (!apiKey) {
      throw new Error("Cấu hình khóa API (GEMINI_API_KEY) chưa được thiết lập trên Server.");
    }

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
    `.trim();

    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        logger.error("[Gemini API Error Response]: %s", errText);
        throw new Error(`Lỗi kết nối dịch vụ Gemini AI (Mã lỗi: ${response.status} ${response.statusText}).`);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await response.json()) as any;
      const choice = data.choices?.[0];
      const content = choice?.message?.content;

      if (!content) {
        throw new Error("Không nhận được nội dung phản hồi hợp lệ từ mô hình AI.");
      }

      return content;
    } catch (error) {
      logger.error("[AIService Error]: %o", error);
      throw error;
    }
  }
}
