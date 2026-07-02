import React from 'react';
import { Shield, ArrowLeft, Lock, CheckCircle } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onBack: () => void;
}

export function PrivacyPolicyPage({ onBack }: PrivacyPolicyPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-cyan-600 font-semibold text-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Chính sách bảo mật</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Chính sách Bảo mật Thông tin</h1>
          <p className="text-slate-400 text-xs font-medium">Cập nhật lần cuối: Ngày 02 tháng 07 năm 2026</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8 leading-relaxed text-slate-600 text-sm">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-850 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center text-xs font-bold">1</span>
              Thông tin chúng tôi thu thập
            </h2>
            <p>
              Hệ thống quản lý học viên IGEN thu thập các thông tin cá nhân do học viên tự nguyện cung cấp khi đăng ký tài khoản hoặc hồ sơ thông qua mã QR/đường dẫn của giáo viên hướng dẫn, bao gồm:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 font-medium text-slate-700">
              <li>Thông tin định danh: Họ và tên, Ngày sinh, Số CCCD/CMND.</li>
              <li>Thông tin liên hệ: Số điện thoại, địa chỉ Email, địa chỉ cư trú hiện tại.</li>
              <li>Tệp đính kèm: Ảnh chân dung cá nhân, ảnh CCCD mặt trước, ảnh CCCD mặt sau.</li>
              <li>Thông tin học tập: Hạng bằng/Lớp học đăng ký, ngày nhập học, giáo viên hướng dẫn.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-850 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center text-xs font-bold">2</span>
              Mục đích sử dụng thông tin
            </h2>
            <p>
              Chúng tôi chỉ sử dụng các thông tin thu thập được cho các mục đích hợp pháp sau đây:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  Xử lý Hồ sơ
                </p>
                <p className="text-[11px] text-slate-500 font-medium">Đăng ký danh sách học viên, phân lớp học, sắp xếp lịch học và đăng ký lịch thi sát hạch.</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  Quản lý Tài chính
                </p>
                <p className="text-[11px] text-slate-500 font-medium">Theo dõi lịch sử đóng học phí, công nợ và hỗ trợ đối chiếu giao dịch chuyển khoản VietQR.</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  Thông báo Tự động
                </p>
                <p className="text-[11px] text-slate-500 font-medium">Gửi tin nhắn SMS/Zalo nhắc nhở lịch thi, lịch đóng học phí và thông tin phản hồi từ hệ thống.</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  Hỗ trợ Trợ lý AI
                </p>
                <p className="text-[11px] text-slate-500 font-medium">Giúp Trợ lý ảo (AI Chatbot) phân tích nhu cầu và phản hồi nhanh các thắc mắc thường gặp của bạn.</p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-850 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center text-xs font-bold">3</span>
              Bảo mật và Lưu trữ dữ liệu
            </h2>
            <p>
              Chúng tôi cam kết bảo vệ dữ liệu cá nhân của bạn bằng các biện pháp an ninh tối tân nhất:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-800">Lưu trữ đám mây an toàn:</strong> Các hình ảnh/tệp hồ sơ tùy thân được tải lên và lưu trữ an toàn trên dịch vụ Cloudinary sử dụng giao thức truyền tải mã hóa HTTPS bảo mật.
              </li>
              <li>
                <strong className="text-slate-800">Truy cập giới hạn:</strong> Chỉ giáo viên trực tiếp hướng dẫn học viên, nhân viên giáo vụ được phân quyền và Quản trị viên hệ thống (Superadmin) mới có quyền truy cập vào thông tin chi tiết của bạn.
              </li>
              <li>
                <strong className="text-slate-800">Mã hóa mật khẩu:</strong> Mật khẩu tài khoản của bạn được băm mã hóa một chiều trước khi lưu vào cơ sở dữ liệu MongoDB nhằm chống lại nguy cơ rò rỉ thông tin.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-850 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center text-xs font-bold">4</span>
              Chia sẻ thông tin với bên thứ ba
            </h2>
            <p>
              IGEN cam kết không bán, cho thuê, trao đổi thông tin cá nhân của bạn cho bên thứ ba vì mục đích thương mại. Chúng tôi chỉ chia sẻ dữ liệu khi:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Có sự đồng ý rõ ràng bằng văn bản từ chính học viên/người dùng.</li>
              <li>Cần thiết để tuân thủ quy định pháp luật hoặc yêu cầu của các cơ quan nhà nước có thẩm quyền trong việc sát hạch, cấp bằng lái xe/chứng chỉ học tập.</li>
              <li>Gửi dữ liệu qua nhà cung cấp cổng SMS TingTing để phục vụ tính năng gửi tin nhắn thông báo tự động (chỉ gửi thông tin liên hệ và nội dung tin nhắn cần truyền đạt).</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-850 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center text-xs font-bold">5</span>
              Quyền hạn của người dùng
            </h2>
            <p>
              Bạn có quyền yêu cầu kiểm tra, cập nhật, điều chỉnh hoặc xóa bỏ dữ liệu cá nhân của mình bằng cách liên hệ trực tiếp với giáo viên phụ trách hoặc thông qua email hỗ trợ của ban quản trị hệ thống IGEN.
            </p>
          </section>
        </div>

        {/* Support Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 text-center space-y-2">
          <p className="font-bold text-sm">Bạn có thắc mắc về chính sách bảo mật?</p>
          <p className="text-[11px] text-slate-400">Vui lòng liên hệ với bộ phận chăm sóc khách hàng của IGEN để được giải đáp 24/7.</p>
          <p className="text-cyan-400 font-mono text-xs font-bold pt-1">support@igenstudentmanagement.com</p>
        </div>
      </main>
    </div>
  );
}
