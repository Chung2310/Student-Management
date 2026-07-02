import React from 'react';
import { FileText, ArrowLeft, ShieldAlert, Scale, CheckSquare } from 'lucide-react';

interface TermsOfServicePageProps {
  onBack: () => void;
}

export function TermsOfServicePage({ onBack }: TermsOfServicePageProps) {
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
            <FileText className="w-5 h-5 text-cyan-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Điều khoản dịch vụ</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto shadow-sm">
            <Scale className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Điều khoản Sử dụng Dịch vụ</h1>
          <p className="text-slate-400 text-xs font-medium">Cập nhật lần cuối: Ngày 02 tháng 07 năm 2026</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8 leading-relaxed text-slate-600 text-sm">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-850 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center text-xs font-bold">1</span>
              Chấp thuận Điều khoản
            </h2>
            <p>
              Bằng việc truy cập, đăng ký tài khoản, đăng ký thông tin học viên qua quét mã QR hoặc sử dụng bất kỳ tính năng nào trên hệ thống quản lý học viên IGEN, bạn đồng ý tuân thủ và chịu sự ràng buộc bởi các điều khoản sử dụng được quy định dưới đây. Nếu bạn không đồng ý với các điều khoản này, vui lòng ngừng sử dụng hệ thống ngay lập tức.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-850 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center text-xs font-bold">2</span>
              Quyền và Trách nhiệm của Học viên
            </h2>
            <p>
              Học viên khi đăng ký thông tin cá nhân lên hệ thống cần cam kết tuân thủ các quy tắc sau:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-800">Tính chính xác của thông tin:</strong> Tự chịu trách nhiệm hoàn toàn về tính pháp lý và chính xác của mọi thông tin cá nhân cung cấp (Họ tên, ngày sinh, số điện thoại, ảnh thẻ, ảnh chụp giấy tờ CCCD).
              </li>
              <li>
                <strong className="text-slate-800">Bảo mật tài khoản cá nhân:</strong> (Nếu được cấp tài khoản) Học viên có trách nhiệm giữ kín mật khẩu và không chia sẻ tài khoản cho người khác sử dụng chung.
              </li>
              <li>
                <strong className="text-slate-800">Nghĩa vụ đóng học phí:</strong> Thực hiện thanh toán học phí đầy đủ theo các đợt đã thỏa thuận với giáo viên hoặc cơ sở đào tạo.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-850 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center text-xs font-bold">3</span>
              Quy định về Thanh toán và VietQR
            </h2>
            <p>
              Để tối ưu hóa quá trình quản trị học phí, IGEN cung cấp hệ thống quét mã thanh toán động thông qua tiêu chuẩn VietQR:
            </p>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
              <p className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <CheckSquare className="w-4 h-4 text-cyan-600" />
                Mã VietQR Động
              </p>
              <p className="text-[11px] text-slate-500 leading-normal">
                Mã QR được hệ thống tự động tính toán dựa trên số tiền cần đóng và cú pháp (Memo) định danh riêng cho từng học viên. Học viên nên quét đúng mã QR được cung cấp để hệ thống gạch nợ tự động thành công.
              </p>
              <p className="text-[11px] text-slate-500 leading-normal">
                Mọi trường hợp chuyển sai số tài khoản, sai cú pháp ghi chú dẫn đến gạch nợ chậm trễ hoặc thất bại, học viên cần chủ động cung cấp biên lai chuyển tiền (Bill) cho giáo viên hướng dẫn để được cập nhật thủ công.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-850 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center text-xs font-bold">4</span>
              Trách nhiệm của Giáo viên và Ban Quản trị
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-800">Cập nhật tiến độ học tập:</strong> Giáo viên có trách nhiệm cập nhật đúng đắn, khách quan tiến độ học tập lý thuyết, thực hành, thi thử và kết quả thi sát hạch thực tế của học viên.
              </li>
              <li>
                <strong className="text-slate-800">Quản lý bảo mật:</strong> Giáo viên tuyệt đối không được phát tán, rò rỉ dữ liệu thông tin cá nhân hoặc các tệp ảnh CCCD/ảnh thẻ của học viên ra bên ngoài hệ thống.
              </li>
              <li>
                <strong className="text-slate-800">Dịch vụ BOT và AI:</strong> Ban quản trị nỗ lực duy trì hoạt động ổn định của dịch vụ gửi tin nhắn tự động nhắc lịch thi/học phí và trợ lý AI trả lời khách hàng, tuy nhiên không cam kết tính thông suốt 100% khi có sự cố từ các nhà cung cấp hạ tầng viễn thông/API bên thứ ba.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-850 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center text-xs font-bold">5</span>
              Giới hạn Trách nhiệm pháp lý
            </h2>
            <p>
              Hệ thống IGEN đóng vai trò là công cụ phần mềm hỗ trợ quản trị học vụ nội bộ. Chúng tôi không trực tiếp chịu trách nhiệm pháp lý đối với bất kỳ khiếu nại, tranh chấp nào phát sinh giữa học viên và giáo viên/trung tâm đào tạo liên quan đến chất lượng đào tạo, học phí thực tế hoặc các vấn đề dân sự khác nằm ngoài tầm kiểm soát kỹ thuật của phần mềm.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-850 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center text-xs font-bold">6</span>
              Thay đổi Điều khoản sử dụng
            </h2>
            <p>
              Ban quản trị IGEN có quyền cập nhật, sửa đổi điều khoản sử dụng này bất kỳ lúc nào để phù hợp với quy định của pháp luật hiện hành và sự thay đổi kỹ thuật của phần mềm. Phiên bản cập nhật mới nhất sẽ được đăng tải trực tiếp tại trang này cùng mốc thời gian cập nhật.
            </p>
          </section>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-rose-800 text-sm">Lưu ý quan trọng</p>
            <p className="text-[11px] text-rose-600 font-semibold leading-normal">
              Việc cố tình khai báo sai lệch thông tin định danh cá nhân hoặc tải ảnh giả mạo, ảnh đồi trụy lên hệ thống IGEN có thể dẫn đến việc tài khoản học viên bị đình chỉ vĩnh viễn và xử lý theo các quy định kỷ luật của cơ sở đào tạo hoặc pháp luật Việt Nam.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
