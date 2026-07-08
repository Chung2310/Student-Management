import { HelpCircle } from 'lucide-react';

interface DrivingCenterGuideProps {
  activeSection: string;
  searchQuery: string;
}

export function DrivingCenterGuide({ activeSection, searchQuery }: DrivingCenterGuideProps) {
  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase() 
            ? <mark key={i} className="bg-yellow-100 text-yellow-900 rounded px-0.5 font-bold">{part}</mark>
            : part
        )}
      </>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'quickstart':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">🚀 Quy trình 5 bước vận hành nhanh cho Trung tâm Lái xe</h3>
              <p className="text-slate-500 text-sm mt-1">Lộ trình 5 bước tiêu chuẩn giúp nhân viên vận hành nhanh phần mềm từ tiếp nhận hồ sơ đến khi lên lịch thi sát hạch.</p>
            </div>

            <div className="relative border-l-2 border-emerald-100 ml-4 pl-6 space-y-8 my-6">
              <div className="relative">
                <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-100">1</div>
                <h4 className="font-bold text-slate-800 text-sm">{highlightText("Tạo Khóa học lái xe")}</h4>
                <p className="text-slate-400 text-xs mt-1">Truy cập menu <strong>Khóa học</strong> ➜ Bấm <strong>+ Tạo khóa học</strong> ➜ Điền các thông tin: Hạng đào tạo (B1, B2, C...), Tên khóa học (ví dụ: Khóa B2 K68), Học phí trọn gói và số học viên tối đa.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-100">2</div>
                <h4 className="font-bold text-slate-800 text-sm">{highlightText("Tiếp nhận Học viên & Tải hồ sơ")}</h4>
                <p className="text-slate-400 text-xs mt-1">Truy cập menu <strong>Học viên</strong> ➜ Bấm <strong>+ Thêm học viên</strong> ➜ Nhập Họ tên, Số điện thoại, Số CCCD (12 chữ số), tải lên 2 ảnh mặt CCCD và 1 ảnh chân dung 3x4.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-100">3</div>
                <h4 className="font-bold text-slate-800 text-sm">{highlightText("Cập nhật Giấy khám sức khỏe (KSK)")}</h4>
                <p className="text-slate-400 text-xs mt-1">Khi học viên nộp giấy khám sức khỏe, mở hồ sơ chi tiết học viên ➜ Tab <strong>KSK</strong> ➜ Chuyển trạng thái sang <strong>Đã KSK</strong>, nhập ngày khám, ghi nhận đạt chuẩn và tải ảnh chụp giấy khám lên.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-100">4</div>
                <h4 className="font-bold text-slate-800 text-sm">{highlightText("Theo dõi Tiến độ học (DAT & Cabin)")}</h4>
                <p className="text-slate-400 text-xs mt-1">Mở hồ sơ học viên ➜ Tab <strong>Tiến độ học</strong> ➜ Cập nhật số Km đã chạy thực tế trên thiết bị giám sát hành trình DAT và số giờ học cabin mô phỏng.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-100">5</div>
                <h4 className="font-bold text-slate-800 text-sm">{highlightText("Lên Lịch thi sát hạch")}</h4>
                <p className="text-slate-400 text-xs mt-1">Vào mục <strong>Lịch thi</strong> ➜ Bấm <strong>+ Tạo kỳ thi mới</strong> ➜ Chọn <strong>Gán học viên</strong>. Hệ thống sẽ chỉ cho phép tích chọn các học viên đã hoàn thành đủ điều kiện (Đã KSK + Đủ Km DAT).</p>
              </div>
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">📊 Tổng quan (Dashboard)</h3>
              <p className="text-slate-500 text-sm mt-1">Màn hình giám sát các chỉ số vận hành đào tạo lái xe và lịch trình thi sát hạch theo thời gian thực.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("1. Các chỉ số thống kê nhanh ở đầu trang:")}</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Học viên đang học:</strong> Tổng số lượng hồ sơ học viên có trạng thái đào tạo là "Đang học" hoặc "Đã KSK" chờ thi.</li>
                <li><strong>Xe tập lái đang hoạt động:</strong> Tổng số xe tập lái đã khai báo và đang ở trạng thái hoạt động trên sân tập sa hình và đường trường.</li>
                <li><strong>Doanh thu tháng này:</strong> Tổng số tiền học phí thực tế đã thu được từ học viên trong tháng hiện tại.</li>
                <li><strong>Kỳ thi sát hạch sắp tới:</strong> Tổng số lượng các kỳ thi tốt nghiệp / sát hạch được lên lịch diễn ra trong vòng 30 ngày tới.</li>
              </ul>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("2. Danh sách cảnh báo tiến độ đào tạo:")}</h4>
              <p>Hiển thị danh sách các học viên sắp tới ngày thi nhưng tiến độ chạy Km đường trường (DAT) vẫn chưa đạt chỉ tiêu (dưới 80%), hỗ trợ nhân viên phát hiện và lên lịch cho giáo viên bổ sung giờ chạy kịp thời.</p>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("3. Biểu đồ tuyển sinh học lái xe:")}</h4>
              <p>Biểu đồ cột thể hiện sự biến động số lượng hồ sơ học viên đăng ký mới theo từng hạng bằng (A1, A2, B1, B2, C...) qua các tháng để ban quản trị đánh giá nguồn tuyển sinh.</p>
            </div>
          </div>
        );

      case 'students':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">👥 Quản lý Học viên lái xe</h3>
              <p className="text-slate-500 text-sm mt-1">Module trung tâm để lưu trữ hồ sơ pháp lý, ảnh CCCD, tình trạng sức khỏe và tiến độ DAT học lái xe.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("1. Hướng dẫn thêm học viên lái xe mới:")}</h4>
              <p>Bấm nút <strong>+ Thêm học viên</strong> ở đầu trang để mở hộp thoại. Điền thông tin vào các trường sau:</p>
              
              <table className="min-w-full border border-slate-200 mt-2 rounded-xl overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-200 px-3 py-2 text-left font-bold text-[10px] uppercase">Tên trường thông tin</th>
                    <th className="border border-slate-200 px-3 py-2 text-left font-bold text-[10px] uppercase">Ràng buộc dữ liệu</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Họ và tên</td>
                    <td className="border border-slate-200 px-3 py-2 text-rose-600 font-bold">Bắt buộc nhập.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Số điện thoại</td>
                    <td className="border border-slate-200 px-3 py-2 text-rose-600 font-bold">Bắt buộc. Phải đủ 10 số (đầu 03, 05, 07, 08, 09). Không trùng lặp.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Số CCCD (12 số)</td>
                    <td className="border border-slate-200 px-3 py-2 text-rose-600 font-bold">Bắt buộc đối với trung tâm lái xe. Phải có đúng 12 chữ số. Không trùng lặp.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Ngày sinh</td>
                    <td className="border border-slate-200 px-3 py-2">Tùy chọn. Dùng để đối chiếu độ tuổi đăng ký học lái xe theo luật.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Hạng bằng (lái xe)</td>
                    <td className="border border-slate-200 px-3 py-2 text-rose-600 font-bold">Bắt buộc. Chọn phân nhóm (A1, A2, B1, B2, C, D, E...) để áp dụng mức phí và Km DAT.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Tải lên CCCD mặt trước</td>
                    <td className="border border-slate-200 px-3 py-2 text-rose-600 font-bold">Bắt buộc. File ảnh JPG / PNG. Phục vụ in ấn hồ sơ nộp lên Sở GTVT.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Tải lên CCCD mặt sau</td>
                    <td className="border border-slate-200 px-3 py-2 text-rose-600 font-bold">Bắt buộc. File ảnh JPG / PNG.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Ảnh chân dung 3x4</td>
                    <td className="border border-slate-200 px-3 py-2">Tùy chọn. Ảnh chụp chân dung học viên làm thẻ dự thi.</td>
                  </tr>
                </tbody>
              </table>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("2. Xem chi tiết & Quản lý bằng các Tab chuyên dụng:")}</h4>
              <p>Bấm chọn tên học viên trên danh sách để mở hộp thoại Hồ sơ chi tiết học viên lái xe:</p>
              
              <table className="min-w-full border border-slate-200 mt-2 rounded-xl overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-200 px-3 py-2 text-left font-bold text-[10px] uppercase">Tên Tab</th>
                    <th className="border border-slate-200 px-3 py-2 text-left font-bold text-[10px] uppercase">Nội dung thao tác chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Hồ sơ</td>
                    <td className="border border-slate-200 px-3 py-2">Hiển thị thông tin cá nhân, ảnh CCCD 2 mặt. Nút in báo cáo lý lịch học viên.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">KSK</td>
                    <td className="border border-slate-200 px-3 py-2">Nhập thông tin Giấy khám sức khỏe: Ngày khám, ghi chú về mắt/sức khỏe, tải ảnh chụp giấy khám sức khỏe gốc và chọn trạng thái <strong>Đã KSK</strong>.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Tiến độ học</td>
                    <td className="border border-slate-200 px-3 py-2">
                      Nhập và theo dõi các chỉ tiêu bắt buộc:
                      <ul className="list-disc pl-5 mt-1">
                        <li><strong>DAT (Km):</strong> Số Km đường trường thực tế đã chạy / Chỉ tiêu (Ví dụ: B2 yêu cầu 810 Km, B1 yêu cầu 710 Km, C yêu cầu 825 Km).</li>
                        <li><strong>Cabin học:</strong> Số giờ thực hành cabin ảo đã hoàn thành (Ví dụ: yêu cầu tối thiểu 3 giờ).</li>
                        <li><strong>Lý thuyết:</strong> Trạng thái học lý thuyết (Đạt / Chưa đạt).</li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Lịch thi & KQ</td>
                    <td className="border border-slate-200 px-3 py-2">Xem lịch sử các kỳ thi thử, thi tốt nghiệp trường và thi sát hạch Sở GTVT kèm kết quả Đậu/Trượt các phần thi Sa hình, Lý thuyết, Mô phỏng, Đường trường.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Học phí</td>
                    <td className="border border-slate-200 px-3 py-2">Lập phiếu thu tiền học phí trọn gói của học viên hoặc thu theo các đợt đóng phí. In hóa đơn thu tiền.</td>
                  </tr>
                </tbody>
              </table>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("3. Nhập danh sách học viên lái xe từ file Excel:")}</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Bấm nút <strong>Nhập Excel</strong> trên trang danh sách học viên.</li>
                <li>Tải tệp mẫu Excel do hệ thống cung cấp về máy.</li>
                <li>Điền đầy đủ thông tin học viên theo đúng các tiêu đề cột (FullName, Phone, IdCard (12 số bắt buộc), Rank (A1, A2, B2...)...).</li>
                <li>Tải tệp tin Excel lên, kiểm tra giao diện xem trước (Preview) để phát hiện hồ sơ bị trùng lặp số điện thoại hoặc số CCCD.</li>
                <li>Bấm <strong>Xác nhận lưu</strong> để nhập hàng loạt học viên.</li>
              </ol>
            </div>
          </div>
        );

      case 'exams':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">📅 Quản lý Lịch thi sát hạch</h3>
              <p className="text-slate-500 text-sm mt-1">Lên lịch các kỳ thi tốt nghiệp trường lái và kỳ thi sát hạch chính thức của Sở Giao thông Vận tải.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("1. Tạo kỳ thi lái xe mới:")}</h4>
              <p>Bấm nút <strong>+ Tạo kỳ thi mới</strong>. Nhập các thông tin bắt buộc:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Tên kỳ thi:</strong> Ví dụ "Thi sát hạch Sở GTVT khóa B2 K68".</li>
                <li><strong>Phân loại:</strong> Chọn Thi tốt nghiệp hoặc Thi sát hạch Sở GTVT.</li>
                <li><strong>Ngày thi:</strong> Ngày diễn ra thi.</li>
                <li><strong>Địa điểm:</strong> Tên trung tâm sát hạch tổ chức thi.</li>
              </ul>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("2. Gán thí sinh dự thi (Tự động lọc điều kiện):")}</h4>
              <p>Mở kỳ thi ➜ Bấm nút <strong>Gán học viên</strong>. Hệ thống sẽ tự động quét danh sách học viên của khóa đó và chỉ hiển thị những học viên <strong>đủ điều kiện thi sát hạch</strong>:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-emerald-700 font-semibold">
                <li>✓ Đã có trạng thái khám sức khỏe là "Đã KSK".</li>
                <li>✓ Đạt đủ 100% chỉ tiêu số Km chạy DAT đường trường (ví dụ: đủ 810 Km đối với hạng B2).</li>
                <li>✓ Đạt đủ số giờ học Cabin mô phỏng ảo (3 giờ).</li>
              </ul>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("3. Nhập kết quả thi sát hạch:")}</h4>
              <p>Sau khi có bảng điểm thi của Sở GTVT gửi về, nhân viên mở kỳ thi ➜ Nhập điểm cho từng học viên:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Lý thuyết:</strong> Nhập số câu đúng (Đạt nếu từ 32/35 câu đối với B2).</li>
                <li><strong>Mô phỏng:</strong> Nhập điểm số (Đạt nếu từ 35/50 điểm).</li>
                <li><strong>Sa hình:</strong> Nhập điểm thi sa hình (Đạt nếu từ 80/100 điểm).</li>
                <li><strong>Đường trường:</strong> Nhập điểm thi đường trường (Đạt nếu từ 80/100 điểm).</li>
              </ul>
              <p>Hệ thống tự động xét trạng thái <code>Đậu</code> hoặc <code>Trượt</code> cho toàn bộ hồ sơ. Học viên trượt phần thi nào sẽ tự động chuyển trạng thái học tập thành "Thi lại" để gán vào kỳ thi sát hạch đợt sau.</p>
            </div>
          </div>
        );

      case 'fees':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">💵 Quản lý Học phí</h3>
              <p className="text-slate-500 text-sm mt-1">Theo dõi tình hình đóng học phí trọn gói hoặc đóng học phí chia theo đợt đóng của học viên lái xe.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("Thu học phí đợt và in hóa đơn:")}</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Vào mục <strong>Học phí</strong> ➜ Tìm kiếm tên học viên lái xe cần đóng tiền.</li>
                <li>Bấm nút <strong>Đóng tiền</strong> ở cuối hàng.</li>
                <li>Nhập số tiền thực thu, chọn hình thức "Tiền mặt" hoặc "Chuyển khoản".</li>
                <li>Hệ thống hỗ trợ tạo mã VietQR động chứa sẵn số tài khoản ngân hàng của trung tâm, số tiền cần chuyển khoản và nội dung chuyển khoản được cấu hình tự động (như: <code>[Mã HV] [Họ tên] đóng học phí lái xe</code>). Học viên quét mã QR bằng ứng dụng ngân hàng di động để hoàn tất giao dịch.</li>
                <li>Bấm <strong>Xác nhận thu tiền</strong> để hệ thống ghi nhận phiếu thu mới và tự động khấu trừ nợ của học viên. Bấm biểu tượng <strong>máy in</strong> để in biên lai học phí phát cho học viên.</li>
              </ol>
            </div>
          </div>
        );

      case 'bot':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">🤖 BOT Thông báo</h3>
              <p className="text-slate-500 text-sm mt-1">Hệ thống gửi tin nhắn thông báo nhắc học phí, nhắc lịch thi tốt nghiệp / sát hạch hàng loạt cho học viên qua Email và SMS.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("1. Cách thức soạn tin nhắn gửi hàng loạt:")}</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Bộ lọc nhóm người nhận:</strong> Chọn 1 trong các nhóm đích muốn gửi:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li><i>Tất cả học viên đang học:</i> Gửi thông báo chung lịch nghỉ lễ, thời gian khai giảng khóa mới.</li>
                    <li><i>Học viên sắp thi:</i> Gửi nhắc nhở thời gian thi tốt nghiệp, thời gian có mặt tại sân sát hạch.</li>
                    <li><i>Học viên còn nợ học phí:</i> Gửi nhắc lịch đóng tiền học phí đợt tiếp theo.</li>
                    <li><i>Học viên cần thi lại:</i> Gửi thông báo đăng ký thi lại.</li>
                  </ul>
                </li>
                <li><strong>Sử dụng Nhãn biến động (Variables) để cá nhân hóa nội dung:</strong>
                  <p className="mt-1">Khi soạn thảo Tiêu đề và Nội dung tin nhắn, bạn có thể chèn các nhãn biến tự động sau. Hệ thống sẽ tự động thay đổi giá trị tương ứng của từng học viên khi gửi:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li><code>{"{ten}"}</code>: Sẽ tự động chuyển thành Họ và tên của học viên.</li>
                    <li><code>{"{hang}"}</code>: Tự động chuyển thành hạng bằng lái đăng ký (B2, B1, C...).</li>
                    <li><code>{"{sotien}"}</code>: Tự động tính số tiền còn nợ học phí của học viên đó.</li>
                    <li><code>{"{ngaythi}"}</code>: Tự động chèn ngày thi gần nhất của học viên đó nếu có lịch thi.</li>
                    <li><code>{"{nhac_dong_phi}"}</code>: Chèn đoạn văn bản mẫu nhắc nhở đóng tiền chi tiết (Đã bao gồm gợi ý số tiền còn nợ học phí hoặc số tiền của đợt thanh toán hiện tại).</li>
                  </ul>
                </li>
                <li><strong>Đóng phí theo đợt (Installment Plan):</strong> Khi chọn gửi cho nhóm nợ học phí, bạn có thể thiết lập số lượng đợt đóng phí và tỷ lệ % của mỗi đợt. Khi gửi thông báo đóng học phí đợt, hệ thống sẽ tự động tính số tiền đợt này <code>{"{tiendot}"}</code> bằng: (Tổng học phí × Tỷ lệ %) và chèn mã VietQR động chứa chính xác số tiền của đợt đóng đó vào Email gửi đi.</li>
              </ol>
            </div>
          </div>
        );

      case 'courses':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">📚 Quản lý Khóa học lái xe</h3>
              <p className="text-slate-500 text-sm mt-1">Cấu hình danh mục các chương trình đào tạo lái xe và hạng bằng đào tạo tương ứng.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("Cấu hình khóa học lái xe:")}</h4>
              <p>Bấm nút <strong>+ Tạo khóa học</strong> để thiết lập một khóa học mới. Các trường thông tin bao gồm:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Mã khóa học:</strong> Ký hiệu viết tắt viết liền không dấu (Ví dụ: <code>B2_K68</code>).</li>
                <li><strong>Tên khóa học:</strong> Tên đầy đủ hiển thị (Ví dụ: "Học lái xe ô tô hạng B2 Khóa K68").</li>
                <li><strong>Hạng bằng:</strong> Chọn hạng đào tạo lái xe tương ứng (A1, A2, B1, B2, C, D...). Việc chọn hạng bằng này sẽ giúp hệ thống tự động gán chỉ tiêu Km DAT cho học viên khi thêm mới.</li>
                <li><strong>Học phí trọn gói:</strong> Số tiền học phí trọn gói của toàn bộ khóa học này.</li>
                <li><strong>Số lượng học viên tối đa:</strong> Sĩ số giới hạn của một khóa học.</li>
              </ul>
            </div>
          </div>
        );

      case 'batches':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">🏫 Lớp & Khai giảng</h3>
              <p className="text-slate-500 text-sm mt-1">Thiết lập các nhóm thực hành sa hình, phân giảng viên dạy lái và gán xe tập lái phụ trách tương ứng.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("Quản lý nhóm thực hành sa hình/đường trường:")}</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Tạo lớp học lái xe:</strong> Bấm <strong>+ Tạo lớp học mới</strong> ➜ Nhập tên lớp (Ví dụ: "Nhóm thực hành B2 - Thầy Hùng") ➜ Chọn Khóa học liên kết ➜ Chọn Giáo viên dạy lái phụ trách nhóm ➜ Gán xe tập lái liên kết.</li>
                <li><strong>Ghi danh học viên vào nhóm thực hành:</strong> Mở chi tiết lớp học ➜ Bấm nút <strong>Ghi danh học viên</strong> ở góc trên bên phải ➜ Hệ thống hiển thị danh sách toàn bộ học viên đăng ký khóa học này nhưng chưa được xếp lớp thực hành ➜ Tích chọn học viên ➜ Bấm <strong>Xác nhận</strong> để đưa học viên vào nhóm thực hành của giảng viên đó.</li>
              </ul>
            </div>
          </div>
        );

      case 'partners':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">🤝 Đối tác & CTV</h3>
              <p className="text-slate-500 text-sm mt-1">Quản lý các cộng tác viên giới thiệu hồ sơ và các trung tâm tiếp nhận hồ sơ liên kết.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("Quản lý hoa hồng đối tác:")}</h4>
              <p>Thêm Đối tác / CTV bằng cách nhập Họ tên, Số điện thoại và cấu hình mức hoa hồng (tính theo số tiền cố định trên một hồ sơ hoặc tính theo phần trăm học phí). Khi thêm học viên mới, chọn tên cộng tác viên giới thiệu để hệ thống tự động tính hoa hồng chi trả khi học viên đóng học phí.</p>
            </div>
          </div>
        );

      case 'resources':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">🚗 Quản lý Xe tập lái & Cabin</h3>
              <p className="text-slate-500 text-sm mt-1">Quản lý cơ sở vật chất xe tập lái và cabin mô phỏng của trung tâm lái xe.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("Quản lý và đặt lịch sử dụng xe tập lái:")}</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Khai báo Xe tập lái:</strong> Bấm <strong>+ Thêm thiết bị</strong> ➜ Chọn phân loại là "Xe tập lái" ➜ Nhập biển số xe tập lái làm Mã định danh (Ví dụ: <code>30H-123.45</code>) ➜ Chọn hãng xe, loại xe (Số sàn - MT, Số tự động - AT), hạng bằng đào tạo cho phép và trạng thái xe hoạt động.</li>
                <li><strong>Đăng kiểm & Bảo dưỡng:</strong> Theo dõi thời hạn đăng kiểm xe và lịch bảo dưỡng định kỳ xe tập lái trực tiếp trên phần mềm để đảm bảo an toàn tập lái.</li>
                <li><strong>Tránh trùng lịch xe tập lái:</strong> Khi người dùng xếp lớp học hoặc giảng viên đặt lịch xe thực hành sa hình cho học viên, hệ thống tự động kiểm tra xem xe tập lái đó đã được gán cho giáo viên/học viên khác cùng khung giờ đó chưa, ngăn chặn việc xếp trùng lịch xe tập lái trên sân tập.</li>
              </ul>
            </div>
          </div>
        );

      case 'usermanagement':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">🛡️ Quản lý Nhân sự & Giảng viên lái xe</h3>
              <p className="text-slate-500 text-sm mt-1">Quản lý tài khoản đăng nhập và phân quyền thao tác cho đội ngũ giáo viên dạy lái sa hình/đường trường và nhân viên nghiệp vụ.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("Cấu hình phân quyền nhân sự:")}</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Giảng viên dạy lái:</strong> Phân quyền tài khoản chỉ được xem trang <strong>Học viên</strong> (hồ sơ nhóm mình dạy) để cập nhật số Km DAT đã hoàn thành, ẩn các mục xem doanh thu học phí tổng của trung tâm.</li>
                <li><strong>Nhân viên nghiệp vụ hồ sơ:</strong> Phân quyền vào mục Học viên và Lịch thi để tiếp nhận hồ sơ, tải ảnh CCCD, cập nhật kết quả khám sức khỏe và xếp lịch thi sát hạch cho học viên.</li>
                <li><strong>Kế toán trung tâm:</strong> Phân quyền vào mục Học phí để thực hiện lập biên lai đóng tiền và kiểm soát dư nợ của các hồ sơ học viên lái xe.</li>
              </ul>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">⚙️ Cài đặt & Quản trị Hệ thống</h3>
              <p className="text-slate-500 text-sm mt-1">Cấu hình thông tin trung tâm lái xe, tài khoản nhận học phí VietQR và tài khoản email gửi tự động SMTP.</p>
            </div>

            <div className="space-y-4">
              <p>Admin có thể cập nhật thông tin tên trung tâm sát hạch lái xe, logo của trung tâm, số điện thoại liên lạc. Thiết lập tài khoản ngân hàng thụ hưởng nhận đóng học phí và kết nối Email Server SMTP để tự động hóa hoạt động thông báo lịch thi và nhắc nợ học phí từ BOT.</p>
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">❓ Câu hỏi thường gặp (FAQs)</h3>
              <p className="text-slate-500 text-sm mt-1">Các tình huống phát sinh thường gặp trong quá trình đào tạo lái xe và cách xử lý nhanh.</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                <h5 className="font-bold text-slate-800 text-xs">Q: Làm thế nào khi học viên thi trượt kỳ thi sát hạch lý thuyết hoặc sa hình của Sở GTVT?</h5>
                <p className="text-slate-400 text-xs mt-1">A: Mở trang Lịch thi sát hạch tương ứng ➜ Tìm tên học viên ➜ Cập nhật kết quả thi sát hạch của học viên là "Trượt". Hệ thống sẽ tự động cập nhật trạng thái học tập của học viên đó thành "Thi lại" và đưa vào danh sách chờ xếp lớp thi lại cho kỳ thi sát hạch đợt kế tiếp.</p>
              </div>

              <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                <h5 className="font-bold text-slate-800 text-xs">Q: Số liệu Km chạy DAT của học viên bị sai lệch so với thiết bị thực tế, làm thế nào để điều chỉnh lại?</h5>
                <p className="text-slate-400 text-xs mt-1">A: Truy cập hồ sơ chi tiết học viên ➜ Tab Tiến độ học ➜ Click nút chỉnh sửa tiến độ ➜ Nhập lại số Km DAT thực tế chạy đúng so với báo cáo ➜ Bấm lưu. Hệ thống sẽ tự động cập nhật lại phần trăm (%) hoàn thành chỉ tiêu để xét điều kiện dự thi tốt nghiệp.</p>
              </div>

              <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                <h5 className="font-bold text-slate-800 text-xs">Q: Tại sao học viên đã hoàn thành đủ Km DAT đường trường nhưng không hiển thị trong danh sách gán thi sát hạch?</h5>
                <p className="text-slate-400 text-xs mt-1">A: Vui lòng kiểm tra lại 2 điều kiện còn lại trong hồ sơ học viên: Thứ nhất, trạng thái khám sức khỏe của học viên phải là "Đã KSK" (trong tab KSK). Thứ hai, học viên phải hoàn thành đủ 3 giờ học thực hành trên Cabin mô phỏng ảo (trong tab Tiến độ học).</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <HelpCircle size={40} className="stroke-1 mb-2 animate-bounce" />
            <p className="text-sm font-medium">Vui lòng chọn một mục hướng dẫn bên trái.</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {renderSection()}
    </div>
  );
}
